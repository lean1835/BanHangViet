package com.sales.service;

import com.sales.dto.request.CreateInvoiceNumberRangeRequest;
import com.sales.dto.response.InvoiceNumberRangeResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.InvoiceNumberRange;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceNumberRangeRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.InvoiceNumberRangeServiceImpl;
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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceNumberRangeServiceImplTest {

    @Mock
    private InvoiceNumberRangeRepository rangeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @InjectMocks
    private InvoiceNumberRangeServiceImpl rangeService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private InvoiceNumberRange activeRange;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Hộ Tạp Hóa Việt")
                .taxCode("0123456789")
                .build();

        Role roleOwner = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        Role roleStaff = Role.builder().id(2).code("VT-02").name("Nhân viên").build();

        ownerUser = User.builder()
                .id("user-001")
                .username("chuho")
                .household(household)
                .role(roleOwner)
                .build();

        staffUser = User.builder()
                .id("user-002")
                .username("nhanvien")
                .household(household)
                .role(roleStaff)
                .build();

        activeRange = InvoiceNumberRange.builder()
                .id("range-001")
                .household(household)
                .invoicePattern("1")
                .invoiceSymbol("C26TAA")
                .startNumber(1)
                .endNumber(100)
                .currentNumber(10)
                .warningThreshold(20)
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("NCL-04-CN-009-TC-01: Khai báo dải số hợp lệ bởi Chủ hộ (VT-01)")
    void createRange_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(rangeRepository.findOverlappingRanges("house-001", "1", "C26TAA")).thenReturn(Collections.emptyList());
        when(rangeRepository.save(any(InvoiceNumberRange.class))).thenAnswer(inv -> {
            InvoiceNumberRange r = inv.getArgument(0);
            r.setId("range-new");
            return r;
        });

        CreateInvoiceNumberRangeRequest req = CreateInvoiceNumberRangeRequest.builder()
                .invoicePattern("1")
                .invoiceSymbol("C26TAA")
                .startNumber(1)
                .endNumber(500)
                .warningThreshold(50)
                .build();

        InvoiceNumberRangeResponse response = rangeService.createRange("chuho", req);

        assertThat(response).isNotNull();
        assertThat(response.getStartNumber()).isEqualTo(1);
        assertThat(response.getEndNumber()).isEqualTo(500);
        assertThat(response.getRemainingCount()).isEqualTo(500);
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("NCL-04-CN-009: Khai báo dải số bị trùng lặp -> Ném exception INVOICE_RANGE_OVERLAP (F-05)")
    void createRange_Overlapping_ThrowsException() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(rangeRepository.findOverlappingRanges("house-001", "1", "C26TAA")).thenReturn(List.of(activeRange));

        CreateInvoiceNumberRangeRequest req = CreateInvoiceNumberRangeRequest.builder()
                .invoicePattern("1")
                .invoiceSymbol("C26TAA")
                .startNumber(50)
                .endNumber(150)
                .warningThreshold(50)
                .build();

        assertThatThrownBy(() -> rangeService.createRange("chuho", req))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.INVOICE_RANGE_OVERLAP.getMessage());
    }

    @Test
    @DisplayName("NCL-04-CN-009: Nhân viên bán hàng (VT-02) khai báo dải số -> Bị chặn 403 FORBIDDEN")
    void createRange_StaffForbidden() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));

        CreateInvoiceNumberRangeRequest req = CreateInvoiceNumberRangeRequest.builder()
                .invoicePattern("1")
                .invoiceSymbol("C26TAA")
                .startNumber(1)
                .endNumber(500)
                .warningThreshold(50)
                .build();

        assertThatThrownBy(() -> rangeService.createRange("nhanvien", req))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.FORBIDDEN.getMessage());
    }

    @Test
    @DisplayName("NCL-04-CN-009-TC-01: Cấp số tuần tự và giảm số còn lại khi dải số bình thường")
    void allocateNextInvoiceNumber_Success() {
        when(rangeRepository.findActiveRangesForUpdate("house-001")).thenReturn(List.of(activeRange));
        when(rangeRepository.save(any(InvoiceNumberRange.class))).thenAnswer(inv -> inv.getArgument(0));

        String invoiceNumber = rangeService.allocateNextInvoiceNumber("house-001");

        assertThat(invoiceNumber).isEqualTo("00000011");
        assertThat(activeRange.getCurrentNumber()).isEqualTo(11);
        assertThat(activeRange.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("NCL-04-CN-009: Cấp số theo Pattern và Symbol chính xác (F-05)")
    void allocateNextInvoiceNumber_WithPatternAndSymbol_Success() {
        when(rangeRepository.findActiveRangesForUpdate("house-001", "1", "C26TAA")).thenReturn(List.of(activeRange));
        when(rangeRepository.save(any(InvoiceNumberRange.class))).thenAnswer(inv -> inv.getArgument(0));

        String invoiceNumber = rangeService.allocateNextInvoiceNumber("house-001", "1", "C26TAA");

        assertThat(invoiceNumber).isEqualTo("00000011");
        assertThat(activeRange.getCurrentNumber()).isEqualTo(11);
        assertThat(activeRange.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("NCL-04-CN-009-TC-02: Số còn lại <= warningThreshold -> Chuyển trạng thái WARNING_LOW")
    void allocateNextInvoiceNumber_WarningLow() {
        // Range 1 to 100, current = 80 -> next = 81 -> remaining = 19 <= 20
        activeRange.setCurrentNumber(80);
        when(rangeRepository.findActiveRangesForUpdate("house-001")).thenReturn(List.of(activeRange));

        String invoiceNumber = rangeService.allocateNextInvoiceNumber("house-001");

        assertThat(invoiceNumber).isEqualTo("00000081");
        assertThat(activeRange.getStatus()).isEqualTo("WARNING_LOW");
    }

    @Test
    @DisplayName("NCL-04-CN-009-TC-03: Dải số đã hết -> Ném exception INVOICE_RANGE_EXHAUSTED và chặn phát hành")
    void allocateNextInvoiceNumber_Exhausted() {
        activeRange.setCurrentNumber(100);
        activeRange.setStatus("EXHAUSTED");
        when(rangeRepository.findActiveRangesForUpdate("house-001")).thenReturn(List.of(activeRange));

        assertThatThrownBy(() -> rangeService.allocateNextInvoiceNumber("house-001"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.INVOICE_RANGE_EXHAUSTED.getMessage());
    }

    @Test
    @DisplayName("NCL-04-CN-009: Khai báo dải số trùng với dải số cũ đã EXHAUSTED -> Vẫn chặn INVOICE_RANGE_OVERLAP (F-02)")
    void createRange_OverlappingWithExhaustedRange_ThrowsException() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        InvoiceNumberRange exhaustedRange = InvoiceNumberRange.builder()
                .id("range-old")
                .household(household)
                .invoicePattern("1")
                .invoiceSymbol("C26TAA")
                .startNumber(1)
                .endNumber(100)
                .currentNumber(100)
                .warningThreshold(10)
                .status("EXHAUSTED")
                .build();

        when(rangeRepository.findOverlappingRanges("house-001", "1", "C26TAA")).thenReturn(List.of(exhaustedRange));

        CreateInvoiceNumberRangeRequest req = CreateInvoiceNumberRangeRequest.builder()
                .invoicePattern("1")
                .invoiceSymbol("C26TAA")
                .startNumber(50)
                .endNumber(150)
                .warningThreshold(20)
                .build();

        assertThatThrownBy(() -> rangeService.createRange("chuho", req))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.INVOICE_RANGE_OVERLAP.getMessage());
    }

    @Test
    @DisplayName("NCL-04-CN-009: Lấy danh sách dải số phân trang -> Precompute dailyRate 1 lần duy nhất (F-03)")
    void getAllRanges_PrecomputesDailyRateOnce() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        InvoiceNumberRange range2 = InvoiceNumberRange.builder()
                .id("range-002")
                .household(household)
                .invoicePattern("1")
                .invoiceSymbol("C26TBB")
                .startNumber(1)
                .endNumber(200)
                .currentNumber(50)
                .warningThreshold(20)
                .status("ACTIVE")
                .build();

        Page<InvoiceNumberRange> page = new PageImpl<>(List.of(activeRange, range2));
        when(rangeRepository.findByHouseholdIdAndDeletedAtIsNull(eq("house-001"), any(Pageable.class)))
                .thenReturn(page);
        when(eInvoiceRepository.countByHouseholdIdAndCreatedAtAfter(eq("house-001"), any(LocalDateTime.class)))
                .thenReturn(14L);

        var response = rangeService.getAllRanges("chuho", 0, 10);

        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getContent().get(0).getDailyConsumptionRate()).isEqualTo(2.0);
        assertThat(response.getContent().get(1).getDailyConsumptionRate()).isEqualTo(2.0);

        // Verify countByHouseholdIdAndCreatedAtAfter is called exactly once (prevent N+1 query)
        verify(eInvoiceRepository, times(1)).countByHouseholdIdAndCreatedAtAfter(eq("house-001"), any(LocalDateTime.class));
    }
}
