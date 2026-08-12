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
}
