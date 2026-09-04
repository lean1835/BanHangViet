package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AnomalyAlertStatus;
import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
import com.sales.dto.request.AnomalyAlertFilterRequest;
import com.sales.dto.request.ReviewAnomalyAlertRequest;
import com.sales.dto.request.UpdateAnomalyRuleRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.AnomalyDetectionServiceImpl;
import com.sales.service.interfaces.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AnomalyDetectionServiceImplTest {

    @Mock
    private AnomalyAlertRepository anomalyAlertRepository;

    @Mock
    private AnomalyRuleConfigRepository anomalyRuleConfigRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessHouseholdRepository householdRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InventoryAuditDetailRepository inventoryAuditDetailRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AnomalyDetectionServiceImpl anomalyDetectionService;

    private BusinessHousehold household;
    private User ownerUser;
    private User staffUser;
    private Role ownerRole;
    private Role staffRole;
    private AnomalyRuleConfig massCancelRule;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-test-1")
                .taxCode("0123456789")
                .name("Hộ Kinh Doanh Anomaly Test")
                .build();

        ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build();
        staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();

        ownerUser = User.builder()
                .id("u-owner-1")
                .username("owner_test")
                .fullName("Chủ Hộ A")
                .role(ownerRole)
                .household(household)
                .build();

        staffUser = User.builder()
                .id("u-staff-1")
                .username("bannam01")
                .fullName("Nguyễn Văn Nam")
                .role(staffRole)
                .household(household)
                .build();

        massCancelRule = AnomalyRuleConfig.builder()
                .id("rule-1")
                .household(household)
                .ruleType(AnomalyAlertType.MASS_INVOICE_CANCEL)
                .ruleName("Hủy nhiều hóa đơn liên tiếp")
                .thresholdValue(BigDecimal.valueOf(5))
                .timeWindowMinutes(10)
                .severity(AnomalySeverity.CRITICAL)
                .isEnabled(true)
                .build();
    }

    @Test
    @DisplayName("NCL-14-CN-004-TC-01: Phát hiện 1 người dùng hủy 5 hóa đơn trong vòng 10 phút -> Sinh cảnh báo CRITICAL")
    void testDetectMassInvoiceCancellation_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(anomalyRuleConfigRepository.findByHouseholdIdOrderByCreatedAtAsc("hh-test-1"))
                .thenReturn(List.of(massCancelRule));

        LocalDate targetDate = LocalDate.of(2026, 9, 15);
        LocalDateTime baseTime = targetDate.atTime(9, 30);

        List<EInvoice> canceledList = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            canceledList.add(EInvoice.builder()
                    .id("inv-" + i)
                    .invoiceNumber("HD-" + i)
                    .status("CANCELED")
                    .canceledByUser(staffUser)
                    .canceledAt(baseTime.plusMinutes(i))
                    .cancelReason("Khách đổi ý lần " + i)
                    .finalAmount(BigDecimal.valueOf(100000 * i))
                    .household(household)
                    .build());
        }

        when(eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                eq("hh-test-1"), eq("CANCELED"), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(canceledList);

        when(anomalyAlertRepository.existsByHouseholdIdAndAlertTypeAndActorUserIdAndDetectedAtBetween(
                eq("hh-test-1"), eq(AnomalyAlertType.MASS_INVOICE_CANCEL), eq("u-staff-1"), any(), any()))
                .thenReturn(false);

        ScanAnomalyResultResponse response = anomalyDetectionService.scanAnomalies("owner_test", targetDate, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertEquals(1, response.getNewAlertsDetected());
        assertFalse(response.isCleanDay());

        AnomalyAlertResponse alert = response.getNewAlerts().get(0);
        assertEquals(AnomalyAlertType.MASS_INVOICE_CANCEL, alert.getAlertType());
        assertEquals(AnomalySeverity.CRITICAL, alert.getSeverity());
        assertEquals("u-staff-1", alert.getActorUserId());
        assertEquals("bannam01", alert.getActorUsername());
        assertTrue(alert.getDescription().contains("5 hóa đơn"));

        verify(anomalyAlertRepository, times(1)).saveAll(any());
        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(ownerUser), eq("SCAN_ANOMALIES"), eq("anomaly_alerts"), any(), any(), any(), any(), any()
        );
    }

    @Test
    @DisplayName("NCL-14-CN-004-TC-02: Dữ liệu rỗng - Không có thao tác vượt ngưỡng trong ngày -> Ghi nhận ngày sạch (isCleanDay = true)")
    void testScanCleanDay_NoAnomalies() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(anomalyRuleConfigRepository.findByHouseholdIdOrderByCreatedAtAsc("hh-test-1"))
                .thenReturn(List.of(massCancelRule));

        LocalDate targetDate = LocalDate.of(2026, 9, 15);
        when(eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                eq("hh-test-1"), eq("CANCELED"), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        when(anomalyAlertRepository.countAnomaliesInDateRange(eq("hh-test-1"), any(), any())).thenReturn(0L);

        ScanAnomalyResultResponse response = anomalyDetectionService.scanAnomalies("owner_test", targetDate, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertEquals(0, response.getNewAlertsDetected());
        assertTrue(response.isCleanDay());
        assertTrue(response.getSummaryMessage().contains("ngày sạch"));
    }

    @Test
    @DisplayName("NCL-14-CN-004-TC-03: Không có quyền - Người dùng có vai trò Nhân viên bán hàng (VT-02) -> Hệ thống chặn 403 Forbidden")
    void testRoleSecurity_StaffBlocked_ThrowsForbidden() {
        when(userRepository.findByUsername("bannam01")).thenReturn(Optional.of(staffUser));

        AppException ex = assertThrows(AppException.class, () ->
                anomalyDetectionService.getAnomalyAlerts("bannam01", new AnomalyAlertFilterRequest(), "127.0.0.1", "Mozilla/5.0"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lấy danh sách cảnh báo bất thường thành công (findFilteredAlerts)")
    void testGetAnomalyAlerts_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));

        AnomalyAlert alert = AnomalyAlert.builder()
                .id("alert-1")
                .household(household)
                .alertType(AnomalyAlertType.MASS_INVOICE_CANCEL)
                .severity(AnomalySeverity.CRITICAL)
                .title("Hủy hóa đơn hàng loạt")
                .status(AnomalyAlertStatus.PENDING)
                .detectedAt(LocalDateTime.now())
                .build();

        Page<AnomalyAlert> page = new PageImpl<>(List.of(alert));
        when(anomalyAlertRepository.findFilteredAlerts(any(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<AnomalyAlertResponse> result = anomalyDetectionService.getAnomalyAlerts(
                "owner_test", new AnomalyAlertFilterRequest(), "127.0.0.1", "Mozilla/5.0");

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("alert-1", result.getContent().get(0).getId());
    }

    @Test
    @DisplayName("Phát hiện đơn hàng có tỷ lệ giảm giá bất thường (UNUSUAL_HIGH_DISCOUNT >= 30%)")
    void testDetectUnusualHighDiscount_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));

        AnomalyRuleConfig discountRule = AnomalyRuleConfig.builder()
                .id("rule-2")
                .household(household)
                .ruleType(AnomalyAlertType.UNUSUAL_HIGH_DISCOUNT)
                .ruleName("Chiết khấu cao")
                .thresholdValue(BigDecimal.valueOf(30.00))
                .timeWindowMinutes(60)
                .severity(AnomalySeverity.WARNING)
                .isEnabled(true)
                .build();

        when(anomalyRuleConfigRepository.findByHouseholdIdOrderByCreatedAtAsc("hh-test-1"))
                .thenReturn(List.of(discountRule));

        LocalDate targetDate = LocalDate.now();
        Order highDiscountOrder = Order.builder()
                .id("ord-1")
                .orderNumber("ORD-999")
                .status("COMPLETED")
                .totalAmount(BigDecimal.valueOf(1000000))
                .discountAmount(BigDecimal.valueOf(450000)) // 45% discount
                .createdByUser(staffUser)
                .createdAt(targetDate.atTime(14, 0))
                .household(household)
                .build();

        when(orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                eq("hh-test-1"), eq("COMPLETED"), any(), any()))
                .thenReturn(List.of(highDiscountOrder));

        ScanAnomalyResultResponse response = anomalyDetectionService.scanAnomalies("owner_test", targetDate, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertEquals(1, response.getNewAlertsDetected());
        assertEquals(AnomalyAlertType.UNUSUAL_HIGH_DISCOUNT, response.getNewAlerts().get(0).getAlertType());
        assertTrue(response.getNewAlerts().get(0).getTitle().contains("45.0%"));
    }

    @Test
    @DisplayName("Chủ hộ cập nhật trạng thái xử lý cảnh báo thành công (REVIEWED)")
    void testReviewAlert_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));

        AnomalyAlert alert = AnomalyAlert.builder()
                .id("alert-1")
                .household(household)
                .alertType(AnomalyAlertType.MASS_INVOICE_CANCEL)
                .severity(AnomalySeverity.CRITICAL)
                .title("Cảnh báo hủy hóa đơn hàng loạt")
                .status(AnomalyAlertStatus.PENDING)
                .build();

        when(anomalyAlertRepository.findByIdAndHouseholdId("alert-1", "hh-test-1")).thenReturn(Optional.of(alert));
        when(anomalyAlertRepository.save(any(AnomalyAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewAnomalyAlertRequest req = ReviewAnomalyAlertRequest.builder()
                .status(AnomalyAlertStatus.REVIEWED)
                .reviewNotes("Đã xác minh lại với nhân viên, giao dịch nhầm do lỗi mạng")
                .build();

        AnomalyAlertResponse response = anomalyDetectionService.reviewAlert("owner_test", "alert-1", req, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertEquals(AnomalyAlertStatus.REVIEWED, response.getStatus());
        assertEquals("owner_test", response.getReviewedByUsername());
        assertEquals("Đã xác minh lại với nhân viên, giao dịch nhầm do lỗi mạng", response.getReviewNotes());
    }

    @Test
    @DisplayName("Cập nhật cấu hình quy tắc cảnh báo thành công")
    void testUpdateRuleConfig_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(anomalyRuleConfigRepository.findByIdAndHouseholdId("rule-1", "hh-test-1")).thenReturn(Optional.of(massCancelRule));
        when(anomalyRuleConfigRepository.save(any(AnomalyRuleConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateAnomalyRuleRequest updateReq = UpdateAnomalyRuleRequest.builder()
                .thresholdValue(BigDecimal.valueOf(10))
                .timeWindowMinutes(15)
                .severity(AnomalySeverity.CRITICAL)
                .isEnabled(true)
                .build();

        AnomalyRuleConfigResponse response = anomalyDetectionService.updateRuleConfig("owner_test", "rule-1", updateReq, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertEquals(BigDecimal.valueOf(10), response.getThresholdValue());
        assertEquals(15, response.getTimeWindowMinutes());
    }

    @Test
    @DisplayName("Lấy tổng quan cảnh báo và thống kê thành công")
    void testGetSummary_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(anomalyAlertRepository.countByHouseholdId("hh-test-1")).thenReturn(10L);
        when(anomalyAlertRepository.countByHouseholdIdAndStatus("hh-test-1", AnomalyAlertStatus.PENDING)).thenReturn(3L);
        when(anomalyAlertRepository.countByHouseholdIdAndStatus("hh-test-1", AnomalyAlertStatus.REVIEWED)).thenReturn(5L);
        when(anomalyAlertRepository.countByHouseholdIdAndStatus("hh-test-1", AnomalyAlertStatus.DISMISSED)).thenReturn(2L);
        when(anomalyAlertRepository.countByHouseholdIdAndSeverity("hh-test-1", AnomalySeverity.CRITICAL)).thenReturn(2L);
        when(anomalyAlertRepository.countAnomaliesInDateRange(eq("hh-test-1"), any(), any())).thenReturn(0L);

        AnomalyAlertSummaryResponse summary = anomalyDetectionService.getSummary("owner_test", LocalDate.now());

        assertNotNull(summary);
        assertEquals(10L, summary.getTotalAlerts());
        assertEquals(3L, summary.getPendingAlerts());
        assertEquals(2L, summary.getCriticalAlerts());
        assertTrue(summary.isCleanDay());
    }

    @Test
    @DisplayName("Phát hiện chênh lệch kiểm kê kho lớn vượt ngưỡng (LARGE_INVENTORY_ADJUSTMENT)")
    void testDetectLargeInventoryAdjustment_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));

        AnomalyRuleConfig invRule = AnomalyRuleConfig.builder()
                .id("rule-3")
                .household(household)
                .ruleType(AnomalyAlertType.LARGE_INVENTORY_ADJUSTMENT)
                .ruleName("Kiểm kê chênh lệch lớn")
                .thresholdValue(BigDecimal.valueOf(50))
                .timeWindowMinutes(60)
                .severity(AnomalySeverity.WARNING)
                .isEnabled(true)
                .build();

        when(anomalyRuleConfigRepository.findByHouseholdIdOrderByCreatedAtAsc("hh-test-1"))
                .thenReturn(List.of(invRule));

        LocalDate targetDate = LocalDate.now();
        InventoryAudit audit = InventoryAudit.builder()
                .id("aud-1")
                .auditNumber("KK-001")
                .household(household)
                .createdByUser(staffUser)
                .build();

        Product product = Product.builder()
                .id("prod-1")
                .name("Sữa tươi Ba Vì 1L")
                .build();

        InventoryAuditDetail detail = InventoryAuditDetail.builder()
                .id("det-1")
                .audit(audit)
                .product(product)
                .systemQuantity(BigDecimal.valueOf(100))
                .actualQuantity(BigDecimal.valueOf(30))
                .differenceQuantity(BigDecimal.valueOf(-70))
                .createdAt(targetDate.atTime(11, 0))
                .build();

        when(inventoryAuditDetailRepository.findDetailsForAnomalyScan(eq("hh-test-1"), any(), any()))
                .thenReturn(List.of(detail));

        ScanAnomalyResultResponse response = anomalyDetectionService.scanAnomalies("owner_test", targetDate, "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertEquals(1, response.getNewAlertsDetected());
        assertEquals(AnomalyAlertType.LARGE_INVENTORY_ADJUSTMENT, response.getNewAlerts().get(0).getAlertType());
        assertTrue(response.getNewAlerts().get(0).getTitle().contains("70"));
    }

    @Test
    @DisplayName("Phát hiện đứt gãy Hash Chain kiểm toán (AUDIT_CHAIN_BREACH)")
    void testDetectAuditChainBreach_Success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));

        AnomalyRuleConfig auditRule = AnomalyRuleConfig.builder()
                .id("rule-4")
                .household(household)
                .ruleType(AnomalyAlertType.AUDIT_CHAIN_BREACH)
                .ruleName("Đứt gãy Hash Chain")
                .thresholdValue(BigDecimal.valueOf(1))
                .timeWindowMinutes(1)
                .severity(AnomalySeverity.CRITICAL)
                .isEnabled(true)
                .build();

        when(anomalyRuleConfigRepository.findByHouseholdIdOrderByCreatedAtAsc("hh-test-1"))
                .thenReturn(List.of(auditRule));

        when(userRepository.findFirstByHouseholdIdAndRoleCode("hh-test-1", "VT-01"))
                .thenReturn(Optional.of(ownerUser));

        AuditIntegrityResponse breachResponse = AuditIntegrityResponse.builder()
                .isValid(false)
                .corruptedSequenceNumber(105L)
                .corruptedLogId("log-105")
                .failureReason("Dữ liệu bản ghi sequence 105 bị sửa đổi trái phép")
                .verifiedAt(LocalDateTime.now())
                .build();

        when(auditLogService.verifyIntegrity("owner_test")).thenReturn(breachResponse);

        ScanAnomalyResultResponse response = anomalyDetectionService.scanAnomalies("owner_test", LocalDate.now(), "127.0.0.1", "Mozilla/5.0");

        assertNotNull(response);
        assertEquals(1, response.getNewAlertsDetected());
        assertEquals(AnomalyAlertType.AUDIT_CHAIN_BREACH, response.getNewAlerts().get(0).getAlertType());
        assertEquals(AnomalySeverity.CRITICAL, response.getNewAlerts().get(0).getSeverity());
    }
}
