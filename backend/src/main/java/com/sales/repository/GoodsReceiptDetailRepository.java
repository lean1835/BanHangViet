package com.sales.repository;

import com.sales.entity.GoodsReceiptDetail;
import com.sales.entity.Supplier;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptDetailRepository extends JpaRepository<GoodsReceiptDetail, String> {

    @EntityGraph(attributePaths = {"product"})
    List<GoodsReceiptDetail> findByReceiptId(String receiptId);

    @Query("SELECT grd.receipt.supplier FROM GoodsReceiptDetail grd WHERE grd.product.id = :productId AND grd.receipt.supplier IS NOT NULL ORDER BY grd.receipt.receivedAt DESC")
    List<Supplier> findLatestSupplierByProductId(@Param("productId") String productId, Pageable pageable);
}
