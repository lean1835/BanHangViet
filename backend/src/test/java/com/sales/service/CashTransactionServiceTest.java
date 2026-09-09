package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.CashTransactionStatus;
import com.sales.constant.CashTransactionType;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CreateCashTransactionRequest;
import com.sales.dto.request.RejectCashExpenseRequest;
import com.sales.dto.response.CashTransactionResponse;
import com.sales.dto.response.ShiftCashSummaryResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.CashTransactionServiceImpl;
import com.sales.service.classes.ShiftServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CashTransactionServiceTest {

    @Mock
    private CashTransactionRepository transactionRepository;

    @Mock
    private CashTransactionCategoryRepository categoryRepository;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private ShiftHandoverRepository shiftHandoverRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private BusinessHouseholdSettingsRepository householdSettingsRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private CashTransactionServiceImpl cashTransactionService;

    private BusinessHousehold household;
    private User cashierUser;
    private User ownerUser;
    private Shift activeShift;
    private BusinessHouseholdSettings settings;
    private CashTransactionCategory expenseCategory;
    private CashTransactionCategory incomeCategory;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("household-1")
                .name("Tiệm Tạp Hóa Việt")
                .build();

        Role cashierRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build();

        cashierUser = User.builder()
                .id("user-cashier-1")
                .username("thungan01")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(household)
                .isActive(true)
                .build();

        ownerUser = User.builder()
                .id("user-owner-1")
                .username("chuho01")
                .fullName("Trần Chủ Hộ")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();

        activeShift = Shift.builder()
                .id("shift-1")
                .household(household)
                .user(cashierUser)
                .status(ShiftStatus.OPEN)
                .openedAt(LocalDateTime.now().minusHours(4))
                .openingCash(new BigDecimal("1000000.00"))
                .build();

        settings = BusinessHouseholdSettings.builder()
                .id("settings-1")
                .household(household)
                .expenseApprovalThreshold(new BigDecimal("200000.00"))
                .build();

        expenseCategory = CashTransactionCategory.builder()
                .id("cat-expense-1")
                .household(household)
                .name("Mua túi gói hàng")
                .type(CashTransactionType.EXPENSE)
                .isActive(true)
                .build();

        incomeCategory = CashTransactionCategory.builder()
                .id("cat-income-1")
                .household(household)
                .name("Nạp tiền lẻ thối")
                .type(CashTransactionType.INCOME)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("TC-01: Chi tiền trong hạn mức (50k <= 200k) -> Tự động APPROVED, mã PC-...")
    void testCreateExpense_BelowThreshold_AutoApproved() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(shiftRepository.findByUserIdAndStatus(cashierUser.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(householdSettingsRepository.findByHouseholdId(household.getId())).thenReturn(Optional.of(settings));
        when(categoryRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cat-expense-1", household.getId()))
                .thenReturn(Optional.of(expenseCategory));
        when(transactionRepository.findMaxCodeByPrefix(eq(household.getId()), anyString())).thenReturn(Optional.empty());

        when(transactionRepository.save(any(CashTransaction.class))).thenAnswer(invocation -> {
            CashTransaction tx = invocation.getArgument(0);
            tx.setId("tx-1");
            return tx;
        });

        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.EXPENSE)
                .categoryId("cat-expense-1")
                .categoryName("Mua túi gói hàng")
                .amount(new BigDecimal("50000.00"))
                .personName("Chị bán bao bì")
                .notes("Mua 5kg túi bóng")
                .build();

        CashTransactionResponse response = cashTransactionService.createTransaction("thungan01", request);

        assertNotNull(response);
        assertEquals(CashTransactionType.EXPENSE, response.getType());
        assertEquals(CashTransactionStatus.APPROVED, response.getStatus());
        assertEquals(new BigDecimal("50000.00"), response.getAmount());
        assertTrue(response.getCode().startsWith("PC-"));
        verify(transactionRepository, times(1)).save(any(CashTransaction.class));
    }

    @Test
    @DisplayName("TC-02: Thu tiền lẻ ngoài bán hàng (500k) -> Tự động APPROVED, mã PT-...")
    void testCreateIncome_AutoApproved() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(shiftRepository.findByUserIdAndStatus(cashierUser.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(categoryRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cat-income-1", household.getId()))
                .thenReturn(Optional.of(incomeCategory));
        when(transactionRepository.findMaxCodeByPrefix(eq(household.getId()), anyString())).thenReturn(Optional.empty());

        when(transactionRepository.save(any(CashTransaction.class))).thenAnswer(invocation -> {
            CashTransaction tx = invocation.getArgument(0);
            tx.setId("tx-2");
            return tx;
        });

        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.INCOME)
                .categoryId("cat-income-1")
                .categoryName("Nạp tiền lẻ thối")
                .amount(new BigDecimal("500000.00"))
                .personName("Chủ hộ")
                .notes("Nạp cọc 10k vào két")
                .build();

        CashTransactionResponse response = cashTransactionService.createTransaction("thungan01", request);

        assertNotNull(response);
        assertEquals(CashTransactionType.INCOME, response.getType());
        assertEquals(CashTransactionStatus.APPROVED, response.getStatus());
        assertEquals(new BigDecimal("500000.00"), response.getAmount());
        assertTrue(response.getCode().startsWith("PT-"));
        verify(transactionRepository, times(1)).save(any(CashTransaction.class));
    }

    @Test
    @DisplayName("TC-03: Nhân viên chi vượt hạn mức (500k > 200k) -> Trạng thái PENDING_APPROVAL")
    void testCreateExpense_AboveThreshold_PendingApproval() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(shiftRepository.findByUserIdAndStatus(cashierUser.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(householdSettingsRepository.findByHouseholdId(household.getId())).thenReturn(Optional.of(settings));
        when(categoryRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cat-expense-1", household.getId()))
                .thenReturn(Optional.of(expenseCategory));
        when(transactionRepository.findMaxCodeByPrefix(eq(household.getId()), anyString())).thenReturn(Optional.empty());

        when(transactionRepository.save(any(CashTransaction.class))).thenAnswer(invocation -> {
            CashTransaction tx = invocation.getArgument(0);
            tx.setId("tx-3");
            return tx;
        });

        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.EXPENSE)
                .categoryId("cat-expense-1")
                .categoryName("Mua túi gói hàng")
                .amount(new BigDecimal("500000.00"))
                .notes("Chi tiền ứng shipper liên tỉnh")
                .build();

        CashTransactionResponse response = cashTransactionService.createTransaction("thungan01", request);

        assertNotNull(response);
        assertEquals(CashTransactionStatus.PENDING_APPROVAL, response.getStatus());
        assertEquals(new BigDecimal("500000.00"), response.getAmount());
    }

    @Test
    @DisplayName("TC-04: Chủ hộ (VT-01) phê duyệt khoản chi vượt hạn mức thành công")
    void testOwnerApproveExpense_Success() {
        CashTransaction pendingTx = CashTransaction.builder()
                .id("tx-pending-1")
                .code("PC-260909-0001")
                .household(household)
                .shift(activeShift)
                .type(CashTransactionType.EXPENSE)
                .amount(new BigDecimal("500000.00"))
                .categoryName("Chi trả ship")
                .status(CashTransactionStatus.PENDING_APPROVAL)
                .createdByUser(cashierUser)
                .build();

        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(ownerUser));
        when(transactionRepository.findByIdAndHouseholdId("tx-pending-1", household.getId()))
                .thenReturn(Optional.of(pendingTx));
        when(transactionRepository.save(any(CashTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CashTransactionResponse response = cashTransactionService.approveTransaction("chuho01", "tx-pending-1");

        assertNotNull(response);
        assertEquals(CashTransactionStatus.APPROVED, response.getStatus());
        assertEquals(ownerUser.getId(), response.getApprovedByUserId());
        assertNotNull(response.getApprovedAt());
    }

    @Test
    @DisplayName("TC-05: Chủ hộ (VT-01) từ chối khoản chi vượt hạn mức kèm lý do")
    void testOwnerRejectExpense_Success() {
        CashTransaction pendingTx = CashTransaction.builder()
                .id("tx-pending-1")
                .code("PC-260909-0001")
                .household(household)
                .shift(activeShift)
                .type(CashTransactionType.EXPENSE)
                .amount(new BigDecimal("500000.00"))
                .categoryName("Chi trả ship")
                .status(CashTransactionStatus.PENDING_APPROVAL)
                .createdByUser(cashierUser)
                .build();

        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(ownerUser));
        when(transactionRepository.findByIdAndHouseholdId("tx-pending-1", household.getId()))
                .thenReturn(Optional.of(pendingTx));
        when(transactionRepository.save(any(CashTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RejectCashExpenseRequest request = new RejectCashExpenseRequest("Khoản chi không đúng thủ tục, yêu cầu thu hồi");
        CashTransactionResponse response = cashTransactionService.rejectTransaction("chuho01", "tx-pending-1", request);

        assertNotNull(response);
        assertEquals(CashTransactionStatus.REJECTED, response.getStatus());
        assertEquals("Khoản chi không đúng thủ tục, yêu cầu thu hồi", response.getRejectionReason());
    }

    @Test
    @DisplayName("TC-06: Chủ hộ (VT-01) tự lập phiếu chi vượt ngưỡng (2tr > 200k) -> Tự động APPROVED")
    void testOwnerCreateExpense_AboveThreshold_AutoApproved() {
        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(ownerUser));
        when(shiftRepository.findByUserIdAndStatus(ownerUser.getId(), ShiftStatus.OPEN)).thenReturn(Optional.empty());
        when(shiftRepository.findByHouseholdIdOrderByOpenedAtDesc(household.getId())).thenReturn(List.of(activeShift));
        when(categoryRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cat-expense-1", household.getId()))
                .thenReturn(Optional.of(expenseCategory));
        when(transactionRepository.findMaxCodeByPrefix(eq(household.getId()), anyString())).thenReturn(Optional.empty());

        when(transactionRepository.save(any(CashTransaction.class))).thenAnswer(invocation -> {
            CashTransaction tx = invocation.getArgument(0);
            tx.setId("tx-owner-1");
            return tx;
        });

        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.EXPENSE)
                .categoryId("cat-expense-1")
                .categoryName("Mua túi gói hàng")
                .amount(new BigDecimal("2000000.00"))
                .notes("Chủ hộ mua máy in hóa đơn mới")
                .build();

        CashTransactionResponse response = cashTransactionService.createTransaction("chuho01", request);

        assertNotNull(response);
        assertEquals(CashTransactionStatus.APPROVED, response.getStatus());
    }

    @Test
    @DisplayName("TC-11: Nhân viên không trong ca mở tạo phiếu -> Ném CASH_TRANSACTION_SHIFT_NOT_OPEN")
    void testCreateTransaction_NoActiveShift_ThrowsException() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(shiftRepository.findByUserIdAndStatus(cashierUser.getId(), ShiftStatus.OPEN)).thenReturn(Optional.empty());

        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.INCOME)
                .categoryName("Thu lẻ")
                .amount(new BigDecimal("50000.00"))
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> cashTransactionService.createTransaction("thungan01", request));
        assertEquals(ErrorCode.CASH_TRANSACTION_SHIFT_NOT_OPEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-12: Số tiền thu chi <= 0 -> Ném CASH_TRANSACTION_AMOUNT_INVALID")
    void testCreateTransaction_InvalidAmount_ThrowsException() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));

        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.EXPENSE)
                .categoryName("Chi vặt")
                .amount(BigDecimal.ZERO)
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> cashTransactionService.createTransaction("thungan01", request));
        assertEquals(ErrorCode.CASH_TRANSACTION_AMOUNT_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-13: Nhân viên (VT-02) cố ý duyệt phiếu chi -> Ném CASH_TRANSACTION_APPROVAL_DENIED")
    void testApproveExpense_ByCashier_ThrowsForbidden() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));

        AppException ex = assertThrows(AppException.class,
                () -> cashTransactionService.approveTransaction("thungan01", "tx-pending-1"));
        assertEquals(ErrorCode.CASH_TRANSACTION_APPROVAL_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-14: Lấy báo cáo tổng hợp dòng tiền ca (ShiftCashSummary)")
    void testGetShiftCashSummary() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(shiftRepository.findById("shift-1")).thenReturn(Optional.of(activeShift));
        when(orderRepository.sumCollectedAmountByShiftId("shift-1")).thenReturn(new BigDecimal("2500000.00"));
        when(transactionRepository.sumAmountByShiftIdAndTypeAndStatus("shift-1", CashTransactionType.INCOME, CashTransactionStatus.APPROVED))
                .thenReturn(new BigDecimal("500000.00"));
        when(transactionRepository.sumAmountByShiftIdAndTypeAndStatus("shift-1", CashTransactionType.EXPENSE, CashTransactionStatus.APPROVED))
                .thenReturn(new BigDecimal("50000.00"));
        when(transactionRepository.sumAmountByShiftIdAndTypeAndStatus("shift-1", CashTransactionType.EXPENSE, CashTransactionStatus.PENDING_APPROVAL))
                .thenReturn(new BigDecimal("500000.00"));
        when(transactionRepository.countByShiftIdAndStatus("shift-1", CashTransactionStatus.PENDING_APPROVAL))
                .thenReturn(1L);

        ShiftCashSummaryResponse summary = cashTransactionService.getShiftCashSummary("thungan01", "shift-1");

        assertNotNull(summary);
        assertEquals(new BigDecimal("1000000.00"), summary.getOpeningCash());
        assertEquals(new BigDecimal("2500000.00"), summary.getCashSales());
        assertEquals(new BigDecimal("500000.00"), summary.getTotalApprovedIncome());
        assertEquals(new BigDecimal("50000.00"), summary.getTotalApprovedExpense());
        assertEquals(new BigDecimal("450000.00"), summary.getNetCashChange());
        assertEquals(new BigDecimal("500000.00"), summary.getTotalPendingExpense());
        assertEquals(1, summary.getPendingExpenseCount());
        // Expected = 1.000.000 + 2.500.000 + 500.000 - 50.000 = 3.950.000
        assertEquals(new BigDecimal("3950000.00"), summary.getCurrentExpectedCash());
    }

    @Test
    @DisplayName("Cập nhật hạn mức duyệt chi thành công")
    void testUpdateExpenseThreshold_Success() {
        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(ownerUser));
        when(householdSettingsRepository.findByHouseholdId(household.getId())).thenReturn(Optional.of(settings));

        cashTransactionService.updateExpenseThreshold("chuho01", new BigDecimal("300000.00"));

        assertEquals(new BigDecimal("300000.00"), settings.getExpenseApprovalThreshold());
        verify(householdSettingsRepository, times(1)).save(settings);
    }

    @Test
    @DisplayName("NCL-03-CN-014: Chủ hộ chỉ định cụ thể shiftId khi tạo phiếu thu chi")
    void testCreateCashTransaction_WithOwnerExplicitShiftId_Success() {
        Shift specificShift = Shift.builder()
                .id("shift-pos-2")
                .household(household)
                .user(cashierUser)
                .status(ShiftStatus.OPEN)
                .openedAt(LocalDateTime.now().minusHours(2))
                .openingCash(new BigDecimal("2000000.00"))
                .build();

        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.INCOME)
                .shiftId("shift-pos-2")
                .categoryName("Nạp thêm tiền lẻ Quầy 2")
                .amount(new BigDecimal("500000.00"))
                .build();

        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(ownerUser));
        when(shiftRepository.findById("shift-pos-2")).thenReturn(Optional.of(specificShift));
        when(transactionRepository.findMaxCodeByPrefix(eq("household-1"), anyString())).thenReturn(Optional.empty());
        when(transactionRepository.save(any(CashTransaction.class))).thenAnswer(invocation -> {
            CashTransaction saved = invocation.getArgument(0);
            saved.setId("tx-explicit-1");
            return saved;
        });

        CashTransactionResponse response = cashTransactionService.createTransaction("chuho01", request);

        assertNotNull(response);
        assertEquals("shift-pos-2", response.getShiftId());
        assertEquals(CashTransactionType.INCOME, response.getType());
        assertEquals(CashTransactionStatus.APPROVED, response.getStatus());
        verify(shiftRepository, times(1)).findById("shift-pos-2");
    }

    @Test
    @DisplayName("NCL-03-CN-014: Chỉ định shiftId của ca đã đóng ném lỗi CASH_TRANSACTION_SHIFT_NOT_OPEN")
    void testCreateCashTransaction_WithClosedShiftId_ThrowsException() {
        Shift closedShift = Shift.builder()
                .id("shift-closed-1")
                .household(household)
                .user(cashierUser)
                .status(ShiftStatus.CLOSED)
                .build();

        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.EXPENSE)
                .shiftId("shift-closed-1")
                .categoryName("Chi mua bao bì")
                .amount(new BigDecimal("50000.00"))
                .build();

        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(ownerUser));
        when(shiftRepository.findById("shift-closed-1")).thenReturn(Optional.of(closedShift));

        AppException ex = assertThrows(AppException.class, () ->
                cashTransactionService.createTransaction("chuho01", request));

        assertEquals(ErrorCode.CASH_TRANSACTION_SHIFT_NOT_OPEN, ex.getErrorCode());
    }
}
