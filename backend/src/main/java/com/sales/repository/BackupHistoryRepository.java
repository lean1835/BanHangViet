package com.sales.repository;

import com.sales.entity.BackupHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BackupHistoryRepository extends JpaRepository<BackupHistory, String> {

    Page<BackupHistory> findByHouseholdIdOrderByBackupTimeDesc(String householdId, Pageable pageable);

    Optional<BackupHistory> findByIdAndHouseholdId(String id, String householdId);

    @Query("SELECT bh FROM BackupHistory bh WHERE bh.household.id = :householdId AND bh.status = 'SUCCESS' ORDER BY bh.backupTime ASC")
    List<BackupHistory> findActiveSuccessfulBackupsOrderByTimeAsc(@Param("householdId") String householdId);

    Optional<BackupHistory> findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(String householdId, String status);

    long countByHouseholdIdAndStatus(String householdId, String status);
}
