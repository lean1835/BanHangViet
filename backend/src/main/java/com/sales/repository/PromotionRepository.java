package com.sales.repository;

import com.sales.constant.PromotionStatus;
import com.sales.entity.Promotion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, String>, JpaSpecificationExecutor<Promotion> {

    Optional<Promotion> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    @Override
    @EntityGraph(attributePaths = {"promotionProducts", "promotionProductGroups"})
    org.springframework.data.domain.Page<Promotion> findAll(org.springframework.data.jpa.domain.Specification<Promotion> spec, org.springframework.data.domain.Pageable pageable);

    @EntityGraph(attributePaths = {"promotionProducts", "promotionProducts.product", "promotionProductGroups", "promotionProductGroups.productGroup"})
    @Query("SELECT p FROM Promotion p WHERE p.id = :id AND p.household.id = :householdId AND p.deletedAt IS NULL")
    Optional<Promotion> findDetailByIdAndHouseholdId(@Param("id") String id, @Param("householdId") String householdId);

    boolean existsByHouseholdIdAndNameAndDeletedAtIsNull(String householdId, String name);

    boolean existsByHouseholdIdAndNameAndIdNotAndDeletedAtIsNull(String householdId, String name, String id);

    @Query("SELECT p FROM Promotion p WHERE p.household.id = :householdId AND p.status = :status AND p.deletedAt IS NULL AND p.startDate <= :now AND p.endDate >= :now")
    List<Promotion> findActivePromotionsAtNow(
            @Param("householdId") String householdId,
            @Param("status") PromotionStatus status,
            @Param("now") LocalDateTime now
    );
}
