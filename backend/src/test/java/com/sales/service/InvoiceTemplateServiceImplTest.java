package com.sales.service;

import com.sales.dto.request.InvoiceTemplateRequest;
import com.sales.dto.response.InvoiceTemplateResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.InvoiceTemplate;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.InvoiceTemplateRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.InvoiceTemplateServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceTemplateServiceImplTest {

    @Mock
    private InvoiceTemplateRepository invoiceTemplateRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InvoiceTemplateServiceImpl invoiceTemplateService;

    private User ownerUser;
    private BusinessHousehold household;
    private InvoiceTemplate existingTemplate;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        household = BusinessHousehold.builder().id("house-001").name("Hộ kinh doanh Bán Hàng Việt").build();

        ownerUser = User.builder()
                .id("user-001")
                .username("owner")
                .role(ownerRole)
                .household(household)
                .build();

        existingTemplate = InvoiceTemplate.builder()
                .id("tpl-001")
                .household(household)
                .invoicePattern("1C26TAA")
                .invoiceSymbol("HUH")
                .title("HÓA ĐƠN KHỞI TẠO TỪ MÁY TÍNH TIỀN")
                .footerNote("Cảm ơn quý khách đã mua hàng tại Hộ kinh doanh Bán Hàng Việt!")
                .build();
    }

    @Test
    @DisplayName("Lấy mẫu hóa đơn thành công khi đã có trong DB")
    void getTemplateByHousehold_Success_Existing() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(invoiceTemplateRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(existingTemplate));

        InvoiceTemplateResponse response = invoiceTemplateService.getTemplateByHousehold("owner");

        assertThat(response).isNotNull();
        assertThat(response.getInvoicePattern()).isEqualTo("1C26TAA");
        assertThat(response.getInvoiceSymbol()).isEqualTo("HUH");
        assertThat(response.getTitle()).isEqualTo("HÓA ĐƠN KHỞI TẠO TỪ MÁY TÍNH TIỀN");
    }

    @Test
    @DisplayName("Lấy mẫu hóa đơn tự động cấp mẫu mặc định khi chưa có trong DB")
    void getTemplateByHousehold_Success_AutoCreateDefault() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(invoiceTemplateRepository.findByHouseholdId("house-001")).thenReturn(Optional.empty());
        when(invoiceTemplateRepository.save(any(InvoiceTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        InvoiceTemplateResponse response = invoiceTemplateService.getTemplateByHousehold("owner");

        assertThat(response).isNotNull();
        assertThat(response.getInvoicePattern()).isEqualTo("1");
        assertThat(response.getInvoiceSymbol()).isEqualTo("1C26TAA");
        verify(invoiceTemplateRepository, times(1)).save(any(InvoiceTemplate.class));
    }

    @Test
    @DisplayName("Cập nhật mẫu hóa đơn thành công bởi VT-01 (Chủ hộ)")
    void updateTemplate_Success_Owner() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(invoiceTemplateRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(existingTemplate));
        when(invoiceTemplateRepository.save(any(InvoiceTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        InvoiceTemplateRequest request = InvoiceTemplateRequest.builder()
                .invoicePattern("1C26TAA")
                .invoiceSymbol("HUH")
                .title("HÓA ĐƠN GIÁ TRỊ GIA TĂNG MỚI")
                .footerNote("Lời cảm ơn mới")
                .build();

        InvoiceTemplateResponse response = invoiceTemplateService.updateTemplate("owner", request);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("HÓA ĐƠN GIÁ TRỊ GIA TĂNG MỚI");
        assertThat(response.getFooterNote()).isEqualTo("Lời cảm ơn mới");
    }

    @Test
    @DisplayName("Từ chối cập nhật mẫu hóa đơn nếu vai trò không phải VT-01 hoặc VT-03")
    void updateTemplate_Forbidden_Staff() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        User staffUser = User.builder().id("user-002").username("staff").role(staffRole).household(household).build();

        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(staffUser));

        InvoiceTemplateRequest request = InvoiceTemplateRequest.builder()
                .invoicePattern("1C26TAA")
                .invoiceSymbol("HUH")
                .title("NCL-09")
                .build();

        assertThatThrownBy(() -> invoiceTemplateService.updateTemplate("staff", request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
    }
}
