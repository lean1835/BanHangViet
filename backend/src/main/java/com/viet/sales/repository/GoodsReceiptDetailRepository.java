package com.viet.sales.repository;

import com.viet.sales.entity.GoodsReceiptDetail;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptDetailRepository extends JpaRepository<GoodsReceiptDetail, String> {

    @EntityGraph(attributePaths = {"product"})
    List<GoodsReceiptDetail> findByReceiptId(String receiptId);
}
