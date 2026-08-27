package com.sales.repository;

import com.sales.entity.PosInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PosInventoryRepository extends JpaRepository<PosInventory, String>, JpaSpecificationExecutor<PosInventory> {

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    Optional<PosInventory> findByPointOfSaleIdAndProductId(String pointOfSaleId, String productId);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    Optional<PosInventory> findByHouseholdIdAndPointOfSaleIdAndProductId(String householdId, String pointOfSaleId, String productId);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    List<PosInventory> findByHouseholdIdAndPointOfSaleId(String householdId, String pointOfSaleId);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    List<PosInventory> findByHouseholdIdAndPointOfSaleIdAndProductIdIn(String householdId, String pointOfSaleId, java.util.Collection<String> productIds);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    Page<PosInventory> findAll(Specification<PosInventory> spec, Pageable pageable);

    boolean existsByPointOfSaleIdAndProductId(String pointOfSaleId, String productId);

    long countByPointOfSaleId(String pointOfSaleId);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    @Query("SELECT pi FROM PosInventory pi WHERE pi.pointOfSale.id = :posId AND pi.household.id = :householdId " +
           "AND pi.product.deletedAt IS NULL AND pi.product.status = 'ACTIVE' " +
           "AND (pi.stockQuantity <= pi.minStockQuantity OR pi.stockQuantity <= 0)")
    List<PosInventory> findLowStockInventoriesByPos(@Param("householdId") String householdId, @Param("posId") String posId);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    List<PosInventory> findByHouseholdIdAndProductId(String householdId, String productId);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    List<PosInventory> findByHouseholdIdAndProductIdIn(String householdId, java.util.Collection<String> productIds);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    List<PosInventory> findByHouseholdIdAndProductIdAndPointOfSaleIdNot(String householdId, String productId, String excludePosId);

    @EntityGraph(attributePaths = {"product", "pointOfSale", "product.group", "product.taxRate"})
    List<PosInventory> findByHouseholdIdAndProductIdInAndPointOfSaleIdNot(String householdId, java.util.Collection<String> productIds, String excludePosId);

    @Query("SELECT COALESCE(SUM(pi.stockQuantity), 0) FROM PosInventory pi WHERE pi.pointOfSale.id = :posId")
    BigDecimal sumTotalStockByPosId(@Param("posId") String posId);
}
