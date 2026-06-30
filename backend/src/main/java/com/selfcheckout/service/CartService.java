package com.selfcheckout.service;

import com.selfcheckout.dto.CartDto.ShoppingCart;

import java.util.UUID;

public interface CartService {
    ShoppingCart getCart(UUID userId);
    ShoppingCart addItemToCart(UUID userId, UUID storeId, String barcode, int quantity);
    ShoppingCart updateItemQuantity(UUID userId, UUID productId, int quantity);
    ShoppingCart removeItemFromCart(UUID userId, UUID productId);
    ShoppingCart applyCoupon(UUID userId, String couponCode);
    ShoppingCart removeCoupon(UUID userId);
    void clearCart(UUID userId);
}
