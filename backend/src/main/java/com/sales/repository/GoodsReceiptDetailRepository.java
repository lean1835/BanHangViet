package com.sales.repository;

import com.sales.dto.response.LatestSupplierProjection;
import com.sales.entity.GoodsReceiptDetail;
import com.sales.entity.Supplier;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface GoodsReceiptDetailRepository extends JpaRepository<GoodsReceiptDetail, String> {

    @EntityGraph(attributePaths = {"product"})
    List<GoodsReceiptDetail> findByReceiptId(String receiptId);

    boolean existsByUnitConversionId(String unitConversionId);

    @Query("SELECT grd.receipt.supplier FROM GoodsReceiptDetail grd WHERE grd.product.id = :productId AND grd.receipt.supplier IS NOT NULL ORDER BY grd.receipt.receivedAt DESC")
    List<Supplier> findLatestSupplierByProductId(@Param("productId") String productId, Pageable pageable);

    @Query(value = "SELECT grd.product_id as productId, s.id as supplierId, s.name as supplierName, s.phone_number as supplierPhone " +
           "FROM goods_receipt_details grd " +
           "JOIN goods_receipts gr ON gr.id = grd.receipt_id " +
           "JOIN suppliers s ON s.id = gr.supplier_id AND s.deleted_at IS NULL " +
           "WHERE grd.product_id IN (:productIds) " +
           "AND (grd.product_id, gr.received_at) IN (" +
           "    SELECT grd2.product_id, MAX(gr2.received_at) " +
           "    FROM goods_receipt_details grd2 " +
           "    JOIN goods_receipts gr2 ON gr2.id = grd2.receipt_id " +
           "    JOIN suppliers s2 ON s2.id = gr2.supplier_id AND s2.deleted_at IS NULL " +
           "    WHERE grd2.product_id IN (:productIds) " +
           "    GROUP BY grd2.product_id" +
           ") " +
           "GROUP BY grd.product_id, s.id, s.name, s.phone_number", nativeQuery = true)
    List<LatestSupplierProjection> findLatestSuppliersByProductIds(@Param("productIds") Collection<String> productIds);

    @Query("SELECT grd FROM GoodsReceiptDetail grd " +
           "JOIN FETCH grd.receipt gr " +
           "LEFT JOIN FETCH gr.createdByUser " +
           "WHERE grd.product.id = :productId " +
           "AND gr.household.id = :householdId " +
           "ORDER BY gr.receivedAt ASC, grd.createdAt ASC")
    List<GoodsReceiptDetail> findStockMovementsByProduct(
            @Param("productId") String productId,
            @Param("householdId") String householdId
    );

    @Query("SELECT grd FROM GoodsReceiptDetail grd " +
           "JOIN FETCH grd.receipt gr " +
           "LEFT JOIN FETCH gr.createdByUser " +
           "WHERE grd.product.id = :productId " +
           "AND gr.household.id = :householdId " +
           "AND (COALESCE(gr.receivedAt, grd.createdAt) BETWEEN :startDateTime AND :endDateTime) " +
           "ORDER BY COALESCE(gr.receivedAt, grd.createdAt) ASC, grd.createdAt ASC")
    List<GoodsReceiptDetail> findStockMovementsByProductInPeriod(
            @Param("productId") String productId,
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    @Query("SELECT COALESCE(SUM(COALESCE(grd.baseQuantity, grd.quantity)), 0) " +
           "FROM GoodsReceiptDetail grd " +
           "JOIN grd.receipt gr " +
           "WHERE grd.product.id = :productId " +
           "AND gr.household.id = :householdId " +
           "AND COALESCE(gr.receivedAt, grd.createdAt) < :startDateTime")
    BigDecimal sumQuantityBefore(
            @Param("productId") String productId,
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime
    );

    @Query("SELECT COALESCE(SUM(COALESCE(grd.baseQuantity, grd.quantity)), 0) " +
           "FROM GoodsReceiptDetail grd " +
           "JOIN grd.receipt gr " +
           "WHERE grd.product.id = :productId " +
           "AND gr.household.id = :householdId")
    BigDecimal sumQuantityAllTime(
            @Param("productId") String productId,
            @Param("householdId") String householdId
    );

    @Query("SELECT COUNT(grd) > 0 FROM GoodsReceiptDetail grd " +
           "WHERE grd.product.id = :productId " +
           "AND grd.receipt.household.id = :householdId")
    boolean hasStockMovementByProduct(
            @Param("productId") String productId,
            @Param("householdId") String householdId
    );

    @Query("SELECT SUM(grd.quantity * grd.purchasePrice) / NULLIF(SUM(COALESCE(grd.baseQuantity, grd.quantity)), 0) " +
           "FROM GoodsReceiptDetail grd " +
           "WHERE grd.product.id = :productId " +
           "AND grd.receipt.household.id = :householdId")
    BigDecimal calculateWeightedAverageCostPrice(
            @Param("productId") String productId,
            @Param("householdId") String householdId
    );

    @Query("SELECT grd.product.id, SUM(grd.quantity * grd.purchasePrice) / NULLIF(SUM(COALESCE(grd.baseQuantity, grd.quantity)), 0) " +
           "FROM GoodsReceiptDetail grd " +
           "WHERE grd.product.id IN (:productIds) " +
           "AND grd.receipt.household.id = :householdId " +
           "GROUP BY grd.product.id")
    List<Object[]> calculateWeightedAverageCostPrices(
            @Param("productIds") Collection<String> productIds,
            @Param("householdId") String householdId
    );
}

