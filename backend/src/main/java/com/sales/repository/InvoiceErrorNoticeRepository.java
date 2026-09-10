package com.sales.repository;

import com.sales.entity.InvoiceErrorNotice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceErrorNoticeRepository extends JpaRepository<InvoiceErrorNotice, String> {

    Optional<InvoiceErrorNotice> findByIdAndHouseholdId(String id, String householdId);

    boolean existsByNoticeCode(String noticeCode);

    @EntityGraph(attributePaths = {"createdByUser"})
    Page<InvoiceErrorNotice> findByHouseholdId(String householdId, Pageable pageable);

    @EntityGraph(attributePaths = {"createdByUser"})
    Page<InvoiceErrorNotice> findByHouseholdIdAndStatus(String householdId, String status, Pageable pageable);

    @Query("SELECT COUNT(i) > 0 FROM InvoiceErrorNoticeItem item " +
           "JOIN item.notice i " +
           "WHERE item.invoice.id = :invoiceId AND i.status = 'ACCEPTED'")
    boolean isInvoiceInAcceptedNotice(@Param("invoiceId") String invoiceId);
}
