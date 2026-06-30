package com.selfcheckout.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CartDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemDto {
        private UUID productId;
        private String barcode;
        private String name;
        private String imageUrl;
        private BigDecimal price;
        private BigDecimal gstPercentage;
        private Integer quantity;
        private BigDecimal subtotal;
        private BigDecimal taxAmount;
        private BigDecimal discountAmount;
        private BigDecimal finalAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShoppingCart {
        private UUID storeId;
        private UUID userId;
        @Builder.Default
        private List<CartItemDto> items = new ArrayList<>();
        private BigDecimal subtotal;
        private BigDecimal taxAmount;
        private BigDecimal discountAmount;
        private BigDecimal finalAmount;
        private String appliedCouponCode;
    }
}
