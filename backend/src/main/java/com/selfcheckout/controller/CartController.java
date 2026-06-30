package com.selfcheckout.controller;

import com.selfcheckout.dto.CartDto.ShoppingCart;
import com.selfcheckout.security.UserPrincipal;
import com.selfcheckout.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Endpoints for managing the active shopping cart cached in Redis")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Fetch the active shopping cart for the current authenticated user")
    public ResponseEntity<ShoppingCart> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cartService.getCart(principal.getId()));
    }

    @PostMapping("/add")
    @Operation(summary = "Scan a barcode and add/increment the product in the shopping cart")
    public ResponseEntity<ShoppingCart> addItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID storeId,
            @RequestParam String barcode,
            @RequestParam(defaultValue = "1") int quantity) {
        return ResponseEntity.ok(cartService.addItemToCart(principal.getId(), storeId, barcode, quantity));
    }

    @PutMapping("/update")
    @Operation(summary = "Update the quantity of an item already in the cart")
    public ResponseEntity<ShoppingCart> updateItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID productId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.updateItemQuantity(principal.getId(), productId, quantity));
    }

    @DeleteMapping("/remove/{productId}")
    @Operation(summary = "Remove an item from the cart")
    public ResponseEntity<ShoppingCart> removeItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID productId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(principal.getId(), productId));
    }

    @PostMapping("/coupon")
    @Operation(summary = "Apply a promotional coupon code to the shopping cart")
    public ResponseEntity<ShoppingCart> applyCoupon(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String code) {
        return ResponseEntity.ok(cartService.applyCoupon(principal.getId(), code));
    }

    @DeleteMapping("/coupon")
    @Operation(summary = "Remove the currently applied coupon code")
    public ResponseEntity<ShoppingCart> removeCoupon(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cartService.removeCoupon(principal.getId()));
    }

    @DeleteMapping("/clear")
    @Operation(summary = "Flush all items and clear the active cart cache")
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal UserPrincipal principal) {
        cartService.clearCart(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
