package com.sales.repository;

import com.sales.entity.InventoryAuditDetail;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryAuditDetailRepository extends JpaRepository<InventoryAuditDetail, String> {

    @EntityGraph(attributePaths = {"product"})
    List<InventoryAuditDetail> findByAuditId(String auditId);

    @Query("SELECT d FROM InventoryAuditDetail d " +
           "JOIN FETCH d.audit a " +
           "LEFT JOIN FETCH d.product p " +
           "WHERE a.household.id = :householdId " +
           "AND d.createdAt BETWEEN :start AND :end")
    List<InventoryAuditDetail> findDetailsForAnomalyScan(
            @Param("householdId") String householdId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT d FROM InventoryAuditDetail d " +
           "JOIN FETCH d.audit a " +
           "LEFT JOIN FETCH a.createdByUser " +
           "WHERE d.product.id = :productId " +
           "AND a.household.id = :householdId " +
           "AND a.status = 'COMPLETED' " +
           "ORDER BY a.auditDate ASC, d.createdAt ASC")
    List<InventoryAuditDetail> findStockMovementsByProduct(
            @Param("productId") String productId,
            @Param("householdId") String householdId
    );

    @Query("SELECT COUNT(d) > 0 FROM InventoryAuditDetail d " +
           "WHERE d.product.id = :productId " +
           "AND d.audit.household.id = :householdId " +
           "AND d.audit.status = 'COMPLETED'")
    boolean hasStockMovementByProduct(
            @Param("productId") String productId,
            @Param("householdId") String householdId
    );
}

