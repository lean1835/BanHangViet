package com.viet.sales.repository;

import com.viet.sales.dto.response.DailyRevenueProjection;
import com.viet.sales.dto.response.ProductRevenueProjection;
import com.viet.sales.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    @EntityGraph(attributePaths = {"items", "items.product", "customer", "shift", "createdByUser", "household"})
    Optional<Order> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    boolean existsByOrderNumber(String orderNumber);

    Optional<Order> findByOrderNumberAndDeletedAtIsNull(String orderNumber);

    Optional<Order> findByOrderNumberAndHouseholdIdAndDeletedAtIsNull(String orderNumber, String householdId);

    List<Order> findByOrderNumberInAndHouseholdIdAndDeletedAtIsNull(Collection<String> orderNumbers, String householdId);

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
    List<Order> findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
            String householdId, String status, LocalDateTime start, LocalDateTime end
    );

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.household.id = :householdId AND o.status = :status AND o.deletedAt IS NULL AND o.createdAt >= :start AND o.createdAt <= :end")
    BigDecimal sumFinalAmountByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
            @Param("householdId") String householdId,
            @Param("status") String status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    long countByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
            String householdId, String status, LocalDateTime start, LocalDateTime end
    );

    @Query(value = "SELECT " +
            "DATE(COALESCE(CONVERT_TZ(o.created_at, '+00:00', '+07:00'), o.created_at)) as salesDate, " +
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
    List<DailyRevenueProjection> getDailyRevenue(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
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
    List<ProductRevenueProjection> getProductRevenue(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );
}
