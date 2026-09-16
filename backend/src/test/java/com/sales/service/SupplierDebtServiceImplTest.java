package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.DebtStatus;
import com.sales.constant.DebtType;
import com.sales.dto.request.PaySupplierDebtRequest;
import com.sales.dto.response.SupplierDebtResponse;
import com.sales.dto.response.SupplierDebtSummaryResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.SupplierDebtRepository;
import com.sales.repository.SupplierRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.SupplierDebtServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupplierDebtServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private SupplierDebtRepository supplierDebtRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private SupplierDebtServiceImpl supplierDebtService;

    private User currentUser;
    private BusinessHousehold household;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ kinh doanh Test")
                .taxCode("0123456789")
                .build();

        currentUser = User.builder()
                .id("usr-1")
                .username("chuho_test")
                .fullName("Nguyễn Văn A")
                .household(household)
                .build();

        supplier = Supplier.builder()
                .id("sup-1")
                .name("Nhà cung cấp Nước Ngọt")
                .phoneNumber("0912345678")
                .household(household)
                .currentDebt(new BigDecimal("1000000.00"))
                .build();
    }

    @Test
    @DisplayName("Ghi nhận công nợ khi lập phiếu nhập kho thành công")
    void recordGoodsReceiptDebt_Success() {
        GoodsReceipt receipt = GoodsReceipt.builder()
                .id("rec-1")
                .receiptNumber("NK-0001")
                .totalAmount(new BigDecimal("500000.00"))
                .household(household)
                .supplier(supplier)
                .build();

        supplierDebtService.recordGoodsReceiptDebt(household, supplier, receipt, currentUser);

        verify(supplierDebtRepository, times(1)).save(any(SupplierDebt.class));
        verify(supplierRepository, times(1)).save(supplier);
        assertEquals(new BigDecimal("1500000.00"), supplier.getCurrentDebt());
    }

    @Test
    @DisplayName("Thanh toán nợ nhà cung cấp thành công theo cơ chế FIFO")
    void paySupplierDebt_Success_FIFO() {
        PaySupplierDebtRequest request = PaySupplierDebtRequest.builder()
                .supplierId("sup-1")
                .amount(new BigDecimal("400000.00"))
                .paymentMethod("BANK_TRANSFER")
                .notes("Trả tiền đợt 1")
                .build();

        SupplierDebt debt1 = SupplierDebt.builder()
                .id("debt-1")
                .household(household)
                .supplier(supplier)
                .amount(new BigDecimal("300000.00"))
                .remainingAmount(new BigDecimal("300000.00"))
                .type(DebtType.DEBT_CREATED)
                .status(DebtStatus.PENDING)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();

        SupplierDebt debt2 = SupplierDebt.builder()
                .id("debt-2")
                .household(household)
                .supplier(supplier)
                .amount(new BigDecimal("700000.00"))
                .remainingAmount(new BigDecimal("700000.00"))
                .type(DebtType.DEBT_CREATED)
                .status(DebtStatus.PENDING)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("sup-1", "hh-1")).thenReturn(Optional.of(supplier));
        when(supplierDebtRepository.findBySupplierIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                eq("sup-1"), eq("hh-1"), anyList(), eq(DebtType.DEBT_CREATED)
        )).thenReturn(List.of(debt1, debt2));

        when(supplierDebtRepository.save(any(SupplierDebt.class))).thenAnswer(invocation -> {
            SupplierDebt sd = invocation.getArgument(0);
            sd.setId("payment-1");
            return sd;
        });

        SupplierDebtResponse response = supplierDebtService.paySupplierDebt("chuho_test", request);

        assertNotNull(response);
        assertEquals(DebtStatus.PAID, debt1.getStatus());
        assertEquals(BigDecimal.ZERO, debt1.getRemainingAmount());

        assertEquals(DebtStatus.PENDING, debt2.getStatus());
        assertEquals(new BigDecimal("600000.00"), debt2.getRemainingAmount());

        assertEquals(new BigDecimal("600000.00"), supplier.getCurrentDebt());
        verify(supplierDebtRepository, times(1)).saveAll(anyList());
        verify(supplierDebtRepository, times(1)).save(any(SupplierDebt.class));
    }

    @Test
    @DisplayName("Thanh toán nợ thất bại khi số tiền không hợp lệ")
    void paySupplierDebt_InvalidAmount() {
        PaySupplierDebtRequest request = PaySupplierDebtRequest.builder()
                .supplierId("sup-1")
                .amount(BigDecimal.ZERO)
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("sup-1", "hh-1")).thenReturn(Optional.of(supplier));

        AppException ex = assertThrows(AppException.class, () -> supplierDebtService.paySupplierDebt("chuho_test", request));
        assertEquals(ErrorCode.INVALID_SUPPLIER_PAYMENT_AMOUNT, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lấy tổng quan công nợ nhà cung cấp thành công")
    void getSupplierDebtSummary_Success() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierDebtRepository.sumTotalOutstandingDebtByHouseholdId("hh-1")).thenReturn(new BigDecimal("2000000.00"));
        when(supplierDebtRepository.countSuppliersWithDebtByHouseholdId("hh-1")).thenReturn(3L);
        when(supplierDebtRepository.sumTotalOverdueDebtByHouseholdId("hh-1")).thenReturn(new BigDecimal("500000.00"));

        SupplierDebtSummaryResponse summary = supplierDebtService.getSupplierDebtSummary("chuho_test");

        assertNotNull(summary);
        assertEquals(new BigDecimal("2000000.00"), summary.getTotalOutstandingDebt());
        assertEquals(3L, summary.getTotalSuppliersWithDebt());
        assertEquals(new BigDecimal("500000.00"), summary.getTotalOverdueDebt());
    }

    @Test
    @DisplayName("P1-01: Ghi nhận giảm trừ công nợ khi trả hàng trên phiếu nhập đã thanh toán (currentDebt âm và lưu remainingAmount)")
    void recordSupplierReturnDebtReduction_FullyPaidReceipt_AllowsNegativeDebtAndTracksRefund() {
        supplier.setCurrentDebt(BigDecimal.ZERO);
        GoodsReceipt receipt = GoodsReceipt.builder()
                .id("rec-paid")
                .receiptNumber("NK-PAID-01")
                .totalAmount(new BigDecimal("1000000.00"))
                .household(household)
                .supplier(supplier)
                .build();

        BigDecimal returnAmount = new BigDecimal("200000.00");
        String returnNumber = "TH-001";

        when(supplierDebtRepository.findByGoodsReceiptIdAndHouseholdIdAndType(
                eq("rec-paid"), eq("hh-1"), eq(DebtType.DEBT_CREATED)))
                .thenReturn(Collections.emptyList());
        when(supplierDebtRepository.findBySupplierIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                eq("sup-1"), eq("hh-1"), anyList(), eq(DebtType.DEBT_CREATED)))
                .thenReturn(Collections.emptyList());

        org.mockito.ArgumentCaptor<SupplierDebt> captor = org.mockito.ArgumentCaptor.forClass(SupplierDebt.class);

        supplierDebtService.recordSupplierReturnDebtReduction(
                household, supplier, receipt, returnAmount, returnNumber, currentUser
        );

        verify(supplierRepository, times(1)).save(supplier);
        assertEquals(new BigDecimal("-200000.00"), supplier.getCurrentDebt());

        verify(supplierDebtRepository, times(1)).save(captor.capture());
        SupplierDebt savedDebt = captor.getValue();
        assertNotNull(savedDebt);
        assertEquals(returnAmount, savedDebt.getAmount());
        assertEquals(returnAmount, savedDebt.getRemainingAmount());
        assertEquals(DebtType.DEBT_PAID, savedDebt.getType());
        assertTrue(savedDebt.getNotes().contains("Khoản tiền NCC cần hoàn lại / dư có"));
    }

    @Test
    @DisplayName("P1-02: Thu tiền hoàn từ NCC thành công đưa công nợ từ âm về 0")
    void receiveSupplierRefund_Success_RestoresDebtToZero() {
        supplier.setCurrentDebt(new BigDecimal("-500000.00"));
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("sup-1", "hh-1"))
                .thenReturn(Optional.of(supplier));

        com.sales.dto.request.ReceiveSupplierRefundRequest request =
                com.sales.dto.request.ReceiveSupplierRefundRequest.builder()
                        .supplierId("sup-1")
                        .amount(new BigDecimal("500000.00"))
                        .paymentMethod("CASH")
                        .notes("NCC hoàn lại tiền mặt")
                        .build();

        when(supplierDebtRepository.save(any(SupplierDebt.class))).thenAnswer(invocation -> {
            SupplierDebt d = invocation.getArgument(0);
            d.setId("refund-debt-1");
            return d;
        });

        SupplierDebtResponse response = supplierDebtService.receiveSupplierRefund("owner_test", request);

        assertNotNull(response);
        assertEquals(0, BigDecimal.ZERO.compareTo(supplier.getCurrentDebt()));
        verify(supplierRepository, times(1)).save(supplier);
        verify(supplierDebtRepository, times(1)).save(any(SupplierDebt.class));
    }

    @Test
    @DisplayName("P1-03: Chặn thu tiền hoàn khi NCC không có nợ âm (không có tiền cần hoàn)")
    void receiveSupplierRefund_NoRefundableDebt_ThrowsException() {
        supplier.setCurrentDebt(new BigDecimal("100000.00")); // Đang nợ dương
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("sup-1", "hh-1"))
                .thenReturn(Optional.of(supplier));

        com.sales.dto.request.ReceiveSupplierRefundRequest request =
                com.sales.dto.request.ReceiveSupplierRefundRequest.builder()
                        .supplierId("sup-1")
                        .amount(new BigDecimal("50000.00"))
                        .build();

        AppException ex = assertThrows(AppException.class, () ->
                supplierDebtService.receiveSupplierRefund("owner_test", request));
        assertEquals(ErrorCode.SUPPLIER_HAS_NO_REFUNDABLE_DEBT, ex.getErrorCode());
    }

    @Test
    @DisplayName("P1-04: Chặn thu tiền hoàn vượt quá số tiền NCC đang nợ lại")
    void receiveSupplierRefund_AmountExceedsDebt_ThrowsException() {
        supplier.setCurrentDebt(new BigDecimal("-200000.00")); // Nợ âm 200k
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("sup-1", "hh-1"))
                .thenReturn(Optional.of(supplier));

        com.sales.dto.request.ReceiveSupplierRefundRequest request =
                com.sales.dto.request.ReceiveSupplierRefundRequest.builder()
                        .supplierId("sup-1")
                        .amount(new BigDecimal("300000.00")) // Yêu cầu thu 300k
                        .build();

        AppException ex = assertThrows(AppException.class, () ->
                supplierDebtService.receiveSupplierRefund("owner_test", request));
        assertEquals(ErrorCode.REFUND_AMOUNT_EXCEEDS_DEBT, ex.getErrorCode());
    }
}

