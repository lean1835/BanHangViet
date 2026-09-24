package com.sales.modules.invoice.repository;
import com.sales.modules.invoice.entity.InvoiceErrorNoticeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceErrorNoticeItemRepository extends JpaRepository<InvoiceErrorNoticeItem, String> {

    List<InvoiceErrorNoticeItem> findByNoticeId(String noticeId);

    List<InvoiceErrorNoticeItem> findByInvoiceId(String invoiceId);
}
