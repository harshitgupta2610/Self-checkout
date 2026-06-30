package com.selfcheckout.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class CheckoutDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckoutRequest {
        private String couponCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentVerifyRequest {
        private String orderNumber;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentInitResponse {
        private String orderNumber;
        private String razorpayOrderId;
        private BigDecimal amount;
        private String currency;
        private String keyId; // Razorpay Client Key ID
        private String redirectUrl; // PhonePe hosted payment URL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private String productName;
        private String barcode;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal taxAmount;
        private BigDecimal discountAmount;
        private BigDecimal finalAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderDto {
        private UUID orderId;
        private String orderNumber;
        private String storeName;
        private String storeAddress;
        private String customerName;
        private BigDecimal subtotal;
        private BigDecimal taxAmount;
        private BigDecimal discountAmount;
        private BigDecimal finalAmount;
        private String status;
        private String receiptQrToken;
        private LocalDateTime createdAt;
        private List<OrderItemDto> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerificationResponse {
        private boolean valid;
        private String orderNumber;
        private String customerName;
        private String storeName;
        private BigDecimal finalAmount;
        private String status;
        private LocalDateTime paymentTimestamp;
        private List<OrderItemDto> items;
        private String message;
    }
}
