package com.viet.sales.repository;

import com.viet.sales.entity.EInvoice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EInvoiceRepository extends JpaRepository<EInvoice, String>, JpaSpecificationExecutor<EInvoice> {

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "canceledByUser", "household", "order"})
    Optional<EInvoice> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    Optional<EInvoice> findByOrderIdAndDeletedAtIsNull(String orderId);

    Optional<EInvoice> findByLookupCodeAndDeletedAtIsNull(String lookupCode);

    boolean existsByLookupCodeAndDeletedAtIsNull(String lookupCode);
}
