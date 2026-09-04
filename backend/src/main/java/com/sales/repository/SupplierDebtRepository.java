package com.sales.repository;

import com.sales.entity.SupplierDebt;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierDebtRepository extends JpaRepository<SupplierDebt, String> {

    @EntityGraph(attributePaths = {"supplier", "goodsReceipt", "createdByUser", "household"})
    List<SupplierDebt> findBySupplierIdAndHouseholdIdOrderByCreatedAtDesc(String supplierId, String householdId);

    @EntityGraph(attributePaths = {"supplier", "goodsReceipt", "createdByUser", "household"})
    List<SupplierDebt> findBySupplierIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
            String supplierId, String householdId, List<String> statuses, String type);

    @EntityGraph(attributePaths = {"supplier", "goodsReceipt", "createdByUser", "household"})
    List<SupplierDebt> findByHouseholdIdAndStatusInAndTypeOrderByCreatedAtDesc(
            String householdId, List<String> statuses, String type);

    @EntityGraph(attributePaths = {"supplier", "goodsReceipt", "createdByUser", "household"})
    List<SupplierDebt> findByHouseholdIdOrderByCreatedAtDesc(String householdId);

    Optional<SupplierDebt> findFirstByGoodsReceiptIdAndType(String goodsReceiptId, String type);

    @Query("SELECT COALESCE(SUM(sd.remainingAmount), 0) FROM SupplierDebt sd " +
           "WHERE sd.household.id = :householdId AND sd.type = 'DEBT_CREATED' AND sd.status IN ('PENDING', 'OVERDUE')")
    BigDecimal sumTotalOutstandingDebtByHouseholdId(@Param("householdId") String householdId);

    @Query("SELECT COUNT(DISTINCT sd.supplier.id) FROM SupplierDebt sd " +
           "WHERE sd.household.id = :householdId AND sd.type = 'DEBT_CREATED' AND sd.status IN ('PENDING', 'OVERDUE') AND sd.remainingAmount > 0")
    long countSuppliersWithDebtByHouseholdId(@Param("householdId") String householdId);

    @Query("SELECT COALESCE(SUM(sd.remainingAmount), 0) FROM SupplierDebt sd " +
           "WHERE sd.household.id = :householdId AND sd.type = 'DEBT_CREATED' AND sd.status = 'OVERDUE'")
    BigDecimal sumTotalOverdueDebtByHouseholdId(@Param("householdId") String householdId);
}
