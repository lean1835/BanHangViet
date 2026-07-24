package com.viet.sales.controller;

import com.viet.sales.constant.BackupType;
import com.viet.sales.service.interfaces.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/backup")
@RequiredArgsConstructor
public class BackupController {

    private final BackupService backupService;

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ResponseEntity<Resource> exportBackupData(
            Principal principal,
            @RequestParam("type") BackupType type,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return backupService.exportBackupData(principal.getName(), type, fromDate, toDate);
    }
}
