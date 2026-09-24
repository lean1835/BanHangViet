package com.sales.modules.backup.repository;
import com.sales.modules.backup.entity.BackupConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query(value = "SELECT bc FROM BackupConfig bc JOIN FETCH bc.household h WHERE bc.isAutoBackupEnabled = true AND h.deletedAt IS NULL",
           countQuery = "SELECT count(bc) FROM BackupConfig bc JOIN bc.household h WHERE bc.isAutoBackupEnabled = true AND h.deletedAt IS NULL")
    Page<BackupConfig> findAllEnabledAutoBackupConfigs(Pageable pageable);
}
