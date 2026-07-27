package com.sales.repository;

import com.sales.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    Optional<OrderItem> findByIdAndOrderId(String id, String orderId);
}
