package com.selfcheckout.service;

import com.selfcheckout.dto.CheckoutDto.*;

import java.util.List;
import java.util.UUID;

public interface OrderService {
    PaymentInitResponse checkout(UUID userId, CheckoutRequest checkoutRequest);
    OrderDto verifyPayment(UUID userId, PaymentVerifyRequest verifyRequest);
    OrderDto verifyPaymentStatus(UUID userId, String orderNumber);
    List<OrderDto> getCustomerOrders(UUID userId);
    List<OrderDto> getStoreOrders(UUID storeId);
    OrderDto getOrderDetails(UUID orderId);
    OrderDto getOrderDetailsByNumber(String orderNumber);
}
