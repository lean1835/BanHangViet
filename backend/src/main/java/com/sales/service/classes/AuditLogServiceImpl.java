package com.sales.service.classes;

import com.sales.dto.request.ActivityLogFilterRequest;
import com.sales.dto.response.ActivityLogResponse;
import com.sales.dto.response.AuditIntegrityResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.ActivityLog;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ActivityLogRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ActivityLogResponse> getAuditLogs(String currentUsername, ActivityLogFilterRequest filter, String clientIp, String userAgent) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        String householdId = getHouseholdIdForUser(currentUser);
        Pageable pageable = PageRequest.of(Math.max(0, filter.getPage()), Math.max(1, filter.getSize()));

        Page<ActivityLog> logPage = activityLogRepository.findFilteredLogs(
                householdId,
                filter.getUsername(),
                filter.getAction(),
                filter.getTargetTable(),
                filter.getStartDate(),
                filter.getEndDate(),
                pageable
        );

        List<ActivityLogResponse> content = logPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        // NCL-14-CN-001-TC-04: Tự động ghi vết việc tra cứu nhật ký
        recordSelfAuditLog(currentUser.getHousehold(), currentUser, "AUDIT_LOG_VIEW", "activity_logs",
                "Tra cứu danh sách nhật ký kiểm toán", clientIp, userAgent);

        return PageResponse.<ActivityLogResponse>builder()
                .content(content)
                .pageNumber(logPage.getNumber())
                .pageSize(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .last(logPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuditIntegrityResponse verifyIntegrity(String currentUsername) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        String householdId = getHouseholdIdForUser(currentUser);
        List<ActivityLog> logs = householdId != null ?
                activityLogRepository.findAllByHouseholdIdOrderBySequenceNumberAsc(householdId) :
                activityLogRepository.findAllByOrderBySequenceNumberAsc();

        long checkedCount = 0;
        String expectedPreviousHash = GENESIS_HASH;

        for (ActivityLog logItem : logs) {
            checkedCount++;

            // 1. Kiểm tra liên kết previous_hash với bản ghi trước đó
            if (logItem.getPreviousHash() != null && !logItem.getPreviousHash().equalsIgnoreCase(expectedPreviousHash) && checkedCount > 1) {
                log.warn("Đứt gãy chuỗi Hash Chain tại sequence={}: previousHash={} nhưng expected={}",
                        logItem.getSequenceNumber(), logItem.getPreviousHash(), expectedPreviousHash);

                return AuditIntegrityResponse.builder()
                        .isValid(false)
                        .totalRecordsChecked(checkedCount)
                        .corruptedSequenceNumber(logItem.getSequenceNumber())
                        .corruptedLogId(logItem.getId())
                        .failureReason("Đứt gãy liên kết chuỗi kiểm tra (Previous hash mismatch tại sequence #" + logItem.getSequenceNumber() + ")")
                        .verifiedAt(LocalDateTime.now())
                        .build();
            }

            // 2. Tính lại SHA-256 Hash của chính bản ghi này
            String computedHash = calculateHash(
                    logItem.getPreviousHash() != null ? logItem.getPreviousHash() : GENESIS_HASH,
                    logItem.getHousehold() != null ? logItem.getHousehold().getId() : null,
                    logItem.getUser() != null ? logItem.getUser().getId() : null,
                    logItem.getAction(),
                    logItem.getTargetTable(),
                    logItem.getTargetId(),
                    logItem.getOldValue(),
                    logItem.getNewValue()
            );

            if (!computedHash.equalsIgnoreCase(logItem.getHash())) {
                log.warn("Dữ liệu bị can thiệp tại sequence={}: logHash={} nhưng computedHash={}",
                        logItem.getSequenceNumber(), logItem.getHash(), computedHash);

                return AuditIntegrityResponse.builder()
                        .isValid(false)
                        .totalRecordsChecked(checkedCount)
                        .corruptedSequenceNumber(logItem.getSequenceNumber())
                        .corruptedLogId(logItem.getId())
                        .failureReason("Phát hiện dữ liệu bản ghi bị can thiệp trái phép tại sequence #" + logItem.getSequenceNumber() + " (Hash calculation mismatch)")
                        .verifiedAt(LocalDateTime.now())
                        .build();
            }

            expectedPreviousHash = logItem.getHash();
        }

        return AuditIntegrityResponse.builder()
                .isValid(true)
                .totalRecordsChecked(checkedCount)
                .corruptedSequenceNumber(null)
                .corruptedLogId(null)
                .failureReason(null)
                .verifiedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAuditLogsToExcel(String currentUsername, ActivityLogFilterRequest filter, String clientIp, String userAgent) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        String householdId = getHouseholdIdForUser(currentUser);
        Pageable pageable = PageRequest.of(0, 10000);

        Page<ActivityLog> logPage = activityLogRepository.findFilteredLogs(
                householdId,
                filter.getUsername(),
                filter.getAction(),
                filter.getTargetTable(),
                filter.getStartDate(),
                filter.getEndDate(),
                pageable
        );

        List<ActivityLog> logList = logPage.getContent();

        // NCL-14-CN-001-TC-04: Tự động ghi vết xuất file nhật ký kiểm toán
        recordSelfAuditLog(currentUser.getHousehold(), currentUser, "AUDIT_LOG_EXPORT", "activity_logs",
                "Xuất file báo cáo nhật ký kiểm toán (" + logList.size() + " bản ghi)", clientIp, userAgent);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Nhật Ký Kiểm Toán");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            String[] headers = {
                    "STT", "Sequence", "Thời Gian", "Tài Khoản", "Họ Và Tên",
                    "Thao Tác", "Bảng Tác Động", "Mã Đối Tượng", "Dữ Liệu Cũ",
                    "Dữ Liệu Mới", "Client IP", "User Agent", "Hash"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (ActivityLog logItem : logList) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(rowIdx - 1);
                row.createCell(1).setCellValue(logItem.getSequenceNumber() != null ? logItem.getSequenceNumber() : 0);
                row.createCell(2).setCellValue(logItem.getCreatedAt() != null ? logItem.getCreatedAt().format(DATE_FORMATTER) : "");
                row.createCell(3).setCellValue(logItem.getUser() != null ? logItem.getUser().getUsername() : "N/A");
                row.createCell(4).setCellValue(logItem.getUser() != null ? logItem.getUser().getFullName() : "N/A");
                row.createCell(5).setCellValue(logItem.getAction());
                row.createCell(6).setCellValue(logItem.getTargetTable());
                row.createCell(7).setCellValue(logItem.getTargetId() != null ? logItem.getTargetId() : "");
                row.createCell(8).setCellValue(logItem.getOldValue() != null ? logItem.getOldValue() : "");
                row.createCell(9).setCellValue(logItem.getNewValue() != null ? logItem.getNewValue() : "");
                row.createCell(10).setCellValue(logItem.getClientIp() != null ? logItem.getClientIp() : "");
                row.createCell(11).setCellValue(logItem.getUserAgent() != null ? logItem.getUserAgent() : "");
                row.createCell(12).setCellValue(logItem.getHash() != null ? logItem.getHash() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel nhật ký kiểm toán", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLog(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent) {
        try {
            String householdId = household != null ? household.getId() : null;

            // 1. Lấy previous hash của bản ghi gần nhất
            Optional<ActivityLog> latestLogOpt = householdId != null ?
                    activityLogRepository.findTopByHouseholdIdOrderBySequenceNumberDesc(householdId) :
                    activityLogRepository.findTopByOrderBySequenceNumberDesc();

            String previousHash = latestLogOpt.map(ActivityLog::getHash).orElse(GENESIS_HASH);

            String formattedOldVal = toJsonString(oldValue);
            String formattedNewVal = toJsonString(newValue);

            // 2. Tính SHA-256 Hash
            String hash = calculateHash(
                    previousHash,
                    householdId,
                    actor != null ? actor.getId() : null,
                    action,
                    targetTable,
                    targetId,
                    formattedOldVal,
                    formattedNewVal
            );

            ActivityLog logEntry = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable(targetTable)
                    .targetId(targetId)
                    .oldValue(formattedOldVal)
                    .newValue(formattedNewVal)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .previousHash(previousHash)
                    .hash(hash)
                    .build();

            activityLogRepository.saveAndFlush(logEntry);
        } catch (Exception e) {
            log.error("Lỗi khi ghi nhật ký kiểm toán với Hash Chain", e);
        }
    }

    private void recordSelfAuditLog(BusinessHousehold household, User actor, String action, String targetTable, String detailNote, String clientIp, String userAgent) {
        try {
            recordLog(household, actor, action, targetTable, null, null, detailNote, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Lỗi khi ghi tự vết tra cứu/xuất nhật ký kiểm toán", e);
        }
    }

    public static String calculateHash(String previousHash, String householdId, String userId, String action, String targetTable, String targetId, String oldValue, String newValue) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            StringBuilder sb = new StringBuilder();
            sb.append(previousHash != null ? previousHash : GENESIS_HASH).append("|");
            sb.append(householdId != null ? householdId : "").append("|");
            sb.append(userId != null ? userId : "").append("|");
            sb.append(action != null ? action : "").append("|");
            sb.append(targetTable != null ? targetTable : "").append("|");
            sb.append(targetId != null ? targetId : "").append("|");
            sb.append(oldValue != null ? oldValue : "").append("|");
            sb.append(newValue != null ? newValue : "");

            byte[] hashBytes = digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 Algorithm not available", e);
        }
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateAccessRole(User user) {
        if (user == null || user.getRole() == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        String roleCode = user.getRole().getCode();
        String roleName = user.getRole().getName();
        if (!"VT-01".equalsIgnoreCase(roleCode) && !"VT-04".equalsIgnoreCase(roleCode) &&
            !"Chủ hộ kinh doanh".equalsIgnoreCase(roleName) && !"Quản trị nền tảng".equalsIgnoreCase(roleName)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private String getHouseholdIdForUser(User user) {
        if (user.getRole() != null &&
            ("VT-04".equalsIgnoreCase(user.getRole().getCode()) || "Quản trị nền tảng".equalsIgnoreCase(user.getRole().getName()))) {
            return null; // Quản trị viên nền tảng được xem toàn bộ
        }
        return user.getHousehold() != null ? user.getHousehold().getId() : null;
    }

    private ActivityLogResponse mapToResponse(ActivityLog logItem) {
        return ActivityLogResponse.builder()
                .id(logItem.getId())
                .sequenceNumber(logItem.getSequenceNumber())
                .householdId(logItem.getHousehold() != null ? logItem.getHousehold().getId() : null)
                .userId(logItem.getUser() != null ? logItem.getUser().getId() : null)
                .username(logItem.getUser() != null ? logItem.getUser().getUsername() : null)
                .fullName(logItem.getUser() != null ? logItem.getUser().getFullName() : null)
                .action(logItem.getAction())
                .targetTable(logItem.getTargetTable())
                .targetId(logItem.getTargetId())
                .oldValue(logItem.getOldValue())
                .newValue(logItem.getNewValue())
                .clientIp(logItem.getClientIp())
                .userAgent(logItem.getUserAgent())
                .previousHash(logItem.getPreviousHash())
                .hash(logItem.getHash())
                .createdAt(logItem.getCreatedAt())
                .build();
    }

    private String toJsonString(String val) {
        if (val == null) return null;
        String trimmed = val.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
            (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
            return trimmed;
        }
        return "\"" + trimmed.replace("\"", "\\\"") + "\"";
    }
}
