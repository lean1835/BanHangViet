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

@Repository
public interface EInvoiceRepository extends JpaRepository<EInvoice, String>, JpaSpecificationExecutor<EInvoice> {

    @EntityGraph(attributePaths = {"items", "household", "createdByUser", "originalInvoice"})
    Optional<EInvoice> findByIdAndHouseholdIdAndDeletedAtIsNull(String id, String householdId);

    List<EInvoice> findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc(String householdId);

    @Override
    @EntityGraph(attributePaths = {"items", "household", "createdByUser", "originalInvoice"})
    Page<EInvoice> findAll(Specification<EInvoice> spec, Pageable pageable);
}
