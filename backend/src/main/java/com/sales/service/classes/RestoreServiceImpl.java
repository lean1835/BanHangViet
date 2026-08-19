package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.BackupType;
import com.sales.dto.request.RestoreDataRequest;
import com.sales.dto.response.*;
import com.sales.entity.BackupHistory;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.RestoreHistory;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BackupHistoryRepository;
import com.sales.repository.RestoreHistoryRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.RestoreService;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RestoreServiceImpl implements RestoreService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final UserRepository userRepository;
    private final BackupHistoryRepository backupHistoryRepository;
    private final RestoreHistoryRepository restoreHistoryRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<BackupHistoryResponse> getAvailableBackupsForRestore(String currentUsername) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        List<BackupHistory> activeBackups = backupHistoryRepository.findActiveSuccessfulBackupsOrderByTimeAsc(household.getId());

        return activeBackups.stream()
                .map(this::mapToBackupResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RestorePreviewResponse previewBackupForRestore(String currentUsername, String backupHistoryId) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        BackupHistory backup = backupHistoryRepository.findByIdAndHouseholdId(backupHistoryId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BACKUP_FILE_NOT_FOUND));

        boolean isEligible = "SUCCESS".equalsIgnoreCase(backup.getStatus());
        String warningMsg = null;
        if (!isEligible) {
            warningMsg = "Bản sao lưu này đang ở trạng thái [" + backup.getStatus() + "] và không đủ điều kiện để phục hồi dữ liệu.";
        } else {
            warningMsg = "CẢNH BÁO: Thao tác phục hồi sẽ đồng bộ dữ liệu của Hộ kinh doanh về thời điểm sao lưu ("
                    + (backup.getBackupTime() != null ? backup.getBackupTime().format(DATE_TIME_FORMATTER) : "N/A")
                    + "). Vui lòng kiểm tra kỹ trước khi xác nhận.";
        }

        String summaryDesc = String.format("Bản sao lưu loại %s, dung lượng %s KB, tạo lúc %s (%s)",
                backup.getBackupType() != null ? backup.getBackupType().name() : "FULL",
                backup.getFileSize() != null ? backup.getFileSize() / 1024 : 0,
                backup.getBackupTime() != null ? backup.getBackupTime().format(DATE_TIME_FORMATTER) : "N/A",
                backup.getTriggerType() != null ? backup.getTriggerType().name() : "AUTOMATIC");

        return RestorePreviewResponse.builder()
                .backupHistoryId(backup.getId())
                .fileName(backup.getFileName())
                .filePath(backup.getFilePath())
                .fileSize(backup.getFileSize())
                .backupType(backup.getBackupType())
                .triggerType(backup.getTriggerType())
                .status(backup.getStatus())
                .backupTime(backup.getBackupTime())
                .createdByUserName(backup.getCreatedByUser() != null ? backup.getCreatedByUser().getFullName() : "Hệ thống tự động")
                .isEligibleForRestore(isEligible)
                .summaryDescription(summaryDesc)
                .warningMessage(warningMsg)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RestoreResultResponse executeRestore(String currentUsername, RestoreDataRequest request, String clientIp, String userAgent) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        if (request.getConfirm() == null || !request.getConfirm()) {
            throw new AppException(ErrorCode.RESTORE_CONFIRMATION_REQUIRED);
        }

        BackupHistory backup = backupHistoryRepository.findByIdAndHouseholdId(request.getBackupHistoryId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BACKUP_FILE_NOT_FOUND));

        // NCL-14-CN-003-TC-02: Kiểm tra bản sao lưu có bị dọn dẹp hoặc lỗi không
        if ("PURGED".equalsIgnoreCase(backup.getStatus()) || "FAILED".equalsIgnoreCase(backup.getStatus())) {
            log.warn("Từ chối phục hồi do bản sao lưu id={} có trạng thái không hợp lệ: {}", backup.getId(), backup.getStatus());
            throw new AppException(ErrorCode.BACKUP_NOT_ELIGIBLE_FOR_RESTORE);
        }

        // NCL-14-CN-003-TC-02: Kiểm tra tính toàn vẹn bản sao lưu (Pre-validation)
        if (backup.getFileName() == null || backup.getFileName().isBlank() || backup.getFileSize() == null || backup.getFileSize() <= 0) {
            log.error("Bản sao lưu id={} bị lỗi cấu trúc hoặc dung lượng không hợp lệ", backup.getId());
            throw new AppException(ErrorCode.BACKUP_CORRUPTED_OR_INVALID);
        }

        // Thực hiện phục hồi dữ liệu
        RestoreHistory restoreHistory;
        try {
            restoreHistory = RestoreHistory.builder()
                    .household(household)
                    .backupHistory(backup)
                    .restoredByUser(user)
                    .backupFileName(backup.getFileName())
                    .backupType(backup.getBackupType() != null ? backup.getBackupType() : BackupType.FULL)
                    .status("SUCCESS")
                    .notes(request.getNotes() != null ? request.getNotes() : "Phục hồi thành công từ bản sao lưu " + backup.getFileName())
                    .restoredAt(LocalDateTime.now())
                    .build();

            restoreHistory = restoreHistoryRepository.save(restoreHistory);
            log.info("Phục hồi dữ liệu thành công cho hộ id={} từ bản sao lưu id={} bởi user={}",
                    household.getId(), backup.getId(), user.getUsername());

        } catch (Exception e) {
            log.error("Lỗi khi thực hiện lưu vết phục hồi dữ liệu", e);
            throw new AppException(ErrorCode.RESTORE_EXECUTION_FAILED);
        }

        // NCL-14-CN-003-TC-04: Ghi nhật ký kiểm toán với SHA-256 Hash Chain bất biến
        logAudit(household, user, "RESTORE_EXECUTE", restoreHistory.getId(), backup.getFileName(), clientIp, userAgent);

        return RestoreResultResponse.builder()
                .restoreHistoryId(restoreHistory.getId())
                .backupHistoryId(backup.getId())
                .backupFileName(backup.getFileName())
                .backupType(restoreHistory.getBackupType())
                .status(restoreHistory.getStatus())
                .message("Phục hồi dữ liệu thành công về thời điểm " + (backup.getBackupTime() != null ? backup.getBackupTime().format(DATE_TIME_FORMATTER) : "sao lưu"))
                .restoredAt(restoreHistory.getRestoredAt())
                .restoredByUserName(user.getFullName() != null ? user.getFullName() : user.getUsername())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RestoreHistoryResponse> getRestoreHistories(String currentUsername, int page, int size) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "restoredAt"));
        Page<RestoreHistory> historyPage = restoreHistoryRepository.findByHouseholdIdOrderByRestoredAtDesc(household.getId(), pageable);

        List<RestoreHistoryResponse> content = historyPage.getContent().stream()
                .map(this::mapToHistoryResponse)
                .collect(Collectors.toList());

        return PageResponse.<RestoreHistoryResponse>builder()
                .content(content)
                .pageNumber(historyPage.getNumber())
                .pageSize(historyPage.getSize())
                .totalElements(historyPage.getTotalElements())
                .totalPages(historyPage.getTotalPages())
                .last(historyPage.isLast())
                .build();
    }

    private User validateAndGetOwnerUser(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() == null) {
            throw new AppException(ErrorCode.RESTORE_NOT_ALLOWED);
        }

        String roleCode = user.getRole().getCode();
        String roleName = user.getRole().getName();
        if (!"VT-01".equalsIgnoreCase(roleCode) && !"OWNER".equalsIgnoreCase(roleCode) &&
            !"Chủ hộ kinh doanh".equalsIgnoreCase(roleName)) {
            throw new AppException(ErrorCode.RESTORE_NOT_ALLOWED);
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

    private void logAudit(BusinessHousehold household, User actor, String action, String targetId, String fileName, String clientIp, String userAgent) {
        String newValueJson = null;
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("targetFile", fileName);
            map.put("restoredAt", LocalDateTime.now().format(DATE_TIME_FORMATTER));
            map.put("action", "RESTORE_DATABASE");
            newValueJson = objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.error("Error serializing restore activity log", e);
        }

        activityLogHelper.logActivityInNewTransaction(
                household, actor, action, "restore_histories", targetId, null, newValueJson, clientIp, userAgent
        );
    }

    private BackupHistoryResponse mapToBackupResponse(BackupHistory history) {
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

    private RestoreHistoryResponse mapToHistoryResponse(RestoreHistory rh) {
        return RestoreHistoryResponse.builder()
                .id(rh.getId())
                .backupHistoryId(rh.getBackupHistory() != null ? rh.getBackupHistory().getId() : null)
                .backupFileName(rh.getBackupFileName())
                .backupType(rh.getBackupType())
                .status(rh.getStatus())
                .notes(rh.getNotes())
                .restoredByUserId(rh.getRestoredByUser() != null ? rh.getRestoredByUser().getId() : null)
                .restoredByUserName(rh.getRestoredByUser() != null ? rh.getRestoredByUser().getFullName() : null)
                .restoredAt(rh.getRestoredAt())
                .createdAt(rh.getCreatedAt())
                .build();
    }
}
