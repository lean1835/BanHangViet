package com.sales.modules.backup.service;
import com.sales.common.constant.BackupType;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;

public interface BackupService {

    ResponseEntity<Resource> exportBackupData(String currentUsername, BackupType type, LocalDate fromDate, LocalDate toDate);
}
