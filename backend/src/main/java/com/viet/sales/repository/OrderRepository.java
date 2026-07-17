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
}
