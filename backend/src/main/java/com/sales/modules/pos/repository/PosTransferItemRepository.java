package com.sales.modules.pos.repository;
import com.sales.modules.pos.entity.PosTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.math.BigDecimal;
import java.util.Collection;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface PosTransferItemRepository extends JpaRepository<PosTransferItem, String> {
    List<PosTransferItem> findByTransferId(String transferId);

    @Query("SELECT COALESCE(SUM(pti.quantity), 0) FROM PosTransferItem pti " +
           "WHERE pti.transfer.household.id = :householdId " +
           "AND pti.transfer.fromPointOfSale IS NULL " +
           "AND pti.transfer.status = com.sales.common.constant.PosTransferStatus.IN_TRANSIT " +
           "AND pti.product.id = :productId")
    BigDecimal sumInTransitFromWarehouseByProductId(@Param("householdId") String householdId, @Param("productId") String productId);

    @Query("SELECT pti.product.id, COALESCE(SUM(pti.quantity), 0) FROM PosTransferItem pti " +
           "WHERE pti.transfer.household.id = :householdId " +
           "AND pti.transfer.fromPointOfSale IS NULL " +
           "AND pti.transfer.status = com.sales.common.constant.PosTransferStatus.IN_TRANSIT " +
           "AND pti.product.id IN :productIds " +
           "GROUP BY pti.product.id")
    List<Object[]> sumInTransitFromWarehouseByProductIds(@Param("householdId") String householdId, @Param("productIds") Collection<String> productIds);
}
