package com.viet.sales.repository;

import com.viet.sales.entity.EInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EInvoiceItemRepository extends JpaRepository<EInvoiceItem, String> {
}
