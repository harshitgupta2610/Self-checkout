package com.selfcheckout.service.impl;

import com.selfcheckout.dto.CartDto.CartItemDto;
import com.selfcheckout.dto.CartDto.ShoppingCart;
import com.selfcheckout.entity.Coupon;
import com.selfcheckout.entity.Product;
import com.selfcheckout.exception.BadRequestException;
import com.selfcheckout.exception.InventoryUnavailableException;
import com.selfcheckout.exception.ResourceNotFoundException;
import com.selfcheckout.repository.CouponRepository;
import com.selfcheckout.repository.ProductRepository;
import com.selfcheckout.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartServiceImpl implements CartService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;

    private static final String CART_KEY_PREFIX = "cart::";
    private static final long CART_TTL_DAYS = 7;

    private String getRedisKey(UUID userId) {
        return CART_KEY_PREFIX + userId.toString();
    }

    @Override
    public ShoppingCart getCart(UUID userId) {
        String key = getRedisKey(userId);
        Object cachedCart = redisTemplate.opsForValue().get(key);
        
        if (cachedCart instanceof ShoppingCart cart) {
            // Re-validate and recalculate prices to match current DB catalog details
            return recalculateCart(cart);
        }
        
        // Return a fresh cart
        return ShoppingCart.builder()
                .userId(userId)
                .items(new ArrayList<>())
                .subtotal(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .build();
    }

    @Override
    public ShoppingCart addItemToCart(UUID userId, UUID storeId, String barcode, int quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than 0");
        }

        Product product = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with barcode: " + barcode));

        if (product.getStockQuantity() < quantity) {
            throw new InventoryUnavailableException("Insufficient stock. Only " + product.getStockQuantity() + " units available.");
        }

        ShoppingCart cart = getCart(userId);
        cart.setStoreId(storeId);

        // Check if item already exists in cart
        Optional<CartItemDto> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(product.getId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItemDto item = existingItemOpt.get();
            int newQuantity = item.getQuantity() + quantity;
            if (product.getStockQuantity() < newQuantity) {
                throw new InventoryUnavailableException("Insufficient stock. Only " + product.getStockQuantity() + " units available.");
            }
            item.setQuantity(newQuantity);
        } else {
            CartItemDto newItem = CartItemDto.builder()
                    .productId(product.getId())
                    .barcode(product.getBarcode())
                    .name(product.getName())
                    .imageUrl(product.getImageUrl())
                    .price(product.getPrice())
                    .gstPercentage(product.getGstPercentage())
                    .quantity(quantity)
                    .build();
            cart.getItems().add(newItem);
        }

        return recalculateAndSave(cart);
    }

    @Override
    public ShoppingCart updateItemQuantity(UUID userId, UUID productId, int quantity) {
        ShoppingCart cart = getCart(userId);
        
        CartItemDto item = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Product not found in cart"));

        if (quantity <= 0) {
            cart.getItems().remove(item);
        } else {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product no longer exists in catalog"));

            if (product.getStockQuantity() < quantity) {
                throw new InventoryUnavailableException("Insufficient stock. Only " + product.getStockQuantity() + " units available.");
            }
            item.setQuantity(quantity);
        }

        return recalculateAndSave(cart);
    }

    @Override
    public ShoppingCart removeItemFromCart(UUID userId, UUID productId) {
        ShoppingCart cart = getCart(userId);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        return recalculateAndSave(cart);
    }

    @Override
    public ShoppingCart applyCoupon(UUID userId, String couponCode) {
        ShoppingCart cart = getCart(userId);
        
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(couponCode)
                .orElseThrow(() -> new BadRequestException("Invalid or inactive coupon code"));

        if (coupon.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Coupon has expired");
        }

        cart.setAppliedCouponCode(coupon.getCode().toUpperCase());
        return recalculateAndSave(cart);
    }

    @Override
    public ShoppingCart removeCoupon(UUID userId) {
        ShoppingCart cart = getCart(userId);
        cart.setAppliedCouponCode(null);
        return recalculateAndSave(cart);
    }

    @Override
    public void clearCart(UUID userId) {
        redisTemplate.delete(getRedisKey(userId));
    }

    private ShoppingCart recalculateAndSave(ShoppingCart cart) {
        ShoppingCart calculatedCart = recalculateCart(cart);
        String key = getRedisKey(cart.getUserId());
        redisTemplate.opsForValue().set(key, calculatedCart, CART_TTL_DAYS, TimeUnit.DAYS);
        return calculatedCart;
    }

    private ShoppingCart recalculateCart(ShoppingCart cart) {
        if (cart.getItems().isEmpty()) {
            cart.setSubtotal(BigDecimal.ZERO);
            cart.setTaxAmount(BigDecimal.ZERO);
            cart.setDiscountAmount(BigDecimal.ZERO);
            cart.setFinalAmount(BigDecimal.ZERO);
            cart.setAppliedCouponCode(null);
            return cart;
        }

        // 1. Sync items with DB catalog prices/stock, count raw total MRP
        BigDecimal rawTotal = BigDecimal.ZERO;
        List<CartItemDto> activeItems = new ArrayList<>();
        
        for (CartItemDto item : cart.getItems()) {
            Optional<Product> productOpt = productRepository.findById(item.getProductId());
            if (productOpt.isPresent()) {
                Product product = productOpt.get();
                item.setPrice(product.getPrice());
                item.setGstPercentage(product.getGstPercentage());
                item.setName(product.getName());
                item.setImageUrl(product.getImageUrl());
                
                // Adjust quantity if exceeds stock
                if (product.getStockQuantity() < item.getQuantity()) {
                    item.setQuantity(product.getStockQuantity());
                }
                
                if (item.getQuantity() > 0) {
                    BigDecimal itemRawTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    rawTotal = rawTotal.add(itemRawTotal);
                    activeItems.add(item);
                }
            }
        }
        cart.setItems(activeItems);

        // 2. Validate Coupon and Calculate Coupon Discount
        BigDecimal couponDiscount = BigDecimal.ZERO;
        if (cart.getAppliedCouponCode() != null) {
            Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCaseAndActiveTrue(cart.getAppliedCouponCode());
            if (couponOpt.isPresent()) {
                Coupon coupon = couponOpt.get();
                boolean valid = !coupon.getExpiryDate().isBefore(LocalDate.now()) && rawTotal.compareTo(coupon.getMinCartValue()) >= 0;
                if (valid) {
                    couponDiscount = rawTotal.multiply(coupon.getDiscountPercentage().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                    if (couponDiscount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                        couponDiscount = coupon.getMaxDiscountAmount();
                    }
                } else {
                    cart.setAppliedCouponCode(null); // Clear coupon if cart value falls below requirement
                }
            } else {
                cart.setAppliedCouponCode(null);
            }
        }

        couponDiscount = couponDiscount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal runningDiscountSum = BigDecimal.ZERO;
        BigDecimal calculatedSubtotal = BigDecimal.ZERO;
        BigDecimal calculatedTax = BigDecimal.ZERO;
        BigDecimal calculatedFinal = BigDecimal.ZERO;

        // 3. Proportional discount distribution & tax back-calculation per item
        for (int i = 0; i < activeItems.size(); i++) {
            CartItemDto item = activeItems.get(i);
            BigDecimal itemRawTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal itemDiscount = BigDecimal.ZERO;

            if (couponDiscount.compareTo(BigDecimal.ZERO) > 0 && rawTotal.compareTo(BigDecimal.ZERO) > 0) {
                if (i == activeItems.size() - 1) {
                    itemDiscount = couponDiscount.subtract(runningDiscountSum);
                } else {
                    itemDiscount = itemRawTotal.multiply(couponDiscount)
                            .divide(rawTotal, 2, RoundingMode.HALF_UP);
                    runningDiscountSum = runningDiscountSum.add(itemDiscount);
                }
            }

            BigDecimal itemFinal = itemRawTotal.subtract(itemDiscount);
            
            // Back calculate tax: GST is inclusive in price
            // finalAmount = basePrice + tax = basePrice + basePrice * (gst/100) = basePrice * (1 + gst/100)
            // basePrice (subtotal) = finalAmount / (1 + gst/100)
            BigDecimal gstFactor = BigDecimal.ONE.add(item.getGstPercentage().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal itemSubtotal = itemFinal.divide(gstFactor, 2, RoundingMode.HALF_UP);
            BigDecimal itemTax = itemFinal.subtract(itemSubtotal);

            item.setSubtotal(itemSubtotal);
            item.setTaxAmount(itemTax);
            item.setDiscountAmount(itemDiscount);
            item.setFinalAmount(itemFinal);

            calculatedSubtotal = calculatedSubtotal.add(itemSubtotal);
            calculatedTax = calculatedTax.add(itemTax);
            calculatedFinal = calculatedFinal.add(itemFinal);
        }

        cart.setSubtotal(calculatedSubtotal);
        cart.setTaxAmount(calculatedTax);
        cart.setDiscountAmount(couponDiscount);
        cart.setFinalAmount(calculatedFinal);

        return cart;
    }
}
