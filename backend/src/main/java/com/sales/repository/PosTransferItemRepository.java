package com.sales.repository;

import com.sales.entity.PosTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PosTransferItemRepository extends JpaRepository<PosTransferItem, String> {

    List<PosTransferItem> findByTransferId(String transferId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(pti.quantity), 0) FROM PosTransferItem pti " +
           "WHERE pti.transfer.household.id = :householdId " +
           "AND pti.transfer.fromPointOfSale IS NULL " +
           "AND pti.transfer.status = com.sales.constant.PosTransferStatus.IN_TRANSIT " +
           "AND pti.product.id = :productId")
    java.math.BigDecimal sumInTransitFromWarehouseByProductId(@org.springframework.data.repository.query.Param("householdId") String householdId, @org.springframework.data.repository.query.Param("productId") String productId);

    @org.springframework.data.jpa.repository.Query("SELECT pti.product.id, COALESCE(SUM(pti.quantity), 0) FROM PosTransferItem pti " +
           "WHERE pti.transfer.household.id = :householdId " +
           "AND pti.transfer.fromPointOfSale IS NULL " +
           "AND pti.transfer.status = com.sales.constant.PosTransferStatus.IN_TRANSIT " +
           "AND pti.product.id IN :productIds " +
           "GROUP BY pti.product.id")
    List<Object[]> sumInTransitFromWarehouseByProductIds(@org.springframework.data.repository.query.Param("householdId") String householdId, @org.springframework.data.repository.query.Param("productIds") java.util.Collection<String> productIds);
}
