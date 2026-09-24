package com.sales.modules.customer.service.impl;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.customer.entity.Customer;
import com.sales.modules.customer.entity.CustomerDebt;
import com.sales.modules.customer.entity.CustomerDebtReconciliation;
import com.sales.modules.order.entity.Order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.common.constant.DebtStatus;
import com.sales.common.constant.DebtType;
import com.sales.common.constant.ReconciliationStatus;
import com.sales.common.constant.RoleCode;
import com.sales.modules.customer.dto.request.ConfirmDebtReconciliationRequest;
import com.sales.modules.customer.dto.request.CreateDebtAdjustmentRequest;
import com.sales.modules.customer.dto.request.CreateDebtReconciliationRequest;
import com.sales.modules.customer.dto.request.DebtReconciliationPreviewRequest;
import com.sales.modules.customer.dto.response.CustomerDebtResponse;
import com.sales.modules.customer.dto.response.DebtReconciliationResponse;
import com.sales.modules.customer.dto.response.DebtStatementPrintResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.customer.repository.CustomerDebtReconciliationItemRepository;
import com.sales.modules.customer.repository.CustomerDebtReconciliationRepository;
import com.sales.modules.customer.repository.CustomerDebtRepository;
import com.sales.modules.customer.repository.CustomerRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class CustomerDebtReconciliationServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerDebtRepository customerDebtRepository;

    @Mock
    private CustomerDebtReconciliationRepository reconciliationRepository;

    @Mock
    private CustomerDebtReconciliationItemRepository reconciliationItemRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private CustomerDebtReconciliationServiceImpl reconciliationService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private Customer customer;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().id(1).code(RoleCode.VT_01.getCode()).name("Chủ hộ").build();
        Role staffRole = Role.builder().id(2).code(RoleCode.VT_02.getCode()).name("Bán hàng").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Tạp Hóa Việt Hưng")
                .taxCode("0400998877")
                .address("120 Lý Thường Kiệt, Đà Nẵng")
                .phoneNumber("0905123456")
                .representativeName("Trần Việt Hưng")
                .build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("chuhoviet")
                .role(ownerRole)
                .household(household)
                .build();

        staffUser = User.builder()
                .id("user-staff")
                .username("nhanvien")
                .role(staffRole)
                .household(household)
                .build();

        customer = Customer.builder()
                .id("cust-001")
                .household(household)
                .name("Nguyễn Văn Ba")
                .phoneNumber("0987654321")
                .taxCode("0401234567")
                .address("45 Lê Duẩn, Đà Nẵng")
                .creditLimit(new BigDecimal("20000000.00"))
                .currentDebt(new BigDecimal("1900000.00"))
                .build();
    }

    @Test
    @DisplayName("NCL-10-CN-007-TC-01: Xem trước đối chiếu thành công có phát sinh tăng/giảm và số dư lũy kế")
    void previewReconciliation_Success_WithDebtsAndPayments() {
        LocalDate startDate = LocalDate.now().minusDays(10);
        LocalDate endDate = LocalDate.now().minusDays(1);

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        // Số dư đầu kỳ: 1.500.000đ (incurred 5tr - paid 3.5tr)
        when(customerDebtRepository.sumAmountByCustomerAndTypeBefore(
                eq("cust-001"), eq("house-001"), eq(DebtType.DEBT_CREATED), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("5000000.00"));
        when(customerDebtRepository.sumAmountByCustomerAndTypeBefore(
                eq("cust-001"), eq("house-001"), eq(DebtType.DEBT_PAID), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("3500000.00"));

        // Giao dịch trong kỳ: 1 đơn nợ 500k, 1 lần trả nợ 400k, 1 đơn nợ 300k
        Order order1 = Order.builder().id("order-1").orderNumber("HD-001").build();
        Order order2 = Order.builder().id("order-2").orderNumber("HD-002").build();

        CustomerDebt d1 = CustomerDebt.builder()
                .id("debt-1")
                .amount(new BigDecimal("500000.00"))
                .type(DebtType.DEBT_CREATED)
                .order(order1)
                .createdAt(startDate.atTime(10, 0))
                .notes("Ghi nợ đơn HD-001")
                .build();

        CustomerDebt d2 = CustomerDebt.builder()
                .id("debt-2")
                .amount(new BigDecimal("400000.00"))
                .type(DebtType.DEBT_PAID)
                .createdAt(startDate.plusDays(2).atTime(14, 30))
                .notes("Khách chuyển khoản trả nợ đợt 1")
                .build();

        CustomerDebt d3 = CustomerDebt.builder()
                .id("debt-3")
                .amount(new BigDecimal("300000.00"))
                .type(DebtType.DEBT_CREATED)
                .order(order2)
                .createdAt(startDate.plusDays(5).atTime(9, 15))
                .notes("Ghi nợ đơn HD-002")
                .build();

        when(customerDebtRepository.findPeriodDebts(
                eq("cust-001"), eq("house-001"), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(d1, d2, d3));

        DebtReconciliationPreviewRequest request = DebtReconciliationPreviewRequest.builder()
                .customerId("cust-001")
                .startDate(startDate)
                .endDate(endDate)
                .build();

        DebtReconciliationResponse response = reconciliationService.previewReconciliation("chuhoviet", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("1500000.00"), response.getOpeningDebtBalance());
        assertEquals(new BigDecimal("800000.00"), response.getTotalDebtIncurred());
        assertEquals(new BigDecimal("400000.00"), response.getTotalDebtPaid());
        assertEquals(new BigDecimal("1900000.00"), response.getClosingDebtBalance());
        assertTrue(response.isHasTransactions());
        assertEquals("Một triệu chín trăm nghìn đồng", response.getClosingDebtInWords());
        assertEquals(3, response.getItems().size());

        // Kiểm tra số dư lũy kế từng dòng
        assertEquals(new BigDecimal("2000000.00"), response.getItems().get(0).getRunningBalance()); // 1.5tr + 500k
        assertEquals(new BigDecimal("1600000.00"), response.getItems().get(1).getRunningBalance()); // 2.0tr - 400k
        assertEquals(new BigDecimal("1900000.00"), response.getItems().get(2).getRunningBalance()); // 1.6tr + 300k
    }

    @Test
    @DisplayName("NCL-10-CN-007-TC-03: Kỳ đối chiếu không phát sinh giao dịch - Trả về bảng đối chiếu hợp lệ với opening = closing")
    void previewReconciliation_EmptyTransactions_Success() {
        LocalDate startDate = LocalDate.now().minusDays(10);
        LocalDate endDate = LocalDate.now().minusDays(1);

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        when(customerDebtRepository.sumAmountByCustomerAndTypeBefore(any(), any(), eq(DebtType.DEBT_CREATED), any()))
                .thenReturn(new BigDecimal("2000000.00"));
        when(customerDebtRepository.sumAmountByCustomerAndTypeBefore(any(), any(), eq(DebtType.DEBT_PAID), any()))
                .thenReturn(BigDecimal.ZERO);

        when(customerDebtRepository.findPeriodDebts(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        DebtReconciliationPreviewRequest request = DebtReconciliationPreviewRequest.builder()
                .customerId("cust-001")
                .startDate(startDate)
                .endDate(endDate)
                .build();

        DebtReconciliationResponse response = reconciliationService.previewReconciliation("chuhoviet", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("2000000.00"), response.getOpeningDebtBalance());
        assertEquals(BigDecimal.ZERO, response.getTotalDebtIncurred());
        assertEquals(BigDecimal.ZERO, response.getTotalDebtPaid());
        assertEquals(new BigDecimal("2000000.00"), response.getClosingDebtBalance());
        assertFalse(response.isHasTransactions());
        assertEquals("Hai triệu đồng", response.getClosingDebtInWords());
        assertTrue(response.getItems().isEmpty());
    }

    @Test
    @DisplayName("Validation: Ngày bắt đầu lớn hơn ngày kết thúc -> Ném DEBT_RECONCILIATION_INVALID_DATE_RANGE")
    void previewReconciliation_InvalidDateRange_ThrowsError() {
        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));

        DebtReconciliationPreviewRequest request = DebtReconciliationPreviewRequest.builder()
                .customerId("cust-001")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().minusDays(5))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                reconciliationService.previewReconciliation("chuhoviet", request));
        assertEquals(ErrorCode.DEBT_RECONCILIATION_INVALID_DATE_RANGE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Validation: Ngày kết thúc là ngày tương lai -> Ném DEBT_RECONCILIATION_FUTURE_DATE")
    void previewReconciliation_FutureDate_ThrowsError() {
        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));

        DebtReconciliationPreviewRequest request = DebtReconciliationPreviewRequest.builder()
                .customerId("cust-001")
                .startDate(LocalDate.now().minusDays(2))
                .endDate(LocalDate.now().plusDays(2))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                reconciliationService.previewReconciliation("chuhoviet", request));
        assertEquals(ErrorCode.DEBT_RECONCILIATION_FUTURE_DATE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tạo biên bản đối chiếu lưu nháp (DRAFT) thành công")
    void createReconciliation_Draft_Success() {
        LocalDate startDate = LocalDate.now().minusDays(10);
        LocalDate endDate = LocalDate.now().minusDays(1);

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));
        when(reconciliationRepository.existsOverlappingConfirmedReconciliation(any(), any(), any(), any()))
                .thenReturn(false);
        when(reconciliationRepository.countByHouseholdIdAndCodeStartingWith(any(), any()))
                .thenReturn(0L);

        when(reconciliationRepository.save(any(CustomerDebtReconciliation.class)))
                .thenAnswer(inv -> {
                    CustomerDebtReconciliation rec = inv.getArgument(0);
                    rec.setId("rec-draft-01");
                    return rec;
                });

        CreateDebtReconciliationRequest request = CreateDebtReconciliationRequest.builder()
                .customerId("cust-001")
                .startDate(startDate)
                .endDate(endDate)
                .notes("Lưu bản nháp để in")
                .confirmNow(false)
                .build();

        DebtReconciliationResponse response = reconciliationService.createReconciliation("chuhoviet", request);

        assertNotNull(response);
        assertEquals(ReconciliationStatus.DRAFT, response.getStatus());
        assertNull(response.getConfirmedAt());
        assertNull(response.getReconciledToDate());
        verify(customerDebtRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("NCL-10-CN-007-TC-02: Tạo và chốt khóa sổ ngay (confirmNow = true) -> Khóa toàn bộ khoản nợ cũ")
    void createReconciliation_ConfirmNow_LocksDebts() {
        LocalDate startDate = LocalDate.now().minusDays(10);
        LocalDate endDate = LocalDate.now().minusDays(1);

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));
        when(reconciliationRepository.existsOverlappingConfirmedReconciliation(any(), any(), any(), any()))
                .thenReturn(false);

        CustomerDebt oldDebt1 = CustomerDebt.builder().id("cd-1").isLocked(false).build();
        CustomerDebt oldDebt2 = CustomerDebt.builder().id("cd-2").isLocked(false).build();
        when(customerDebtRepository.findDebtsToLock(eq("cust-001"), eq("house-001"), any(LocalDateTime.class)))
                .thenReturn(List.of(oldDebt1, oldDebt2));

        when(reconciliationRepository.save(any(CustomerDebtReconciliation.class)))
                .thenAnswer(inv -> {
                    CustomerDebtReconciliation rec = inv.getArgument(0);
                    rec.setId("rec-confirmed-01");
                    return rec;
                });

        CreateDebtReconciliationRequest request = CreateDebtReconciliationRequest.builder()
                .customerId("cust-001")
                .startDate(startDate)
                .endDate(endDate)
                .notes("Chốt đối chiếu ngay")
                .confirmNow(true)
                .build();

        DebtReconciliationResponse response = reconciliationService.createReconciliation("chuhoviet", request);

        assertNotNull(response);
        assertEquals(ReconciliationStatus.CONFIRMED, response.getStatus());
        assertNotNull(response.getConfirmedAt());
        assertEquals(endDate, response.getReconciledToDate());

        // Kiểm tra các khoản nợ cũ đã bị khóa
        assertTrue(oldDebt1.isLocked());
        assertTrue(oldDebt2.isLocked());
        verify(customerDebtRepository).saveAll(any());
        assertEquals(endDate, customer.getLastReconciledDate());
        verify(customerRepository).save(customer);
    }

    @Test
    @DisplayName("Bảo mật: Nhân viên (VT-02) không được phép tạo đối chiếu -> Ném ONLY_STORE_OWNER_CAN_RECONCILE")
    void createReconciliation_StaffRole_ThrowsForbidden() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));

        CreateDebtReconciliationRequest request = CreateDebtReconciliationRequest.builder()
                .customerId("cust-001")
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().minusDays(1))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                reconciliationService.createReconciliation("nhanvien", request));
        assertEquals(ErrorCode.ONLY_STORE_OWNER_CAN_RECONCILE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chặn đối chiếu nếu ngày bắt đầu nằm trước/trùng mốc đã khóa sổ gần nhất")
    void createReconciliation_PeriodBeforeLastLock_ThrowsError() {
        customer.setLastReconciledDate(LocalDate.now().minusDays(5));

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        CreateDebtReconciliationRequest request = CreateDebtReconciliationRequest.builder()
                .customerId("cust-001")
                .startDate(LocalDate.now().minusDays(7)) // Nằm trước lastReconciledDate (-5)
                .endDate(LocalDate.now().minusDays(1))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                reconciliationService.createReconciliation("chuhoviet", request));
        assertEquals(ErrorCode.DEBT_RECONCILIATION_PERIOD_BEFORE_LAST_LOCK, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-10-CN-007-TC-02: Xác nhận biên bản nháp (confirm) -> Chuyển CONFIRMED và khóa sổ công nợ")
    void confirmReconciliation_Success() {
        LocalDate endDate = LocalDate.now().minusDays(1);
        CustomerDebtReconciliation rec = CustomerDebtReconciliation.builder()
                .id("rec-01")
                .code("DREC-260913-0001")
                .household(household)
                .customer(customer)
                .startDate(LocalDate.now().minusDays(10))
                .endDate(endDate)
                .status(ReconciliationStatus.DRAFT)
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(reconciliationRepository.findWithDetailsByIdAndHouseholdId("rec-01", "house-001"))
                .thenReturn(Optional.of(rec));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        CustomerDebt d1 = CustomerDebt.builder().id("cd-1").isLocked(false).build();
        when(customerDebtRepository.findDebtsToLock(eq("cust-001"), eq("house-001"), any(LocalDateTime.class)))
                .thenReturn(List.of(d1));
        when(reconciliationRepository.save(any(CustomerDebtReconciliation.class))).thenReturn(rec);

        ConfirmDebtReconciliationRequest confirmReq = ConfirmDebtReconciliationRequest.builder()
                .notes("Khách đã ký tay vào biên bản")
                .build();

        DebtReconciliationResponse response = reconciliationService.confirmReconciliation("chuhoviet", "rec-01", confirmReq);

        assertNotNull(response);
        assertEquals(ReconciliationStatus.CONFIRMED, response.getStatus());
        assertEquals(endDate, response.getReconciledToDate());
        assertTrue(d1.isLocked());
        verify(customerDebtRepository).saveAll(any());
        assertEquals(endDate, customer.getLastReconciledDate());
    }

    @Test
    @DisplayName("Xác nhận biên bản đã CONFIRMED -> Ném DEBT_RECONCILIATION_ALREADY_CONFIRMED")
    void confirmReconciliation_AlreadyConfirmed_ThrowsError() {
        CustomerDebtReconciliation rec = CustomerDebtReconciliation.builder()
                .id("rec-01")
                .household(household)
                .customer(customer)
                .status(ReconciliationStatus.CONFIRMED)
                .build();

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(reconciliationRepository.findWithDetailsByIdAndHouseholdId("rec-01", "house-001"))
                .thenReturn(Optional.of(rec));

        AppException ex = assertThrows(AppException.class, () ->
                reconciliationService.confirmReconciliation("chuhoviet", "rec-01", new ConfirmDebtReconciliationRequest()));
        assertEquals(ErrorCode.DEBT_RECONCILIATION_ALREADY_CONFIRMED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Hủy biên bản đối chiếu nháp (cancel) thành công")
    void cancelReconciliation_Success() {
        CustomerDebtReconciliation rec = CustomerDebtReconciliation.builder()
                .id("rec-01")
                .household(household)
                .status(ReconciliationStatus.DRAFT)
                .build();

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(reconciliationRepository.findByIdAndHouseholdId("rec-01", "house-001"))
                .thenReturn(Optional.of(rec));

        reconciliationService.cancelReconciliation("chuhoviet", "rec-01");

        assertEquals(ReconciliationStatus.CANCELLED, rec.getStatus());
        verify(reconciliationRepository).save(rec);
    }

    @Test
    @DisplayName("GAP 45: Lấy thông tin mẫu in Giấy Xác Nhận Nợ có 2 khung ký Bên Bán & Bên Mua")
    void getPrintStatement_Success() {
        CustomerDebtReconciliation rec = CustomerDebtReconciliation.builder()
                .id("rec-01")
                .code("DREC-260913-0001")
                .household(household)
                .customer(customer)
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().minusDays(1))
                .openingDebtBalance(new BigDecimal("1500000.00"))
                .totalDebtIncurred(new BigDecimal("800000.00"))
                .totalDebtPaid(new BigDecimal("400000.00"))
                .closingDebtBalance(new BigDecimal("1900000.00"))
                .closingDebtInWords("Một triệu chín trăm nghìn đồng")
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(reconciliationRepository.findWithDetailsByIdAndHouseholdId("rec-01", "house-001"))
                .thenReturn(Optional.of(rec));

        DebtStatementPrintResponse printDoc = reconciliationService.getPrintStatement("chuhoviet", "rec-01");

        assertNotNull(printDoc);
        assertEquals("GIẤY ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ", printDoc.getDocumentTitle());
        assertEquals("DREC-260913-0001", printDoc.getReconciliationCode());
        assertEquals("Tạp Hóa Việt Hưng", printDoc.getHouseholdName());
        assertEquals("Nguyễn Văn Ba", printDoc.getCustomerName());
        assertEquals("Một triệu chín trăm nghìn đồng", printDoc.getClosingDebtInWords());
        assertNotNull(printDoc.getSellerSignTitle());
        assertNotNull(printDoc.getBuyerSignTitle());
    }

    @Test
    @DisplayName("Lập bút toán điều chỉnh công nợ sau mốc khóa sổ (Tăng nợ)")
    void createDebtAdjustment_IncreaseDebt_Success() {
        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        when(customerDebtRepository.save(any(CustomerDebt.class)))
                .thenAnswer(inv -> {
                    CustomerDebt d = inv.getArgument(0);
                    d.setId("adj-01");
                    return d;
                });

        CreateDebtAdjustmentRequest request = CreateDebtAdjustmentRequest.builder()
                .customerId("cust-001")
                .adjustmentType("DEBT_INCREASE")
                .amount(new BigDecimal("50000.00"))
                .reason("Bổ sung phí bốc vác thỏa thuận sau")
                .build();

        CustomerDebtResponse response = reconciliationService.createDebtAdjustment("chuhoviet", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("50000.00"), response.getAmount());
        assertEquals(DebtType.DEBT_CREATED, response.getType());
        assertEquals(new BigDecimal("1950000.00"), customer.getCurrentDebt()); // 1.9tr + 50k
        verify(customerRepository).save(customer);
        verify(customerDebtRepository).save(any(CustomerDebt.class));
    }

    @Test
    @DisplayName("Lập bút toán điều chỉnh thiếu lý do -> Ném DEBT_ADJUSTMENT_REASON_REQUIRED")
    void createDebtAdjustment_BlankReason_ThrowsError() {
        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));

        CreateDebtAdjustmentRequest request = CreateDebtAdjustmentRequest.builder()
                .customerId("cust-001")
                .adjustmentType("DEBT_DECREASE")
                .amount(new BigDecimal("50000.00"))
                .reason("") // Rỗng
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                reconciliationService.createDebtAdjustment("chuhoviet", request));
        assertEquals(ErrorCode.DEBT_ADJUSTMENT_REASON_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("P0: Lập bút toán điều chỉnh giảm (DEBT_DECREASE) đồng bộ giảm remainingAmount của nợ mở")
    void createDebtAdjustment_DecreaseDebt_SyncsActiveDebtsRemainingAmount() {
        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        CustomerDebt openDebt1 = CustomerDebt.builder()
                .id("debt-01")
                .amount(new BigDecimal("30000.00"))
                .remainingAmount(new BigDecimal("30000.00"))
                .status(DebtStatus.PENDING)
                .type(DebtType.DEBT_CREATED)
                .build();

        CustomerDebt openDebt2 = CustomerDebt.builder()
                .id("debt-02")
                .amount(new BigDecimal("50000.00"))
                .remainingAmount(new BigDecimal("50000.00"))
                .status(DebtStatus.PENDING)
                .type(DebtType.DEBT_CREATED)
                .build();

        when(customerDebtRepository.findByCustomerIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                eq("cust-001"), eq("house-001"), any(), eq(DebtType.DEBT_CREATED)))
                .thenReturn(List.of(openDebt1, openDebt2));

        when(customerDebtRepository.save(any(CustomerDebt.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CreateDebtAdjustmentRequest request = CreateDebtAdjustmentRequest.builder()
                .customerId("cust-001")
                .adjustmentType("DEBT_DECREASE")
                .amount(new BigDecimal("50000.00"))
                .reason("Khách được duyệt giảm trừ do hư hỏng hàng")
                .build();

        CustomerDebtResponse response = reconciliationService.createDebtAdjustment("chuhoviet", request);

        assertNotNull(response);
        assertEquals(DebtType.DEBT_PAID, response.getType());
        assertEquals(DebtStatus.PAID, response.getStatus());
        // 1.9tr - 50k = 1.85tr
        assertEquals(new BigDecimal("1850000.00"), customer.getCurrentDebt());

        // openDebt1 bị trừ hết 30k -> remaining = 0, status = PAID
        assertEquals(BigDecimal.ZERO, openDebt1.getRemainingAmount());
        assertEquals(DebtStatus.PAID, openDebt1.getStatus());

        // openDebt2 bị trừ tiếp 20k -> remaining = 30k, status = PENDING
        assertEquals(new BigDecimal("30000.00"), openDebt2.getRemainingAmount());
        assertEquals(DebtStatus.PENDING, openDebt2.getStatus());

        verify(customerDebtRepository).saveAll(any());
        verify(customerRepository).save(customer);
    }

    @Test
    @DisplayName("P2: Lập bút toán với loại điều chỉnh không hợp lệ -> Ném INVALID_INPUT")
    void createDebtAdjustment_InvalidType_ThrowsInvalidInput() {
        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));

        CreateDebtAdjustmentRequest request = CreateDebtAdjustmentRequest.builder()
                .customerId("cust-001")
                .adjustmentType("DEBT_UNKNOWN")
                .amount(new BigDecimal("50000.00"))
                .reason("Lý do hợp lệ")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                reconciliationService.createDebtAdjustment("chuhoviet", request));
        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    @DisplayName("P2: Khách hàng có currentDebt là null -> Xử lý an toàn không văng NPE")
    void createDebtAdjustment_NullCurrentDebt_Safe() {
        customer.setCurrentDebt(null);
        when(userRepository.findByUsername("chuhoviet")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));
        when(customerDebtRepository.save(any(CustomerDebt.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CreateDebtAdjustmentRequest request = CreateDebtAdjustmentRequest.builder()
                .customerId("cust-001")
                .adjustmentType("DEBT_INCREASE")
                .amount(new BigDecimal("100000.00"))
                .reason("Điều chỉnh bù công nợ")
                .build();

        CustomerDebtResponse response = reconciliationService.createDebtAdjustment("chuhoviet", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("100000.00"), customer.getCurrentDebt());
    }
}
