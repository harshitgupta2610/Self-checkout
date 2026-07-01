package com.selfcheckout.service.impl;

import com.selfcheckout.dto.CheckoutDto.PaymentInitResponse;
import com.selfcheckout.dto.CheckoutDto.PaymentVerifyRequest;
import com.selfcheckout.entity.Order;
import com.selfcheckout.service.PaymentGatewayService;
import com.selfcheckout.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;

@Service
@Slf4j
public class PhonePePaymentServiceImpl implements PaymentGatewayService {

    private final String merchantId;
    private final String saltKey;
    private final String saltIndex;
    private final String apiDomain;
    private final String redirectUrl;
    private final boolean isMockMode;
    private final HttpClient httpClient;

    public PhonePePaymentServiceImpl(
            @Value("${app.phonepe.merchantId}") String merchantId,
            @Value("${app.phonepe.saltKey}") String saltKey,
            @Value("${app.phonepe.saltIndex}") String saltIndex,
            @Value("${app.phonepe.apiDomain}") String apiDomain,
            @Value("${app.phonepe.redirectUrl}") String redirectUrl) {
        this.merchantId = merchantId;
        this.saltKey = saltKey;
        this.saltIndex = saltIndex;
        this.apiDomain = apiDomain;
        this.redirectUrl = redirectUrl;
        this.isMockMode = merchantId.contains("mock") || saltKey.contains("mock");
        this.httpClient = HttpClient.newBuilder().build();
        log.info("Initialized PhonePe Payment Service. Mock Mode Enabled: {}, Domain: {}", isMockMode, apiDomain);
    }

    @Override
    public PaymentInitResponse createPaymentOrder(Order order) {
        BigDecimal amountInRupees = order.getFinalAmount();
        // Convert to paise
        long amountInPaise = amountInRupees.multiply(BigDecimal.valueOf(100)).longValue();
        String orderNumber = order.getOrderNumber();

        if (isMockMode) {
            String mockRedirectUrl = redirectUrl + "?orderNumber=" + orderNumber + "&mock=true";
            log.info("[MOCK PHONEPE] Created transaction for order {}. Redirect URL: {}", orderNumber, mockRedirectUrl);
            return PaymentInitResponse.builder()
                    .orderNumber(orderNumber)
                    .amount(amountInRupees)
                    .currency("INR")
                    .redirectUrl(mockRedirectUrl)
                    .build();
        }

        try {
            JSONObject payPayload = new JSONObject();
            payPayload.put("merchantId", merchantId);
            payPayload.put("merchantTransactionId", orderNumber);
            payPayload.put("merchantUserId", order.getUser().getId().toString().replace("-", "_"));
            payPayload.put("amount", amountInPaise);
            payPayload.put("redirectUrl", redirectUrl + "?orderNumber=" + orderNumber);
            payPayload.put("redirectMode", "REDIRECT");
            payPayload.put("expireAfter", 300); // 5 minutes payment window
            
            JSONObject paymentInstrument = new JSONObject();
            paymentInstrument.put("type", "PAY_PAGE");
            payPayload.put("paymentInstrument", paymentInstrument);

            String jsonPayload = payPayload.toString();
            String base64Body = Base64.getEncoder().encodeToString(jsonPayload.getBytes("UTF-8"));

            String verifyHeader = calculateSha256(base64Body + "/pg/v1/pay" + saltKey) + "###" + saltIndex;

            JSONObject requestBodyJson = new JSONObject();
            requestBodyJson.put("request", base64Body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiDomain + "/pg/v1/pay"))
                    .header("Content-Type", "application/json")
                    .header("X-VERIFY", verifyHeader)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JSONObject responseJson = new JSONObject(response.body());
                if (responseJson.getBoolean("success")) {
                    JSONObject dataJson = responseJson.getJSONObject("data");
                    String phonePeRedirectUrl = dataJson.getJSONObject("instrumentResponse")
                            .getJSONObject("redirectInfo")
                            .getString("url");

                    log.info("PhonePe checkout initialized for order: {}. Redirect URL: {}", orderNumber, phonePeRedirectUrl);

                    return PaymentInitResponse.builder()
                            .orderNumber(orderNumber)
                            .amount(amountInRupees)
                            .currency("INR")
                            .redirectUrl(phonePeRedirectUrl)
                            .build();
                } else {
                    throw new BadRequestException("PhonePe initialization failed: " + responseJson.getString("message"));
                }
            } else {
                log.error("PhonePe API pay request failed. Code: {}, Body: {}", response.statusCode(), response.body());
                throw new BadRequestException("PhonePe gateway failed with status: " + response.statusCode());
            }

        } catch (Exception e) {
            log.error("Failed to initialize PhonePe payment order for: " + orderNumber, e);
            throw new BadRequestException("PhonePe gateway exception: " + e.getMessage());
        }
    }

    @Override
    public boolean verifyPaymentSignature(PaymentVerifyRequest verifyRequest) {
        // Fallback for compatibility, not directly used in Redirection flow
        return false;
    }

    @Override
    public int checkPaymentStatus(String orderNumber) {
        if (isMockMode) {
            log.info("[MOCK PHONEPE] Checking status for order: {}. Returned: 1 (SUCCESS)", orderNumber);
            return 1;
        }

        try {
            String path = "/pg/v1/status/" + merchantId + "/" + orderNumber;
            String verifyHeader = calculateSha256(path + saltKey) + "###" + saltIndex;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiDomain + path))
                    .header("X-VERIFY", verifyHeader)
                    .header("X-MERCHANT-ID", merchantId)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JSONObject responseJson = new JSONObject(response.body());
                String code = responseJson.optString("code", "");
                
                JSONObject dataJson = responseJson.optJSONObject("data");
                if (dataJson != null) {
                    String state = dataJson.optString("state", "");
                    String responseCode = dataJson.optString("responseCode", "");
                    log.info("PhonePe status check for order {}: code={}, state={}, responseCode={}", 
                            orderNumber, code, state, responseCode);
                    
                    if ("PAYMENT_SUCCESS".equals(code) || "COMPLETED".equals(state) || "SUCCESS".equals(responseCode)) {
                        return 1; // SUCCESS
                    } else if ("PAYMENT_PENDING".equals(code) || "PENDING".equals(state) || "PAYMENT_INITIATED".equals(code)) {
                        return 0; // PENDING
                    } else {
                        return -1; // FAILED
                    }
                }
            }
            log.warn("PhonePe status check API failed/pending for order: {}. Status code: {}, Body: {}", 
                    orderNumber, response.statusCode(), response.body());
            return 0; // Treat transient errors as PENDING to allow client retries
        } catch (Exception e) {
            log.error("Failed checking PhonePe status for order: " + orderNumber, e);
            return 0; // Retry on exceptions
        }
    }

    private String calculateSha256(String data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data.getBytes("UTF-8"));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
