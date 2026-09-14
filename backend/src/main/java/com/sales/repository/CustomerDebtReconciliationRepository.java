package com.sales.repository;

import com.sales.entity.CustomerDebtReconciliation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerDebtReconciliationRepository extends JpaRepository<CustomerDebtReconciliation, String> {

    Optional<CustomerDebtReconciliation> findByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"customer", "household", "confirmedByUser", "createdByUser", "items", "items.customerDebt"})
    Optional<CustomerDebtReconciliation> findWithDetailsByIdAndHouseholdId(String id, String householdId);

    @EntityGraph(attributePaths = {"customer", "household", "confirmedByUser", "createdByUser"})
    @Query("SELECT r FROM CustomerDebtReconciliation r WHERE r.household.id = :householdId " +
           "AND (:customerId IS NULL OR r.customer.id = :customerId) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:startDate IS NULL OR r.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR r.endDate <= :endDate) " +
           "ORDER BY r.createdAt DESC")
    Page<CustomerDebtReconciliation> filterReconciliations(
            @Param("householdId") String householdId,
            @Param("customerId") String customerId,
            @Param("status") String status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    long countByHouseholdIdAndCodeStartingWith(String householdId, String codePrefix);

    Optional<CustomerDebtReconciliation> findFirstByHouseholdIdAndCustomerIdAndStatusOrderByConfirmedAtDesc(
            String householdId, String customerId, String status);

    @Query("SELECT COUNT(r) > 0 FROM CustomerDebtReconciliation r " +
           "WHERE r.household.id = :householdId AND r.customer.id = :customerId " +
           "AND r.status = 'CONFIRMED' " +
           "AND ((r.startDate <= :endDate AND r.endDate >= :startDate))")
    boolean existsOverlappingConfirmedReconciliation(
            @Param("householdId") String householdId,
            @Param("customerId") String customerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
