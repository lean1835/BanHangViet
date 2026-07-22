package com.viet.sales.repository;

import com.viet.sales.entity.EInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.List;

@Repository
public interface EInvoiceRepository extends JpaRepository<EInvoice, String>, JpaSpecificationExecutor<EInvoice> {

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order", "originalInvoice"})
    Page<EInvoice> findAll(Specification<EInvoice> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"createdByUser", "canceledByUser", "household", "order"})
    Page<EInvoice> findByTaxResponseAtIsNotNullAndDeletedAtIsNull(Pageable pageable);

    @EntityGraph(attributePaths = {"createdByUser", "canceledByUser", "household", "order"})
    Page<EInvoice> findByStatusAndDeletedAtIsNull(String status, Pageable pageable);

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

    long countByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
            String householdId, String status, java.time.LocalDateTime start, java.time.LocalDateTime end
    );

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order"})
    List<EInvoice> findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
            String householdId, String status, java.time.LocalDateTime start, java.time.LocalDateTime end
    );
    List<EInvoice> findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc(String householdId);
}
