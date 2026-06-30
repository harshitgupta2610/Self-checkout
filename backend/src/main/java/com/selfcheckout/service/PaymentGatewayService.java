package com.selfcheckout.service;

import com.selfcheckout.dto.CheckoutDto.PaymentInitResponse;
import com.selfcheckout.dto.CheckoutDto.PaymentVerifyRequest;
import com.selfcheckout.entity.Order;

public interface PaymentGatewayService {
    PaymentInitResponse createPaymentOrder(Order order);
    boolean verifyPaymentSignature(PaymentVerifyRequest verifyRequest);
    int checkPaymentStatus(String orderNumber);
}
