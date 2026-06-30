package com.selfcheckout.controller;

import com.selfcheckout.dto.CheckoutDto.*;
import com.selfcheckout.security.UserPrincipal;
import com.selfcheckout.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Endpoints for order checkouts, payments, and histories")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @Operation(summary = "Validate cart pricing on the server, lock inventory, and initialize Razorpay transaction")
    public ResponseEntity<PaymentInitResponse> checkout(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) CheckoutRequest checkoutRequest) {
        CheckoutRequest req = checkoutRequest != null ? checkoutRequest : new CheckoutRequest();
        return ResponseEntity.ok(orderService.checkout(principal.getId(), req));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment signature, finalize stock locks, and issue signed exit QR receipt")
    public ResponseEntity<OrderDto> verifyPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PaymentVerifyRequest verifyRequest) {
        return ResponseEntity.ok(orderService.verifyPayment(principal.getId(), verifyRequest));
    }

    @GetMapping("/verify-status/{orderNumber}")
    @Operation(summary = "Verify PhonePe payment status, finalize stock locks, and issue signed exit QR receipt")
    public ResponseEntity<OrderDto> verifyPaymentStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.verifyPaymentStatus(principal.getId(), orderNumber));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get list of all orders completed by the current customer")
    public ResponseEntity<List<OrderDto>> getMyOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(orderService.getCustomerOrders(principal.getId()));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get detailed summary of an order using its ID")
    public ResponseEntity<OrderDto> getOrderDetails(@PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.getOrderDetails(orderId));
    }

    @GetMapping("/by-number/{orderNumber}")
    @Operation(summary = "Get detailed summary of an order using its unique Order Number")
    public ResponseEntity<OrderDto> getOrderDetailsByNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.getOrderDetailsByNumber(orderNumber));
    }
}
