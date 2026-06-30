package com.selfcheckout.controller;

import com.selfcheckout.dto.AnalyticsDto.DashboardData;
import com.selfcheckout.dto.CatalogDto.ProductDto;
import com.selfcheckout.dto.CatalogDto.StoreDto;
import com.selfcheckout.entity.Coupon;
import com.selfcheckout.entity.Product;
import com.selfcheckout.entity.Store;
import com.selfcheckout.repository.CouponRepository;
import com.selfcheckout.service.AnalyticsService;
import com.selfcheckout.service.ProductService;
import com.selfcheckout.service.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Operations", description = "Endpoints for administrator analytics, stock management, and configurations")
public class AdminController {

    private final AnalyticsService analyticsService;
    private final StoreService storeService;
    private final ProductService productService;
    private final CouponRepository couponRepository;

    // --- Dashboard ---
    @GetMapping("/dashboard")
    @Operation(summary = "Get aggregated sales, revenues, branch lists, and recent activity logs")
    public ResponseEntity<DashboardData> getDashboardData() {
        return ResponseEntity.ok(analyticsService.getDashboardData());
    }

    // --- Stores ---
    @PostMapping("/stores")
    @Operation(summary = "Create a new retail outlet store")
    public ResponseEntity<Store> createStore(@Valid @RequestBody StoreDto storeDto) {
        return new ResponseEntity<>(storeService.createStore(storeDto), HttpStatus.CREATED);
    }

    // --- Products ---
    @PostMapping("/products")
    @Operation(summary = "Create a new product entry")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductDto productDto) {
        return new ResponseEntity<>(productService.createProduct(productDto), HttpStatus.CREATED);
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Update an existing product description or stock volume")
    public ResponseEntity<Product> updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductDto productDto) {
        return ResponseEntity.ok(productService.updateProduct(id, productDto));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Remove a product from the database catalog")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // --- Coupons ---
    @GetMapping("/coupons")
    @Operation(summary = "Get list of all promotional discount coupons")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    @PostMapping("/coupons")
    @Operation(summary = "Create a new discount coupon")
    public ResponseEntity<Coupon> createCoupon(@Valid @RequestBody Coupon coupon) {
        return new ResponseEntity<>(couponRepository.save(coupon), HttpStatus.CREATED);
    }

    @PutMapping("/coupons/{id}")
    @Operation(summary = "Update coupon rules")
    public ResponseEntity<Coupon> updateCoupon(@PathVariable UUID id, @Valid @RequestBody Coupon couponDetails) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found with ID: " + id));
        
        coupon.setCode(couponDetails.getCode());
        coupon.setDiscountPercentage(couponDetails.getDiscountPercentage());
        coupon.setMaxDiscountAmount(couponDetails.getMaxDiscountAmount());
        coupon.setMinCartValue(couponDetails.getMinCartValue());
        coupon.setActive(couponDetails.isActive());
        coupon.setExpiryDate(couponDetails.getExpiryDate());

        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @DeleteMapping("/coupons/{id}")
    @Operation(summary = "Delete a coupon")
    public ResponseEntity<Void> deleteCoupon(@PathVariable UUID id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found with ID: " + id));
        couponRepository.delete(coupon);
        return ResponseEntity.noContent().build();
    }
}
