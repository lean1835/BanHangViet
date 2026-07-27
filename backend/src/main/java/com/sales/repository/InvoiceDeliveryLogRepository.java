package com.sales.repository;

import com.sales.entity.InvoiceDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceDeliveryLogRepository extends JpaRepository<InvoiceDeliveryLog, String> {
    List<InvoiceDeliveryLog> findByInvoiceIdOrderBySentAtDesc(String invoiceId);
}
