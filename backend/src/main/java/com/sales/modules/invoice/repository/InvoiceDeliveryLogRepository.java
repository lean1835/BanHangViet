package com.sales.modules.invoice.repository;
import com.sales.modules.invoice.entity.InvoiceDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface InvoiceDeliveryLogRepository extends JpaRepository<InvoiceDeliveryLog, String> {
    List<InvoiceDeliveryLog> findByInvoiceIdOrderBySentAtDesc(String invoiceId);
    long countByInvoiceId(String invoiceId);
    Optional<InvoiceDeliveryLog> findFirstByInvoiceIdOrderBySentAtDesc(String invoiceId);

    @Query("SELECT l FROM InvoiceDeliveryLog l JOIN FETCH l.invoice WHERE l.invoice.id IN :invoiceIds ORDER BY l.sentAt DESC")
    List<InvoiceDeliveryLog> findByInvoiceIdInOrderBySentAtDesc(@Param("invoiceIds") List<String> invoiceIds);

    @Query("SELECT l FROM InvoiceDeliveryLog l JOIN FETCH l.invoice WHERE l.id = :id")
    Optional<InvoiceDeliveryLog> findByIdWithInvoice(@Param("id") String id);
}
