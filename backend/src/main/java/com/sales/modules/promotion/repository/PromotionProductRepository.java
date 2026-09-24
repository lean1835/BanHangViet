package com.sales.modules.promotion.repository;
import com.sales.modules.promotion.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionProductRepository extends JpaRepository<PromotionProduct, String> {
    void deleteByPromotionId(String promotionId);
    List<PromotionProduct> findByPromotionId(String promotionId);
}
