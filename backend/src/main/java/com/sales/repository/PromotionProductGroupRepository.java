package com.sales.repository;

import com.sales.entity.PromotionProductGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionProductGroupRepository extends JpaRepository<PromotionProductGroup, String> {
    void deleteByPromotionId(String promotionId);
    List<PromotionProductGroup> findByPromotionId(String promotionId);
}
