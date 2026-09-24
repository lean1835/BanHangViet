package com.sales.modules.order.repository;
import com.sales.modules.order.entity.ProductExchangeTicket;
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
public interface ProductExchangeTicketRepository extends JpaRepository<ProductExchangeTicket, String>, JpaSpecificationExecutor<ProductExchangeTicket> {

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "household", "originalInvoice", "originalOrder", "customer", "additionalInvoice"})
    Page<ProductExchangeTicket> findAll(Specification<ProductExchangeTicket> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "household", "originalInvoice", "originalOrder", "customer", "additionalInvoice"})
    Optional<ProductExchangeTicket> findById(String id);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "household", "originalInvoice", "originalOrder", "customer", "additionalInvoice"})
    Optional<ProductExchangeTicket> findByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"items", "items.product", "createdByUser", "household", "originalInvoice", "originalOrder", "customer", "additionalInvoice"})
    List<ProductExchangeTicket> findByOriginalInvoiceIdAndStatusIn(String originalInvoiceId, List<String> statuses);

    @Query("SELECT MAX(p.ticketNumber) FROM ProductExchangeTicket p WHERE p.household.id = :householdId AND p.ticketNumber LIKE :prefix%")
    Optional<String> findMaxTicketNumberByPrefix(@Param("householdId") String householdId, @Param("prefix") String prefix);

    boolean existsByTicketNumber(String ticketNumber);

    @EntityGraph(attributePaths = {"items", "items.product", "originalInvoice"})
    Optional<ProductExchangeTicket> findByAdditionalInvoiceId(String additionalInvoiceId);

    boolean existsByOriginalInvoiceIdAndStatusIn(String originalInvoiceId, List<String> statuses);

    boolean existsByOriginalOrderIdAndStatusIn(String originalOrderId, List<String> statuses);
}
