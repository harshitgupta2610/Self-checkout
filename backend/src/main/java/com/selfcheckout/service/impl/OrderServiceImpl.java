package com.selfcheckout.service.impl;

import com.selfcheckout.dto.CheckoutDto.*;
import com.selfcheckout.dto.CartDto.ShoppingCart;
import com.selfcheckout.dto.CartDto.CartItemDto;
import com.selfcheckout.entity.*;
import com.selfcheckout.exception.BadRequestException;
import com.selfcheckout.exception.InventoryUnavailableException;
import com.selfcheckout.exception.ResourceNotFoundException;
import com.selfcheckout.repository.*;
import com.selfcheckout.service.CartService;
import com.selfcheckout.service.OrderService;
import com.selfcheckout.service.PaymentGatewayService;
import com.selfcheckout.service.AuditLogService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final CartService cartService;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentGatewayService paymentGatewayService;
    private final AuditLogService auditLogService;
    private final SecretKey jwtKey;

    public OrderServiceImpl(
            CartService cartService,
            StoreRepository storeRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository,
            PaymentGatewayService paymentGatewayService,
            AuditLogService auditLogService,
            @Value("${app.jwt.secret}") String jwtSecret) {
        this.cartService = cartService;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.paymentGatewayService = paymentGatewayService;
        this.auditLogService = auditLogService;
        this.jwtKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    @Override
    @Transactional
    public PaymentInitResponse checkout(UUID userId, CheckoutRequest checkoutRequest) {
        ShoppingCart cart = cartService.getCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot checkout an empty shopping cart!");
        }

        if (cart.getStoreId() == null) {
            throw new BadRequestException("No store session is active for this checkout!");
        }

        Store store = storeRepository.findById(cart.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Active store not found."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found."));

        // Generate dynamic unique order number
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int random = 100000 + new SecureRandom().nextInt(900000);
        String orderNumber = "ORD-" + timestamp + "-" + random;

        Order order = Order.builder()
                .store(store)
                .user(user)
                .orderNumber(orderNumber)
                .subtotal(cart.getSubtotal())
                .taxAmount(cart.getTaxAmount())
                .discountAmount(cart.getDiscountAmount())
                .finalAmount(cart.getFinalAmount())
                .status(OrderStatus.PENDING)
                .build();

        // Validate inventory and lock stock
        for (CartItemDto item : cart.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product " + item.getName() + " no longer exists in catalog"));

            if (product.getStockQuantity() < item.getQuantity()) {
                throw new InventoryUnavailableException("Inventory stock out for: " + product.getName() + ". Only " 
                        + product.getStockQuantity() + " items left.");
            }

            // Deduct stock (Optimistic Locking `@Version` validates against write collisions)
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(item.getQuantity())
                    .unitPrice(item.getPrice())
                    .taxAmount(item.getTaxAmount())
                    .discountAmount(item.getDiscountAmount())
                    .finalAmount(item.getFinalAmount())
                    .build();

            order.addItem(orderItem);
        }

        orderRepository.save(order);
        auditLogService.log(user, "ORDER_CHECKOUT_INIT", "Initialized checkout for " + orderNumber + ", locked stock.");

        // Call Payment Gateway
        PaymentInitResponse initResponse = paymentGatewayService.createPaymentOrder(order);
        return initResponse;
    }

    @Override
    @Transactional
    public OrderDto verifyPayment(UUID userId, PaymentVerifyRequest verifyRequest) {
        Order order = orderRepository.findByOrderNumber(verifyRequest.getOrderNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Order details not found for checkout."));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Order is already processed. Current Status: " + order.getStatus());
        }

        boolean verified = paymentGatewayService.verifyPaymentSignature(verifyRequest);

        if (verified) {
            order.setStatus(OrderStatus.PAID);
            order.setPaymentTransactionId(verifyRequest.getRazorpayPaymentId());

            // Generate Cryptographically secure QR Receipt Token
            String receiptToken = Jwts.builder()
                    .subject(order.getId().toString())
                    .claim("orderNumber", order.getOrderNumber())
                    .claim("storeId", order.getStore().getId().toString())
                    .claim("timestamp", LocalDateTime.now().toString())
                    .signWith(jwtKey)
                    .compact();

            order.setReceiptQrToken(receiptToken);
            orderRepository.save(order);

            // Clear Customer shopping cart
            cartService.clearCart(userId);

            auditLogService.log(order.getUser(), "PAYMENT_SUCCESS", "Verified payment for order: " + order.getOrderNumber());

            return mapToOrderDto(order);
        } else {
            // Restore inventory stock back on payment failure
            order.setStatus(OrderStatus.FAILED);
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
            orderRepository.save(order);

            auditLogService.log(order.getUser(), "PAYMENT_FAILED", "Failed payment verification for order: " + order.getOrderNumber());
            throw new BadRequestException("Payment verification signature failed. Transaction rejected.");
        }
    }

    @Override
    @Transactional
    public OrderDto verifyPaymentStatus(UUID userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order details not found for checkout."));

        if (order.getStatus() != OrderStatus.PENDING) {
            return mapToOrderDto(order);
        }

        int verified = paymentGatewayService.checkPaymentStatus(orderNumber);

        if (verified == 1) {
            order.setStatus(OrderStatus.PAID);
            order.setPaymentTransactionId("TXN-" + orderNumber);

            String receiptToken = Jwts.builder()
                    .subject(order.getId().toString())
                    .claim("orderNumber", order.getOrderNumber())
                    .claim("storeId", order.getStore().getId().toString())
                    .claim("timestamp", LocalDateTime.now().toString())
                    .signWith(jwtKey)
                    .compact();

            order.setReceiptQrToken(receiptToken);
            orderRepository.save(order);

            cartService.clearCart(userId);

            auditLogService.log(order.getUser(), "PAYMENT_SUCCESS", "Verified PhonePe payment for order: " + order.getOrderNumber());

            return mapToOrderDto(order);
        } else if (verified == 0) {
            // Still pending - do not fail the order, just notify the client to retry
            auditLogService.log(order.getUser(), "PAYMENT_PENDING", "PhonePe payment check pending for order: " + order.getOrderNumber());
            throw new BadRequestException("PAYMENT_PENDING");
        } else {
            order.setStatus(OrderStatus.FAILED);
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
            orderRepository.save(order);

            auditLogService.log(order.getUser(), "PAYMENT_FAILED", "Failed PhonePe payment verification for order: " + order.getOrderNumber());
            throw new BadRequestException("PhonePe payment verification failed. Transaction was not completed.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> getCustomerOrders(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToOrderDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> getStoreOrders(UUID storeId) {
        return orderRepository.findByStoreIdOrderByCreatedAtDesc(storeId)
                .stream()
                .map(this::mapToOrderDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto getOrderDetails(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order details not found."));
        return mapToOrderDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto getOrderDetailsByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order details not found."));
        return mapToOrderDto(order);
    }

    private OrderDto mapToOrderDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems().stream().map(item -> 
            OrderItemDto.builder()
                    .productName(item.getProduct().getName())
                    .barcode(item.getProduct().getBarcode())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .taxAmount(item.getTaxAmount())
                    .discountAmount(item.getDiscountAmount())
                    .finalAmount(item.getFinalAmount())
                    .build()
        ).collect(Collectors.toList());

        return OrderDto.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .storeName(order.getStore().getName())
                .storeAddress(order.getStore().getAddress())
                .customerName(order.getUser().getUsername())
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus().name())
                .receiptQrToken(order.getReceiptQrToken())
                .createdAt(order.getCreatedAt())
                .items(itemDtos)
                .build();
    }
}
