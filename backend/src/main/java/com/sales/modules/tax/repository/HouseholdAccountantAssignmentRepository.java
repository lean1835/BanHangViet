package com.sales.modules.tax.repository;
import com.sales.common.constant.AccountantAssignmentStatus;
import com.sales.modules.tax.entity.HouseholdAccountantAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HouseholdAccountantAssignmentRepository extends JpaRepository<HouseholdAccountantAssignment, String> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"household", "accountantUser"})
    Optional<HouseholdAccountantAssignment> findByHouseholdIdAndAccountantUserId(String householdId, String accountantUserId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"household", "accountantUser"})
    Optional<HouseholdAccountantAssignment> findByHouseholdIdAndAccountantUserIdAndStatus(String householdId, String accountantUserId, AccountantAssignmentStatus status);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"household", "accountantUser"})
    List<HouseholdAccountantAssignment> findByHouseholdIdOrderByCreatedAtDesc(String householdId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"household", "accountantUser"})
    List<HouseholdAccountantAssignment> findByAccountantUserIdAndStatus(String accountantUserId, AccountantAssignmentStatus status);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"household", "accountantUser"})
    List<HouseholdAccountantAssignment> findByAccountantUserId(String accountantUserId);

    boolean existsByHouseholdIdAndAccountantUserIdAndStatus(String householdId, String accountantUserId, AccountantAssignmentStatus status);

    List<HouseholdAccountantAssignment> findByStatusAndAccessExpiresAtBefore(AccountantAssignmentStatus status, LocalDateTime now);
}
