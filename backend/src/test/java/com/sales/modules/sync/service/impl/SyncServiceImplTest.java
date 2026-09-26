package com.sales.modules.sync.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.common.constant.ConflictResolutionStrategy;
import com.sales.common.dto.PageResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdSettingsRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.customer.repository.CustomerRepository;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.order.dto.response.OrderResponse;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.repository.OrderRepository;
import com.sales.modules.pos.repository.ShiftRepository;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.sync.dto.request.SyncCheckRequest;
import com.sales.modules.sync.dto.request.SyncResolveRequest;
import com.sales.modules.sync.dto.response.SyncCheckResponse;
import com.sales.modules.sync.dto.response.SyncReconciliationSummaryResponse;
import com.sales.modules.sync.dto.response.SyncSessionResponse;
import com.sales.modules.sync.entity.SyncSession;
import com.sales.modules.sync.repository.SyncSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SyncServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private SyncSessionRepository syncSessionRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;

    @InjectMocks
    private SyncServiceImpl syncService;

    private BusinessHousehold household;
    private Role ownerRole;
    private Role staffRole;
    private User ownerUser;
    private User staffUser;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-sync-100")
                .name("Hộ Kinh Doanh Sync Test")
                .taxCode("0102030405")
                .address("123 Phố Huế, Hà Nội")
                .phoneNumber("0912345678")
                .build();

        ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên").build();

        ownerUser = User.builder()
                .id("user-owner-1")
                .username("chuho_sync")
                .fullName("Chủ Hộ Sync")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();

        staffUser = User.builder()
                .id("user-staff-1")
                .username("nhanvien_sync")
                .fullName("Nhân Viên Sync")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("checkConflicts: Không có đơn trùng lặp")
    void testCheckConflicts_NoDuplicates() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));
        when(orderRepository.findByOrderNumberInAndHouseholdIdAndDeletedAtIsNull(anyList(), eq("hh-sync-100")))
                .thenReturn(List.of());

        SyncCheckRequest request = SyncCheckRequest.builder()
                .offlineOrderNumbers(List.of("ORD-OFF-001", "ORD-OFF-002"))
                .build();

        SyncCheckResponse response = syncService.checkConflicts("chuho_sync", request);

        assertNotNull(response);
        assertTrue(response.getDuplicates().isEmpty());
        assertTrue(response.getConflicts().isEmpty());
    }

    @Test
    @DisplayName("checkConflicts: Phát hiện mã đơn đã tồn tại trên server (Duplicate)")
    void testCheckConflicts_WithDuplicates() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));

        Order existingOrder = Order.builder()
                .id("ord-1")
                .orderNumber("ORD-OFF-001")
                .household(household)
                .totalAmount(new BigDecimal("200000"))
                .finalAmount(new BigDecimal("200000"))
                .status("COMPLETED")
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .isOffline(true)
                .build();

        when(orderRepository.findByOrderNumberInAndHouseholdIdAndDeletedAtIsNull(anyList(), eq("hh-sync-100")))
                .thenReturn(List.of(existingOrder));

        SyncCheckRequest request = SyncCheckRequest.builder()
                .offlineOrderNumbers(List.of("ORD-OFF-001", "ORD-OFF-002"))
                .build();

        SyncCheckResponse response = syncService.checkConflicts("chuho_sync", request);

        assertNotNull(response);
        assertEquals(1, response.getDuplicates().size());
        assertEquals("ORD-OFF-001", response.getDuplicates().get(0));
    }

    @Test
    @DisplayName("NCL-08-CN-003-TC-04: Nhân viên (VT-02) giải quyết xung đột -> Ném lỗi FORBIDDEN")
    void testResolveConflict_NonOwner_ThrowsForbidden() {
        when(userRepository.findByUsername("nhanvien_sync")).thenReturn(Optional.of(staffUser));

        SyncResolveRequest request = SyncResolveRequest.builder()
                .orderNumber("ORD-OFF-001")
                .resolutionStrategy(ConflictResolutionStrategy.KEEP_SERVER)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                syncService.resolveConflict("nhanvien_sync", request));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("resolveConflict: Đơn hàng không tồn tại trên server -> Ném lỗi ORDER_NOT_FOUND")
    void testResolveConflict_OrderNotFound_ThrowsException() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));
        when(orderRepository.findByOrderNumberAndHouseholdIdAndDeletedAtIsNull("ORD-UNKNOWN", "hh-sync-100"))
                .thenReturn(Optional.empty());

        SyncResolveRequest request = SyncResolveRequest.builder()
                .orderNumber("ORD-UNKNOWN")
                .resolutionStrategy(ConflictResolutionStrategy.KEEP_SERVER)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                syncService.resolveConflict("chuho_sync", request));

        assertEquals(ErrorCode.ORDER_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("resolveConflict: Chiến lược KEEP_SERVER thành công")
    void testResolveConflict_KeepServer_Success() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));

        Order serverOrder = Order.builder()
                .id("ord-10")
                .orderNumber("ORD-CONF-001")
                .household(household)
                .createdByUser(ownerUser)
                .totalAmount(new BigDecimal("150000"))
                .finalAmount(new BigDecimal("150000"))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .status("COMPLETED")
                .syncStatus("SYNCED")
                .items(new ArrayList<>())
                .build();

        when(orderRepository.findByOrderNumberAndHouseholdIdAndDeletedAtIsNull("ORD-CONF-001", "hh-sync-100"))
                .thenReturn(Optional.of(serverOrder));

        SyncResolveRequest request = SyncResolveRequest.builder()
                .orderNumber("ORD-CONF-001")
                .resolutionStrategy(ConflictResolutionStrategy.KEEP_SERVER)
                .build();

        OrderResponse response = syncService.resolveConflict("chuho_sync", request);

        assertNotNull(response);
        assertEquals("ORD-CONF-001", response.getOrderNumber());
        assertEquals("COMPLETED", response.getStatus());
    }

    @Test
    @DisplayName("resolveConflict: Chiến lược OVERWRITE_SERVER thiếu clientData -> Ném lỗi INVALID_INPUT")
    void testResolveConflict_OverwriteServer_MissingClientData_ThrowsException() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));

        Order serverOrder = Order.builder()
                .id("ord-10")
                .orderNumber("ORD-CONF-002")
                .household(household)
                .totalAmount(new BigDecimal("150000"))
                .finalAmount(new BigDecimal("150000"))
                .build();

        when(orderRepository.findByOrderNumberAndHouseholdIdAndDeletedAtIsNull("ORD-CONF-002", "hh-sync-100"))
                .thenReturn(Optional.of(serverOrder));

        SyncResolveRequest request = SyncResolveRequest.builder()
                .orderNumber("ORD-CONF-002")
                .resolutionStrategy(ConflictResolutionStrategy.OVERWRITE_SERVER)
                .clientOrderData(null)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                syncService.resolveConflict("chuho_sync", request));

        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-08-CN-006: getSyncSessions phân quyền theo vai trò (VT-01 xem toàn bộ, VT-02 xem của mình)")
    void testGetSyncSessions_Success() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));

        SyncSession session = SyncSession.builder()
                .id("session-1")
                .sessionCode("SYNC-260925-001")
                .household(household)
                .user(ownerUser)
                .totalSent(5)
                .totalReceived(5)
                .totalDuplicated(0)
                .totalConflicted(0)
                .totalFailed(0)
                .status("MATCHED")
                .syncedAt(LocalDateTime.now())
                .details(new ArrayList<>())
                .build();

        Page<SyncSession> sessionPage = new PageImpl<>(List.of(session));
        when(syncSessionRepository.findFiltered(eq("hh-sync-100"), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(sessionPage);

        PageResponse<SyncSessionResponse> pageResponse = syncService.getSyncSessions("chuho_sync", 0, 10, null, null, null);

        assertNotNull(pageResponse);
        assertEquals(1, pageResponse.getContent().size());
        assertEquals("SYNC-260925-001", pageResponse.getContent().get(0).getSessionCode());
    }

    @Test
    @DisplayName("NCL-08-CN-006: getSyncSessionDetail tìm thấy chi tiết phiên thành công")
    void testGetSyncSessionDetail_Success() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));

        SyncSession session = SyncSession.builder()
                .id("session-1")
                .sessionCode("SYNC-260925-001")
                .household(household)
                .user(ownerUser)
                .totalSent(2)
                .totalReceived(2)
                .status("MATCHED")
                .syncedAt(LocalDateTime.now())
                .details(new ArrayList<>())
                .build();

        when(syncSessionRepository.findWithDetailsByIdAndHouseholdId("session-1", "hh-sync-100"))
                .thenReturn(Optional.of(session));

        SyncSessionResponse detail = syncService.getSyncSessionDetail("chuho_sync", "session-1");

        assertNotNull(detail);
        assertEquals("session-1", detail.getId());
        assertEquals("MATCHED", detail.getStatus());
    }

    @Test
    @DisplayName("NCL-08-CN-006: getSyncSessionDetail phiên không tồn tại -> Ném lỗi INVALID_INPUT")
    void testGetSyncSessionDetail_NotFound_ThrowsException() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));
        when(syncSessionRepository.findWithDetailsByIdAndHouseholdId("unknown-session", "hh-sync-100"))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                syncService.getSyncSessionDetail("chuho_sync", "unknown-session"));

        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-08-CN-006: getSyncReconciliationSummary trả về tổng hợp đối soát chuẩn")
    void testGetSyncReconciliationSummary_Success() {
        when(userRepository.findByUsername("chuho_sync")).thenReturn(Optional.of(ownerUser));

        when(syncSessionRepository.countFiltered(eq("hh-sync-100"), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(0L);

        SyncReconciliationSummaryResponse summary = syncService.getSyncReconciliationSummary("chuho_sync", null, null, null);

        assertNotNull(summary);
        assertEquals(0, summary.getTotalSessions());
        assertEquals(0, summary.getMatchedSessions());
        assertEquals(0, summary.getDiscrepancySessions());
    }
}
