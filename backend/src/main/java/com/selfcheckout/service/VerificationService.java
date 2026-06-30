package com.selfcheckout.service;

import com.selfcheckout.dto.CheckoutDto.VerificationResponse;

import java.util.UUID;

public interface VerificationService {
    VerificationResponse verifyReceipt(String token, UUID guardStoreId);
}
