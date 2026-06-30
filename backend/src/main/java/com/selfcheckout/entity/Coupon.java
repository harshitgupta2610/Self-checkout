package com.selfcheckout.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "coupons", uniqueConstraints = {
    @UniqueConstraint(columnNames = "code")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String code;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "max_discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "min_cart_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal minCartValue;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @NotNull
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;
}
