package com.sales.repository;

import com.sales.entity.InvoiceDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceDeliveryLogRepository extends JpaRepository<InvoiceDeliveryLog, String> {
    List<InvoiceDeliveryLog> findByInvoiceIdOrderBySentAtDesc(String invoiceId);
    long countByInvoiceId(String invoiceId);
    java.util.Optional<InvoiceDeliveryLog> findFirstByInvoiceIdOrderBySentAtDesc(String invoiceId);

    List<InvoiceDeliveryLog> findByInvoiceIdInOrderBySentAtDesc(List<String> invoiceIds);

    @org.springframework.data.jpa.repository.Query("SELECT l FROM InvoiceDeliveryLog l JOIN FETCH l.invoice WHERE l.id = :id")
    java.util.Optional<InvoiceDeliveryLog> findByIdWithInvoice(@org.springframework.data.repository.query.Param("id") String id);
}
