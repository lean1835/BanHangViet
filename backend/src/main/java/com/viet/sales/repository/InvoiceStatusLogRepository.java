package com.viet.sales.repository;

import com.viet.sales.entity.InvoiceStatusLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceStatusLogRepository extends JpaRepository<InvoiceStatusLog, String> {
    @EntityGraph(attributePaths = {"changedByUser"})
    List<InvoiceStatusLog> findByInvoiceIdOrderByCreatedAtAsc(String invoiceId);
}
