package com.viet.sales.repository;

import com.viet.sales.entity.CustomerDebt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface CustomerDebtRepository extends JpaRepository<CustomerDebt, String> {

    List<CustomerDebt> findByCustomerIdAndHouseholdIdOrderByCreatedAtDesc(String customerId, String householdId);

    @Query("SELECT d FROM CustomerDebt d JOIN FETCH d.customer JOIN FETCH d.createdByUser LEFT JOIN FETCH d.order " +
           "WHERE d.customer.id = :customerId AND d.household.id = :householdId ORDER BY d.createdAt DESC")
    List<CustomerDebt> findByCustomerIdAndHouseholdIdOrderByCreatedAtDescWithRelations(
            @Param("customerId") String customerId, @Param("householdId") String householdId);

    List<CustomerDebt> findByCustomerIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
            String customerId, String householdId, Collection<String> statuses, String type);

    List<CustomerDebt> findByHouseholdIdAndStatusInAndTypeOrderByDueDateAsc(
            String householdId, Collection<String> statuses, String type);

    @Query("SELECT d FROM CustomerDebt d JOIN FETCH d.customer JOIN FETCH d.createdByUser LEFT JOIN FETCH d.order " +
           "WHERE d.household.id = :householdId AND d.status IN :statuses AND d.type = :type ORDER BY d.dueDate Asc")
    List<CustomerDebt> findByHouseholdIdAndStatusInAndTypeOrderByDueDateAscWithRelations(
            @Param("householdId") String householdId,
            @Param("statuses") Collection<String> statuses,
            @Param("type") String type);

    List<CustomerDebt> findByHouseholdIdAndStatusInAndTypeAndDueDateBefore(
            String householdId, Collection<String> statuses, String type, LocalDateTime dateTime);

    List<CustomerDebt> findByStatusInAndTypeAndDueDateBefore(
            Collection<String> statuses, String type, LocalDateTime dateTime);

    boolean existsByCustomerIdAndHouseholdIdAndStatusIn(
            String customerId, String householdId, Collection<String> statuses);

    @Query("SELECT COALESCE(SUM(d.remainingAmount), 0) FROM CustomerDebt d " +
           "WHERE d.household.id = :householdId AND d.type = 'DEBT_CREATED' AND d.status IN ('PENDING', 'OVERDUE')")
    java.math.BigDecimal sumTotalActiveDebt(@Param("householdId") String householdId);

    @Query("SELECT COALESCE(SUM(d.remainingAmount), 0) FROM CustomerDebt d " +
           "WHERE d.household.id = :householdId AND d.type = 'DEBT_CREATED' AND d.status = 'OVERDUE'")
    java.math.BigDecimal sumTotalOverdueDebt(@Param("householdId") String householdId);

    @Query("SELECT COUNT(DISTINCT d.customer.id) FROM CustomerDebt d " +
           "WHERE d.household.id = :householdId AND d.type = 'DEBT_CREATED' AND d.status IN ('PENDING', 'OVERDUE')")
    long countCustomersWithActiveDebt(@Param("householdId") String householdId);
}
