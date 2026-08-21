package com.sales.repository;

import com.sales.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, String> {

    @Query("SELECT DISTINCT p FROM Promotion p " +
           "LEFT JOIN FETCH p.promotionProducts pp " +
           "LEFT JOIN FETCH p.promotionProductGroups ppg " +
           "WHERE p.household.id = :householdId " +
           "AND p.status = 'ACTIVE' " +
           "AND p.deletedAt IS NULL " +
           "AND p.startDate <= :atTime " +
           "AND p.endDate >= :atTime " +
           "ORDER BY p.createdAt DESC")
    List<Promotion> findActivePromotionsAtTime(
            @Param("householdId") String householdId,
            @Param("atTime") LocalDateTime atTime
    );

    List<Promotion> findByHouseholdIdAndDeletedAtIsNull(String householdId);
}
