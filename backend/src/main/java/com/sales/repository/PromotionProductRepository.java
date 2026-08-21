package com.sales.repository;

import com.sales.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionProductRepository extends JpaRepository<PromotionProduct, String> {
    List<PromotionProduct> findByPromotionId(String promotionId);
    void deleteByPromotionId(String promotionId);
}
