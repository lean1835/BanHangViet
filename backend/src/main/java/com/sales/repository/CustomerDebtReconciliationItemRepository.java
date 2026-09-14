package com.sales.repository;

import com.sales.entity.CustomerDebtReconciliationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerDebtReconciliationItemRepository extends JpaRepository<CustomerDebtReconciliationItem, String> {

    List<CustomerDebtReconciliationItem> findByReconciliationIdOrderByTransactionDateAsc(String reconciliationId);
}
