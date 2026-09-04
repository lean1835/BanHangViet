package com.sales.repository;

import com.sales.entity.GoodsReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, String> {
    
    @EntityGraph(attributePaths = {"createdByUser", "supplier"})
    Optional<GoodsReceipt> findByIdAndHouseholdId(String id, String householdId);
    
    @EntityGraph(attributePaths = {"createdByUser", "supplier"})
    Page<GoodsReceipt> findByHouseholdId(String householdId, Pageable pageable);
    
    boolean existsByReceiptNumber(String receiptNumber);

    boolean existsBySupplierId(String supplierId);
}
