package com.selfcheckout.service.impl;

import com.selfcheckout.dto.CheckoutDto.VerificationResponse;
import com.selfcheckout.dto.CheckoutDto.OrderItemDto;
import com.selfcheckout.entity.Order;
import com.selfcheckout.entity.OrderItem;
import com.selfcheckout.entity.OrderStatus;
import com.selfcheckout.repository.OrderRepository;
import com.selfcheckout.service.VerificationService;
import com.selfcheckout.service.AuditLogService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class VerificationServiceImpl implements VerificationService {

    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;
    private final SecretKey jwtKey;

    public VerificationServiceImpl(
            OrderRepository orderRepository,
            AuditLogService auditLogService,
            @Value("${app.jwt.secret}") String jwtSecret) {
        this.orderRepository = orderRepository;
        this.auditLogService = auditLogService;
        this.jwtKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    @Override
    @Transactional
    public VerificationResponse verifyReceipt(String token, UUID guardStoreId) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(jwtKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String orderIdStr = claims.getSubject();
            UUID orderId = UUID.fromString(orderIdStr);
            String tokenStoreIdStr = claims.get("storeId", String.class);
            UUID tokenStoreId = UUID.fromString(tokenStoreIdStr);

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid receipt: Order not found in database"));

            // Verify Store Match
            if (guardStoreId != null && !tokenStoreId.equals(guardStoreId)) {
                return VerificationResponse.builder()
                        .valid(false)
                        .message("Exit Denied: Receipt was issued at a different store location!")
                        .orderNumber(order.getOrderNumber())
                        .storeName(order.getStore().getName())
                        .finalAmount(order.getFinalAmount())
                        .status(order.getStatus().name())
                        .build();
            }

            // Verify Status
            if (order.getStatus() == OrderStatus.VERIFIED) {
                auditLogService.log("GUARD_REUSE_ATTEMPT", "Detected potential reuse for order: " + order.getOrderNumber());
                return VerificationResponse.builder()
                        .valid(false)
                        .message("Exit Denied: This receipt has already been verified! Scanned at: " + order.getVerifiedAt())
                        .orderNumber(order.getOrderNumber())
                        .storeName(order.getStore().getName())
                        .customerName(order.getUser().getUsername())
                        .finalAmount(order.getFinalAmount())
                        .status(order.getStatus().name())
                        .build();
            }

            if (order.getStatus() != OrderStatus.PAID) {
                return VerificationResponse.builder()
                        .valid(false)
                        .message("Exit Denied: Order status is: " + order.getStatus() + ". Must be PAID.")
                        .orderNumber(order.getOrderNumber())
                        .storeName(order.getStore().getName())
                        .finalAmount(order.getFinalAmount())
                        .status(order.getStatus().name())
                        .build();
            }

            // Expiry Check (Receipt must be verified within 2 hours of creation)
            if (order.getUpdatedAt().isBefore(LocalDateTime.now().minusHours(2))) {
                return VerificationResponse.builder()
                        .valid(false)
                        .message("Exit Denied: Receipt has expired. Must verify within 2 hours of payment.")
                        .orderNumber(order.getOrderNumber())
                        .storeName(order.getStore().getName())
                        .finalAmount(order.getFinalAmount())
                        .status(order.getStatus().name())
                        .build();
            }

            // All checks pass - update order status to VERIFIED
            order.setStatus(OrderStatus.VERIFIED);
            order.setVerifiedAt(LocalDateTime.now());
            orderRepository.save(order);

            auditLogService.log("GUARD_VERIFY_SUCCESS", "Successfully validated receipt for order: " + order.getOrderNumber());

            List<OrderItemDto> itemDtos = order.getItems().stream().map(item -> 
                OrderItemDto.builder()
                        .productName(item.getProduct().getName())
                        .barcode(item.getProduct().getBarcode())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .finalAmount(item.getFinalAmount())
                        .build()
            ).collect(Collectors.toList());

            return VerificationResponse.builder()
                    .valid(true)
                    .orderNumber(order.getOrderNumber())
                    .customerName(order.getUser().getUsername())
                    .storeName(order.getStore().getName())
                    .finalAmount(order.getFinalAmount())
                    .status(order.getStatus().name())
                    .paymentTimestamp(order.getUpdatedAt())
                    .items(itemDtos)
                    .message("Verification Successful: Customer is authorized to exit.")
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse and verify receipt QR token", e);
            return VerificationResponse.builder()
                    .valid(false)
                    .message("Exit Denied: Invalid or tampered receipt QR code signature!")
                    .build();
        }
    }
}
