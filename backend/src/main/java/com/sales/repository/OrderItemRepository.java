package com.sales.repository;

import com.sales.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, String> {

    Optional<OrderItem> findByIdAndOrderId(String id, String orderId);

    interface PromotionMetricsProjection {
        Long getTotalOrdersCount();
        BigDecimal getTotalQuantitySold();
        BigDecimal getPromotionRevenue();
        BigDecimal getTotalDiscountAmount();
    }

    interface PromotionProductStatProjection {
        String getProductId();
        String getProductName();
        BigDecimal getQuantitySold();
        BigDecimal getRevenue();
        BigDecimal getDiscountAmount();
    }

    @Query("""
        SELECT 
            COUNT(DISTINCT oi.order.id) as totalOrdersCount,
            COALESCE(SUM(oi.quantity), 0) as totalQuantitySold,
            COALESCE(SUM(oi.subtotal), 0) as promotionRevenue,
            COALESCE(SUM(oi.discountAmount), 0) as totalDiscountAmount
        FROM OrderItem oi
        WHERE oi.promotion.id = :promotionId
          AND oi.order.status = 'COMPLETED'
    """)
    PromotionMetricsProjection getPromotionMetrics(@Param("promotionId") String promotionId);

    @Query("""
        SELECT 
            oi.product.id as productId,
            oi.productName as productName,
            COALESCE(SUM(oi.quantity), 0) as quantitySold,
            COALESCE(SUM(oi.subtotal), 0) as revenue,
            COALESCE(SUM(oi.discountAmount), 0) as discountAmount
        FROM OrderItem oi
        WHERE oi.promotion.id = :promotionId
          AND oi.order.status = 'COMPLETED'
        GROUP BY oi.product.id, oi.productName
        ORDER BY SUM(oi.subtotal) DESC
    """)
    List<PromotionProductStatProjection> getPromotionProductStats(@Param("promotionId") String promotionId);

    @Query("""
        SELECT COALESCE(SUM(oi.subtotal), 0)
        FROM OrderItem oi
        WHERE oi.order.household.id = :householdId
          AND oi.order.status = 'COMPLETED'
          AND oi.order.createdAt >= :startDate
          AND oi.order.createdAt < :endDate
          AND oi.product.id IN :productIds
    """)
    BigDecimal getBaselineRevenueForProducts(
            @Param("householdId") String householdId,
            @Param("productIds") List<String> productIds,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT COALESCE(SUM(oi.subtotal), 0)
        FROM OrderItem oi
        WHERE oi.order.household.id = :householdId
          AND oi.order.status = 'COMPLETED'
          AND oi.order.createdAt >= :startDate
          AND oi.order.createdAt < :endDate
    """)
    BigDecimal getBaselineRevenueForAll(
            @Param("householdId") String householdId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
