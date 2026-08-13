package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateInventoryAuditDetailRequest;
import com.sales.dto.request.CreateInventoryAuditRequest;
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
import com.sales.service.classes.ActivityLogHelper;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class InventoryAuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BusinessHouseholdRepository householdRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private InventoryAuditRepository inventoryAuditRepository;

    @MockBean
    private ActivityLogHelper activityLogHelper;

    private User ownerUser;
    private User staffUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        BusinessHousehold household = householdRepository.save(BusinessHousehold.builder()
                .taxCode("TAX-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Kinh Doanh Kiểm Kê Test")
                .address("123 Lê Lợi, Q1")
                .phoneNumber("090" + (int)(Math.random() * 10000000))
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role staffRole = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên").build()));

        ownerUser = userRepository.save(User.builder()
                .username("owner_audit_user")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuu")
                .fullName("Chủ Hộ Kiểm Kê")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build());

        staffUser = userRepository.save(User.builder()
                .username("staff_audit_user")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuu")
                .fullName("Nhân Viên Bán Hàng")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .household(household)
                .name("Thuế 1%")
                .ratePercentage(new BigDecimal("1.00"))
                .isActive(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .household(household)
                .taxRate(taxRate)
                .sku("SKU-AUDIT-" + UUID.randomUUID().toString().substring(0, 5))
                .name("Sản Phẩm Kiểm Kê Test")
                .unit("Cái")
                .price(new BigDecimal("50000.00"))
                .costPrice(new BigDecimal("30000.00"))
                .stockQuantity(new BigDecimal("15.000"))
                .status("ACTIVE")
                .build());
    }

    @Test
    @WithMockUser(username = "owner_audit_user", roles = "VT-01")
    @DisplayName("API POST /api/v1/inventory-audits - Chủ hộ lập phiếu kiểm kê kho thành công")
    void testCreateInventoryAudit_AsOwner_Success() throws Exception {
        CreateInventoryAuditDetailRequest detail = CreateInventoryAuditDetailRequest.builder()
                .productId(testProduct.getId())
                .actualQuantity(new BigDecimal("12.000"))
                .reason("Hàng hỏng 3 cái")
                .build();

        CreateInventoryAuditRequest request = CreateInventoryAuditRequest.builder()
                .notes("Kiểm kê cuối tuần")
                .details(List.of(detail))
                .build();

        mockMvc.perform(post("/api/v1/inventory-audits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalItems").value(1))
                .andExpect(jsonPath("$.result.totalDifferenceQty").value(-3.0));

        // Kiểm tra trong DB: tồn kho sản phẩm phải được cập nhật về 12.000
        Product updatedProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("12.000").compareTo(updatedProduct.getStockQuantity()));
    }

    @Test
    @WithMockUser(username = "owner_audit_user", roles = "VT-01")
    @DisplayName("API POST /api/v1/inventory-audits - Chênh lệch tồn nhưng để trống lý do -> Trả về lỗi 400")
    void testCreateInventoryAudit_MissingReason_BadRequest() throws Exception {
        CreateInventoryAuditDetailRequest detail = CreateInventoryAuditDetailRequest.builder()
                .productId(testProduct.getId())
                .actualQuantity(new BigDecimal("10.000"))
                .reason("") // Để trống lý do khi chênh lệch = -5
                .build();

        CreateInventoryAuditRequest request = CreateInventoryAuditRequest.builder()
                .details(List.of(detail))
                .build();

        mockMvc.perform(post("/api/v1/inventory-audits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3042));
    }

    @Test
    @WithMockUser(username = "staff_audit_user", roles = "VT-02")
    @DisplayName("API POST /api/v1/inventory-audits - Vai trò Nhân viên -> Trả về lỗi 403 Forbidden")
    void testCreateInventoryAudit_AsStaff_Forbidden() throws Exception {
        CreateInventoryAuditDetailRequest detail = CreateInventoryAuditDetailRequest.builder()
                .productId(testProduct.getId())
                .actualQuantity(new BigDecimal("12.000"))
                .reason("Hàng hỏng 3 cái")
                .build();

        CreateInventoryAuditRequest request = CreateInventoryAuditRequest.builder()
                .details(List.of(detail))
                .build();

        mockMvc.perform(post("/api/v1/inventory-audits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner_audit_user", roles = "VT-01")
    @DisplayName("API GET /api/v1/inventory-audits/check-pending-orders - Kiểm tra đơn dang dở thành công")
    void testCheckPendingOrders_Success() throws Exception {
        mockMvc.perform(get("/api/v1/inventory-audits/check-pending-orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.hasPendingOrders").value(false));
    }

    @Test
    @WithMockUser(username = "owner_audit_user", roles = "VT-01")
    @DisplayName("API GET /api/v1/inventory-audits - Lấy danh sách phiếu kiểm kê thành công")
    void testGetInventoryAudits_Success() throws Exception {
        mockMvc.perform(get("/api/v1/inventory-audits")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }
}
