package com.viet.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.InvoiceTemplateRequest;
import com.viet.sales.dto.response.InvoiceTemplateResponse;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.InvoiceTemplate;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.InvoiceTemplateRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.InvoiceTemplateServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceTemplateServiceImplTest {

    @Mock
    private InvoiceTemplateRepository invoiceTemplateRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private InvoiceTemplateServiceImpl invoiceTemplateService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        Role staffRole = Role.builder().code("VT-02").name("Bán hàng").build();

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
    @DisplayName("NCL-09-CN-002-TC-01: Nhập ký hiệu và mẫu số hợp lệ theo TT78 lưu mẫu thành công")
    void updateTemplate_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(invoiceTemplateRepository.findByHouseholdId("house-001")).thenReturn(Optional.empty());
        when(invoiceTemplateRepository.save(any(InvoiceTemplate.class))).thenAnswer(invocation -> {
            InvoiceTemplate template = invocation.getArgument(0);
            template.setId("template-001");
            return template;
        });

        InvoiceTemplateRequest request = InvoiceTemplateRequest.builder()
                .invoicePattern("1")
                .invoiceSymbol("C24TAA")
                .title("HÓA ĐƠN BÁN HÀNG VIỆT")
                .footerNote("Cảm ơn quý khách")
                .build();

        InvoiceTemplateResponse response = invoiceTemplateService.updateTemplate("owner", request);

        assertNotNull(response);
        assertEquals("1", response.getInvoicePattern());
        assertEquals("C24TAA", response.getInvoiceSymbol());
        assertEquals("HÓA ĐƠN BÁN HÀNG VIỆT", response.getTitle());

        verify(invoiceTemplateRepository, times(1)).save(any(InvoiceTemplate.class));
        verify(activityLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("NCL-09-CN-002-TC-02: Ký hiệu sai quy định TT78 ném ngoại lệ INVALID_INVOICE_SYMBOL")
    void updateTemplate_InvalidSymbol_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        InvoiceTemplateRequest request = InvoiceTemplateRequest.builder()
                .invoicePattern("1")
                .invoiceSymbol("INVALID_SYMBOL") // Sai quy định Thông tư 78
                .title("HÓA ĐƠN BÁN HÀNG")
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                invoiceTemplateService.updateTemplate("owner", request)
        );

        assertEquals(ErrorCode.INVALID_INVOICE_SYMBOL, exception.getErrorCode());
        verify(invoiceTemplateRepository, never()).save(any());
    }

    @Test
    @DisplayName("Nhân viên bán hàng không được phép cập nhật mẫu hóa đơn")
    void updateTemplate_UnauthorizedRole_ThrowsForbidden() {
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(staffUser));

        InvoiceTemplateRequest request = InvoiceTemplateRequest.builder()
                .invoicePattern("1")
                .invoiceSymbol("C24TAA")
                .title("HÓA ĐƠN BÁN HÀNG")
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                invoiceTemplateService.updateTemplate("staff", request)
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }
}
