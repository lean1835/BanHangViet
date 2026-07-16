package com.viet.sales.repository;

import com.viet.sales.entity.GoodsReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, String> {
    
    @EntityGraph(attributePaths = {"createdByUser"})
    Optional<GoodsReceipt> findByIdAndHouseholdId(String id, String householdId);
    
    @EntityGraph(attributePaths = {"createdByUser"})
    Page<GoodsReceipt> findByHouseholdId(String householdId, Pageable pageable);
    
    boolean existsByReceiptNumber(String receiptNumber);
}
