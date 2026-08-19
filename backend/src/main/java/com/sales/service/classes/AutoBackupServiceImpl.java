package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.BackupTriggerType;
import com.sales.constant.BackupType;
import com.sales.dto.request.UpdateBackupConfigRequest;
import com.sales.dto.response.BackupConfigResponse;
import com.sales.dto.response.BackupHistoryResponse;
import com.sales.dto.response.BackupStatusOverviewResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BackupConfig;
import com.sales.entity.BackupHistory;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BackupConfigRepository;
import com.sales.repository.BackupHistoryRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.AutoBackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutoBackupServiceImpl implements AutoBackupService {

    private static final DateTimeFormatter FILE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final BackupConfigRepository backupConfigRepository;
    private final BackupHistoryRepository backupHistoryRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public BackupConfigResponse getBackupConfig(String currentUsername) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        BackupConfig config = getOrCreateDefaultConfig(household);
        return mapToConfigResponse(config);
    }

    @Override
    @Transactional
    public BackupConfigResponse updateBackupConfig(String currentUsername, UpdateBackupConfigRequest request) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        if (request.getRetentionCount() == null || request.getRetentionCount() < 1 || request.getRetentionCount() > 100) {
            throw new AppException(ErrorCode.INVALID_RETENTION_COUNT);
        }

        BackupConfig config = getOrCreateDefaultConfig(household);
        config.setIsAutoBackupEnabled(request.getIsAutoBackupEnabled());
        config.setScheduledTime(request.getScheduledTime());
        config.setRetentionCount(request.getRetentionCount());
        config.setBackupType(request.getBackupType());

        BackupConfig savedConfig = backupConfigRepository.save(config);

        // Ghi nhật ký kiểm toán
        logActivity(household, user, "UPDATE_BACKUP_CONFIG", savedConfig.getId(), savedConfig.getScheduledTime());

        return mapToConfigResponse(savedConfig);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BackupHistoryResponse> getBackupHistories(String currentUsername, int page, int size) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "backupTime"));
        Page<BackupHistory> historyPage = backupHistoryRepository.findByHouseholdIdOrderByBackupTimeDesc(household.getId(), pageable);

        List<BackupHistoryResponse> content = historyPage.getContent().stream()
                .map(this::mapToHistoryResponse)
                .collect(Collectors.toList());

        return PageResponse.<BackupHistoryResponse>builder()
                .content(content)
                .pageNumber(historyPage.getNumber())
                .pageSize(historyPage.getSize())
                .totalElements(historyPage.getTotalElements())
                .totalPages(historyPage.getTotalPages())
                .last(historyPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public BackupStatusOverviewResponse getBackupOverview(String currentUsername) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        BackupConfig config = getOrCreateDefaultConfig(household);
        Optional<BackupHistory> latestSuccessOpt = backupHistoryRepository
                .findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS");

        long activeCount = backupHistoryRepository.countByHouseholdIdAndStatus(household.getId(), "SUCCESS");
        List<BackupHistory> activeBackups = backupHistoryRepository.findActiveSuccessfulBackupsOrderByTimeAsc(household.getId());

        long totalSize = activeBackups.stream()
                .mapToLong(h -> h.getFileSize() != null ? h.getFileSize() : 0L)
                .sum();

        return BackupStatusOverviewResponse.builder()
                .isAutoBackupEnabled(config.getIsAutoBackupEnabled())
                .scheduledTime(config.getScheduledTime())
                .retentionCount(config.getRetentionCount())
                .lastBackupTime(latestSuccessOpt.map(BackupHistory::getBackupTime).orElse(null))
                .lastBackupStatus(latestSuccessOpt.map(BackupHistory::getStatus).orElse("NONE"))
                .lastBackupFileName(latestSuccessOpt.map(BackupHistory::getFileName).orElse(null))
                .activeBackupCount(activeCount)
                .totalStorageSizeBytes(totalSize)
                .build();
    }

    @Override
    @Transactional
    public BackupHistoryResponse triggerManualBackup(String currentUsername) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        BackupHistory history = executeBackup(household, user, BackupTriggerType.MANUAL);
        return mapToHistoryResponse(history);
    }

    @Override
    @Transactional
    public void runDailyAutoBackupForHousehold(BusinessHousehold household) {
        if (household == null || household.getDeletedAt() != null) {
            return;
        }

        BackupConfig config = backupConfigRepository.findByHouseholdId(household.getId()).orElse(null);
        if (config == null || !Boolean.TRUE.equals(config.getIsAutoBackupEnabled())) {
            return;
        }

        try {
            executeBackup(household, null, BackupTriggerType.AUTOMATIC);
        } catch (Exception e) {
            log.error("Lỗi khi thực thi sao lưu tự động cho hộ kinh doanh id={}", household.getId(), e);
        }
    }

    private BackupHistory executeBackup(BusinessHousehold household, User user, BackupTriggerType triggerType) {
        BackupConfig config = getOrCreateDefaultConfig(household);

        // NCL-14-CN-002-TC-02: Kiểm tra giới hạn số lượng bản sao lưu retention_count
        List<BackupHistory> activeBackups = backupHistoryRepository.findActiveSuccessfulBackupsOrderByTimeAsc(household.getId());
        int retentionCount = config.getRetentionCount() != null ? config.getRetentionCount() : 7;

        // Nếu số bản thành công đã đạt/vượt quá retentionCount -> Dọn dẹp các bản cũ nhất
        if (activeBackups.size() >= retentionCount) {
            int itemsToPurge = activeBackups.size() - retentionCount + 1;
            for (int i = 0; i < itemsToPurge; i++) {
                BackupHistory oldest = activeBackups.get(i);
                oldest.setStatus("PURGED");
                oldest.setNotes("Tự động dọn dẹp bản sao lưu cũ để duy trì giới hạn " + retentionCount + " bản gần nhất (TC-02)");
                backupHistoryRepository.save(oldest);
                log.info("Dọn dẹp bản sao lưu cũ ID={} file={} theo quy tắc retention={}", oldest.getId(), oldest.getFileName(), retentionCount);
            }
        }

        // Tạo bản sao lưu mới
        String timestampStr = LocalDateTime.now().format(FILE_DATE_FORMATTER);
        BackupType type = config.getBackupType() != null ? config.getBackupType() : BackupType.FULL;
        String ext = type == BackupType.FULL ? ".zip" : ".xlsx";
        String fileName = String.format("backup_%s_%s_%s%s",
                type.name().toLowerCase(),
                household.getTaxCode() != null ? household.getTaxCode() : "default",
                timestampStr,
                ext);

        long simulatedFileSize = 1024L * 256L; // 256KB simulated file size

        BackupHistory history = BackupHistory.builder()
                .household(household)
                .createdByUser(user)
                .fileName(fileName)
                .filePath("/backups/" + household.getId() + "/" + fileName)
                .fileSize(simulatedFileSize)
                .backupType(type)
                .triggerType(triggerType)
                .status("SUCCESS")
                .notes(triggerType == BackupTriggerType.AUTOMATIC ? "Tự động sao lưu theo lịch hằng ngày" : "Chủ hộ sao lưu thủ công")
                .backupTime(LocalDateTime.now())
                .build();

        BackupHistory savedHistory = backupHistoryRepository.save(history);

        // Ghi log kiểm toán
        logActivity(household, user, "AUTO_BACKUP_EXECUTE", savedHistory.getId(), fileName);

        return savedHistory;
    }

    private User validateAndGetOwnerUser(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() == null || !"VT-01".equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.ONLY_STORE_OWNER_CAN_BACKUP);
        }
        return user;
    }

    private BusinessHousehold getHouseholdOrThrow(User user) {
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        return household;
    }

    private BackupConfig getOrCreateDefaultConfig(BusinessHousehold household) {
        return backupConfigRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> backupConfigRepository.save(BackupConfig.builder()
                        .household(household)
                        .isAutoBackupEnabled(true)
                        .scheduledTime("01:00")
                        .retentionCount(7)
                        .backupType(BackupType.FULL)
                        .build()));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, String details) {
        String newValueJson = null;
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("details", details);
            newValueJson = objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.error("Error serializing activity log", e);
        }

        activityLogHelper.logActivityInNewTransaction(
                household, actor, action, "backup_configs", targetId, null, newValueJson, null, null
        );
    }

    private BackupConfigResponse mapToConfigResponse(BackupConfig config) {
        return BackupConfigResponse.builder()
                .id(config.getId())
                .householdId(config.getHousehold() != null ? config.getHousehold().getId() : null)
                .isAutoBackupEnabled(config.getIsAutoBackupEnabled())
                .scheduledTime(config.getScheduledTime())
                .retentionCount(config.getRetentionCount())
                .backupType(config.getBackupType())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private BackupHistoryResponse mapToHistoryResponse(BackupHistory history) {
        return BackupHistoryResponse.builder()
                .id(history.getId())
                .fileName(history.getFileName())
                .filePath(history.getFilePath())
                .fileSize(history.getFileSize())
                .backupType(history.getBackupType())
                .triggerType(history.getTriggerType())
                .status(history.getStatus())
                .notes(history.getNotes())
                .createdByUserId(history.getCreatedByUser() != null ? history.getCreatedByUser().getId() : null)
                .createdByUserName(history.getCreatedByUser() != null ? history.getCreatedByUser().getFullName() : null)
                .backupTime(history.getBackupTime())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
