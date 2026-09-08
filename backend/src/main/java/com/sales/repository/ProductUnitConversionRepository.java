package com.sales.repository;

import com.sales.entity.ProductUnitConversion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductUnitConversionRepository extends JpaRepository<ProductUnitConversion, String> {

    List<ProductUnitConversion> findByProductId(String productId);

    List<ProductUnitConversion> findByProductIdIn(java.util.Collection<String> productIds);

    Optional<ProductUnitConversion> findByIdAndProductId(String id, String productId);

    boolean existsByProductIdAndUnitNameIgnoreCase(String productId, String unitName);

    boolean existsByProductIdAndUnitNameIgnoreCaseAndIdNot(String productId, String unitName, String id);

    @Query("SELECT puc FROM ProductUnitConversion puc WHERE puc.product.household.id = :householdId AND puc.barcode = :barcode")
    Optional<ProductUnitConversion> findByHouseholdIdAndBarcode(@Param("householdId") String householdId, @Param("barcode") String barcode);

    @Query("SELECT COUNT(puc) > 0 FROM ProductUnitConversion puc WHERE puc.product.household.id = :householdId AND puc.barcode = :barcode AND (:id IS NULL OR puc.id != :id)")
    boolean existsByHouseholdIdAndBarcodeAndIdNot(
            @Param("householdId") String householdId,
            @Param("barcode") String barcode,
            @Param("id") String id
    );

    List<ProductUnitConversion> findByProductIdAndIsDefaultImportTrue(String productId);

    List<ProductUnitConversion> findByProductIdAndIsDefaultSaleTrue(String productId);
}
