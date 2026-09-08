package com.sales.repository;

import com.sales.entity.InvoiceNumberRange;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceNumberRangeRepository extends JpaRepository<InvoiceNumberRange, String> {

    @Query("SELECT r FROM InvoiceNumberRange r WHERE r.household.id = :householdId AND r.deletedAt IS NULL AND r.status IN ('ACTIVE', 'WARNING_LOW') ORDER BY r.createdAt DESC")
    List<InvoiceNumberRange> findActiveRangesByHouseholdId(@Param("householdId") String householdId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM InvoiceNumberRange r WHERE r.household.id = :householdId " +
           "AND r.invoicePattern = :pattern AND r.invoiceSymbol = :symbol " +
           "AND r.deletedAt IS NULL AND r.status IN ('ACTIVE', 'WARNING_LOW') ORDER BY r.startNumber ASC, r.createdAt ASC")
    List<InvoiceNumberRange> findActiveRangesForUpdate(@Param("householdId") String householdId,
                                                      @Param("pattern") String pattern,
                                                      @Param("symbol") String symbol);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM InvoiceNumberRange r WHERE r.household.id = :householdId " +
           "AND r.deletedAt IS NULL AND r.status IN ('ACTIVE', 'WARNING_LOW') ORDER BY r.startNumber ASC, r.createdAt ASC")
    List<InvoiceNumberRange> findActiveRangesForUpdate(@Param("householdId") String householdId);

    Optional<InvoiceNumberRange> findFirstByHouseholdIdAndStatusInAndDeletedAtIsNullOrderByCreatedAtDesc(
            String householdId, List<String> statuses);

    Page<InvoiceNumberRange> findByHouseholdIdAndDeletedAtIsNull(String householdId, Pageable pageable);

    @Query("SELECT r FROM InvoiceNumberRange r WHERE r.household.id = :householdId AND r.invoicePattern = :pattern AND r.invoiceSymbol = :symbol AND r.deletedAt IS NULL")
    List<InvoiceNumberRange> findOverlappingRanges(@Param("householdId") String householdId,
                                                   @Param("pattern") String pattern,
                                                   @Param("symbol") String symbol);
}
