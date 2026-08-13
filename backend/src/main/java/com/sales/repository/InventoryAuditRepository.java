package com.sales.repository;

import com.sales.entity.InventoryAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryAuditRepository extends JpaRepository<InventoryAudit, String>, JpaSpecificationExecutor<InventoryAudit> {

    @EntityGraph(attributePaths = {"createdByUser"})
    Page<InventoryAudit> findByHouseholdIdOrderByCreatedAtDesc(String householdId, Pageable pageable);

    Optional<InventoryAudit> findByIdAndHouseholdId(String id, String householdId);

    boolean existsByAuditNumber(String auditNumber);

    @Query("SELECT COUNT(a) FROM InventoryAudit a WHERE a.household.id = :householdId")
    long countByHouseholdId(@Param("householdId") String householdId);
}
