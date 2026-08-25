package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.AssignPosEmployeeRequest;
import com.sales.dto.request.InitPosInventoryRequest;
import com.sales.dto.request.PosInventoryItemRequest;
import com.sales.dto.request.UpdatePosInventoryRequest;
import com.sales.entity.*;
import com.sales.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PosEmployeeAndInventoryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointOfSaleRepository pointOfSaleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private PosInventoryRepository posInventoryRepository;

    private BusinessHousehold testHousehold;
    private User testOwner;
    private User testStaff;
    private PointOfSale pos1;
    private PointOfSale pos2;
    private Product product1;

    @BeforeEach
    public void setUp() {
        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));
        Role staffRole = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên bán hàng").build()));

        testHousehold = businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("9999888877")
                .name("Hộ kinh doanh Test POS")
                .address("123 Phố Test")
                .phoneNumber("0912345678")
                .build());

        testOwner = userRepository.save(User.builder()
                .household(testHousehold)
                .role(ownerRole)
                .username("test_owner_pos")
                .passwordHash("$2a$10$hash")
                .fullName("Chủ hộ Test POS")
                .phoneNumber("0912345678")
                .isActive(true)
                .build());

        testStaff = userRepository.save(User.builder()
                .household(testHousehold)
                .role(staffRole)
                .username("test_staff_pos")
                .passwordHash("$2a$10$hash")
                .fullName("Nhân viên Test POS")
                .phoneNumber("0987654321")
                .isActive(true)
                .build());

        pos1 = pointOfSaleRepository.save(PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-T1")
                .name("Quầy 1 - Điểm chính")
                .address("Số 1 Đường Test")
                .isDefault(true)
                .isActive(true)
                .build());

        pos2 = pointOfSaleRepository.save(PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-T2")
                .name("Quầy 2 - Chi nhánh")
                .address("Số 2 Đường Test")
                .isDefault(false)
                .isActive(true)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .household(testHousehold)
                .name("Thuế VAT 1%")
                .ratePercentage(BigDecimal.valueOf(1.00))
                .isActive(true)
                .build());

        product1 = productRepository.save(Product.builder()
                .household(testHousehold)
                .sku("SKU-TEST-001")
                .name("Sản phẩm Test 01")
                .unit("Cái")
                .price(BigDecimal.valueOf(50000))
                .stockQuantity(BigDecimal.valueOf(100))
                .taxRate(taxRate)
                .status("ACTIVE")
                .build());
    }

    @Test
    @DisplayName("API: Gán nhân viên vào điểm bán thành công")
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    public void testAssignEmployeeToPos_Success() throws Exception {
        AssignPosEmployeeRequest request = AssignPosEmployeeRequest.builder()
                .userIds(List.of(testStaff.getId()))
                .build();

        mockMvc.perform(post("/api/v1/points-of-sale/" + pos2.getId() + "/employees/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].pointOfSaleId").value(pos2.getId()));
    }

    @Test
    @DisplayName("API: Lấy danh sách nhân viên thuộc điểm bán")
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    public void testGetEmployeesByPos() throws Exception {
        testStaff.setPointOfSale(pos2);
        userRepository.save(testStaff);

        mockMvc.perform(get("/api/v1/points-of-sale/" + pos2.getId() + "/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].username").value("test_staff_pos"));
    }

    @Test
    @DisplayName("API: Khởi tạo tồn kho theo điểm bán")
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    public void testInitPosInventory_Success() throws Exception {
        InitPosInventoryRequest request = InitPosInventoryRequest.builder()
                .items(List.of(
                        PosInventoryItemRequest.builder()
                                .productId(product1.getId())
                                .stockQuantity(BigDecimal.valueOf(15))
                                .minStockQuantity(BigDecimal.valueOf(5))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/points-of-sale/" + pos2.getId() + "/inventories/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].productId").value(product1.getId()))
                .andExpect(jsonPath("$.result[0].stockQuantity").value(15.0));
    }

    @Test
    @DisplayName("API: Cập nhật tồn kho sản phẩm tại điểm bán")
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    public void testUpdatePosInventory_Success() throws Exception {
        posInventoryRepository.save(PosInventory.builder()
                .household(testHousehold)
                .pointOfSale(pos2)
                .product(product1)
                .stockQuantity(BigDecimal.valueOf(10))
                .minStockQuantity(BigDecimal.valueOf(3))
                .build());

        UpdatePosInventoryRequest request = UpdatePosInventoryRequest.builder()
                .stockQuantity(BigDecimal.valueOf(25))
                .minStockQuantity(BigDecimal.valueOf(8))
                .build();

        mockMvc.perform(put("/api/v1/points-of-sale/" + pos2.getId() + "/inventories/" + product1.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.stockQuantity").value(25.0))
                .andExpect(jsonPath("$.result.minStockQuantity").value(8.0));
    }

    @Test
    @DisplayName("API: Xem cảnh báo tồn kho tại điểm bán")
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    public void testGetLowStockWarningsByPos() throws Exception {
        posInventoryRepository.save(PosInventory.builder()
                .household(testHousehold)
                .pointOfSale(pos2)
                .product(product1)
                .stockQuantity(BigDecimal.valueOf(2))
                .minStockQuantity(BigDecimal.valueOf(5))
                .build());

        mockMvc.perform(get("/api/v1/points-of-sale/" + pos2.getId() + "/inventories/warning"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].isLowStock").value(true));
    }

    @Test
    @DisplayName("API: Nhân viên chưa gán điểm bán mở ca bị chặn (POS_EMPLOYEE_NOT_ASSIGNED)")
    @WithMockUser(username = "test_staff_pos", roles = {"VT-02"})
    public void testOpenShift_WithoutPos_ThrowsForbidden() throws Exception {
        com.sales.dto.request.OpenShiftRequest request = com.sales.dto.request.OpenShiftRequest.builder()
                .openingCash(BigDecimal.valueOf(500000))
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(7014));
    }
}
