package com.sales.repository;

import com.sales.entity.ProductPriceTier;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductPriceTierRepository extends JpaRepository<ProductPriceTier, String> {

    @EntityGraph(attributePaths = {"unitConversion", "product"})
    List<ProductPriceTier> findByProductIdAndHouseholdIdOrderByMinQuantityAsc(String productId, String householdId);

    @EntityGraph(attributePaths = {"unitConversion", "product"})
    List<ProductPriceTier> findByProductIdAndHouseholdIdAndIsActiveTrueOrderByMinQuantityAsc(String productId, String householdId);

    @EntityGraph(attributePaths = {"unitConversion", "product"})
    Optional<ProductPriceTier> findByIdAndHouseholdId(String id, String householdId);

    void deleteByProductIdAndHouseholdId(String productId, String householdId);

    boolean existsByUnitConversionId(String unitConversionId);
}
