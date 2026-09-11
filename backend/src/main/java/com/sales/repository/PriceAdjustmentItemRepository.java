package com.sales.repository;

import com.sales.entity.PriceAdjustmentItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceAdjustmentItemRepository extends JpaRepository<PriceAdjustmentItem, String> {

    @EntityGraph(attributePaths = {"product", "product.group"})
    List<PriceAdjustmentItem> findByBatchId(String batchId);

    List<PriceAdjustmentItem> findByBatchIdAndIsBelowCostTrue(String batchId);

    long countByBatchIdAndIsBelowCostTrue(String batchId);
}
