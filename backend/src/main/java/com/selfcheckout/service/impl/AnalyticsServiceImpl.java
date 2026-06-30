package com.selfcheckout.service.impl;

import com.selfcheckout.dto.AnalyticsDto.*;
import com.selfcheckout.dto.CheckoutDto.OrderDto;
import com.selfcheckout.dto.CheckoutDto.OrderItemDto;
import com.selfcheckout.entity.AuditLog;
import com.selfcheckout.entity.Order;
import com.selfcheckout.entity.OrderStatus;
import com.selfcheckout.entity.Store;
import com.selfcheckout.repository.AuditLogRepository;
import com.selfcheckout.repository.OrderRepository;
import com.selfcheckout.repository.StoreRepository;
import com.selfcheckout.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardData getDashboardData() {
        // Fetch all orders
        List<Order> allOrders = orderRepository.findAll();
        
        // Filter active/paid/verified orders for revenue calculation
        List<Order> completedOrders = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID || o.getStatus() == OrderStatus.VERIFIED)
                .toList();

        // 1. Calculate general sales summary
        BigDecimal totalRevenue = completedOrders.stream()
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long totalOrdersCount = completedOrders.size();
        BigDecimal averageOrderValue = BigDecimal.ZERO;
        if (totalOrdersCount > 0) {
            averageOrderValue = totalRevenue.divide(BigDecimal.valueOf(totalOrdersCount), 2, RoundingMode.HALF_UP);
        }

        SalesSummary summary = SalesSummary.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrdersCount)
                .averageOrderValue(averageOrderValue)
                .build();

        // 2. Calculate store performance
        List<Store> stores = storeRepository.findAll();
        Map<Store, List<Order>> ordersByStore = completedOrders.stream()
                .collect(Collectors.groupingBy(Order::getStore));

        List<StoreSales> storeSalesList = new ArrayList<>();
        for (Store store : stores) {
            List<Order> storeOrders = ordersByStore.getOrDefault(store, new ArrayList<>());
            BigDecimal storeRevenue = storeOrders.stream()
                    .map(Order::getFinalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            storeSalesList.add(StoreSales.builder()
                    .storeId(store.getId())
                    .storeName(store.getName())
                    .revenue(storeRevenue)
                    .orderCount(storeOrders.size())
                    .build());
        }

        // 3. Retrieve recent orders (limit 10)
        List<OrderDto> recentOrders = allOrders.stream()
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .limit(10)
                .map(this::mapToOrderDto)
                .collect(Collectors.toList());

        // 4. Retrieve recent logs (limit 10)
        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByTimestampDesc();
        List<AuditLogDto> recentLogs = allLogs.stream()
                .limit(10)
                .map(log -> AuditLogDto.builder()
                        .id(log.getId())
                        .username(log.getUser() != null ? log.getUser().getUsername() : "SYSTEM")
                        .action(log.getAction())
                        .details(log.getDetails())
                        .timestamp(log.getTimestamp().toString())
                        .build())
                .collect(Collectors.toList());

        return DashboardData.builder()
                .salesSummary(summary)
                .storeSales(storeSalesList)
                .recentOrders(recentOrders)
                .recentLogs(recentLogs)
                .build();
    }

    private OrderDto mapToOrderDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems().stream().map(item -> 
            OrderItemDto.builder()
                    .productName(item.getProduct().getName())
                    .barcode(item.getProduct().getBarcode())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .taxAmount(item.getTaxAmount())
                    .discountAmount(item.getDiscountAmount())
                    .finalAmount(item.getFinalAmount())
                    .build()
        ).collect(Collectors.toList());

        return OrderDto.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .storeName(order.getStore().getName())
                .storeAddress(order.getStore().getAddress())
                .customerName(order.getUser().getUsername())
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus().name())
                .receiptQrToken(order.getReceiptQrToken())
                .createdAt(order.getCreatedAt())
                .items(itemDtos)
                .build();
    }
}
