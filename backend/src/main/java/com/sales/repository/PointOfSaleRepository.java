package com.sales.repository;

import com.sales.entity.PointOfSale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PointOfSaleRepository extends JpaRepository<PointOfSale, String>, JpaSpecificationExecutor<PointOfSale> {

    @EntityGraph(attributePaths = {"household"})
    Optional<PointOfSale> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    @EntityGraph(attributePaths = {"household"})
    List<PointOfSale> findAllByHouseholdIdAndDeletedAtIsNull(String householdId);

    @EntityGraph(attributePaths = {"household"})
    List<PointOfSale> findAllByHouseholdIdAndIsActiveTrueAndDeletedAtIsNull(String householdId);

    @EntityGraph(attributePaths = {"household"})
    Optional<PointOfSale> findByHouseholdIdAndIsDefaultTrueAndDeletedAtIsNull(String householdId);

    @Override
    @EntityGraph(attributePaths = {"household"})
    Page<PointOfSale> findAll(Specification<PointOfSale> spec, Pageable pageable);

    boolean existsByHouseholdIdAndNameIgnoreCaseAndDeletedAtIsNull(String householdId, String name);

    boolean existsByHouseholdIdAndNameIgnoreCaseAndIdNotAndDeletedAtIsNull(String householdId, String name, String id);

    boolean existsByHouseholdIdAndPosCodeIgnoreCaseAndDeletedAtIsNull(String householdId, String posCode);

    boolean existsByHouseholdIdAndPosCodeIgnoreCaseAndIdNotAndDeletedAtIsNull(String householdId, String posCode, String id);

    boolean existsByHouseholdIdAndInvoiceSymbolIgnoreCaseAndDeletedAtIsNull(String householdId, String invoiceSymbol);

    boolean existsByHouseholdIdAndInvoiceSymbolIgnoreCaseAndIdNotAndDeletedAtIsNull(String householdId, String invoiceSymbol, String id);

    long countByHouseholdIdAndDeletedAtIsNull(String householdId);

    @Modifying
    @Query("UPDATE PointOfSale p SET p.isDefault = false WHERE p.household.id = :householdId AND p.id <> :excludePosId AND p.deletedAt IS NULL")
    void resetDefaultExcept(@Param("householdId") String householdId, @Param("excludePosId") String excludePosId);

    @Modifying
    @Query("UPDATE PointOfSale p SET p.isDefault = false WHERE p.household.id = :householdId AND p.deletedAt IS NULL")
    void resetAllDefaults(@Param("householdId") String householdId);
}
