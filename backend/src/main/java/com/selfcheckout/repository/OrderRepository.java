package com.selfcheckout.repository;

import com.selfcheckout.entity.Order;
import com.selfcheckout.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Order> findByStoreIdOrderByCreatedAtDesc(UUID storeId);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.status = :status AND o.createdAt >= :startDate")
    BigDecimal sumFinalAmountByStatusAndCreatedAtAfter(@Param("status") OrderStatus status, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status AND o.createdAt >= :startDate")
    long countByStatusAndCreatedAtAfter(@Param("status") OrderStatus status, @Param("startDate") LocalDateTime startDate);
}
