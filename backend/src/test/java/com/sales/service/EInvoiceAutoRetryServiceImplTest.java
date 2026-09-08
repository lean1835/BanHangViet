package com.sales.service;

import com.sales.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.BusinessHouseholdSettings;
import com.sales.entity.EInvoice;
import com.sales.entity.InvoiceStatusLog;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceStatusLogRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.EInvoiceAutoRetryServiceImpl;
import com.sales.service.interfaces.EInvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EInvoiceAutoRetryServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private InvoiceStatusLogRepository invoiceStatusLogRepository;

    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;

    @Mock
    private EInvoiceService eInvoiceService;

    @Mock
    private TransactionTemplate transactionTemplate;

    @InjectMocks
    private EInvoiceAutoRetryServiceImpl autoRetryService;

    private BusinessHousehold household;
    private BusinessHouseholdSettings settings;
    private EInvoice waitingInvoice;
    private User testUser;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-100")
                .name("Hộ Kinh Doanh Mẫu")
                .build();

        settings = BusinessHouseholdSettings.builder()
                .id("set-100")
                .household(household)
                .autoRetryEnabled(true)
                .maxRetryAttempts(3)
                .retryIntervalMinutes(15)
                .maxRetryHoursDeadline(24)
                .build();

        Role role = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        testUser = User.builder()
                .id("user-100")
                .username("chuho_test")
                .household(household)
                .role(role)
                .build();

        waitingInvoice = EInvoice.builder()
                .id("inv-100")
                .household(household)
                .status("SEND_ERROR")
                .retryCount(0)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        // TransactionTemplate mock pass-through
        lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> action = invocation.getArgument(0);
            return action.doInTransaction(mock(TransactionStatus.class));
        });
    }

    @Test
    @DisplayName("NCL-04-CN-007-TC-01: Tự động thử lại thành công và cấp mã hóa đơn khi đến lịch")
    void testProcessScheduledAutoRetry_Success() {
        when(eInvoiceRepository.findEligibleForAutoRetry(any(), any(Pageable.class))).thenReturn(List.of(waitingInvoice));
        when(eInvoiceRepository.findById("inv-100")).thenReturn(Optional.of(waitingInvoice));
        when(settingsRepository.findByHouseholdId("hh-100")).thenReturn(Optional.of(settings));

        // Mock approveInvoiceByTax success
        when(eInvoiceService.approveInvoiceByTax(eq(null), eq("inv-100"), anyString()))
                .thenAnswer(inv -> {
                    waitingInvoice.setStatus("ISSUED");
                    waitingInvoice.setTaxAuthorityCode("CQT-12345");
                    return InvoiceResponse.builder().id("inv-100").status("ISSUED").build();
                });

        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processScheduledAutoRetry();

        assertNotNull(summary);
        assertEquals(1, summary.getTotalProcessed());
        assertEquals(1, summary.getSuccessCount());
        assertEquals(0, summary.getMovedToManualCount());
        assertTrue(summary.getIssuedInvoiceIds().contains("inv-100"));
        verify(eInvoiceRepository, atLeastOnce()).save(any(EInvoice.class));
    }

    @Test
    @DisplayName("NCL-04-CN-007-TC-02: Lỗi sai MST người mua (NON_RETRYABLE) -> Không tăng retryCount và chuyển sang MANUAL_PROCESSING")
    void testProcessScheduledAutoRetry_NonRetryableError() {
        waitingInvoice.setTaxAuthorityResponse("Lỗi từ cơ quan thuế: Sai mã số thuế người mua");
        when(eInvoiceRepository.findEligibleForAutoRetry(any(), any(Pageable.class))).thenReturn(List.of(waitingInvoice));
        when(eInvoiceRepository.findById("inv-100")).thenReturn(Optional.of(waitingInvoice));
        when(settingsRepository.findByHouseholdId("hh-100")).thenReturn(Optional.of(settings));

        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processScheduledAutoRetry();

        assertNotNull(summary);
        assertEquals(1, summary.getTotalProcessed());
        assertEquals(0, summary.getSuccessCount());
        assertEquals(1, summary.getMovedToManualCount());
        assertTrue(summary.getManualProcessingInvoiceIds().contains("inv-100"));
        assertEquals("MANUAL_PROCESSING", waitingInvoice.getStatus());
        // TC-02: retryCount không được tăng khi gặp lỗi non-retryable
        assertEquals(0, waitingInvoice.getRetryCount());
        verify(invoiceStatusLogRepository).save(any(InvoiceStatusLog.class));
    }

    @Test
    @DisplayName("NCL-04-CN-007-TC-03: Đã chạm số lần thử tối đa (max_retry_attempts) -> Chuyển sang MANUAL_PROCESSING")
    void testProcessScheduledAutoRetry_ExceedMaxAttempts() {
        waitingInvoice.setRetryCount(3); // Max attempts is 3
        when(eInvoiceRepository.findEligibleForAutoRetry(any(), any(Pageable.class))).thenReturn(List.of(waitingInvoice));
        when(eInvoiceRepository.findById("inv-100")).thenReturn(Optional.of(waitingInvoice));
        when(settingsRepository.findByHouseholdId("hh-100")).thenReturn(Optional.of(settings));

        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processScheduledAutoRetry();

        assertNotNull(summary);
        assertEquals(1, summary.getTotalProcessed());
        assertEquals(0, summary.getSuccessCount());
        assertEquals(1, summary.getMovedToManualCount());
        assertTrue(summary.getManualProcessingInvoiceIds().contains("inv-100"));
        assertEquals("MANUAL_PROCESSING", waitingInvoice.getStatus());
        verify(invoiceStatusLogRepository).save(any(InvoiceStatusLog.class));
    }

    @Test
    @DisplayName("NCL-04-CN-007-TC-03: Quá hạn max_retry_hours_deadline -> Chuyển sang MANUAL_PROCESSING")
    void testProcessScheduledAutoRetry_ExceedDeadlineHours() {
        waitingInvoice.setCreatedAt(LocalDateTime.now().minusHours(25)); // Deadline is 24 hours
        when(eInvoiceRepository.findEligibleForAutoRetry(any(), any(Pageable.class))).thenReturn(List.of(waitingInvoice));
        when(eInvoiceRepository.findById("inv-100")).thenReturn(Optional.of(waitingInvoice));
        when(settingsRepository.findByHouseholdId("hh-100")).thenReturn(Optional.of(settings));

        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processScheduledAutoRetry();

        assertNotNull(summary);
        assertEquals(1, summary.getTotalProcessed());
        assertEquals(0, summary.getSuccessCount());
        assertEquals(1, summary.getMovedToManualCount());
        assertTrue(summary.getManualProcessingInvoiceIds().contains("inv-100"));
        assertEquals("MANUAL_PROCESSING", waitingInvoice.getStatus());
        verify(invoiceStatusLogRepository).save(any(InvoiceStatusLog.class));
    }

    @Test
    @DisplayName("P1.1: processManualAutoRetryForUser cách ly dữ liệu đa hộ kinh doanh")
    void testProcessManualAutoRetryForUser_HouseholdIsolation() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(testUser));
        when(eInvoiceRepository.findEligibleForAutoRetryByHousehold(eq("hh-100"), any(), any(Pageable.class)))
                .thenReturn(List.of(waitingInvoice));
        when(eInvoiceRepository.findById("inv-100")).thenReturn(Optional.of(waitingInvoice));
        when(settingsRepository.findByHouseholdId("hh-100")).thenReturn(Optional.of(settings));

        when(eInvoiceService.approveInvoiceByTax(eq(null), eq("inv-100"), anyString()))
                .thenAnswer(inv -> {
                    waitingInvoice.setStatus("ISSUED");
                    return InvoiceResponse.builder().id("inv-100").status("ISSUED").build();
                });

        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processManualAutoRetryForUser("chuho_test");

        assertNotNull(summary);
        assertEquals(1, summary.getTotalProcessed());
        assertEquals(1, summary.getSuccessCount());
        verify(eInvoiceRepository).findEligibleForAutoRetryByHousehold(eq("hh-100"), any(), any(Pageable.class));
        verify(eInvoiceRepository, never()).findEligibleForAutoRetry(any(), any());
    }

    @Test
    @DisplayName("P1.2: getManualProcessingInvoices phân trang và map trực tiếp không bị N+1")
    void testGetManualProcessingInvoices_DirectMapping() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(testUser));
        EInvoice manualInvoice = EInvoice.builder()
                .id("inv-manual-1")
                .household(household)
                .status("MANUAL_PROCESSING")
                .items(Collections.emptyList())
                .build();
        Page<EInvoice> pageData = new PageImpl<>(List.of(manualInvoice));

        when(eInvoiceRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageData);

        PageResponse<InvoiceResponse> response = autoRetryService.getManualProcessingInvoices("chuho_test", 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("inv-manual-1", response.getContent().get(0).getId());
        assertEquals("MANUAL_PROCESSING", response.getContent().get(0).getStatus());
        // Đảm bảo không gọi eInvoiceService.getInvoice trong vòng lặp (tránh N+1)
        verify(eInvoiceService, never()).getInvoice(anyString(), anyString());
    }

    @Test
    @DisplayName("CRIT-01 (P0): handleRetryResult bảo vệ hóa đơn đã ISSUED từ luồng khác không bị đè về SEND_ERROR")
    void testHandleRetryResult_RaceConditionProtection() {
        EInvoice issuedInvoice = EInvoice.builder()
                .id("inv-100")
                .household(household)
                .status("ISSUED")
                .retryCount(1)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        when(eInvoiceRepository.findEligibleForAutoRetry(any(), any(Pageable.class))).thenReturn(List.of(waitingInvoice));
        // Lần 1 (prepare): trả về waitingInvoice (SEND_ERROR). Lần 2 (handleRetryResult): trả về issuedInvoice (ISSUED)
        when(eInvoiceRepository.findById("inv-100"))
                .thenReturn(Optional.of(waitingInvoice))
                .thenReturn(Optional.of(issuedInvoice));
        when(settingsRepository.findByHouseholdId("hh-100")).thenReturn(Optional.of(settings));

        // Giả lập approveInvoiceByTax bị lỗi do status đã thành ISSUED từ luồng khác
        doThrow(new RuntimeException("Hóa đơn đã ở trạng thái ISSUED"))
                .when(eInvoiceService).approveInvoiceByTax(any(), eq("inv-100"), any());

        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processScheduledAutoRetry();

        assertNotNull(summary);
        // Trạng thái hóa đơn phải được giữ nguyên là ISSUED
        assertEquals("ISSUED", issuedInvoice.getStatus());
    }

    @Test
    @DisplayName("HIGH-02 (P1): retryInvoiceSingle reset retryCount về 0 khi người dùng gửi lại thủ công")
    void testRetryInvoiceSingle_ResetsRetryCount() {
        waitingInvoice.setStatus("MANUAL_PROCESSING");
        waitingInvoice.setRetryCount(3);
        waitingInvoice.setErrorCategory("DEADLINE_OR_MAX_RETRY_EXCEEDED");

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(testUser));
        when(eInvoiceRepository.findById("inv-100")).thenReturn(Optional.of(waitingInvoice));
        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

        InvoiceResponse response = autoRetryService.retryInvoiceSingle("chuho_test", "inv-100");

        assertNotNull(response);
        assertEquals("WAITING_TAX_CODE", waitingInvoice.getStatus());
        assertEquals(0, waitingInvoice.getRetryCount());
        assertNull(waitingInvoice.getErrorCategory());
    }

    @Test
    @DisplayName("MED-04 (P2): VT-04 Admin không có household vẫn có thể gọi processManualAutoRetryForUser")
    void testProcessManualAutoRetryForUser_VT04Admin() {
        Role adminRole = Role.builder().id(4).code("VT-04").name("Quản trị hệ thống").build();
        User adminUser = User.builder()
                .id("admin-1")
                .username("admin_system")
                .household(null)
                .role(adminRole)
                .build();

        when(userRepository.findByUsername("admin_system")).thenReturn(Optional.of(adminUser));
        when(eInvoiceRepository.findEligibleForAutoRetry(any(), any(Pageable.class))).thenReturn(Collections.emptyList());

        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processManualAutoRetryForUser("admin_system");

        assertNotNull(summary);
        assertEquals(0, summary.getTotalProcessed());
        verify(eInvoiceRepository).findEligibleForAutoRetry(any(), any(Pageable.class));
    }
}
