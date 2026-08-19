package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.BackupTriggerType;
import com.sales.constant.BackupType;
import com.sales.dto.request.UpdateBackupConfigRequest;
import com.sales.dto.response.BackupConfigResponse;
import com.sales.dto.response.BackupHistoryResponse;
import com.sales.dto.response.BackupStatusOverviewResponse;
import com.sales.entity.BackupConfig;
import com.sales.entity.BackupHistory;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BackupConfigRepository;
import com.sales.repository.BackupHistoryRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.AutoBackupServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AutoBackupServiceImplTest {

    @Mock
    private BackupConfigRepository backupConfigRepository;

    @Mock
    private BackupHistoryRepository backupHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AutoBackupServiceImpl autoBackupService;

    private BusinessHousehold household;
    private User ownerUser;
    private User staffUser;
    private Role ownerRole;
    private Role staffRole;
    private BackupConfig defaultConfig;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-test-1")
                .taxCode("0123456789")
                .name("Hộ Kinh Doanh Sao Lưu Test")
                .build();

        ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên").build();

        ownerUser = User.builder()
                .id("user-owner-1")
                .username("owner_test")
                .role(ownerRole)
                .household(household)
                .build();

        staffUser = User.builder()
                .id("user-staff-1")
                .username("staff_test")
                .role(staffRole)
                .household(household)
                .build();

        defaultConfig = BackupConfig.builder()
                .id("config-1")
                .household(household)
                .isAutoBackupEnabled(true)
                .scheduledTime("01:00")
                .retentionCount(7)
                .backupType(BackupType.FULL)
                .build();
    }

    @Test
    @DisplayName("TC-01: Chủ hộ lấy cấu hình sao lưu tự động thành công")
    void testGetBackupConfig_AsOwner_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(backupConfigRepository.findByHouseholdId("hh-test-1")).thenReturn(Optional.of(defaultConfig));

        BackupConfigResponse response = autoBackupService.getBackupConfig("owner_test");

        assertNotNull(response);
        assertEquals("01:00", response.getScheduledTime());
        assertEquals(7, response.getRetentionCount());
        assertTrue(response.getIsAutoBackupEnabled());
    }

    @Test
    @DisplayName("TC-03: Nhân viên bán hàng (VT-02) truy cập cấu hình sao lưu -> Throws 403 Forbidden")
    void testGetBackupConfig_AsStaff_ThrowsForbidden() {
        when(userRepository.findByUsername("staff_test")).thenReturn(Optional.of(staffUser));

        AppException ex = assertThrows(AppException.class, () -> autoBackupService.getBackupConfig("staff_test"));
        assertEquals(ErrorCode.ONLY_STORE_OWNER_CAN_BACKUP, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật cấu hình sao lưu thất bại do số lượng bản giữ lại không hợp lệ (< 1)")
    void testUpdateBackupConfig_InvalidRetentionCount_ThrowsBadRequest() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));

        UpdateBackupConfigRequest request = UpdateBackupConfigRequest.builder()
                .isAutoBackupEnabled(true)
                .scheduledTime("02:00")
                .retentionCount(0) // Giá trị không hợp lệ
                .backupType(BackupType.FULL)
                .build();

        AppException ex = assertThrows(AppException.class, () -> autoBackupService.updateBackupConfig("owner_test", request));
        assertEquals(ErrorCode.INVALID_RETENTION_COUNT, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-01: Chủ hộ kích hoạt sao lưu thủ công thành công")
    void testTriggerManualBackup_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(backupConfigRepository.findByHouseholdId("hh-test-1")).thenReturn(Optional.of(defaultConfig));
        when(backupHistoryRepository.findActiveSuccessfulBackupsOrderByTimeAsc("hh-test-1")).thenReturn(new ArrayList<>());
        when(backupHistoryRepository.save(any(BackupHistory.class))).thenAnswer(invocation -> {
            BackupHistory history = invocation.getArgument(0);
            history.setId("hist-1");
            return history;
        });

        BackupHistoryResponse response = autoBackupService.triggerManualBackup("owner_test");

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(BackupTriggerType.MANUAL, response.getTriggerType());
        assertTrue(response.getFileName().startsWith("backup_full_"));
        verify(backupHistoryRepository, times(1)).save(any(BackupHistory.class));
    }

    @Test
    @DisplayName("TC-02: Tự động dọn dẹp (PURGED) bản sao lưu cũ nhất khi vượt quá giới hạn retention_count")
    void testAutoBackup_RetentionLimit_PurgesOldest() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(backupConfigRepository.findByHouseholdId("hh-test-1")).thenReturn(Optional.of(defaultConfig)); // retentionCount = 7

        // Tạo 7 bản sao lưu thành công hiện có trong DB
        List<BackupHistory> activeList = new ArrayList<>();
        for (int i = 1; i <= 7; i++) {
            activeList.add(BackupHistory.builder()
                    .id("hist-old-" + i)
                    .household(household)
                    .fileName("backup_full_old_" + i + ".zip")
                    .status("SUCCESS")
                    .backupTime(LocalDateTime.now().minusDays(10 - i))
                    .build());
        }
        when(backupHistoryRepository.findActiveSuccessfulBackupsOrderByTimeAsc("hh-test-1")).thenReturn(activeList);
        when(backupHistoryRepository.save(any(BackupHistory.class))).thenAnswer(inv -> inv.getArgument(0));

        // Thực thi tạo bản mới
        autoBackupService.triggerManualBackup("owner_test");

        // Đảm bảo bản cũ nhất (hist-old-1) bị đổi status sang PURGED (TC-02)
        assertEquals("PURGED", activeList.get(0).getStatus());
        assertTrue(activeList.get(0).getNotes().contains("Tự động dọn dẹp"));
    }

    @Test
    @DisplayName("TC-01: Chạy sao lưu tự động hàng ngày cho Hộ kinh doanh theo lịch ngầm")
    void testRunDailyAutoBackupForHousehold_Success() {
        when(backupConfigRepository.findByHouseholdId("hh-test-1")).thenReturn(Optional.of(defaultConfig));
        when(backupHistoryRepository.findActiveSuccessfulBackupsOrderByTimeAsc("hh-test-1")).thenReturn(new ArrayList<>());
        when(backupHistoryRepository.save(any(BackupHistory.class))).thenAnswer(inv -> inv.getArgument(0));

        autoBackupService.runDailyAutoBackupForHousehold(household);

        verify(backupHistoryRepository, times(1)).save(any(BackupHistory.class));
    }
}
