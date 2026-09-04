package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.AssignPosEmployeeRequest;
import com.sales.dto.response.PosEmployeeResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.PosEmployeeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PosEmployeeServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PointOfSaleRepository pointOfSaleRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache userCache;

    @InjectMocks
    private PosEmployeeServiceImpl posEmployeeService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private PointOfSale branchPos;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build();
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .taxCode("0123456789")
                .name("Tạp Hóa Bà Năm")
                .address("123 Lê Lợi")
                .phoneNumber("0901234567")
                .build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("chuho")
                .fullName("Bà Năm")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();

        staffUser = User.builder()
                .id("user-staff-01")
                .username("bannam01")
                .fullName("Nguyễn Văn Bán Hàng")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build();

        branchPos = PointOfSale.builder()
                .id("pos-002")
                .household(household)
                .posCode("POS-02")
                .name("Điểm bán Chi nhánh 2")
                .address("456 Nguyễn Huệ")
                .isDefault(false)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Gán nhân viên vào điểm bán thành công")
    void testAssignEmployeesToPos_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(userRepository.findById("user-staff-01")).thenReturn(Optional.of(staffUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cacheManager.getCache("users")).thenReturn(userCache);

        AssignPosEmployeeRequest request = AssignPosEmployeeRequest.builder()
                .userIds(List.of("user-staff-01"))
                .build();

        List<PosEmployeeResponse> result = posEmployeeService.assignEmployeesToPos("chuho", "pos-002", request);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("user-staff-01", result.get(0).getId());
        assertEquals("pos-002", result.get(0).getPointOfSaleId());
        assertEquals("Điểm bán Chi nhánh 2", result.get(0).getPointOfSaleName());

        verify(userRepository).save(any(User.class));
        verify(userCache).evict("bannam01");
    }

    @Test
    @DisplayName("Gán nhân viên thất bại khi không phải chủ hộ")
    void testAssignEmployeesToPos_Forbidden() {
        when(userRepository.findByUsername("bannam01")).thenReturn(Optional.of(staffUser));

        AssignPosEmployeeRequest request = AssignPosEmployeeRequest.builder()
                .userIds(List.of("user-staff-01"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                posEmployeeService.assignEmployeesToPos("bannam01", "pos-002", request));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Gán nhân viên thất bại khi cố tình gán chủ hộ vào 1 điểm bán cố định")
    void testAssignEmployeesToPos_CannotAssignOwner() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(userRepository.findById("user-owner")).thenReturn(Optional.of(ownerUser));

        AssignPosEmployeeRequest request = AssignPosEmployeeRequest.builder()
                .userIds(List.of("user-owner"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                posEmployeeService.assignEmployeesToPos("chuho", "pos-002", request));

        assertEquals(ErrorCode.CANNOT_ASSIGN_OWNER_TO_POS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lấy danh sách nhân viên theo điểm bán thành công")
    void testGetEmployeesByPos_Success() {
        staffUser.setPointOfSale(branchPos);
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(userRepository.findByHouseholdIdAndPointOfSaleIdAndDeletedAtIsNull("house-001", "pos-002"))
                .thenReturn(List.of(staffUser));

        List<PosEmployeeResponse> result = posEmployeeService.getEmployeesByPos("chuho", "pos-002");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("bannam01", result.get(0).getUsername());
        assertEquals("pos-002", result.get(0).getPointOfSaleId());
    }

    @Test
    @DisplayName("Gỡ nhân viên khỏi điểm bán thành công")
    void testUnassignEmployeeFromPos_Success() {
        staffUser.setPointOfSale(branchPos);
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(userRepository.findById("user-staff-01")).thenReturn(Optional.of(staffUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cacheManager.getCache("users")).thenReturn(userCache);

        posEmployeeService.unassignEmployeeFromPos("chuho", "pos-002", "user-staff-01");

        assertNull(staffUser.getPointOfSale());
        verify(userRepository).save(staffUser);
    }
}
