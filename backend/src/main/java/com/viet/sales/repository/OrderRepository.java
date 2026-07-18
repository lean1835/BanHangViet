package com.viet.sales.repository;

import com.viet.sales.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    @EntityGraph(attributePaths = {"items", "items.product", "customer", "shift", "createdByUser", "household"})
    Optional<Order> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    boolean existsByOrderNumber(String orderNumber);

    List<Order> findByShiftIdAndDeletedAtIsNull(String shiftId);

    boolean existsByShiftIdAndStatusAndDeletedAtIsNull(String shiftId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.shift.id = :shiftId AND o.status = :status AND o.paymentMethod = :paymentMethod AND o.deletedAt IS NULL")
    java.math.BigDecimal sumFinalAmountByShiftIdAndStatusAndPaymentMethodAndDeletedAtIsNull(
            @org.springframework.data.repository.query.Param("shiftId") String shiftId,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("paymentMethod") String paymentMethod
    );

    int countByShiftIdAndStatusAndDeletedAtIsNull(String shiftId, String status);
}
