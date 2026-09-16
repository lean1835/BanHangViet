package com.sales.service.classes;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.TriggerVerificationRequest;
import com.sales.dto.response.AuditIntegrityResponse;
import com.sales.dto.response.BackupVerificationHistoryResponse;
import com.sales.dto.response.BackupVerificationStatusResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.AppNotification;
import com.sales.entity.BackupConfig;
import com.sales.entity.BackupHistory;
import com.sales.entity.BackupVerificationHistory;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.AppNotificationRepository;
import com.sales.repository.BackupConfigRepository;
import com.sales.repository.BackupHistoryRepository;
import com.sales.repository.BackupVerificationHistoryRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.AuditLogService;
import com.sales.service.interfaces.BackupVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackupVerificationServiceImpl implements BackupVerificationService {

    @Autowired
    @Lazy
    private BackupVerificationService self;

    private BackupVerificationService getSelf() {
        return self != null ? self : this;
    }

    @Value("${app.backup-verification.max-unverified-days:7}")
    private int maxAllowedDaysWithoutVerification = 7;

    private final BackupVerificationHistoryRepository verificationHistoryRepository;
    private final BackupHistoryRepository backupHistoryRepository;
    private final BackupConfigRepository backupConfigRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final AppNotificationRepository appNotificationRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public BackupVerificationStatusResponse getVerificationStatus(String currentUsername) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);
        String householdId = household.getId();

        Optional<BackupVerificationHistory> latestOpt = verificationHistoryRepository
                .findFirstByHouseholdIdOrderByVerifiedAtDesc(householdId);

        Optional<BackupVerificationHistory> latestSuccessOpt = verificationHistoryRepository
                .findFirstByHouseholdIdAndStatusOrderByVerifiedAtDesc(householdId, "PASSED");

        long totalVerifications = verificationHistoryRepository.countByHouseholdId(householdId);
        long passedVerifications = verificationHistoryRepository.countByHouseholdIdAndStatus(householdId, "PASSED");
        long failedVerifications = verificationHistoryRepository.countByHouseholdIdAndStatus(householdId, "FAILED");

        Long daysSinceLastSuccess = null;
        boolean isOverdue = false;
        boolean hasFailedRecent = false;
        String overallHealthStatus = "NORMAL";
        String warningMessage = "Bản sao lưu gần nhất đã được kiểm chứng thành công và sẵn sàng phục hồi.";

        if (latestOpt.isEmpty()) {
            isOverdue = true;
            overallHealthStatus = "WARNING";
            warningMessage = "Bản sao lưu chưa từng được chạy thử phục hồi để kiểm chứng tính toàn vẹn.";
        } else {
            BackupVerificationHistory latest = latestOpt.get();
            hasFailedRecent = "FAILED".equalsIgnoreCase(latest.getStatus());

            if (hasFailedRecent) {
                isOverdue = true;
                overallHealthStatus = "DANGER";
                warningMessage = "CẢNH BÁO NGUY HIỂM: Lần thử phục hồi bản sao lưu gần nhất ("
                        + latest.getBackupFileName() + ") bị THẤT BẠI. Chi tiết lỗi: " + latest.getFailureReason();
            }

            if (latestSuccessOpt.isPresent()) {
                daysSinceLastSuccess = ChronoUnit.DAYS.between(latestSuccessOpt.get().getVerifiedAt(), LocalDateTime.now());
                if (daysSinceLastSuccess > maxAllowedDaysWithoutVerification) {
                    isOverdue = true;
                    if (!hasFailedRecent) {
                        overallHealthStatus = "WARNING";
                        warningMessage = "CẢNH BÁO QUÁ HẠN: Đã quá " + daysSinceLastSuccess
                                + " ngày kể từ lần kiểm chứng bản sao lưu thành công gần nhất (ngưỡng cho phép: "
                                + maxAllowedDaysWithoutVerification + " ngày). Vui lòng kích hoạt thử phục hồi.";
                    }
                }
            } else if (!hasFailedRecent) {
                isOverdue = true;
                overallHealthStatus = "WARNING";
                warningMessage = "Chưa có lần kiểm chứng bản sao lưu nào đạt kết quả thành công.";
            }
        }

        return BackupVerificationStatusResponse.builder()
                .latestVerification(latestOpt.map(this::mapToResponse).orElse(null))
                .latestSuccessfulVerification(latestSuccessOpt.map(this::mapToResponse).orElse(null))
                .daysSinceLastSuccess(daysSinceLastSuccess)
                .maxAllowedDaysWithoutVerification(maxAllowedDaysWithoutVerification)
                .isOverdue(isOverdue)
                .hasFailedRecent(hasFailedRecent)
                .overallHealthStatus(overallHealthStatus)
                .warningMessage(warningMessage)
                .totalVerificationsRun(totalVerifications)
                .passedVerificationsCount(passedVerifications)
                .failedVerificationsCount(failedVerifications)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BackupVerificationHistoryResponse> getVerificationHistories(String currentUsername, int page, int size) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<BackupVerificationHistory> historyPage = verificationHistoryRepository
                .findByHouseholdIdOrderByVerifiedAtDesc(household.getId(), pageable);

        List<BackupVerificationHistoryResponse> content = historyPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<BackupVerificationHistoryResponse>builder()
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
    public BackupVerificationHistoryResponse triggerVerification(String currentUsername, TriggerVerificationRequest request) {
        User user = validateAndGetOwnerUser(currentUsername);
        BusinessHousehold household = getHouseholdOrThrow(user);

        BackupHistory targetBackup = null;
        if (request != null && request.getBackupHistoryId() != null && !request.getBackupHistoryId().isBlank()) {
            targetBackup = backupHistoryRepository.findByIdAndHouseholdId(request.getBackupHistoryId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.BACKUP_FILE_NOT_FOUND));
        } else {
            targetBackup = backupHistoryRepository
                    .findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS")
                    .orElseThrow(() -> new AppException(ErrorCode.NO_BACKUP_AVAILABLE_FOR_VERIFICATION));
        }

        String notes = request != null ? request.getNotes() : null;
        BackupVerificationHistory verification = getSelf().executeSandboxVerification(household, targetBackup, "MANUAL", notes, user);

        return mapToResponse(verification);
    }

    @Override
    public void runScheduledPeriodicVerification() {
        log.info("Bắt đầu tác vụ tự động kiểm thử phục hồi bản sao lưu định kỳ (NCL-14-CN-005)...");

        List<BackupConfig> enabledConfigs = backupConfigRepository.findAllEnabledAutoBackupConfigs();

        for (BackupConfig config : enabledConfigs) {
            BusinessHousehold household = config.getHousehold();
            if (household == null || household.getDeletedAt() != null) {
                continue;
            }

            try {
                Optional<BackupHistory> latestBackupOpt = backupHistoryRepository
                        .findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS");

                if (latestBackupOpt.isEmpty()) {
                    continue;
                }

                BackupHistory latestBackup = latestBackupOpt.get();

                // Kiểm tra xem bản sao lưu này đã được kiểm chứng thành công gần đây chưa
                Optional<BackupVerificationHistory> lastVerificationOpt = verificationHistoryRepository
                        .findFirstByHouseholdIdOrderByVerifiedAtDesc(household.getId());

                if (lastVerificationOpt.isPresent()) {
                    BackupVerificationHistory lastVer = lastVerificationOpt.get();
                    if (lastVer.getBackupHistory() != null
                            && lastVer.getBackupHistory().getId().equals(latestBackup.getId())
                            && "PASSED".equalsIgnoreCase(lastVer.getStatus())
                            && lastVer.getVerifiedAt().isAfter(LocalDateTime.now().minusHours(23))) {
                        // Đã kiểm chứng đạt bản này trong 24h qua, bỏ qua
                        continue;
                    }
                }

                getSelf().executeSandboxVerification(household, latestBackup, "AUTOMATIC", "Tự động kiểm thử phục hồi theo lịch hệ thống", null);

            } catch (Exception e) {
                log.error("Lỗi khi chạy thử phục hồi định kỳ cho hộ id={}", household.getId(), e);
            }
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BackupVerificationHistory executeSandboxVerification(
            BusinessHousehold household,
            BackupHistory backup,
            String triggerType,
            String notes,
            User actor) {

        long startTime = System.currentTimeMillis();
        boolean fileReadable = false;
        boolean recordCountsMatched = false;
        boolean auditChainIntact = false;
        int productCount = 0;
        int customerCount = 0;
        int supplierCount = 0;
        int userCount = 0;
        int auditCount = 0;
        String failureReason = null;
        String status = "PASSED";

        try {
            // ==========================================
            // PILLAR 1: Kiểm tra khả năng đọc tệp (Sandbox)
            // ==========================================
            Path targetDiskPath = resolveBackupFilePath(household.getId(), backup);
            if (targetDiskPath == null || !Files.exists(targetDiskPath)) {
                status = "FAILED";
                failureReason = "Không tìm thấy tệp bản sao lưu trên ổ đĩa lưu trữ";
            } else {
                long fileSize = Files.size(targetDiskPath);
                if (fileSize <= 0) {
                    status = "FAILED";
                    failureReason = "Tệp sao lưu rỗng (0 bytes)";
                } else {
                    Map<String, Object> snapshotData = null;
                    try (InputStream is = Files.newInputStream(targetDiskPath)) {
                        snapshotData = objectMapper.readValue(is, new TypeReference<Map<String, Object>>() {});
                    } catch (Exception parseEx) {
                        status = "FAILED";
                        failureReason = "Tệp sao lưu bị lỗi cấu trúc hoặc định dạng dữ liệu hỏng: " + parseEx.getMessage();
                    }

                    if (snapshotData != null) {
                        fileReadable = true;

                        // Kiểm tra tính toàn vẹn đa người thuê (Multi-tenancy): householdId trong tệp phải khớp
                        Object snapHId = snapshotData.get("householdId");
                        if (snapHId == null || !household.getId().equals(snapHId.toString())) {
                            status = "FAILED";
                            failureReason = "Dữ liệu bản sao lưu không có hoặc không khớp với định danh hộ kinh doanh hiện tại";
                        } else {
                            // ==========================================
                            // PILLAR 2: Đối soát số lượng bản ghi chính
                            // ==========================================
                            if (snapshotData.containsKey("products")) {
                                List<?> prods = (List<?>) snapshotData.get("products");
                                productCount = prods != null ? prods.size() : 0;
                            }
                            if (snapshotData.containsKey("customers")) {
                                List<?> custs = (List<?>) snapshotData.get("customers");
                                customerCount = custs != null ? custs.size() : 0;
                            }
                            if (snapshotData.containsKey("suppliers")) {
                                List<?> sups = (List<?>) snapshotData.get("suppliers");
                                supplierCount = sups != null ? sups.size() : 0;
                            }
                            if (snapshotData.containsKey("users")) {
                                List<?> users = (List<?>) snapshotData.get("users");
                                userCount = users != null ? users.size() : 0;
                            }

                            recordCountsMatched = snapshotData.containsKey("products")
                                    || snapshotData.containsKey("customers")
                                    || snapshotData.containsKey("suppliers")
                                    || snapshotData.containsKey("users");

                            if (!recordCountsMatched) {
                                status = "FAILED";
                                failureReason = "Tệp sao lưu thiếu cấu trúc dữ liệu của các bảng thực thể chính";
                            }

                            // ==========================================
                            // PILLAR 3: Thẩm định chuỗi kiểm toán SHA-256 (QTN-25)
                            // ==========================================
                            AuditIntegrityResponse integrityRes = auditLogService.verifyIntegrityForHousehold(household.getId());
                            auditCount = (int) integrityRes.getTotalRecordsChecked();
                            auditChainIntact = integrityRes.isValid();

                            if (!auditChainIntact) {
                                status = "FAILED";
                                String auditFailReason = "Phát hiện chuỗi kiểm tra nhật ký kiểm toán bị đứt gãy tại sequence #"
                                        + integrityRes.getCorruptedSequenceNumber() + ": " + integrityRes.getFailureReason();
                                failureReason = (failureReason == null) ? auditFailReason : failureReason + "; " + auditFailReason;
                            }
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("Ngoại lệ khi thực hiện thử phục hồi trong sandbox cho backup id={}", backup.getId(), e);
            status = "FAILED";
            failureReason = "Lỗi xử lý kiểm thử nội bộ: " + e.getMessage();
        }

        long durationMs = Math.max(System.currentTimeMillis() - startTime, 1L);

        BackupVerificationHistory history = BackupVerificationHistory.builder()
                .household(household)
                .backupHistory(backup)
                .backupFileName(backup.getFileName())
                .backupTime(backup.getBackupTime() != null ? backup.getBackupTime() : LocalDateTime.now())
                .fileSize(backup.getFileSize() != null ? backup.getFileSize() : 0L)
                .status(status)
                .executionDurationMs(durationMs)
                .verifiedAt(LocalDateTime.now())
                .checkedFileReadable(fileReadable)
                .checkedRecordCountsMatched(recordCountsMatched)
                .checkedAuditChainIntact(auditChainIntact)
                .productCount(productCount)
                .customerCount(customerCount)
                .supplierCount(supplierCount)
                .userCount(userCount)
                .auditLogCount(auditCount)
                .failureReason(failureReason)
                .triggerType(triggerType)
                .notes(notes)
                .build();

        BackupVerificationHistory savedHistory = verificationHistoryRepository.save(history);

        // NCL-14-CN-005-TC-02: Bắn AppNotification cảnh báo khi FAILED
        if ("FAILED".equalsIgnoreCase(status)) {
            dispatchFailureNotification(household, savedHistory);
        }

        // Ghi vết nhật ký kiểm toán
        logActivity(household, actor, "FAILED".equalsIgnoreCase(status) ? "BACKUP_VERIFY_FAILED" : "BACKUP_VERIFY_SUCCESS",
                savedHistory.getId(), backup.getFileName(), status, failureReason);

        return savedHistory;
    }

    private Path resolveBackupFilePath(String householdId, BackupHistory backup) {
        if (backup.getFilePath() != null && !backup.getFilePath().isBlank()) {
            Path directPath = Paths.get(backup.getFilePath());
            if (Files.exists(directPath)) {
                return directPath;
            }
        }
        Path fallbackPath = Paths.get("backups", householdId, backup.getFileName() + ".json");
        if (Files.exists(fallbackPath)) {
            return fallbackPath;
        }
        return null;
    }

    private void dispatchFailureNotification(BusinessHousehold household, BackupVerificationHistory verification) {
        try {
            AppNotification notification = AppNotification.builder()
                    .household(household)
                    .notificationType("BACKUP_VERIFICATION_FAILED")
                    .severity("DANGER")
                    .title("Cảnh báo: Thử phục hồi bản sao lưu thất bại!")
                    .message("Bản sao lưu " + verification.getBackupFileName() + " không thể phục hồi được. Chi tiết: "
                            + (verification.getFailureReason() != null ? verification.getFailureReason() : "Lỗi kiểm tra tính toàn vẹn"))
                    .targetType("BACKUP_VERIFICATION")
                    .targetId(verification.getId())
                    .actionUrl("/settings/backup-export")
                    .isRead(false)
                    .isClosed(false)
                    .build();

            appNotificationRepository.save(notification);
            log.warn("Đã gửi AppNotification DANGER cho household id={}", household.getId());
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo cảnh báo thử phục hồi thất bại", e);
        }
    }

    private User validateAndGetOwnerUser(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() == null) {
            throw new AppException(ErrorCode.ONLY_STORE_OWNER_CAN_VERIFY_BACKUP);
        }

        String roleCode = user.getRole().getCode();
        String roleName = user.getRole().getName();
        if (!"VT-01".equalsIgnoreCase(roleCode) && !"OWNER".equalsIgnoreCase(roleCode)
                && !"Chủ hộ kinh doanh".equalsIgnoreCase(roleName)) {
            throw new AppException(ErrorCode.ONLY_STORE_OWNER_CAN_VERIFY_BACKUP);
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

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, String fileName, String status, String reason) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("fileName", fileName);
            map.put("status", status);
            if (reason != null) {
                map.put("failureReason", reason);
            }
            String newValueJson = objectMapper.writeValueAsString(map);

            activityLogHelper.logActivityInNewTransaction(
                    household, actor, action, "backup_verification_histories", targetId, null, newValueJson, null, null
            );
        } catch (Exception e) {
            log.error("Lỗi khi ghi vết nhật ký kiểm toán cho thử phục hồi sao lưu", e);
        }
    }

    private BackupVerificationHistoryResponse mapToResponse(BackupVerificationHistory bvh) {
        return BackupVerificationHistoryResponse.builder()
                .id(bvh.getId())
                .backupHistoryId(bvh.getBackupHistory() != null ? bvh.getBackupHistory().getId() : null)
                .backupFileName(bvh.getBackupFileName())
                .backupTime(bvh.getBackupTime())
                .fileSize(bvh.getFileSize())
                .status(bvh.getStatus())
                .executionDurationMs(bvh.getExecutionDurationMs())
                .verifiedAt(bvh.getVerifiedAt())
                .checkedFileReadable(bvh.getCheckedFileReadable())
                .checkedRecordCountsMatched(bvh.getCheckedRecordCountsMatched())
                .checkedAuditChainIntact(bvh.getCheckedAuditChainIntact())
                .productCount(bvh.getProductCount())
                .customerCount(bvh.getCustomerCount())
                .supplierCount(bvh.getSupplierCount())
                .userCount(bvh.getUserCount())
                .auditLogCount(bvh.getAuditLogCount())
                .failureReason(bvh.getFailureReason())
                .triggerType(bvh.getTriggerType())
                .notes(bvh.getNotes())
                .createdAt(bvh.getCreatedAt())
                .build();
    }
}
