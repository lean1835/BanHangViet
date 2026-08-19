package com.sales.service;

import com.sales.dto.request.ActivityLogFilterRequest;
import com.sales.dto.response.ActivityLogResponse;
import com.sales.dto.response.AuditIntegrityResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.ActivityLog;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ActivityLogRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.AuditLogServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceImplTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuditLogServiceImpl auditLogService;

    private User storeOwner;
    private User staffUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build();
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();

        household = BusinessHousehold.builder().id("hh-001").name("Hộ kinh doanh Việt").taxCode("1234567890").build();

        storeOwner = User.builder()
                .id("u-owner")
                .username("owner1")
                .fullName("Chủ Hộ Kinh Doanh")
                .role(ownerRole)
                .household(household)
                .build();

        staffUser = User.builder()
                .id("u-staff")
                .username("staff1")
                .fullName("Nhân Viên")
                .role(staffRole)
                .household(household)
                .build();
    }

    @Test
    @DisplayName("NCL-14-CN-001-TC-01: Ghi nhận nhật ký thành công tạo Hash Chain chuẩn SHA-256")
    void testRecordLog_Success_CreatesHashChain() {
        when(activityLogRepository.findTopByHouseholdIdOrderBySequenceNumberDesc("hh-001"))
                .thenReturn(Optional.empty());

        auditLogService.recordLog(household, storeOwner, "CANCEL_INVOICE", "e_invoices", "inv-001",
                "{\"status\":\"ISSUED\"}", "{\"status\":\"CANCELED\"}", "127.0.0.1", "Mozilla/5.0");

        ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository, times(1)).saveAndFlush(captor.capture());

        ActivityLog savedLog = captor.getValue();
        assertNotNull(savedLog);
        assertEquals("0000000000000000000000000000000000000000000000000000000000000000", savedLog.getPreviousHash());
        assertNotNull(savedLog.getHash());
        assertEquals(64, savedLog.getHash().length());
        assertEquals("CANCEL_INVOICE", savedLog.getAction());
    }

    @Test
    @DisplayName("NCL-14-CN-001-TC-03: Kiểm tra tính toàn vẹn Hash Chain - Dữ liệu sạch trả về isValid = true")
    void testVerifyIntegrity_CleanData_ReturnsValid() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(storeOwner));

        String prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
        String hash1 = AuditLogServiceImpl.calculateHash(prevHash, "hh-001", "u-owner", "CREATE_ORDER", "orders", "ord-1", "\"val1\"", "\"val2\"");

        ActivityLog log1 = ActivityLog.builder()
                .id("log-1")
                .sequenceNumber(1L)
                .household(household)
                .user(storeOwner)
                .action("CREATE_ORDER")
                .targetTable("orders")
                .targetId("ord-1")
                .oldValue("\"val1\"")
                .newValue("\"val2\"")
                .previousHash(prevHash)
                .hash(hash1)
                .createdAt(LocalDateTime.now())
                .build();

        String hash2 = AuditLogServiceImpl.calculateHash(hash1, "hh-001", "u-owner", "CANCEL_INVOICE", "e_invoices", "inv-1", "\"val3\"", "\"val4\"");
        ActivityLog log2 = ActivityLog.builder()
                .id("log-2")
                .sequenceNumber(2L)
                .household(household)
                .user(storeOwner)
                .action("CANCEL_INVOICE")
                .targetTable("e_invoices")
                .targetId("inv-1")
                .oldValue("\"val3\"")
                .newValue("\"val4\"")
                .previousHash(hash1)
                .hash(hash2)
                .createdAt(LocalDateTime.now())
                .build();

        when(activityLogRepository.findAllByHouseholdIdOrderBySequenceNumberAsc("hh-001"))
                .thenReturn(List.of(log1, log2));

        AuditIntegrityResponse response = auditLogService.verifyIntegrity("owner1");

        assertTrue(response.isValid());
        assertEquals(2, response.getTotalRecordsChecked());
        assertNull(response.getCorruptedSequenceNumber());
    }

    @Test
    @DisplayName("NCL-14-CN-001-TC-03: Kiểm tra tính toàn vẹn Hash Chain - Dữ liệu bị can thiệp phát hiện đứt gãy đúng vị trí")
    void testVerifyIntegrity_TamperedData_DetectsCorruptedRecord() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(storeOwner));

        String prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
        String hash1 = AuditLogServiceImpl.calculateHash(prevHash, "hh-001", "u-owner", "CREATE_ORDER", "orders", "ord-1", "\"val1\"", "\"val2\"");

        ActivityLog log1 = ActivityLog.builder()
                .id("log-1")
                .sequenceNumber(1L)
                .household(household)
                .user(storeOwner)
                .action("CREATE_ORDER")
                .targetTable("orders")
                .targetId("ord-1")
                .oldValue("\"val1\"")
                .newValue("\"val2\"")
                .previousHash(prevHash)
                .hash(hash1)
                .createdAt(LocalDateTime.now())
                .build();

        // Bản ghi 2 bị ai đó sửa dữ liệu newValue thành TAMPERED_VALUE nhưng giữ nguyên hash
        String realHash2 = AuditLogServiceImpl.calculateHash(hash1, "hh-001", "u-owner", "CANCEL_INVOICE", "e_invoices", "inv-1", "\"val3\"", "\"val4\"");
        ActivityLog tamperedLog2 = ActivityLog.builder()
                .id("log-2")
                .sequenceNumber(2L)
                .household(household)
                .user(storeOwner)
                .action("CANCEL_INVOICE")
                .targetTable("e_invoices")
                .targetId("inv-1")
                .oldValue("\"val3\"")
                .newValue("\"TAMPERED_VALUE\"") // TAMPERED!
                .previousHash(hash1)
                .hash(realHash2)
                .createdAt(LocalDateTime.now())
                .build();

        when(activityLogRepository.findAllByHouseholdIdOrderBySequenceNumberAsc("hh-001"))
                .thenReturn(List.of(log1, tamperedLog2));

        AuditIntegrityResponse response = auditLogService.verifyIntegrity("owner1");

        assertFalse(response.isValid());
        assertEquals(2, response.getTotalRecordsChecked());
        assertEquals(2L, response.getCorruptedSequenceNumber());
        assertEquals("log-2", response.getCorruptedLogId());
        assertNotNull(response.getFailureReason());
    }

    @Test
    @DisplayName("NCL-14-CN-001-TC-04: Tra cứu nhật ký tự động ghi vết hành vi tra cứu (Self-Auditing)")
    void testGetAuditLogs_TriggersSelfAuditLog() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(storeOwner));
        when(activityLogRepository.findFilteredLogs(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(new ArrayList<>()));

        ActivityLogFilterRequest filter = ActivityLogFilterRequest.builder().page(0).size(10).build();
        PageResponse<ActivityLogResponse> response = auditLogService.getAuditLogs("owner1", filter, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        // Verify self auditing record was triggered
        verify(activityLogRepository, atLeastOnce()).saveAndFlush(any(ActivityLog.class));
    }

    @Test
    @DisplayName("NCL-14-CN-001-TC-02: Vai trò không đủ quyền (Staff) bị từ chối truy cập nhật ký kiểm toán")
    void testGetAuditLogs_ForbiddenRole_ThrowsException() {
        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staffUser));

        ActivityLogFilterRequest filter = ActivityLogFilterRequest.builder().build();

        AppException ex = assertThrows(AppException.class, () ->
                auditLogService.getAuditLogs("staff1", filter, "127.0.0.1", "Mozilla/5.0"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }
}
