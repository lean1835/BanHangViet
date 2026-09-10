package com.sales.repository;

import com.sales.constant.CashTransactionStatus;
import com.sales.constant.CashTransactionType;
import com.sales.entity.CashTransaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CashTransactionRepository extends JpaRepository<CashTransaction, String> {

    @EntityGraph(attributePaths = {"createdByUser", "approvedByUser", "category", "shift"})
    List<CashTransaction> findByShiftIdOrderByCreatedAtDesc(String shiftId);

    @EntityGraph(attributePaths = {"createdByUser", "approvedByUser", "category", "shift"})
    List<CashTransaction> findByShiftIdAndHouseholdIdOrderByCreatedAtDesc(String shiftId, String householdId);

    Optional<CashTransaction> findByIdAndHouseholdId(String id, String householdId);

    boolean existsByCategoryId(String categoryId);

    boolean existsByHouseholdIdAndCode(String householdId, String code);

    long countByShiftIdAndStatus(String shiftId, CashTransactionStatus status);

    @Query("SELECT MAX(c.code) FROM CashTransaction c WHERE c.household.id = :householdId AND c.code LIKE CONCAT(:prefix, '%')")
    Optional<String> findMaxCodeByPrefix(@Param("householdId") String householdId, @Param("prefix") String prefix);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashTransaction c WHERE c.shift.id = :shiftId AND c.type = :type AND c.status = :status")
    BigDecimal sumAmountByShiftIdAndTypeAndStatus(
            @Param("shiftId") String shiftId,
            @Param("type") CashTransactionType type,
            @Param("status") CashTransactionStatus status);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashTransaction c WHERE c.shift.id = :shiftId AND c.type = :type AND c.status = :status AND c.createdAt >= :startTime AND c.createdAt <= :endTime")
    BigDecimal sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
            @Param("shiftId") String shiftId,
            @Param("type") CashTransactionType type,
            @Param("status") CashTransactionStatus status,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashTransaction c WHERE c.shift.id = :shiftId AND c.status = :status")
    BigDecimal sumAmountByShiftIdAndStatus(
            @Param("shiftId") String shiftId,
            @Param("status") CashTransactionStatus status);
}
