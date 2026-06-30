package com.selfcheckout.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class AnalyticsDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesSummary {
        private BigDecimal totalRevenue;
        private long totalOrders;
        private BigDecimal averageOrderValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StoreSales {
        private UUID storeId;
        private String storeName;
        private BigDecimal revenue;
        private long orderCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardData {
        private SalesSummary salesSummary;
        private List<StoreSales> storeSales;
        private List<CheckoutDto.OrderDto> recentOrders;
        private List<AuditLogDto> recentLogs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditLogDto {
        private UUID id;
        private String username;
        private String action;
        private String details;
        private String timestamp;
    }
}
