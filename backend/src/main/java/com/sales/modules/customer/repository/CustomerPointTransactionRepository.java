package com.sales.modules.customer.repository;
import com.sales.modules.customer.entity.CustomerPointTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerPointTransactionRepository extends JpaRepository<CustomerPointTransaction, String> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"customer", "order", "returnTicket", "createdByUser"})
    Page<CustomerPointTransaction> findAllByHouseholdIdAndCustomerIdOrderByCreatedAtDesc(
            String householdId, String customerId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"customer", "order", "returnTicket", "createdByUser"})
    Page<CustomerPointTransaction> findAllByHouseholdIdAndCustomerIdAndTypeOrderByCreatedAtDesc(
            String householdId, String customerId, String type, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"customer", "order", "returnTicket", "createdByUser"})
    List<CustomerPointTransaction> findAllByHouseholdIdAndCustomerIdOrderByCreatedAtDesc(
            String householdId, String customerId);

    @Query("SELECT COALESCE(SUM(ABS(t.pointsChange)), 0) FROM CustomerPointTransaction t " +
           "WHERE t.order.id = :orderId AND t.type = 'RETURN_DEDUCTION'")
    Integer sumPointsDeductedByOrderId(@Param("orderId") String orderId);

    @Query("SELECT COALESCE(SUM(t.pointsChange), 0) FROM CustomerPointTransaction t " +
           "WHERE t.household.id = :householdId AND t.customer.id = :customerId AND t.type = 'EARN'")
    Integer sumPointsEarnedByCustomer(@Param("householdId") String householdId, @Param("customerId") String customerId);

    @Query("SELECT COALESCE(SUM(ABS(t.pointsChange)), 0) FROM CustomerPointTransaction t " +
           "WHERE t.household.id = :householdId AND t.customer.id = :customerId AND t.type = 'REDEEM'")
    Integer sumPointsRedeemedByCustomer(@Param("householdId") String householdId, @Param("customerId") String customerId);

    @Query("SELECT COALESCE(SUM(ABS(t.pointsChange)), 0) FROM CustomerPointTransaction t " +
           "WHERE t.household.id = :householdId AND t.customer.id = :customerId AND t.type = 'RETURN_DEDUCTION'")
    Integer sumPointsDeductedByCustomer(@Param("householdId") String householdId, @Param("customerId") String customerId);

    @Query("SELECT MIN(t.expiryDate) FROM CustomerPointTransaction t " +
           "WHERE t.household.id = :householdId AND t.customer.id = :customerId " +
           "AND t.type = 'EARN' AND t.expiryDate >= :today")
    Optional<LocalDate> findNearestExpiringDate(
            @Param("householdId") String householdId,
            @Param("customerId") String customerId,
            @Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(t.pointsChange), 0) FROM CustomerPointTransaction t " +
           "WHERE t.household.id = :householdId AND t.customer.id = :customerId " +
           "AND t.type = 'EARN' AND t.expiryDate >= :today AND t.expiryDate <= :deadline")
    Integer sumPointsExpiringSoon(
            @Param("householdId") String householdId,
            @Param("customerId") String customerId,
            @Param("today") LocalDate today,
            @Param("deadline") LocalDate deadline);
}
