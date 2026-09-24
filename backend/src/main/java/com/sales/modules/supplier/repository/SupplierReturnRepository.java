package com.sales.modules.supplier.repository;
import com.sales.modules.supplier.entity.SupplierReturn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierReturnRepository extends JpaRepository<SupplierReturn, String>, JpaSpecificationExecutor<SupplierReturn> {

    boolean existsByReturnNumber(String returnNumber);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "household", "receipt", "supplier"})
    Optional<SupplierReturn> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "household", "receipt", "supplier"})
    Optional<SupplierReturn> findByIdAndHouseholdId(String id, String householdId);

    @Override
    @EntityGraph(attributePaths = {"createdByUser", "household", "receipt", "supplier"})
    Page<SupplierReturn> findAll(Specification<SupplierReturn> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"createdByUser", "household", "receipt", "supplier"})
    Page<SupplierReturn> findByHouseholdIdAndDeletedAtIsNull(String householdId, Pageable pageable);

    @Query("SELECT r FROM SupplierReturn r WHERE r.receipt.id = :receiptId AND r.household.id = :householdId AND r.deletedAt IS NULL")
    List<SupplierReturn> findByReceiptIdAndHouseholdId(@Param("receiptId") String receiptId, @Param("householdId") String householdId);

    @Query("SELECT sr.receipt.id, COALESCE(SUM(sr.totalReturnAmount), 0) " +
           "FROM SupplierReturn sr " +
           "WHERE sr.receipt.id IN :receiptIds AND sr.household.id = :householdId AND sr.deletedAt IS NULL " +
           "GROUP BY sr.receipt.id")
    List<Object[]> sumTotalReturnAmountByReceiptIds(@Param("receiptIds") List<String> receiptIds, @Param("householdId") String householdId);
}
