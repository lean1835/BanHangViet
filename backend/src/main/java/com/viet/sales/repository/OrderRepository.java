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
}
