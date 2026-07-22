package com.viet.sales.repository;

import com.viet.sales.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    @EntityGraph(attributePaths = {"items", "items.product", "customer", "shift", "createdByUser", "household"})
    Optional<Order> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    boolean existsByOrderNumber(String orderNumber);

    List<Order> findByShiftIdAndDeletedAtIsNull(String shiftId);

    boolean existsByShiftIdAndStatusAndDeletedAtIsNull(String shiftId, String status);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.shift.id = :shiftId AND o.status = :status AND o.paymentMethod = :paymentMethod AND o.deletedAt IS NULL")
    BigDecimal sumFinalAmountByShiftIdAndStatusAndPaymentMethodAndDeletedAtIsNull(
            @Param("shiftId") String shiftId,
            @Param("status") String status,
            @Param("paymentMethod") String paymentMethod
    );

    int countByShiftIdAndStatusAndDeletedAtIsNull(String shiftId, String status);

    @EntityGraph(attributePaths = {"items", "items.product", "customer", "shift", "createdByUser", "household"})
    List<Order> findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc(String householdId);

    @EntityGraph(attributePaths = {"items", "items.product", "customer", "shift", "createdByUser", "household"})
    List<Order> findByHouseholdIdAndCreatedByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(String householdId, String userId);

    @EntityGraph(attributePaths = {"customer", "household"})
    java.util.List<Order> findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
            String householdId, String status, java.time.LocalDateTime start, java.time.LocalDateTime end
    );

    @Query(value = "SELECT " +
            "DATE(CONVERT_TZ(o.created_at, '+00:00', '+07:00')) as salesDate, " +
            "COUNT(o.id) as orderCount, " +
            "SUM(o.total_amount) as grossSales, " +
            "SUM(o.discount_amount) as totalDiscounts, " +
            "SUM(o.final_amount) as netRevenue, " +
            "SUM(CASE WHEN o.payment_method = 'CASH' THEN o.final_amount ELSE 0 END) as cashRevenue, " +
            "SUM(CASE WHEN o.payment_method = 'BANK_TRANSFER' THEN o.final_amount ELSE 0 END) as bankRevenue, " +
            "SUM(CASE WHEN o.payment_method = 'DEBT' THEN o.final_amount ELSE 0 END) as debtRevenue " +
            "FROM orders o " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime AND o.created_at <= :endDateTime " +
            "GROUP BY salesDate " +
            "ORDER BY salesDate DESC", nativeQuery = true)
    List<com.viet.sales.dto.response.DailyRevenueProjection> getDailyRevenue(
            @Param("householdId") String householdId,
            @Param("startDateTime") java.time.LocalDateTime startDateTime,
            @Param("endDateTime") java.time.LocalDateTime endDateTime
    );

    @Query(value = "SELECT " +
            "oi.product_id as productId, " +
            "oi.product_name as productName, " +
            "p.sku as sku, " +
            "p.unit as unit, " +
            "SUM(oi.quantity) as quantitySold, " +
            "SUM(oi.subtotal) as revenue " +
            "FROM order_items oi " +
            "JOIN orders o ON o.id = oi.order_id " +
            "LEFT JOIN products p ON p.id = oi.product_id " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime AND o.created_at <= :endDateTime " +
            "GROUP BY oi.product_id, oi.product_name, p.sku, p.unit " +
            "ORDER BY revenue DESC", nativeQuery = true)
    List<com.viet.sales.dto.response.ProductRevenueProjection> getProductRevenue(
            @Param("householdId") String householdId,
            @Param("startDateTime") java.time.LocalDateTime startDateTime,
            @Param("endDateTime") java.time.LocalDateTime endDateTime
    );
}
