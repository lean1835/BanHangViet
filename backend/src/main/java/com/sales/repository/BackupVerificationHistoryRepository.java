package com.sales.repository;

import com.sales.entity.BackupVerificationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BackupVerificationHistoryRepository extends JpaRepository<BackupVerificationHistory, String> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"backupHistory"})
    Page<BackupVerificationHistory> findByHouseholdIdOrderByVerifiedAtDesc(String householdId, Pageable pageable);

    Optional<BackupVerificationHistory> findFirstByHouseholdIdOrderByVerifiedAtDesc(String householdId);

    Optional<BackupVerificationHistory> findFirstByHouseholdIdAndStatusOrderByVerifiedAtDesc(String householdId, String status);

    long countByHouseholdId(String householdId);

    long countByHouseholdIdAndStatus(String householdId, String status);
}
