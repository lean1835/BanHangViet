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
import com.viet.sales.repository.ProductRepository;
import com.viet.sales.repository.TaxRateRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.ActivityLogHelper;
import com.viet.sales.service.classes.TaxRateServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaxRateServiceImplTest {

    @Mock
    private TaxRateRepository taxRateRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TaxRateServiceImpl taxRateService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();

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

        staffUser = User.builder()
                .id("user-002")
                .username("staff")
                .role(staffRole)
                .household(household)
                .build();
    }

    @Test
    @DisplayName("Lấy danh sách thuế suất theo Hộ kinh doanh thành công")
    void getAllTaxRates_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        TaxRate rate = TaxRate.builder()
                .id("tax-001")
                .household(household)
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build();

        when(taxRateRepository.findByHouseholdIdOrderByCreatedAtDesc("house-001")).thenReturn(List.of(rate));

        List<TaxRateResponse> responses = taxRateService.getAllTaxRates("owner");

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("VAT 10%", responses.get(0).getName());
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
        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(ownerUser), eq("CREATE_TAX_RATE"), eq("tax_rates"), eq("tax-001"), any(), any(), any(), any()
        );
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
    @DisplayName("Cập nhật thông tin thuế suất thành công")
    void updateTaxRate_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        TaxRate existing = TaxRate.builder()
                .id("tax-001")
                .household(household)
                .name("VAT 5%")
                .ratePercentage(new BigDecimal("5.00"))
                .isActive(true)
                .build();
        when(taxRateRepository.findByIdAndHouseholdId("tax-001", "house-001")).thenReturn(Optional.of(existing));
        when(taxRateRepository.existsByHouseholdIdAndNameAndIdNot("house-001", "VAT 8%", "tax-001")).thenReturn(false);
        when(taxRateRepository.save(any(TaxRate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaxRateRequest request = TaxRateRequest.builder()
                .name("VAT 8%")
                .ratePercentage(new BigDecimal("8.00"))
                .isActive(true)
                .build();

        TaxRateResponse response = taxRateService.updateTaxRate("owner", "tax-001", request);

        assertNotNull(response);
        assertEquals("VAT 8%", response.getName());
        assertEquals(new BigDecimal("8.00"), response.getRatePercentage());
    }

    @Test
    @DisplayName("Cập nhật ngắt hiệu lực thuế suất đang gán cho sản phẩm ném ngoại lệ TAX_RATE_IN_USE")
    void updateTaxRate_TaxRateInUse_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        TaxRate existing = TaxRate.builder()
                .id("tax-001")
                .household(household)
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build();
        when(taxRateRepository.findByIdAndHouseholdId("tax-001", "house-001")).thenReturn(Optional.of(existing));
        when(taxRateRepository.existsByHouseholdIdAndNameAndIdNot("house-001", "VAT 10%", "tax-001")).thenReturn(false);
        when(productRepository.existsByHouseholdIdAndTaxRateIdAndDeletedAtIsNull("house-001", "tax-001")).thenReturn(true);

        TaxRateRequest request = TaxRateRequest.builder()
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(false)
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                taxRateService.updateTaxRate("owner", "tax-001", request)
        );

        assertEquals(ErrorCode.TAX_RATE_IN_USE, exception.getErrorCode());
        verify(taxRateRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cập nhật tỷ lệ phần trăm của thuế suất đang gán cho sản phẩm ném ngoại lệ TAX_RATE_IN_USE")
    void updateTaxRate_RateChanged_TaxRateInUse_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        TaxRate existing = TaxRate.builder()
                .id("tax-001")
                .household(household)
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build();
        when(taxRateRepository.findByIdAndHouseholdId("tax-001", "house-001")).thenReturn(Optional.of(existing));
        when(taxRateRepository.existsByHouseholdIdAndNameAndIdNot("house-001", "VAT 10%", "tax-001")).thenReturn(false);
        when(productRepository.existsByHouseholdIdAndTaxRateIdAndDeletedAtIsNull("house-001", "tax-001")).thenReturn(true);

        TaxRateRequest request = TaxRateRequest.builder()
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("5.00")) // Đổi từ 10% xuống 5%
                .isActive(true)
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                taxRateService.updateTaxRate("owner", "tax-001", request)
        );

        assertEquals(ErrorCode.TAX_RATE_IN_USE, exception.getErrorCode());
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
        when(productRepository.existsByHouseholdIdAndTaxRateIdAndDeletedAtIsNull("house-001", "tax-001")).thenReturn(false);
        when(taxRateRepository.save(any(TaxRate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaxRateResponse response = taxRateService.toggleTaxRateStatus("owner", "tax-001", false);

        assertNotNull(response);
        assertFalse(response.getIsActive());

        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(ownerUser), eq("TOGGLE_TAX_RATE_STATUS"), eq("tax_rates"), eq("tax-001"), any(), any(), any(), any()
        );
    }

    @Test
    @DisplayName("Tắt hiệu lực thuế suất đang gán cho sản phẩm ném ngoại lệ TAX_RATE_IN_USE")
    void toggleTaxRateStatus_TaxRateInUse_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        TaxRate existing = TaxRate.builder()
                .id("tax-001")
                .household(household)
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build();
        when(taxRateRepository.findByIdAndHouseholdId("tax-001", "house-001")).thenReturn(Optional.of(existing));
        when(productRepository.existsByHouseholdIdAndTaxRateIdAndDeletedAtIsNull("house-001", "tax-001")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () ->
                taxRateService.toggleTaxRateStatus("owner", "tax-001", false)
        );

        assertEquals(ErrorCode.TAX_RATE_IN_USE, exception.getErrorCode());
        verify(taxRateRepository, never()).save(any());
    }

    @Test
    @DisplayName("Nhân viên không có quyền VT-01/VT-03 bị ném ngoại lệ FORBIDDEN")
    void validateUserAndHousehold_ForbiddenRole() {
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(staffUser));

        AppException exception = assertThrows(AppException.class, () ->
                taxRateService.getAllTaxRates("staff")
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    @DisplayName("Tên mức thuế null hoặc khoảng trắng ném ngoại lệ INVALID_INPUT")
    void createTaxRate_NullOrBlankName_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        TaxRateRequest requestBlank = TaxRateRequest.builder()
                .name("   ")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                taxRateService.createTaxRate("owner", requestBlank)
        );

        assertEquals(ErrorCode.INVALID_INPUT, exception.getErrorCode());
        verify(taxRateRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tỷ lệ phần trăm vượt quá 100% ném ngoại lệ INVALID_TAX_RATE_PERCENTAGE")
    void createTaxRate_RateExceeds100_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        TaxRateRequest request = TaxRateRequest.builder()
                .name("Thuế quá cao")
                .ratePercentage(new BigDecimal("105.00"))
                .isActive(true)
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                taxRateService.createTaxRate("owner", request)
        );

        assertEquals(ErrorCode.INVALID_TAX_RATE_PERCENTAGE, exception.getErrorCode());
        verify(taxRateRepository, never()).save(any());
    }
}
