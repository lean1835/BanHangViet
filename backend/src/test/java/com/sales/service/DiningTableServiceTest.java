package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateDiningTableRequest;
import com.sales.dto.request.UpdateDiningTableRequest;
import com.sales.dto.response.DiningTableResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.BusinessHouseholdSettings;
import com.sales.entity.DiningTable;
import com.sales.entity.Order;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.DiningTableRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.DiningTableServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiningTableServiceTest {

    @Mock
    private DiningTableRepository diningTableRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private DiningTableServiceImpl diningTableService;

    private BusinessHousehold household;
    private User ownerUser;
    private DiningTable sampleTable;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("household-001")
                .name("Nhà hàng Hương Sen")
                .build();

        ownerUser = User.builder()
                .id("user-001")
                .username("chuhuyen")
                .role(Role.builder().code("VT-01").build())
                .household(household)
                .build();

        sampleTable = DiningTable.builder()
                .id("table-001")
                .household(household)
                .name("Bàn 1")
                .area("Tầng 1")
                .seatCapacity(4)
                .sortOrder(1)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Lấy danh sách bàn ăn thành công kèm trạng thái phục vụ và cảnh báo quá hạn")
    void getTables_success() {
        when(userRepository.findByUsername("chuhuyen")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("household-001")).thenReturn(Optional.of(
                BusinessHouseholdSettings.builder().maxOrderHoldingHours(4).build()
        ));
        when(diningTableRepository.findByHouseholdIdOrderBySortOrderAscNameAsc("household-001"))
                .thenReturn(List.of(sampleTable));

        // Bàn 1 đang có đơn tạo dở cách đây 5 tiếng (quá 4 giờ)
        Order heldOrder = Order.builder()
                .id("order-001")
                .orderLabel("Khách bàn 1")
                .diningTable(sampleTable)
                .createdAt(LocalDateTime.now().minusHours(5))
                .status("CREATING")
                .build();
        when(orderRepository.findByHouseholdIdAndStatusAndDiningTableIsNotNullAndDeletedAtIsNullOrderByCreatedAtDesc("household-001", "CREATING"))
                .thenReturn(List.of(heldOrder));

        List<DiningTableResponse> results = diningTableService.getTables("chuhuyen", null, null);

        assertNotNull(results);
        assertEquals(1, results.size());
        DiningTableResponse res = results.get(0);
        assertEquals("table-001", res.getId());
        assertEquals("Bàn 1", res.getName());
        assertTrue(res.getIsOccupied());
        assertEquals("order-001", res.getCurrentOrderId());
        assertEquals("Khách bàn 1", res.getCurrentOrderLabel());
        assertTrue(res.getIsOverdue());
    }

    @Test
    @DisplayName("Lấy chi tiết bàn ăn thành công")
    void getTableById_success() {
        when(userRepository.findByUsername("chuhuyen")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("household-001")).thenReturn(Optional.of(
                BusinessHouseholdSettings.builder().maxOrderHoldingHours(4).build()
        ));
        when(diningTableRepository.findByIdAndHouseholdId("table-001", "household-001"))
                .thenReturn(Optional.of(sampleTable));
        when(orderRepository.findFirstByDiningTableIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc("table-001", "CREATING"))
                .thenReturn(Optional.empty());

        DiningTableResponse res = diningTableService.getTableById("chuhuyen", "table-001");

        assertNotNull(res);
        assertEquals("table-001", res.getId());
        assertFalse(res.getIsOccupied());
        assertFalse(res.getIsOverdue());
    }

    @Test
    @DisplayName("Tạo bàn ăn thành công khi tên chưa tồn tại trong cùng khu vực")
    void createTable_success() {
        CreateDiningTableRequest request = CreateDiningTableRequest.builder()
                .name("Bàn 2")
                .area("Tầng 1")
                .seatCapacity(6)
                .sortOrder(2)
                .isActive(true)
                .build();

        when(userRepository.findByUsername("chuhuyen")).thenReturn(Optional.of(ownerUser));
        when(diningTableRepository.existsByHouseholdIdAndNameAndArea("household-001", "Bàn 2", "Tầng 1"))
                .thenReturn(false);

        DiningTable saved = DiningTable.builder()
                .id("table-002")
                .household(household)
                .name("Bàn 2")
                .area("Tầng 1")
                .seatCapacity(6)
                .sortOrder(2)
                .isActive(true)
                .build();
        when(diningTableRepository.save(any(DiningTable.class))).thenReturn(saved);

        DiningTableResponse res = diningTableService.createTable("chuhuyen", request);

        assertNotNull(res);
        assertEquals("table-002", res.getId());
        assertEquals("Bàn 2", res.getName());
        assertFalse(res.getIsOccupied());
        verify(diningTableRepository, times(1)).save(any(DiningTable.class));
    }

    @Test
    @DisplayName("Tạo bàn ăn thất bại ném DINING_TABLE_NAME_DUPLICATED khi trùng tên trong khu vực")
    void createTable_duplicatedName_throwsException() {
        CreateDiningTableRequest request = CreateDiningTableRequest.builder()
                .name("Bàn 1")
                .area("Tầng 1")
                .build();

        when(userRepository.findByUsername("chuhuyen")).thenReturn(Optional.of(ownerUser));
        when(diningTableRepository.existsByHouseholdIdAndNameAndArea("household-001", "Bàn 1", "Tầng 1"))
                .thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> diningTableService.createTable("chuhuyen", request));
        assertEquals(ErrorCode.DINING_TABLE_NAME_DUPLICATED, ex.getErrorCode());
        verify(diningTableRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cập nhật bàn ăn thất bại khi vô hiệu hóa bàn đang có đơn dở dang")
    void updateTable_deactivateOccupiedTable_throwsException() {
        UpdateDiningTableRequest request = UpdateDiningTableRequest.builder()
                .name("Bàn 1")
                .area("Tầng 1")
                .isActive(false)
                .build();

        when(userRepository.findByUsername("chuhuyen")).thenReturn(Optional.of(ownerUser));
        when(diningTableRepository.findByIdAndHouseholdId("table-001", "household-001"))
                .thenReturn(Optional.of(sampleTable));
        when(diningTableRepository.existsByHouseholdIdAndNameAndAreaAndIdNot("household-001", "Bàn 1", "Tầng 1", "table-001"))
                .thenReturn(false);
        when(orderRepository.existsByDiningTableIdAndStatusAndDeletedAtIsNull("table-001", "CREATING"))
                .thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> diningTableService.updateTable("chuhuyen", "table-001", request));
        assertEquals(ErrorCode.DINING_TABLE_IN_USE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Xóa bàn ăn thất bại khi bàn đang có đơn hàng dở dang")
    void deleteTable_occupied_throwsException() {
        when(userRepository.findByUsername("chuhuyen")).thenReturn(Optional.of(ownerUser));
        when(diningTableRepository.findByIdAndHouseholdId("table-001", "household-001"))
                .thenReturn(Optional.of(sampleTable));
        when(orderRepository.existsByDiningTableIdAndStatusAndDeletedAtIsNull("table-001", "CREATING"))
                .thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> diningTableService.deleteTable("chuhuyen", "table-001"));
        assertEquals(ErrorCode.DINING_TABLE_IN_USE, ex.getErrorCode());
        verify(diningTableRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Xóa bàn ăn thành công khi bàn trống")
    void deleteTable_success() {
        when(userRepository.findByUsername("chuhuyen")).thenReturn(Optional.of(ownerUser));
        when(diningTableRepository.findByIdAndHouseholdId("table-001", "household-001"))
                .thenReturn(Optional.of(sampleTable));
        when(orderRepository.existsByDiningTableIdAndStatusAndDeletedAtIsNull("table-001", "CREATING"))
                .thenReturn(false);

        diningTableService.deleteTable("chuhuyen", "table-001");

        verify(diningTableRepository, times(1)).delete(sampleTable);
    }
}
