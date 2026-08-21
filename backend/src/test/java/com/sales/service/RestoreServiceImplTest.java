package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.BackupTriggerType;
import com.sales.constant.BackupType;
import com.sales.dto.request.RestoreDataRequest;
import com.sales.dto.response.BackupHistoryResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.RestoreHistoryResponse;
import com.sales.dto.response.RestorePreviewResponse;
import com.sales.dto.response.RestoreResultResponse;
import com.sales.entity.BackupHistory;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.RestoreHistory;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BackupHistoryRepository;
import com.sales.repository.RestoreHistoryRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.RestoreServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RestoreServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BackupHistoryRepository backupHistoryRepository;

    @Mock
    private RestoreHistoryRepository restoreHistoryRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private RestoreServiceImpl restoreService;

    private BusinessHousehold household;
    private User ownerUser;
    private User staffUser;
    private BackupHistory validBackup;
    private BackupHistory purgedBackup;
    private BackupHistory corruptedBackup;

    @BeforeEach
    void setUp() {
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

        validBackup = BackupHistory.builder()
                .id(UUID.randomUUID().toString())
                .household(household)
                .createdByUser(ownerUser)
                .fileName("backup_full_0123456789_20260915_093100.zip")
                .filePath("/backups/test.zip")
                .fileSize(1024L * 500L)
                .backupType(BackupType.FULL)
                .triggerType(BackupTriggerType.AUTOMATIC)
                .status("SUCCESS")
                .backupTime(LocalDateTime.now().minusDays(1))
                .build();

        purgedBackup = BackupHistory.builder()
                .id(UUID.randomUUID().toString())
                .household(household)
                .createdByUser(ownerUser)
                .fileName("backup_full_0123456789_20260901_000000.zip")
                .fileSize(1024L * 500L)
                .backupType(BackupType.FULL)
                .triggerType(BackupTriggerType.AUTOMATIC)
                .status("PURGED")
                .backupTime(LocalDateTime.now().minusMonths(1))
                .build();

        corruptedBackup = BackupHistory.builder()
                .id(UUID.randomUUID().toString())
                .household(household)
                .createdByUser(ownerUser)
                .fileName("")
                .fileSize(0L)
                .backupType(BackupType.FULL)
                .triggerType(BackupTriggerType.AUTOMATIC)
                .status("SUCCESS")
                .backupTime(LocalDateTime.now().minusDays(2))
                .build();
    }

    @Test
    @DisplayName("TC-01: Lấy danh sách bản sao lưu khả dụng để phục hồi thành công")
    void testGetAvailableBackupsForRestore_Success() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findActiveSuccessfulBackupsOrderByTimeAsc(household.getId()))
                .thenReturn(List.of(validBackup));

        List<BackupHistoryResponse> result = restoreService.getAvailableBackupsForRestore("chuho_test");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(validBackup.getFileName(), result.get(0).getFileName());
        assertEquals("SUCCESS", result.get(0).getStatus());
    }

    @Test
    @DisplayName("TC-01: Xem trước thông tin bản sao lưu (Preview) thành công")
    void testPreviewBackupForRestore_Success() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findByIdAndHouseholdId(validBackup.getId(), household.getId()))
                .thenReturn(Optional.of(validBackup));

        RestorePreviewResponse preview = restoreService.previewBackupForRestore("chuho_test", validBackup.getId());

        assertNotNull(preview);
        assertEquals(validBackup.getId(), preview.getBackupHistoryId());
        assertEquals(validBackup.getFileName(), preview.getFileName());
        assertTrue(preview.getIsEligibleForRestore());
        assertNotNull(preview.getSummaryDescription());
        assertNotNull(preview.getWarningMessage());
    }

    @Test
    @DisplayName("TC-02: Xem trước bản sao lưu không tồn tại -> Ném BACKUP_FILE_NOT_FOUND")
    void testPreviewBackupForRestore_NotFound() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findByIdAndHouseholdId("invalid-id", household.getId()))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                restoreService.previewBackupForRestore("chuho_test", "invalid-id"));

        assertEquals(ErrorCode.BACKUP_FILE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-01 & TC-04: Phục hồi dữ liệu thành công, lưu restore_histories và ghi nhật ký kiểm toán Hash Chain")
    void testExecuteRestore_Success_TC01_TC04() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findByIdAndHouseholdId(validBackup.getId(), household.getId()))
                .thenReturn(Optional.of(validBackup));

        RestoreHistory savedHistory = RestoreHistory.builder()
                .id(UUID.randomUUID().toString())
                .household(household)
                .backupHistory(validBackup)
                .restoredByUser(ownerUser)
                .backupFileName(validBackup.getFileName())
                .backupType(BackupType.FULL)
                .status("SUCCESS")
                .restoredAt(LocalDateTime.now())
                .build();

        when(restoreHistoryRepository.save(any(RestoreHistory.class))).thenReturn(savedHistory);

        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(validBackup.getId())
                .confirm(true)
                .notes("Phục hồi sự cố ngày 15/09")
                .build();

        RestoreResultResponse response = restoreService.executeRestore("chuho_test", request, "127.0.0.1", "JUnit-Test");

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(validBackup.getFileName(), response.getBackupFileName());

        // Kiểm tra TC-04: Ghi nhận nhật ký kiểm toán
        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(ownerUser), eq("RESTORE_EXECUTE"), eq("restore_histories"),
                eq(savedHistory.getId()), isNull(), anyString(), eq("127.0.0.1"), eq("JUnit-Test")
        );
    }

    @Test
    @DisplayName("TC-02: Phục hồi bản sao lưu trạng thái PURGED -> Ném BACKUP_NOT_ELIGIBLE_FOR_RESTORE")
    void testExecuteRestore_PurgedBackup_ThrowsException_TC02() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findByIdAndHouseholdId(purgedBackup.getId(), household.getId()))
                .thenReturn(Optional.of(purgedBackup));

        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(purgedBackup.getId())
                .confirm(true)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                restoreService.executeRestore("chuho_test", request, "127.0.0.1", "JUnit-Test"));

        assertEquals(ErrorCode.BACKUP_NOT_ELIGIBLE_FOR_RESTORE, ex.getErrorCode());
        verify(restoreHistoryRepository, never()).save(any());
        verify(activityLogHelper, never()).logActivityInNewTransaction(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("TC-02: Phục hồi bản sao lưu bị hỏng (corrupted) -> Ném BACKUP_CORRUPTED_OR_INVALID")
    void testExecuteRestore_CorruptedBackup_ThrowsException_TC02() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(backupHistoryRepository.findByIdAndHouseholdId(corruptedBackup.getId(), household.getId()))
                .thenReturn(Optional.of(corruptedBackup));

        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(corruptedBackup.getId())
                .confirm(true)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                restoreService.executeRestore("chuho_test", request, "127.0.0.1", "JUnit-Test"));

        assertEquals(ErrorCode.BACKUP_CORRUPTED_OR_INVALID, ex.getErrorCode());
        verify(restoreHistoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-03: Nhân viên bán hàng (VT-02) cố thực hiện phục hồi -> Ném RESTORE_NOT_ALLOWED")
    void testExecuteRestore_StaffRole_ThrowsForbidden_TC03() {
        when(userRepository.findByUsername("nhanvien_test")).thenReturn(Optional.of(staffUser));

        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(validBackup.getId())
                .confirm(true)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                restoreService.executeRestore("nhanvien_test", request, "127.0.0.1", "JUnit-Test"));

        assertEquals(ErrorCode.RESTORE_NOT_ALLOWED, ex.getErrorCode());
        verify(restoreHistoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lấy danh sách lịch sử phục hồi (Restore Histories) phân trang thành công")
    void testGetRestoreHistories_Success() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));

        RestoreHistory history = RestoreHistory.builder()
                .id(UUID.randomUUID().toString())
                .household(household)
                .backupHistory(validBackup)
                .restoredByUser(ownerUser)
                .backupFileName(validBackup.getFileName())
                .backupType(BackupType.FULL)
                .status("SUCCESS")
                .restoredAt(LocalDateTime.now())
                .build();

        Page<RestoreHistory> page = new PageImpl<>(List.of(history));
        when(restoreHistoryRepository.findByHouseholdIdOrderByRestoredAtDesc(eq(household.getId()), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<RestoreHistoryResponse> response = restoreService.getRestoreHistories("chuho_test", 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("SUCCESS", response.getContent().get(0).getStatus());
        assertEquals(validBackup.getFileName(), response.getContent().get(0).getBackupFileName());
    }
}
