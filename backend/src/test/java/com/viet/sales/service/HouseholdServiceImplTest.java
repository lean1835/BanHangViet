package com.viet.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.UpdateHouseholdRequest;
import com.viet.sales.dto.response.HouseholdResponse;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.BusinessHouseholdRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.HouseholdServiceImpl;
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
class HouseholdServiceImplTest {

    @Mock
    private BusinessHouseholdRepository householdRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private HouseholdServiceImpl householdService;

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
                .address("123 Phố Huế")
                .phoneNumber("0987654321")
                .representativeName("Nguyễn Văn A")
                .revenueThresholdEnabled(false)
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
    @DisplayName("NCL-09-CN-001-TC-01: Cập nhật thông tin hộ kinh doanh hợp lệ thành công")
    void updateMyHousehold_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(householdRepository.save(any(BusinessHousehold.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateHouseholdRequest request = UpdateHouseholdRequest.builder()
                .name("Cửa Hàng Bán Hàng Việt Mới")
                .taxCode("9876543210")
                .address("456 Giải Phóng")
                .phoneNumber("0912345678")
                .representativeName("Nguyễn Văn B")
                .build();

        HouseholdResponse response = householdService.updateMyHousehold("owner", request);

        assertNotNull(response);
        assertEquals("Cửa Hàng Bán Hàng Việt Mới", response.getName());
        assertEquals("9876543210", response.getTaxCode());
        assertEquals("456 Giải Phóng", response.getAddress());
        assertEquals("0912345678", response.getPhoneNumber());

        verify(householdRepository, times(1)).save(any(BusinessHousehold.class));
        verify(activityLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("NCL-09-CN-001-TC-02: MST sai định dạng ném ngoại lệ INVALID_TAX_CODE")
    void updateMyHousehold_InvalidTaxCode_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        UpdateHouseholdRequest request = UpdateHouseholdRequest.builder()
                .name("Cửa Hàng Bán Hàng Việt")
                .taxCode("12345") // Sai quy định (không đủ 10 hoặc 13 số)
                .address("123 Phố Huế")
                .phoneNumber("0987654321")
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                householdService.updateMyHousehold("owner", request)
        );

        assertEquals(ErrorCode.INVALID_TAX_CODE, exception.getErrorCode());
        verify(householdRepository, never()).save(any());
    }

    @Test
    @DisplayName("Người dùng không phải chủ hộ ném ngoại lệ FORBIDDEN")
    void updateMyHousehold_NotOwner_ThrowsForbidden() {
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(staffUser));

        UpdateHouseholdRequest request = UpdateHouseholdRequest.builder()
                .name("Cửa Hàng Mới")
                .taxCode("0123456789")
                .address("123 Phố Huế")
                .phoneNumber("0987654321")
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                householdService.updateMyHousehold("staff", request)
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }
}
