package com.sales.repository;

import com.sales.constant.BatchStatus;
import com.sales.entity.PriceAdjustmentBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PriceAdjustmentBatchRepository extends JpaRepository<PriceAdjustmentBatch, String>, JpaSpecificationExecutor<PriceAdjustmentBatch> {

    Optional<PriceAdjustmentBatch> findByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"items", "items.product"})
    Optional<PriceAdjustmentBatch> findWithItemsByIdAndHouseholdId(String id, String householdId);

    Page<PriceAdjustmentBatch> findByHouseholdIdOrderByAppliedAtDesc(String householdId, Pageable pageable);

    Page<PriceAdjustmentBatch> findByHouseholdIdAndStatusOrderByAppliedAtDesc(String householdId, BatchStatus status, Pageable pageable);

    boolean existsByBatchCodeAndHouseholdId(String batchCode, String householdId);

    long countByHouseholdIdAndBatchCodeStartingWith(String householdId, String prefix);
}
