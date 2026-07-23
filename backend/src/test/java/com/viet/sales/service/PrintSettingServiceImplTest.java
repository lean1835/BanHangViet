package com.viet.sales.service;

import com.viet.sales.dto.request.PrintSettingRequest;
import com.viet.sales.dto.response.PrintSettingResponse;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.PrintSetting;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.PrintSettingRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.PrintSettingServiceImpl;
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
class PrintSettingServiceImplTest {

    @Mock
    private PrintSettingRepository printSettingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PrintSettingServiceImpl printSettingService;

    private User ownerUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        household = BusinessHousehold.builder()
                .id("house-001")
                .taxCode("0123456789")
                .name("Hộ Kinh Doanh Mẫu")
                .build();

        ownerUser = User.builder()
                .id("user-001")
                .username("owner")
                .role(ownerRole)
                .household(household)
                .build();
    }

    @Test
    @DisplayName("NCL-09-CN-004-TC-01: Lấy cấu hình máy in thành công, tạo mặc định nếu chưa tồn tại")
    void getMyPrintSetting_CreatesDefault_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(printSettingRepository.findByHouseholdId("house-001")).thenReturn(Optional.empty());
        when(printSettingRepository.save(any(PrintSetting.class))).thenAnswer(invocation -> {
            PrintSetting s = invocation.getArgument(0);
            s.setId("print-001");
            return s;
        });

        PrintSettingResponse response = printSettingService.getMyPrintSetting("owner");

        assertNotNull(response);
        assertEquals("K80", response.getPaperSize());
        assertEquals(1, response.getPrintCopies());
        assertFalse(response.getAutoPrint());
        verify(printSettingRepository, times(1)).save(any(PrintSetting.class));
    }

    @Test
    @DisplayName("NCL-09-CN-004-TC-01: Chọn khổ giấy và số liên hợp lệ -> Lưu cấu hình thành công")
    void updateMyPrintSetting_ValidInput_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        PrintSetting existing = PrintSetting.builder()
                .id("print-001")
                .household(household)
                .paperSize("K80")
                .printCopies(1)
                .autoPrint(false)
                .build();
        when(printSettingRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(existing));
        when(printSettingRepository.save(any(PrintSetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PrintSettingRequest request = PrintSettingRequest.builder()
                .paperSize("A4")
                .printCopies(2)
                .autoPrint(true)
                .build();

        PrintSettingResponse response = printSettingService.updateMyPrintSetting("owner", request);

        assertNotNull(response);
        assertEquals("A4", response.getPaperSize());
        assertEquals(2, response.getPrintCopies());
        assertTrue(response.getAutoPrint());
        verify(printSettingRepository, times(1)).save(any(PrintSetting.class));
    }
}
