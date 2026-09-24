package com.sales.modules.order.repository;
import com.sales.modules.order.entity.OrderPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderPaymentRepository extends JpaRepository<OrderPayment, String> {

    List<OrderPayment> findByOrderId(String orderId);

    List<OrderPayment> findByOrderIdAndHouseholdId(String orderId, String householdId);

    Optional<OrderPayment> findByIdAndOrderIdAndHouseholdId(String id, String orderId, String householdId);

    boolean existsByOrderId(String orderId);

    List<OrderPayment> findByOrderIdIn(Collection<String> orderIds);

    @Query("SELECT COALESCE(SUM(op.amount), 0) FROM OrderPayment op " +
           "WHERE op.order.shift.id = :shiftId AND op.paymentMethod = 'CASH' " +
           "AND op.order.status = 'COMPLETED' AND op.order.deletedAt IS NULL")
    BigDecimal sumCashAmountByShiftId(@Param("shiftId") String shiftId);

    @Query("SELECT COALESCE(SUM(op.amount), 0) FROM OrderPayment op " +
           "WHERE op.order.shift.id = :shiftId AND op.paymentMethod = :paymentMethod " +
           "AND op.order.status = 'COMPLETED' AND op.order.deletedAt IS NULL")
    BigDecimal sumAmountByShiftIdAndPaymentMethod(@Param("shiftId") String shiftId, @Param("paymentMethod") String paymentMethod);

    Optional<OrderPayment> findFirstByOrderIdAndHouseholdIdAndPaymentMethod(String orderId, String householdId, String paymentMethod);

    Optional<OrderPayment> findFirstByOrderIdAndPaymentMethod(String orderId, String paymentMethod);

    @Query("SELECT op FROM OrderPayment op " +
           "JOIN FETCH op.order o " +
           "LEFT JOIN FETCH op.confirmedByUser cu " +
           "WHERE op.order.id = :orderId AND op.household.id = :householdId " +
           "ORDER BY op.createdAt ASC")
    List<OrderPayment> findByOrderIdAndHouseholdIdWithDetails(@Param("orderId") String orderId, @Param("householdId") String householdId);

    @Query("SELECT op FROM OrderPayment op " +
           "JOIN FETCH op.order o " +
           "LEFT JOIN FETCH op.confirmedByUser cu " +
           "WHERE o.shift.id = :shiftId AND op.household.id = :householdId " +
           "AND op.paymentMethod = 'BANK_TRANSFER' AND o.deletedAt IS NULL AND o.status <> 'CANCELED' " +
           "ORDER BY op.createdAt DESC")
    List<OrderPayment> findBankTransfersByShiftIdAndHouseholdId(@Param("shiftId") String shiftId, @Param("householdId") String householdId);

    interface PaymentMethodRevenueProjection {
        String getPaymentMethod();
        BigDecimal getTotalAmount();
        Long getCount();
    }

    @Query("""
        SELECT 
            op.paymentMethod as paymentMethod,
            COALESCE(SUM(op.amount), 0) as totalAmount,
            COUNT(op.id) as count
        FROM OrderPayment op
        JOIN op.order o
        WHERE op.household.id = :householdId
          AND o.status = 'COMPLETED'
          AND o.deletedAt IS NULL
          AND o.createdAt >= :startDate
          AND o.createdAt <= :endDate
          AND (:userId IS NULL OR o.createdByUser.id = :userId)
          AND (:shiftId IS NULL OR o.shift.id = :shiftId)
        GROUP BY op.paymentMethod
    """)
    List<PaymentMethodRevenueProjection> getRevenueByPaymentMethod(
            @Param("householdId") String householdId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            @Param("userId") String userId,
            @Param("shiftId") String shiftId
    );

    @Query("""
        SELECT op FROM OrderPayment op
        JOIN FETCH op.order o
        WHERE op.household.id = :householdId
          AND o.status = 'COMPLETED'
          AND o.deletedAt IS NULL
          AND o.createdAt >= :startDate
          AND o.createdAt <= :endDate
          AND (:userId IS NULL OR o.createdByUser.id = :userId)
          AND (:shiftId IS NULL OR o.shift.id = :shiftId)
        ORDER BY o.createdAt ASC
    """)
    List<OrderPayment> findPaymentsInPeriod(
            @Param("householdId") String householdId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            @Param("userId") String userId,
            @Param("shiftId") String shiftId
    );
}

