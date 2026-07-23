package com.viet.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.TaxRateRequest;
import com.viet.sales.dto.response.TaxRateResponse;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.TaxRate;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.TaxRateRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.TaxRateServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaxRateServiceImplTest {

    @Mock
    private TaxRateRepository taxRateRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TaxRateServiceImpl taxRateService;

    private User ownerUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .taxCode("0123456789")
                .name("Cửa Hàng Việt")
                .build();

        ownerUser = User.builder()
                .id("user-001")
                .username("owner")
                .role(ownerRole)
                .household(household)
                .build();
    }

    @Test
    @DisplayName("NCL-09-CN-003-TC-01: Nhập mức thuế hợp lệ lưu thành công")
    void createTaxRate_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(taxRateRepository.existsByHouseholdIdAndName("house-001", "VAT 8%")).thenReturn(false);
        when(taxRateRepository.save(any(TaxRate.class))).thenAnswer(invocation -> {
            TaxRate rate = invocation.getArgument(0);
            rate.setId("tax-001");
            return rate;
        });

        TaxRateRequest request = TaxRateRequest.builder()
                .name("VAT 8%")
                .ratePercentage(new BigDecimal("8.00"))
                .isActive(true)
                .build();

        TaxRateResponse response = taxRateService.createTaxRate("owner", request);

        assertNotNull(response);
        assertEquals("VAT 8%", response.getName());
        assertEquals(new BigDecimal("8.00"), response.getRatePercentage());
        assertTrue(response.getIsActive());

        verify(taxRateRepository, times(1)).save(any(TaxRate.class));
        verify(activityLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("NCL-09-CN-003-TC-02: Tỷ lệ phần trăm âm ném ngoại lệ INVALID_TAX_RATE_PERCENTAGE")
    void createTaxRate_NegativeRate_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        TaxRateRequest request = TaxRateRequest.builder()
                .name("Thuế âm")
                .ratePercentage(new BigDecimal("-5.00"))
                .isActive(true)
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                taxRateService.createTaxRate("owner", request)
        );

        assertEquals(ErrorCode.INVALID_TAX_RATE_PERCENTAGE, exception.getErrorCode());
        verify(taxRateRepository, never()).save(any());
    }

    @Test
    @DisplayName("NCL-09-CN-003-TC-03: Tên trùng lặp ném ngoại lệ TAX_RATE_ALREADY_EXISTS")
    void createTaxRate_DuplicateName_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(taxRateRepository.existsByHouseholdIdAndName("house-001", "VAT 10%")).thenReturn(true);

        TaxRateRequest request = TaxRateRequest.builder()
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                taxRateService.createTaxRate("owner", request)
        );

        assertEquals(ErrorCode.TAX_RATE_ALREADY_EXISTS, exception.getErrorCode());
        verify(taxRateRepository, never()).save(any());
    }

    @Test
    @DisplayName("Bật/tắt trạng thái hiệu lực thuế suất thành công")
    void toggleTaxRateStatus_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        TaxRate existing = TaxRate.builder()
                .id("tax-001")
                .household(household)
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build();
        when(taxRateRepository.findByIdAndHouseholdId("tax-001", "house-001")).thenReturn(Optional.of(existing));
        when(taxRateRepository.save(any(TaxRate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaxRateResponse response = taxRateService.toggleTaxRateStatus("owner", "tax-001", false);

        assertNotNull(response);
        assertFalse(response.getIsActive());

        verify(activityLogRepository, times(1)).save(any());
    }
}
