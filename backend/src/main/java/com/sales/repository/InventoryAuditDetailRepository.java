package com.sales.repository;

import com.sales.entity.InventoryAuditDetail;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryAuditDetailRepository extends JpaRepository<InventoryAuditDetail, String> {

    @EntityGraph(attributePaths = {"product"})
    List<InventoryAuditDetail> findByAuditId(String auditId);
}
