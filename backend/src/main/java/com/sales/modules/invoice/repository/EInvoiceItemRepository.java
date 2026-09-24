package com.sales.modules.invoice.repository;
import com.sales.modules.invoice.entity.EInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EInvoiceItemRepository extends JpaRepository<EInvoiceItem, String> {
    List<EInvoiceItem> findByInvoiceId(String invoiceId);
}
