package com.sales.repository;

import com.sales.entity.BackupConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BackupConfigRepository extends JpaRepository<BackupConfig, String> {

    Optional<BackupConfig> findByHouseholdId(String householdId);

    @Query("SELECT bc FROM BackupConfig bc JOIN FETCH bc.household h WHERE bc.isAutoBackupEnabled = true AND h.deletedAt IS NULL")
    List<BackupConfig> findAllEnabledAutoBackupConfigs();
}
