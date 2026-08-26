package com.sales.repository;

import com.sales.dto.response.DailyRevenueProjection;
import com.sales.dto.response.PeakDayOfWeekProjection;
import com.sales.dto.response.PeakHeatmapProjection;
import com.sales.dto.response.PeakHourlyProjection;
import com.sales.dto.response.PosDailyRevenueProjection;
import com.sales.dto.response.PosRevenueProjection;
import com.sales.dto.response.ProductRevenueProjection;
import com.sales.dto.response.PurchaseSuggestionProjection;
import com.sales.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    long countByHouseholdIdAndIsOfflineTrue(String householdId);

    Optional<Order> findByOrderNumberAndDeletedAtIsNull(String orderNumber);

    Optional<Order> findByOrderNumberAndHouseholdIdAndDeletedAtIsNull(String orderNumber, String householdId);

    @EntityGraph(attributePaths = {"items", "items.product", "customer", "shift", "createdByUser", "household"})
    List<Order> findByOrderNumberInAndHouseholdIdAndDeletedAtIsNull(Collection<String> orderNumbers, String householdId);

    List<Order> findByShiftIdAndDeletedAtIsNull(String shiftId);

    boolean existsByShiftIdAndStatusAndDeletedAtIsNull(String shiftId, String status);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.shift.id = :shiftId AND o.status = :status AND o.paymentMethod = :paymentMethod AND o.deletedAt IS NULL")
    BigDecimal sumFinalAmountByShiftIdAndStatusAndPaymentMethodAndDeletedAtIsNull(
            @Param("shiftId") String shiftId,
            @Param("status") String status,
            @Param("paymentMethod") String paymentMethod
    );

    @Query("SELECT COALESCE(SUM(" +
           "  CASE " +
           "    WHEN o.paymentMethod = 'DEBT' THEN (o.finalAmount - COALESCE((SELECT cd.amount FROM CustomerDebt cd WHERE cd.order.id = o.id AND cd.type = 'DEBT_CREATED'), 0)) " +
           "    ELSE o.finalAmount " +
           "  END), 0) " +
           "FROM Order o " +
           "WHERE o.shift.id = :shiftId AND o.status = 'COMPLETED' AND o.deletedAt IS NULL")
    BigDecimal sumCollectedAmountByShiftId(@Param("shiftId") String shiftId);

    int countByShiftIdAndStatusAndDeletedAtIsNull(String shiftId, String status);

    @EntityGraph(attributePaths = {"items", "items.product", "customer", "shift", "createdByUser", "household"})
    List<Order> findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc(String householdId);

    List<Order> findByHouseholdIdAndStatusAndDeletedAtIsNull(String householdId, String status);

    @EntityGraph(attributePaths = {"items", "items.product", "customer", "createdByUser"})
    @Query("SELECT o FROM Order o WHERE o.household.id = :householdId AND o.deletedAt IS NULL AND o.createdAt BETWEEN :start AND :end ORDER BY o.createdAt DESC")
    List<Order> findOrdersForBackup(
            @Param("householdId") String householdId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

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
            "DATE(o.created_at) as salesDate, " +
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

    @Query(value = "SELECT " +
            "oi.product_id as productId, " +
            "SUM(oi.quantity) as totalQuantitySold, " +
            "SUM(CASE WHEN (o.discount_amount > 0 OR oi.discount_amount > 0) THEN 1 ELSE 0 END) as promotionCount " +
            "FROM order_items oi " +
            "JOIN orders o ON o.id = oi.order_id " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime " +
            "GROUP BY oi.product_id", nativeQuery = true)
    List<com.sales.dto.response.ProductSalesSummaryProjection> getProductSalesSummary(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime
    );

    @Query(value = "SELECT " +
            "p.id AS productId, " +
            "p.sku AS sku, " +
            "p.name AS productName, " +
            "p.unit AS unit, " +
            "p.cost_price AS costPrice, " +
            "COALESCE(p.stock_quantity, 0) AS stockQuantity, " +
            "COALESCE(p.min_stock_quantity, 0) AS minStockQuantity, " +
            "g.id AS groupId, " +
            "g.name AS groupName, " +
            "SUM(oi.quantity) AS totalSoldInPeriod, " +
            "SUM(CASE WHEN (o.discount_amount > 0 OR oi.discount_amount > 0) THEN 1 ELSE 0 END) AS promotionCount, " +
            "ROUND(SUM(oi.quantity) / (:periodWeeks), 2) AS averageWeeklySales, " +
            "CEIL(ROUND(SUM(oi.quantity) / (:periodWeeks), 2) - COALESCE(p.stock_quantity, 0)) AS suggestedQuantity " +
            "FROM order_items oi " +
            "JOIN orders o ON o.id = oi.order_id " +
            "JOIN products p ON p.id = oi.product_id " +
            "LEFT JOIN product_groups g ON g.id = p.group_id AND g.deleted_at IS NULL " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime " +
            "AND p.deleted_at IS NULL " +
            "AND p.status = 'ACTIVE' " +
            "AND (:groupId IS NULL OR :groupId = '' OR p.group_id = :groupId) " +
            "GROUP BY p.id, p.sku, p.name, p.unit, p.cost_price, p.stock_quantity, p.min_stock_quantity, g.id, g.name " +
            "HAVING CEIL(ROUND(SUM(oi.quantity) / (:periodWeeks), 2) - COALESCE(p.stock_quantity, 0)) > 0 " +
            "ORDER BY suggestedQuantity DESC, p.id ASC",
            countQuery = "SELECT COUNT(*) FROM (" +
                    "SELECT p.id FROM order_items oi " +
                    "JOIN orders o ON o.id = oi.order_id " +
                    "JOIN products p ON p.id = oi.product_id " +
                    "WHERE o.household_id = :householdId " +
                    "AND o.status = 'COMPLETED' " +
                    "AND o.deleted_at IS NULL " +
                    "AND o.created_at >= :startDateTime " +
                    "AND p.deleted_at IS NULL " +
                    "AND p.status = 'ACTIVE' " +
                    "AND (:groupId IS NULL OR :groupId = '' OR p.group_id = :groupId) " +
                    "GROUP BY p.id, p.stock_quantity " +
                    "HAVING CEIL(ROUND(SUM(oi.quantity) / (:periodWeeks), 2) - COALESCE(p.stock_quantity, 0)) > 0" +
                    ") AS count_table",
            nativeQuery = true)
    Page<PurchaseSuggestionProjection> getPurchaseSuggestions(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("periodWeeks") double periodWeeks,
            @Param("groupId") String groupId,
            Pageable pageable);

    @Query(value = "SELECT " +
            "o.point_of_sale_id AS posId, " +
            "COUNT(o.id) AS orderCount, " +
            "COALESCE(SUM(o.total_amount), 0) AS grossSales, " +
            "COALESCE(SUM(o.discount_amount), 0) AS totalDiscount, " +
            "COALESCE(SUM(o.final_amount), 0) AS netRevenue, " +
            "COALESCE(SUM(CASE WHEN o.payment_method = 'CASH' THEN o.final_amount ELSE 0 END), 0) AS cashRevenue, " +
            "COALESCE(SUM(CASE WHEN o.payment_method = 'BANK_TRANSFER' THEN o.final_amount ELSE 0 END), 0) AS bankRevenue, " +
            "COALESCE(SUM(CASE WHEN o.payment_method = 'DEBT' THEN o.final_amount ELSE 0 END), 0) AS debtRevenue " +
            "FROM orders o " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime AND o.created_at <= :endDateTime " +
            "AND (:posId IS NULL OR :posId = '' OR o.point_of_sale_id = :posId) " +
            "GROUP BY o.point_of_sale_id", nativeQuery = true)
    List<PosRevenueProjection> getPosRevenueSummary(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("posId") String posId
    );

    @Query(value = "SELECT " +
            "DATE(o.created_at) AS salesDate, " +
            "o.point_of_sale_id AS posId, " +
            "p.name AS posName, " +
            "COUNT(o.id) AS orderCount, " +
            "COALESCE(SUM(o.final_amount), 0) AS netRevenue " +
            "FROM orders o " +
            "LEFT JOIN points_of_sale p ON p.id = o.point_of_sale_id " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime AND o.created_at <= :endDateTime " +
            "AND (:posId IS NULL OR :posId = '' OR o.point_of_sale_id = :posId) " +
            "GROUP BY DATE(o.created_at), o.point_of_sale_id, p.name " +
            "ORDER BY salesDate ASC, netRevenue DESC", nativeQuery = true)
    List<PosDailyRevenueProjection> getPosDailyRevenue(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("posId") String posId
    );

    @Query(value = "SELECT " +
            "HOUR(o.created_at) AS hourOfDay, " +
            "COUNT(o.id) AS orderCount, " +
            "COALESCE(SUM(o.final_amount), 0) AS totalRevenue, " +
            "COALESCE(SUM(o.total_amount), 0) AS grossRevenue, " +
            "COALESCE(SUM(o.discount_amount), 0) AS totalDiscount " +
            "FROM orders o " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime AND o.created_at <= :endDateTime " +
            "AND (:posId IS NULL OR :posId = '' OR o.point_of_sale_id = :posId) " +
            "GROUP BY HOUR(o.created_at) " +
            "ORDER BY hourOfDay ASC", nativeQuery = true)
    List<PeakHourlyProjection> getPeakHourlyAnalysis(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("posId") String posId
    );

    @Query(value = "SELECT " +
            "DAYOFWEEK(o.created_at) AS dayOfWeek, " +
            "COUNT(o.id) AS orderCount, " +
            "COALESCE(SUM(o.final_amount), 0) AS totalRevenue, " +
            "COALESCE(SUM(o.total_amount), 0) AS grossRevenue, " +
            "COALESCE(SUM(o.discount_amount), 0) AS totalDiscount " +
            "FROM orders o " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime AND o.created_at <= :endDateTime " +
            "AND (:posId IS NULL OR :posId = '' OR o.point_of_sale_id = :posId) " +
            "GROUP BY DAYOFWEEK(o.created_at) " +
            "ORDER BY dayOfWeek ASC", nativeQuery = true)
    List<PeakDayOfWeekProjection> getPeakDayOfWeekAnalysis(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("posId") String posId
    );

    @Query(value = "SELECT " +
            "DAYOFWEEK(o.created_at) AS dayOfWeek, " +
            "HOUR(o.created_at) AS hourOfDay, " +
            "COUNT(o.id) AS orderCount, " +
            "COALESCE(SUM(o.final_amount), 0) AS totalRevenue " +
            "FROM orders o " +
            "WHERE o.household_id = :householdId " +
            "AND o.status = 'COMPLETED' " +
            "AND o.deleted_at IS NULL " +
            "AND o.created_at >= :startDateTime AND o.created_at <= :endDateTime " +
            "AND (:posId IS NULL OR :posId = '' OR o.point_of_sale_id = :posId) " +
            "GROUP BY DAYOFWEEK(o.created_at), HOUR(o.created_at) " +
            "ORDER BY dayOfWeek ASC, hourOfDay ASC", nativeQuery = true)
    List<PeakHeatmapProjection> getPeakHeatmapAnalysis(
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            @Param("posId") String posId
    );
}
