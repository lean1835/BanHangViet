package com.sales.modules.backup.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.common.constant.BackupTriggerType;
import com.sales.common.constant.BackupType;
import com.sales.modules.backup.dto.request.TriggerVerificationRequest;
import com.sales.modules.audit.dto.response.AuditIntegrityResponse;
import com.sales.modules.backup.dto.response.BackupVerificationHistoryResponse;
import com.sales.modules.backup.dto.response.BackupVerificationStatusResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.audit.entity.AppNotification;
import com.sales.modules.backup.entity.BackupConfig;
import com.sales.modules.backup.entity.BackupHistory;
import com.sales.modules.backup.entity.BackupVerificationHistory;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.audit.repository.AppNotificationRepository;
import com.sales.modules.backup.repository.BackupConfigRepository;
import com.sales.modules.backup.repository.BackupHistoryRepository;
import com.sales.modules.backup.repository.BackupVerificationHistoryRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import com.sales.modules.audit.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BackupVerificationServiceImplTest {

    @Mock
    private BackupVerificationHistoryRepository verificationHistoryRepository;

    @Mock
    private BackupHistoryRepository backupHistoryRepository;

    @Mock
    private BackupConfigRepository backupConfigRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private AppNotificationRepository appNotificationRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private BackupVerificationServiceImpl verificationService;

    @TempDir
    Path tempDir;

    private BusinessHousehold household;
    private User ownerUser;
    private User staffUser;
    private BackupHistory validBackup;
    private Path validBackupFilePath;

    @BeforeEach
    void setUp() throws Exception {
        household = BusinessHousehold.builder()
                .id(UUID.randomUUID().toString())
                .name("Hộ Kinh Doanh Test")
                .taxCode("0123456789")
                .address("123 Lê Lợi, Q1")
                .phoneNumber("0901234567")
                .build();

        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build();
        Role staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();

        ownerUser = User.builder()
                .id(UUID.randomUUID().toString())
                .username("chuho_test")
                .fullName("Nguyễn Văn Chủ Hộ")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();

        staffUser = User.builder()
                .id(UUID.randomUUID().toString())
                .username("nhanvien_test")
                .fullName("Trần Văn Nhân Viên")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build();

        // Tạo tệp sao lưu snapshot JSON hợp lệ trên đĩa tạm
        Map<String, Object> snapshotData = new HashMap<>();
        snapshotData.put("householdId", household.getId());
        snapshotData.put("backupTime", LocalDateTime.now().toString());
        snapshotData.put("products", List.of(
                Map.of("id", "prod-1", "name", "Bia Tiger"),
                Map.of("id", "prod-2", "name", "Nước ngọt Coca")
        ));
        snapshotData.put("customers", List.of(
                Map.of("id", "cust-1", "name", "Khách hàng A")
        ));
        snapshotData.put("suppliers", List.of(
                Map.of("id", "sup-1", "name", "Nhà cung cấp bia")
        ));
        snapshotData.put("users", List.of(
                Map.of("id", "usr-1", "username", "nhanvien1")
        ));

        String jsonStr = objectMapper.writeValueAsString(snapshotData);
        validBackupFilePath = tempDir.resolve("backup_test.json");
        Files.writeString(validBackupFilePath, jsonStr, StandardCharsets.UTF_8);

        validBackup = BackupHistory.builder()
                .id(UUID.randomUUID().toString())
                .household(household)
                .createdByUser(ownerUser)
                .fileName("backup_test.zip")
                .filePath(validBackupFilePath.toString())
                .fileSize(Files.size(validBackupFilePath))
                .backupType(BackupType.FULL)
                .triggerType(BackupTriggerType.AUTOMATIC)
                .status("SUCCESS")
                .backupTime(LocalDateTime.now().minusHours(2))
                .build();

        verificationService.setBackupBaseDir(tempDir.toString());
    }

    @Test
    @DisplayName("TC-01: Thử phục hồi tự động thành công (Luồng chuẩn, cả 3 Pillars đều PASSED)")
    void testVerification_Success_TC01() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(auditLogService.verifyIntegrityForHousehold(household.getId()))
                .thenReturn(AuditIntegrityResponse.builder().isValid(true).totalRecordsChecked(100L).build());

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> {
                    BackupVerificationHistory saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID().toString());
                    return saved;
                });

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("PASSED", response.getStatus());
        assertTrue(response.getCheckedFileReadable());
        assertTrue(response.getCheckedRecordCountsMatched());
        assertTrue(response.getCheckedAuditChainIntact());
        assertEquals(2, response.getProductCount());
        assertEquals(1, response.getCustomerCount());
        assertEquals(1, response.getSupplierCount());
        assertEquals(1, response.getUserCount());
        assertEquals(100, response.getAuditLogCount());
        assertNull(response.getFailureReason());
        assertTrue(response.getExecutionDurationMs() >= 0);

        // Không gửi cảnh báo DANGER khi thành công
        verify(appNotificationRepository, never()).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("TC-02: Thử phục hồi thủ công (Manual Trigger) theo ID bản sao lưu cụ thể")
    void testVerification_ManualTriggerWithId_Success_TC02() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findByIdAndHouseholdId(validBackup.getId(), household.getId()))
                .thenReturn(Optional.of(validBackup));

        when(auditLogService.verifyIntegrityForHousehold(household.getId()))
                .thenReturn(AuditIntegrityResponse.builder().isValid(true).totalRecordsChecked(50L).build());

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> {
                    BackupVerificationHistory saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID().toString());
                    return saved;
                });

        TriggerVerificationRequest req = TriggerVerificationRequest.builder()
                .backupHistoryId(validBackup.getId())
                .notes("Chủ hộ tự kiểm tra")
                .build();

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", req);

        assertNotNull(response);
        assertEquals("PASSED", response.getStatus());
        assertEquals("MANUAL", response.getTriggerType());
        assertEquals("Chủ hộ tự kiểm tra", response.getNotes());
    }

    @Test
    @DisplayName("TC-03: Thử phục hồi thất bại do tệp sao lưu không tồn tại trên đĩa")
    void testVerification_FileNotFound_TC03() {
        validBackup.setFilePath("/invalid/path/nonexistent.json");

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> {
                    BackupVerificationHistory saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID().toString());
                    return saved;
                });

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertFalse(response.getCheckedFileReadable());
        assertNotNull(response.getFailureReason());
        assertTrue(response.getFailureReason().contains("Không tìm thấy tệp"));

        // Phải gửi thông báo khẩn cấp DANGER cho chủ hộ
        ArgumentCaptor<AppNotification> notifCaptor = ArgumentCaptor.forClass(AppNotification.class);
        verify(appNotificationRepository, times(1)).save(notifCaptor.capture());
        assertEquals("DANGER", notifCaptor.getValue().getSeverity());
        assertEquals("BACKUP_VERIFICATION_FAILED", notifCaptor.getValue().getNotificationType());
        assertEquals("/settings/backup-export", notifCaptor.getValue().getActionUrl());
    }

    @Test
    @DisplayName("TC-04: Thử phục hồi thất bại do tệp sao lưu rỗng (0 bytes)")
    void testVerification_EmptyFile_TC04() throws Exception {
        Path emptyFilePath = tempDir.resolve("empty_backup.json");
        Files.createFile(emptyFilePath);
        validBackup.setFilePath(emptyFilePath.toString());

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> {
                    BackupVerificationHistory saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID().toString());
                    return saved;
                });

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertFalse(response.getCheckedFileReadable());
        assertTrue(response.getFailureReason().contains("0 bytes"));

        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("TC-05: Thử phục hồi thất bại do tệp JSON bị lỗi cú pháp")
    void testVerification_CorruptedJson_TC05() throws Exception {
        Path corruptFilePath = tempDir.resolve("corrupt_backup.json");
        Files.writeString(corruptFilePath, "{\"householdId\": \"abc\", broken-json", StandardCharsets.UTF_8);
        validBackup.setFilePath(corruptFilePath.toString());

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> {
                    BackupVerificationHistory saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID().toString());
                    return saved;
                });

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertFalse(response.getCheckedFileReadable());
        assertTrue(response.getFailureReason().contains("lỗi cấu trúc hoặc định dạng"));

        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("TC-05b: Thử phục hồi thất bại do tệp sao lưu thiếu toàn bộ các bảng thực thể chính (Pillar 2)")
    void testVerification_MissingMainEntities_Failed_TC05b() throws Exception {
        Map<String, Object> emptyStructureData = new HashMap<>();
        emptyStructureData.put("householdId", household.getId());
        emptyStructureData.put("backupTime", LocalDateTime.now().toString());

        Path emptyStructureFile = tempDir.resolve("backup_empty_structure.json");
        Files.writeString(emptyStructureFile, objectMapper.writeValueAsString(emptyStructureData), StandardCharsets.UTF_8);

        BackupHistory emptyBackup = BackupHistory.builder()
                .id("b-empty-structure")
                .household(household)
                .fileName("backup_empty_structure.json")
                .filePath(emptyStructureFile.toString())
                .status("SUCCESS")
                .fileSize(Files.size(emptyStructureFile))
                .backupTime(LocalDateTime.now())
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(emptyBackup));

        when(auditLogService.verifyIntegrityForHousehold(household.getId()))
                .thenReturn(AuditIntegrityResponse.builder().isValid(true).totalRecordsChecked(10L).build());

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> {
                    BackupVerificationHistory saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID().toString());
                    return saved;
                });

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertTrue(response.getCheckedFileReadable());
        assertFalse(response.getCheckedRecordCountsMatched());
        assertNotNull(response.getFailureReason());
        assertTrue(response.getFailureReason().contains("thiếu hoặc không đúng định dạng các bảng thực thể bắt buộc"));

        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("TC-06: Thử phục hồi thất bại do chuỗi nhật ký kiểm toán bị đứt gãy (QTN-25)")
    void testVerification_AuditChainBroken_TC06() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        // Giả lập chuỗi kiểm toán bị đứt gãy tại sequence 12
        when(auditLogService.verifyIntegrityForHousehold(household.getId()))
                .thenReturn(AuditIntegrityResponse.builder()
                        .isValid(false)
                        .corruptedSequenceNumber(12L)
                        .failureReason("Mã băm không khớp (Dữ liệu bị sửa đổi)")
                        .totalRecordsChecked(15L)
                        .build());

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> {
                    BackupVerificationHistory saved = invocation.getArgument(0);
                    saved.setId(UUID.randomUUID().toString());
                    return saved;
                });

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertTrue(response.getCheckedFileReadable());
        assertTrue(response.getCheckedRecordCountsMatched());
        assertFalse(response.getCheckedAuditChainIntact());
        assertTrue(response.getFailureReason().contains("đứt gãy tại sequence #12"));

        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("TC-07: Cảnh báo quá hạn kiểm chứng khi quá 7 ngày chưa thử thành công (TC-03)")
    void testVerificationStatus_OverdueWarning_TC07() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));

        BackupVerificationHistory oldSuccess = BackupVerificationHistory.builder()
                .id("old-success-id")
                .household(household)
                .backupFileName("old_backup.zip")
                .status("PASSED")
                .verifiedAt(LocalDateTime.now().minusDays(10))
                .build();

        when(verificationHistoryRepository.findFirstByHouseholdIdOrderByVerifiedAtDesc(household.getId()))
                .thenReturn(Optional.of(oldSuccess));
        when(verificationHistoryRepository.findFirstByHouseholdIdAndStatusOrderByVerifiedAtDesc(household.getId(), "PASSED"))
                .thenReturn(Optional.of(oldSuccess));
        when(verificationHistoryRepository.countByHouseholdId(household.getId())).thenReturn(5L);
        when(verificationHistoryRepository.countByHouseholdIdAndStatus(household.getId(), "PASSED")).thenReturn(5L);
        when(verificationHistoryRepository.countByHouseholdIdAndStatus(household.getId(), "FAILED")).thenReturn(0L);

        BackupVerificationStatusResponse status = verificationService.getVerificationStatus("chuho_test");

        assertNotNull(status);
        assertTrue(status.getIsOverdue());
        assertEquals("WARNING", status.getOverallHealthStatus());
        assertEquals(10L, status.getDaysSinceLastSuccess());
        assertFalse(status.getHasFailedRecent());
        assertTrue(status.getWarningMessage().contains("Đã quá 10 ngày"));
    }

    @Test
    @DisplayName("TC-08: Cảnh báo khi chưa từng có lần kiểm chứng nào (TC-03)")
    void testVerificationStatus_NeverVerified_TC08() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(verificationHistoryRepository.findFirstByHouseholdIdOrderByVerifiedAtDesc(household.getId()))
                .thenReturn(Optional.empty());
        when(verificationHistoryRepository.findFirstByHouseholdIdAndStatusOrderByVerifiedAtDesc(household.getId(), "PASSED"))
                .thenReturn(Optional.empty());

        BackupVerificationStatusResponse status = verificationService.getVerificationStatus("chuho_test");

        assertNotNull(status);
        assertTrue(status.getIsOverdue());
        assertEquals("WARNING", status.getOverallHealthStatus());
        assertNull(status.getDaysSinceLastSuccess());
        assertTrue(status.getWarningMessage().contains("chưa từng được chạy thử phục hồi"));
    }

    @Test
    @DisplayName("TC-09: Cảnh báo DANGER khi lần thử phục hồi gần nhất bị FAILED")
    void testVerificationStatus_RecentFailed_TC09() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));

        BackupVerificationHistory failedVer = BackupVerificationHistory.builder()
                .id("failed-id")
                .household(household)
                .backupFileName("corrupt_backup.zip")
                .status("FAILED")
                .failureReason("Tệp bị hỏng")
                .verifiedAt(LocalDateTime.now().minusHours(1))
                .build();

        BackupVerificationHistory oldPassed = BackupVerificationHistory.builder()
                .id("passed-id")
                .household(household)
                .backupFileName("old_good.zip")
                .status("PASSED")
                .verifiedAt(LocalDateTime.now().minusDays(2))
                .build();

        when(verificationHistoryRepository.findFirstByHouseholdIdOrderByVerifiedAtDesc(household.getId()))
                .thenReturn(Optional.of(failedVer));
        when(verificationHistoryRepository.findFirstByHouseholdIdAndStatusOrderByVerifiedAtDesc(household.getId(), "PASSED"))
                .thenReturn(Optional.of(oldPassed));

        BackupVerificationStatusResponse status = verificationService.getVerificationStatus("chuho_test");

        assertNotNull(status);
        assertTrue(status.getHasFailedRecent());
        assertEquals("DANGER", status.getOverallHealthStatus());
        assertTrue(status.getWarningMessage().contains("CẢNH BÁO NGUY HIỂM"));
        assertTrue(status.getWarningMessage().contains("Tệp bị hỏng"));
    }

    @Test
    @DisplayName("TC-10: Chặn kích hoạt khi không có bản sao lưu nào để thử")
    void testVerification_NoBackupAvailable_TC10() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                verificationService.triggerVerification("chuho_test", null));

        assertEquals(ErrorCode.NO_BACKUP_AVAILABLE_FOR_VERIFICATION, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-11: Chặn nhân viên bán hàng (VT-02) kích hoạt hoặc xem tình trạng sao lưu")
    void testVerification_ForbiddenForStaff_TC11() {
        when(userRepository.findByUsername("nhanvien_test")).thenReturn(Optional.of(staffUser));

        AppException ex = assertThrows(AppException.class, () ->
                verificationService.triggerVerification("nhanvien_test", null));

        assertEquals(ErrorCode.ONLY_STORE_OWNER_CAN_VERIFY_BACKUP, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-14: Lấy danh sách lịch sử thử phục hồi phân trang thành công")
    void testVerification_HistoriesPagination_TC14() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));

        BackupVerificationHistory bvh = BackupVerificationHistory.builder()
                .id(UUID.randomUUID().toString())
                .household(household)
                .backupFileName("backup_full.zip")
                .status("PASSED")
                .verifiedAt(LocalDateTime.now())
                .build();

        Page<BackupVerificationHistory> page = new PageImpl<>(List.of(bvh));
        when(verificationHistoryRepository.findByHouseholdIdOrderByVerifiedAtDesc(eq(household.getId()), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<BackupVerificationHistoryResponse> response =
                verificationService.getVerificationHistories("chuho_test", 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("PASSED", response.getContent().get(0).getStatus());
        assertEquals(1, response.getTotalElements());
    }

    @Test
    @DisplayName("Tiến trình Cron quét định kỳ tự động chạy cho hộ kinh doanh có bật sao lưu")
    void testScheduledPeriodicVerification_Success() {
        BackupConfig config = BackupConfig.builder()
                .id("config-1")
                .household(household)
                .isAutoBackupEnabled(true)
                .build();

        when(backupConfigRepository.findAllEnabledAutoBackupConfigs(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(config)));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(verificationHistoryRepository.findFirstByHouseholdIdOrderByVerifiedAtDesc(household.getId()))
                .thenReturn(Optional.empty());

        when(auditLogService.verifyIntegrityForHousehold(household.getId()))
                .thenReturn(AuditIntegrityResponse.builder().isValid(true).totalRecordsChecked(50L).build());

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> verificationService.runScheduledPeriodicVerification());

        verify(verificationHistoryRepository, times(1)).save(any(BackupVerificationHistory.class));
    }

    @Test
    @DisplayName("Thử phục hồi thất bại khi householdId trong tệp snapshot không khớp với hộ hiện tại")
    void testVerification_TenantMismatch_Fails() throws Exception {
        Map<String, Object> foreignSnapshot = Map.of(
                "householdId", "other-household-uuid",
                "products", List.of(Map.of("id", "p1"))
        );
        Path foreignFilePath = tempDir.resolve("foreign_backup.json");
        Files.writeString(foreignFilePath, objectMapper.writeValueAsString(foreignSnapshot), StandardCharsets.UTF_8);
        validBackup.setFilePath(foreignFilePath.toString());

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertTrue(response.getFailureReason().contains("không khớp với định danh hộ kinh doanh"));
        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("Thử phục hồi thất bại khi tệp snapshot thiếu trường householdId (Multi-tenancy SEC-01)")
    void testVerification_MissingHouseholdId_Fails() throws Exception {
        Map<String, Object> missingHouseholdSnapshot = Map.of(
                "products", List.of(Map.of("id", "p1"))
        );
        Path missingHouseholdFilePath = tempDir.resolve("missing_household_backup.json");
        Files.writeString(missingHouseholdFilePath, objectMapper.writeValueAsString(missingHouseholdSnapshot), StandardCharsets.UTF_8);
        validBackup.setFilePath(missingHouseholdFilePath.toString());

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertTrue(response.getFailureReason().contains("không có hoặc không khớp với định danh hộ kinh doanh"));
        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("Thử phục hồi thất bại khi tệp sao lưu chỉ có một thực thể rỗng như users mà thiếu các bảng khác (Pillar 2 fix)")
    void testVerification_PartialEntities_OnlyUsers_Failed() throws Exception {
        Map<String, Object> partialSnapshot = Map.of(
                "householdId", household.getId(),
                "users", List.of()
                // thiếu products, customers, suppliers
        );
        Path partialFilePath = tempDir.resolve("partial_backup.json");
        Files.writeString(partialFilePath, objectMapper.writeValueAsString(partialSnapshot), StandardCharsets.UTF_8);
        validBackup.setFilePath(partialFilePath.toString());

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(auditLogService.verifyIntegrityForHousehold(household.getId()))
                .thenReturn(AuditIntegrityResponse.builder().isValid(true).totalRecordsChecked(10L).build());

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertFalse(response.getCheckedRecordCountsMatched());
        assertTrue(response.getFailureReason().contains("thiếu hoặc không đúng định dạng các bảng thực thể bắt buộc"));
        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("Thử phục hồi thất bại khi đường dẫn tệp sao lưu vi phạm Path Traversal")
    void testVerification_PathTraversal_Fails() {
        validBackup.setFilePath("../../etc/passwd");

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findFirstByHouseholdIdAndStatusOrderByBackupTimeDesc(household.getId(), "SUCCESS"))
                .thenReturn(Optional.of(validBackup));

        when(verificationHistoryRepository.save(any(BackupVerificationHistory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BackupVerificationHistoryResponse response = verificationService.triggerVerification("chuho_test", null);

        assertNotNull(response);
        assertEquals("FAILED", response.getStatus());
        assertFalse(response.getCheckedFileReadable());
        assertTrue(response.getFailureReason().contains("Không tìm thấy tệp bản sao lưu"));
        verify(appNotificationRepository, times(1)).save(any(AppNotification.class));
    }
}
