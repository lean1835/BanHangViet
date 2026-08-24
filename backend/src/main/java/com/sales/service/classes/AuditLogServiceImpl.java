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
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
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
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApplicationReady() {
        repairLegacyHashChain();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized void repairLegacyHashChain() {
        try {
            List<ActivityLog> allLogs = activityLogRepository.findAll();
            if (allLogs.isEmpty()) {
                return;
            }

            Map<String, List<ActivityLog>> logsByHousehold = new HashMap<>();
            for (ActivityLog l : allLogs) {
                String hId = l.getHousehold() != null ? l.getHousehold().getId() : "__SYSTEM__";
                logsByHousehold.computeIfAbsent(hId, k -> new ArrayList<>()).add(l);
            }

            for (Map.Entry<String, List<ActivityLog>> entry : logsByHousehold.entrySet()) {
                List<ActivityLog> groupLogs = entry.getValue();
                groupLogs.sort((a, b) -> {
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                        int comp = a.getCreatedAt().compareTo(b.getCreatedAt());
                        if (comp != 0) return comp;
                    }
                    if (a.getSequenceNumber() != null && b.getSequenceNumber() != null) {
                        return a.getSequenceNumber().compareTo(b.getSequenceNumber());
                    }
                    if (a.getId() != null && b.getId() != null) {
                        return a.getId().compareTo(b.getId());
                    }
                    return 0;
                });

                // Kiểm tra xem nhóm này có mắt xích nào bị đứt gãy hoặc chưa chuẩn hóa không
                boolean groupNeedsRepair = false;
                long expectedSeq = 1;
                String testPrevHash = GENESIS_HASH;

                for (ActivityLog item : groupLogs) {
                    String hId = item.getHousehold() != null ? item.getHousehold().getId() : null;
                    String uId = item.getUser() != null ? item.getUser().getId() : null;
                    String formattedOldVal = toJsonString(item.getOldValue());
                    String formattedNewVal = toJsonString(item.getNewValue());
                    String computedHash = calculateHash(testPrevHash, hId, uId, item.getAction(), item.getTargetTable(), item.getTargetId(), formattedOldVal, formattedNewVal);

                    if (item.getSequenceNumber() == null || item.getSequenceNumber() != expectedSeq
                            || item.getPreviousHash() == null || !item.getPreviousHash().equalsIgnoreCase(testPrevHash)
                            || item.getHash() == null || !item.getHash().equalsIgnoreCase(computedHash)) {
                        groupNeedsRepair = true;
                        break;
                    }
                    testPrevHash = item.getHash();
                    expectedSeq++;
                }

                if (!groupNeedsRepair) {
                    continue;
                }

                log.info("Phát hiện chuỗi Hash Chain của household={} chưa đồng bộ hoặc bị đứt gãy. Tiến hành tái tạo toàn bộ chuỗi...", entry.getKey());

                long seq = 1;
                String prevHash = GENESIS_HASH;

                for (ActivityLog logItem : groupLogs) {
                    String hId = logItem.getHousehold() != null ? logItem.getHousehold().getId() : null;
                    String uId = logItem.getUser() != null ? logItem.getUser().getId() : null;

                    String formattedOldVal = toJsonString(logItem.getOldValue());
                    String formattedNewVal = toJsonString(logItem.getNewValue());

                    String hash = calculateHash(
                            prevHash,
                            hId,
                            uId,
                            logItem.getAction(),
                            logItem.getTargetTable(),
                            logItem.getTargetId(),
                            formattedOldVal,
                            formattedNewVal
                    );

                    logItem.setSequenceNumber(seq++);
                    logItem.setPreviousHash(prevHash);
                    logItem.setHash(hash);
                    logItem.setOldValue(formattedOldVal);
                    logItem.setNewValue(formattedNewVal);

                    prevHash = hash;
                }

                activityLogRepository.saveAllAndFlush(groupLogs);
                log.info("Đã chuẩn hóa và tái tạo thành công chuỗi Hash Chain cho {} bản ghi của household={}", groupLogs.size(), entry.getKey());
            }
        } catch (Exception e) {
            log.error("Lỗi khi chuẩn hóa chuỗi Hash Chain cho nhật ký cũ", e);
        }
    }

    @Override
    @Transactional
    public PageResponse<ActivityLogResponse> getAuditLogs(String currentUsername, ActivityLogFilterRequest filter, String clientIp, String userAgent) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        String householdId = getHouseholdIdForUser(currentUser);
        Pageable pageable = PageRequest.of(Math.max(0, filter.getPage()), Math.max(1, filter.getSize()));

        String usernameFilter = (filter.getUsername() != null && !filter.getUsername().isBlank()) ? filter.getUsername().trim() : null;
        String actionFilter = (filter.getAction() != null && !filter.getAction().isBlank()) ? filter.getAction().trim() : null;
        String targetTableFilter = (filter.getTargetTable() != null && !filter.getTargetTable().isBlank()) ? filter.getTargetTable().trim() : null;

        LocalDateTime startDateTime = filter.getStartDate();
        LocalDateTime endDateTime = filter.getEndDate();
        if (endDateTime != null && endDateTime.toLocalTime().equals(java.time.LocalTime.MIN)) {
            endDateTime = endDateTime.with(java.time.LocalTime.MAX);
        }

        Page<ActivityLog> logPage = activityLogRepository.findFilteredLogs(
                householdId,
                usernameFilter,
                actionFilter,
                targetTableFilter,
                startDateTime,
                endDateTime,
                pageable
        );

        boolean hasUnindexed = logPage.getContent().stream().anyMatch(l -> l.getSequenceNumber() == null || l.getHash() == null || l.getPreviousHash() == null);
        if (hasUnindexed) {
            repairLegacyHashChain();
            logPage = activityLogRepository.findFilteredLogs(
                    householdId,
                    usernameFilter,
                    actionFilter,
                    targetTableFilter,
                    startDateTime,
                    endDateTime,
                    pageable
            );
        }

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
    @Transactional
    public AuditIntegrityResponse verifyIntegrity(String currentUsername) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        String householdId = getHouseholdIdForUser(currentUser);

        if (householdId != null) {
            List<ActivityLog> logs = activityLogRepository.findAllByHouseholdIdOrderBySequenceNumberAsc(householdId);
            boolean hasUnindexed = logs.stream().anyMatch(l -> l.getSequenceNumber() == null || l.getHash() == null || l.getPreviousHash() == null);
            if (hasUnindexed) {
                repairLegacyHashChain();
                logs = activityLogRepository.findAllByHouseholdIdOrderBySequenceNumberAsc(householdId);
            }
            return verifyLogGroup(logs);
        } else {
            List<ActivityLog> allLogs = activityLogRepository.findAll();
            boolean hasUnindexed = allLogs.stream().anyMatch(l -> l.getSequenceNumber() == null || l.getHash() == null || l.getPreviousHash() == null);
            if (hasUnindexed) {
                repairLegacyHashChain();
                allLogs = activityLogRepository.findAll();
            }

            Map<String, List<ActivityLog>> logsByHousehold = new HashMap<>();
            for (ActivityLog l : allLogs) {
                String hId = l.getHousehold() != null ? l.getHousehold().getId() : "__SYSTEM__";
                logsByHousehold.computeIfAbsent(hId, k -> new ArrayList<>()).add(l);
            }

            long totalChecked = 0;
            for (List<ActivityLog> groupLogs : logsByHousehold.values()) {
                groupLogs.sort((a, b) -> {
                    if (a.getSequenceNumber() != null && b.getSequenceNumber() != null) {
                        return a.getSequenceNumber().compareTo(b.getSequenceNumber());
                    }
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                        return a.getCreatedAt().compareTo(b.getCreatedAt());
                    }
                    return 0;
                });
                AuditIntegrityResponse groupRes = verifyLogGroup(groupLogs);
                if (!groupRes.isValid()) {
                    return groupRes;
                }
                totalChecked += groupRes.getTotalRecordsChecked();
            }

            return AuditIntegrityResponse.builder()
                    .isValid(true)
                    .totalRecordsChecked(totalChecked)
                    .corruptedSequenceNumber(null)
                    .corruptedLogId(null)
                    .failureReason(null)
                    .verifiedAt(LocalDateTime.now())
                    .build();
        }
    }

    private AuditIntegrityResponse verifyLogGroup(List<ActivityLog> logs) {
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
    @Transactional
    public byte[] exportAuditLogsToExcel(String currentUsername, ActivityLogFilterRequest filter, String clientIp, String userAgent) {
        User currentUser = getUserByUsername(currentUsername);
        validateAccessRole(currentUser);

        String householdId = getHouseholdIdForUser(currentUser);
        Pageable pageable = PageRequest.of(0, 10000);

        String usernameFilter = (filter.getUsername() != null && !filter.getUsername().isBlank()) ? filter.getUsername().trim() : null;
        String actionFilter = (filter.getAction() != null && !filter.getAction().isBlank()) ? filter.getAction().trim() : null;
        String targetTableFilter = (filter.getTargetTable() != null && !filter.getTargetTable().isBlank()) ? filter.getTargetTable().trim() : null;
        LocalDateTime startDateTime = filter.getStartDate();
        LocalDateTime endDateTime = filter.getEndDate();
        if (endDateTime != null && endDateTime.toLocalTime().equals(java.time.LocalTime.MIN)) {
            endDateTime = endDateTime.with(java.time.LocalTime.MAX);
        }

        Page<ActivityLog> logPage = activityLogRepository.findFilteredLogs(
                householdId,
                usernameFilter,
                actionFilter,
                targetTableFilter,
                startDateTime,
                endDateTime,
                pageable
        );

        boolean hasUnindexed = logPage.getContent().stream().anyMatch(l -> l.getSequenceNumber() == null || l.getHash() == null || l.getPreviousHash() == null);
        if (hasUnindexed) {
            repairLegacyHashChain();
            logPage = activityLogRepository.findFilteredLogs(
                    householdId,
                    usernameFilter,
                    actionFilter,
                    targetTableFilter,
                    startDateTime,
                    endDateTime,
                    pageable
            );
        }

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
    public synchronized void recordLog(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent) {
        try {
            String householdId = household != null ? household.getId() : null;

            // 1. Lấy previous hash của bản ghi gần nhất và sequence number
            Optional<ActivityLog> latestLogOpt = householdId != null ?
                    activityLogRepository.findTopByHouseholdIdOrderBySequenceNumberDesc(householdId) :
                    activityLogRepository.findTopByOrderBySequenceNumberDesc();

            String previousHash = latestLogOpt.map(ActivityLog::getHash).orElse(GENESIS_HASH);
            long nextSequence = latestLogOpt.map(l -> (l.getSequenceNumber() != null ? l.getSequenceNumber() : 0L) + 1L).orElse(1L);

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
                    .sequenceNumber(nextSequence)
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
