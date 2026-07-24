package com.viet.sales.repository;

import com.viet.sales.entity.EInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
public interface EInvoiceRepository extends JpaRepository<EInvoice, String>, JpaSpecificationExecutor<EInvoice> {

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order", "originalInvoice"})
    Page<EInvoice> findAll(Specification<EInvoice> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order", "originalInvoice"})
    List<EInvoice> findAll(Specification<EInvoice> spec);

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order", "originalInvoice"})
    Optional<EInvoice> findById(String id);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order", "originalInvoice"})
    Optional<EInvoice> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order", "originalInvoice"})
    Optional<EInvoice> findByOrderIdAndDeletedAtIsNull(String orderId);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order", "originalInvoice"})
    Optional<EInvoice> findByLookupCodeAndDeletedAtIsNull(String lookupCode);

    boolean existsByLookupCodeAndDeletedAtIsNull(String lookupCode);

    List<EInvoice> findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc(String householdId);

    @Query("SELECT MAX(e.invoiceNumber) FROM EInvoice e WHERE e.household.id = :householdId AND e.invoicePattern = :pattern AND e.invoiceSymbol = :symbol AND e.invoiceNumber IS NOT NULL AND e.deletedAt IS NULL")
    Optional<String> findMaxInvoiceNumber(@Param("householdId") String householdId,
                                          @Param("pattern") String pattern,
                                          @Param("symbol") String symbol);

    long countByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
            String householdId, String status, LocalDateTime start, LocalDateTime end
    );

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order"})
    List<EInvoice> findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
            String householdId, String status, LocalDateTime start, LocalDateTime end
    );
}
