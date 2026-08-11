package com.sales.repository;

import com.sales.entity.ReturnTicket;
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
public interface ReturnTicketRepository extends JpaRepository<ReturnTicket, String>, JpaSpecificationExecutor<ReturnTicket> {

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "approvedByUser", "household", "originalInvoice", "originalOrder", "customer"})
    Page<ReturnTicket> findAll(Specification<ReturnTicket> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "approvedByUser", "household", "originalInvoice", "originalOrder", "customer"})
    Optional<ReturnTicket> findById(String id);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "approvedByUser", "household", "originalInvoice", "originalOrder", "customer"})
    Optional<ReturnTicket> findByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "approvedByUser", "household", "originalInvoice", "originalOrder", "customer"})
    List<ReturnTicket> findByOriginalInvoiceIdAndStatusIn(String originalInvoiceId, List<String> statuses);

    @Query("SELECT MAX(r.ticketNumber) FROM ReturnTicket r WHERE r.household.id = :householdId AND r.ticketNumber LIKE :prefix%")
    Optional<String> findMaxTicketNumberByPrefix(@Param("householdId") String householdId, @Param("prefix") String prefix);

    boolean existsByTicketNumber(String ticketNumber);
}
