package com.sales.modules.customer.repository;
import com.sales.modules.customer.entity.CustomerDebtReconciliationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerDebtReconciliationItemRepository extends JpaRepository<CustomerDebtReconciliationItem, String> {

    List<CustomerDebtReconciliationItem> findByReconciliationIdOrderByTransactionDateAsc(String reconciliationId);
}
