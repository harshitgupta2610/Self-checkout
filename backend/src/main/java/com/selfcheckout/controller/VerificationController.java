package com.selfcheckout.controller;

import com.selfcheckout.dto.CheckoutDto.VerificationResponse;
import com.selfcheckout.service.VerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/guard")
@RequiredArgsConstructor
@Tag(name = "Guard Verification", description = "Endpoints for security guards to scan and verify customer receipts")
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/verify")
    @Operation(summary = "Scan and verify customer receipt QR code token, validate status, check timestamps and double exits")
    public ResponseEntity<VerificationResponse> verifyReceipt(
            @RequestParam String token,
            @RequestParam(required = false) UUID storeId) {
        return ResponseEntity.ok(verificationService.verifyReceipt(token, storeId));
    }
}
