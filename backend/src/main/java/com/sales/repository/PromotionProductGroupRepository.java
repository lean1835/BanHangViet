package com.sales.repository;

import com.sales.entity.PromotionProductGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionProductGroupRepository extends JpaRepository<PromotionProductGroup, String> {
    List<PromotionProductGroup> findByPromotionId(String promotionId);
    void deleteByPromotionId(String promotionId);
}
