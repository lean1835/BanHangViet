package com.sales.modules.customer.repository;
import com.sales.modules.customer.dto.response.PeriodDebtSummaryProjection;
import com.sales.modules.customer.entity.CustomerDebt;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerDebtRepository extends JpaRepository<CustomerDebt, String> {

    List<CustomerDebt> findByCustomerIdAndHouseholdIdOrderByCreatedAtDesc(String customerId, String householdId);

    Optional<CustomerDebt> findFirstByOrderIdAndType(String orderId, String type);

    @Query("SELECT DISTINCT d FROM CustomerDebt d JOIN FETCH d.customer JOIN FETCH d.createdByUser LEFT JOIN FETCH d.order o LEFT JOIN FETCH o.items " +
           "WHERE d.customer.id = :customerId AND d.household.id = :householdId ORDER BY d.createdAt DESC")
    List<CustomerDebt> findByCustomerIdAndHouseholdIdOrderByCreatedAtDescWithRelations(
            @Param("customerId") String customerId, @Param("householdId") String householdId);

    @EntityGraph(attributePaths = {"customer", "createdByUser", "order", "order.items"})
    List<CustomerDebt> findByCustomerIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
            String customerId, String householdId, Collection<String> statuses, String type);

    List<CustomerDebt> findByHouseholdIdAndStatusInAndTypeOrderByDueDateAsc(
            String householdId, Collection<String> statuses, String type);

    @Query("SELECT DISTINCT d FROM CustomerDebt d JOIN FETCH d.customer JOIN FETCH d.createdByUser LEFT JOIN FETCH d.order o LEFT JOIN FETCH o.items " +
           "WHERE d.household.id = :householdId AND d.status IN :statuses AND d.type = :type ORDER BY d.dueDate Asc")
    List<CustomerDebt> findByHouseholdIdAndStatusInAndTypeOrderByDueDateAscWithRelations(
            @Param("householdId") String householdId,
            @Param("statuses") Collection<String> statuses,
            @Param("type") String type);

    List<CustomerDebt> findByHouseholdIdAndStatusInAndTypeAndDueDateBefore(
            String householdId, Collection<String> statuses, String type, LocalDateTime dateTime);

    @Query("SELECT d FROM CustomerDebt d JOIN FETCH d.customer LEFT JOIN FETCH d.household " +
           "WHERE d.status = 'PENDING' AND d.type = 'DEBT_CREATED' AND d.reminderSent = false " +
           "AND d.customer.email IS NOT NULL AND TRIM(d.customer.email) != '' " +
           "AND d.dueDate < :maxDueDate " +
           "AND d.id > :lastId ORDER BY d.id ASC")
    List<CustomerDebt> findPendingPreDueRemindersKeyset(
            @Param("lastId") String lastId,
            @Param("maxDueDate") LocalDateTime maxDueDate,
            Pageable pageable);

    @Query("SELECT d FROM CustomerDebt d JOIN FETCH d.customer LEFT JOIN FETCH d.household " +
           "WHERE d.status = 'OVERDUE' AND d.type = 'DEBT_CREATED' AND d.overdueReminderSent = false " +
           "AND d.customer.email IS NOT NULL AND TRIM(d.customer.email) != '' " +
           "AND d.dueDate < :maxOverdueDueDate " +
           "AND d.id > :lastId ORDER BY d.id ASC")
    List<CustomerDebt> findPendingOverdueRemindersKeyset(
            @Param("lastId") String lastId,
            @Param("maxOverdueDueDate") LocalDateTime maxOverdueDueDate,
            Pageable pageable);

    @Query("SELECT COALESCE(MIN(d.customer.reminderDaysAfter), 3) FROM CustomerDebt d " +
           "WHERE d.status = 'OVERDUE' AND d.type = 'DEBT_CREATED' AND d.overdueReminderSent = false")
    Integer findMinPendingOverdueReminderDaysAfter();

    @Query("SELECT COALESCE(MAX(d.customer.reminderDaysBefore), 3) FROM CustomerDebt d " +
           "WHERE d.status = 'PENDING' AND d.type = 'DEBT_CREATED' AND d.reminderSent = false")
    Integer findMaxPendingReminderDaysBefore();

    @EntityGraph(attributePaths = {"customer"})
    List<CustomerDebt> findByStatusInAndTypeAndDueDateBefore(
            Collection<String> statuses, String type, LocalDateTime dateTime);

    boolean existsByCustomerIdAndHouseholdIdAndStatusIn(
            String customerId, String householdId, Collection<String> statuses);

    @Query("SELECT COALESCE(SUM(d.remainingAmount), 0) FROM CustomerDebt d " +
           "WHERE d.household.id = :householdId AND d.type = 'DEBT_CREATED' AND d.status IN ('PENDING', 'OVERDUE')")
    BigDecimal sumTotalActiveDebt(@Param("householdId") String householdId);

    @Query("SELECT COALESCE(SUM(d.remainingAmount), 0) FROM CustomerDebt d " +
           "WHERE d.household.id = :householdId AND d.type = 'DEBT_CREATED' AND d.status = 'OVERDUE'")
    BigDecimal sumTotalOverdueDebt(@Param("householdId") String householdId);

    @Query("SELECT COUNT(DISTINCT d.customer.id) FROM CustomerDebt d " +
           "WHERE d.household.id = :householdId AND d.type = 'DEBT_CREATED' AND d.status IN ('PENDING', 'OVERDUE')")
    long countCustomersWithActiveDebt(@Param("householdId") String householdId);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM CustomerDebt d " +
           "WHERE d.customer.id = :customerId AND d.household.id = :householdId " +
           "AND d.type = :type AND d.createdAt < :beforeDate")
    BigDecimal sumAmountByCustomerAndTypeBefore(
            @Param("customerId") String customerId,
            @Param("householdId") String householdId,
            @Param("type") String type,
            @Param("beforeDate") LocalDateTime beforeDate);

    @Query("SELECT d FROM CustomerDebt d LEFT JOIN FETCH d.order o " +
           "WHERE d.customer.id = :customerId AND d.household.id = :householdId " +
           "AND d.createdAt >= :startDate AND d.createdAt < :endDateExclusive " +
           "ORDER BY d.createdAt ASC")
    List<CustomerDebt> findPeriodDebts(
            @Param("customerId") String customerId,
            @Param("householdId") String householdId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDateExclusive") LocalDateTime endDateExclusive);

    @Query("SELECT d FROM CustomerDebt d WHERE d.customer.id = :customerId " +
           "AND d.household.id = :householdId AND d.createdAt < :maxDateExclusive " +
           "AND (d.isLocked = false OR d.reconciliation IS NULL)")
    List<CustomerDebt> findDebtsToLock(
            @Param("customerId") String customerId,
            @Param("householdId") String householdId,
            @Param("maxDateExclusive") LocalDateTime maxDateExclusive);

    @Query("""
        SELECT COALESCE(SUM(d.amount), 0)
        FROM CustomerDebt d
        WHERE d.household.id = :householdId
          AND d.type = 'DEBT_CREATED'
          AND d.createdAt >= :startDate
          AND d.createdAt <= :endDate
    """)
    BigDecimal sumDebtCreatedInPeriod(
            @Param("householdId") String householdId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT COALESCE(SUM(d.amount), 0)
        FROM CustomerDebt d
        WHERE d.household.id = :householdId
          AND d.type = 'DEBT_PAID'
          AND d.createdAt >= :startDate
          AND d.createdAt <= :endDate
    """)
    BigDecimal sumDebtPaidInPeriod(
            @Param("householdId") String householdId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
        SELECT 
            COALESCE(SUM(d.amount), 0) AS totalCreated,
            COALESCE(SUM(d.amount - d.remainingAmount), 0) AS totalPaid,
            COALESCE(SUM(d.remainingAmount), 0) AS totalRemaining
        FROM CustomerDebt d
        LEFT JOIN d.order o
        LEFT JOIN o.shift s
        WHERE d.household.id = :householdId
          AND d.type = 'DEBT_CREATED'
          AND d.createdAt >= :startDate
          AND d.createdAt <= :endDate
          AND (:userId IS NULL OR (o IS NOT NULL AND o.createdByUser.id = :userId) OR (o IS NULL AND d.createdByUser.id = :userId))
          AND (:shiftId IS NULL OR (o IS NOT NULL AND s.id = :shiftId))
    """)
    PeriodDebtSummaryProjection getDebtSummaryInPeriod(
            @Param("householdId") String householdId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("userId") String userId,
            @Param("shiftId") String shiftId
    );
}

