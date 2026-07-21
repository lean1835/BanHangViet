package com.viet.sales.repository;

import com.viet.sales.entity.EInvoice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import java.util.Optional;

@Repository
public interface EInvoiceRepository extends JpaRepository<EInvoice, String>, JpaSpecificationExecutor<EInvoice> {

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order"})
    Page<EInvoice> findAll(Specification<EInvoice> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order"})
    Optional<EInvoice> findById(String id);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order"})
    Optional<EInvoice> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order"})
    Optional<EInvoice> findByOrderIdAndDeletedAtIsNull(String orderId);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order"})
    Optional<EInvoice> findByLookupCodeAndDeletedAtIsNull(String lookupCode);

    boolean existsByLookupCodeAndDeletedAtIsNull(String lookupCode);
}
