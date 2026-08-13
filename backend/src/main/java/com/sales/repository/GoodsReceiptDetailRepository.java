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

import java.util.Collection;
import java.util.List;

@Repository
public interface GoodsReceiptDetailRepository extends JpaRepository<GoodsReceiptDetail, String> {

    @EntityGraph(attributePaths = {"product"})
    List<GoodsReceiptDetail> findByReceiptId(String receiptId);

    @Query("SELECT grd.receipt.supplier FROM GoodsReceiptDetail grd WHERE grd.product.id = :productId AND grd.receipt.supplier IS NOT NULL ORDER BY grd.receipt.receivedAt DESC")
    List<Supplier> findLatestSupplierByProductId(@Param("productId") String productId, Pageable pageable);

    @Query(value = "SELECT grd.product_id as productId, s.id as supplierId, s.name as supplierName, s.phone_number as supplierPhone " +
           "FROM goods_receipt_details grd " +
           "JOIN goods_receipts gr ON gr.id = grd.receipt_id " +
           "JOIN suppliers s ON s.id = gr.supplier_id " +
           "WHERE grd.product_id IN (:productIds) " +
           "AND (grd.product_id, gr.received_at) IN (" +
           "    SELECT grd2.product_id, MAX(gr2.received_at) " +
           "    FROM goods_receipt_details grd2 " +
           "    JOIN goods_receipts gr2 ON gr2.id = grd2.receipt_id " +
           "    WHERE grd2.product_id IN (:productIds) " +
           "    GROUP BY grd2.product_id" +
           ") " +
           "GROUP BY grd.product_id, s.id, s.name, s.phone_number", nativeQuery = true)
    List<LatestSupplierProjection> findLatestSuppliersByProductIds(@Param("productIds") Collection<String> productIds);
}
