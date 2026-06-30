package com.selfcheckout.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

public class CatalogDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StoreDto {
        private UUID id;
        @NotBlank
        private String name;
        @NotBlank
        private String address;
        @NotBlank
        private String qrIdentifier;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductDto {
        private UUID id;
        @NotBlank
        private String barcode;
        @NotBlank
        private String name;
        private String description;
        private String imageUrl;
        @NotNull
        @DecimalMin("0.0")
        private BigDecimal price;
        @NotNull
        @DecimalMin("0.0")
        private BigDecimal gstPercentage;
        @NotNull
        @Min(0)
        private Integer stockQuantity;
    }
}
