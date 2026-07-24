package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.SyncCheckRequest;
import com.viet.sales.dto.request.OfflineOrderRequest;
import com.viet.sales.dto.request.OfflineOrderItemRequest;
import com.viet.sales.dto.request.SyncResolveRequest;
import com.viet.sales.constant.ConflictResolutionStrategy;
import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.entity.*;
import com.viet.sales.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SyncControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private User testOwner;
    private User testEmployee;
    private Product testProduct;
    private TaxRate testTaxRate;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findAll().stream().findFirst().orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("1234567890")
                    .name("Hộ kinh doanh Test Sync")
                    .address("Hà Nội")
                    .phoneNumber("0123456789")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        testOwner = userRepository.findByUsername("chuho_viet").orElseGet(() -> {
            User u = User.builder()
                    .username("chuho_viet")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });
        if (testOwner.getHousehold() == null || !testHousehold.getId().equals(testOwner.getHousehold().getId())) {
            testOwner.setHousehold(testHousehold);
            testOwner = userRepository.save(testOwner);
        }

        testEmployee = userRepository.findByUsername("nhanvien_viet").orElseGet(() -> {
            User u = User.builder()
                    .username("nhanvien_viet")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });
        if (testEmployee.getHousehold() == null || !testHousehold.getId().equals(testEmployee.getHousehold().getId())) {
            testEmployee.setHousehold(testHousehold);
            testEmployee = userRepository.save(testEmployee);
        }

        testTaxRate = taxRateRepository.findAll().stream()
                .filter(tr -> tr.getHousehold() != null && testHousehold.getId().equals(tr.getHousehold().getId()))
                .findFirst()
                .orElseGet(() -> {
                    TaxRate tr = TaxRate.builder()
                            .household(testHousehold)
                            .name("VAT 10%")
                            .ratePercentage(BigDecimal.valueOf(10.0))
                            .isActive(true)
                            .build();
                    return taxRateRepository.save(tr);
                });

        testProduct = productRepository.findAll().stream()
                .filter(p -> p.getHousehold() != null && testHousehold.getId().equals(p.getHousehold().getId()))
                .findFirst()
                .orElseGet(() -> {
                    Product p = Product.builder()
                            .household(testHousehold)
                            .sku("SKU-SYNC-TEST")
                            .name("Sản phẩm Sync Test")
                            .unit("Cái")
                            .price(BigDecimal.valueOf(100000.00))
                            .stockQuantity(BigDecimal.valueOf(50.0))
                            .taxRate(testTaxRate)
                            .status("ACTIVE")
                            .build();
                    return productRepository.save(p);
                });
    }

    @Test
    @WithMockUser(username = "nhanvien_viet", roles = {"VT-02"})
    public void testCheckConflicts_NoConflicts() throws Exception {
        SyncCheckRequest request = SyncCheckRequest.builder()
                .offlineOrderNumbers(Collections.singletonList("ORD-OFF-TEST-999"))
                .build();

        mockMvc.perform(post("/api/v1/sync/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.duplicates").isEmpty())
                .andExpect(jsonPath("$.result.conflicts").isEmpty());
    }

    @Test
    @WithMockUser(username = "nhanvien_viet", roles = {"VT-02"})
    public void testBulkUpload_Success() throws Exception {
        OfflineOrderItemRequest itemReq = OfflineOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(BigDecimal.valueOf(2.0))
                .unitPrice(testProduct.getPrice())
                .discountAmount(BigDecimal.ZERO)
                .taxRatePercentage(testTaxRate.getRatePercentage())
                .taxAmount(BigDecimal.valueOf(20000.00))
                .subtotal(BigDecimal.valueOf(220000.00))
                .build();

        OfflineOrderRequest orderReq = OfflineOrderRequest.builder()
                .orderNumber("ORD-OFF-BULK-001")
                .totalAmount(BigDecimal.valueOf(200000.00))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.valueOf(220000.00))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .createdAt(LocalDateTime.now())
                .items(Collections.singletonList(itemReq))
                .build();

        mockMvc.perform(post("/api/v1/sync/bulk-upload")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Collections.singletonList(orderReq))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].orderNumber").value("ORD-OFF-BULK-001"))
                .andExpect(jsonPath("$.result[0].syncStatus").value("SYNCED"));
    }

    @Test
    @WithMockUser(username = "chuho_viet", roles = {"VT-01"})
    public void testResolveConflict_KeepServer() throws Exception {
        // Create an existing order first
        Order existing = Order.builder()
                .household(testHousehold)
                .createdByUser(testOwner)
                .orderNumber("ORD-CONF-001")
                .totalAmount(BigDecimal.valueOf(100000.00))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.valueOf(100000.00))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .status("COMPLETED")
                .syncStatus("SYNCED")
                .isOffline(false)
                .build();
        orderRepository.save(existing);

        SyncResolveRequest resolveReq = SyncResolveRequest.builder()
                .orderNumber("ORD-CONF-001")
                .resolutionStrategy(ConflictResolutionStrategy.KEEP_SERVER)
                .build();

        mockMvc.perform(post("/api/v1/sync/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.orderNumber").value("ORD-CONF-001"));
    }

    @Test
    @WithMockUser(username = "nhanvien_viet", roles = {"VT-02"})
    public void testBulkUpload_EmptyList_ReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/v1/sync/bulk-upload")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Collections.emptyList())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Danh sách đơn hàng đồng bộ không được trống")));
    }

    @Test
    @WithMockUser(username = "chuho_viet", roles = {"VT-01"})
    public void testResolveConflict_OverwriteServer_UpdatesCustomerAndShift() throws Exception {
        // Create an existing order first
        Order existing = Order.builder()
                .household(testHousehold)
                .createdByUser(testOwner)
                .orderNumber("ORD-CONF-002")
                .totalAmount(BigDecimal.valueOf(100000.00))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.valueOf(100000.00))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .status("COMPLETED")
                .syncStatus("SYNCED")
                .isOffline(false)
                .build();
        existing = orderRepository.save(existing);

        // Create test shift
        Shift newShift = Shift.builder()
                .household(testHousehold)
                .user(testOwner)
                .openedAt(LocalDateTime.now())
                .openingCash(BigDecimal.valueOf(100000))
                .status(ShiftStatus.OPEN)
                .build();
        newShift = shiftRepository.save(newShift);

        // Create test customer
        Customer newCustomer = Customer.builder()
                .household(testHousehold)
                .name("Khách Hàng Mới")
                .phoneNumber("0999888777")
                .build();
        newCustomer = customerRepository.save(newCustomer);

        OfflineOrderItemRequest itemReq = OfflineOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(BigDecimal.valueOf(1.0))
                .unitPrice(testProduct.getPrice())
                .discountAmount(BigDecimal.ZERO)
                .taxRatePercentage(testTaxRate.getRatePercentage())
                .taxAmount(BigDecimal.valueOf(10000.00))
                .subtotal(BigDecimal.valueOf(110000.00))
                .build();

        OfflineOrderRequest clientData = OfflineOrderRequest.builder()
                .orderNumber("ORD-CONF-002")
                .customerId(newCustomer.getId())
                .shiftId(newShift.getId())
                .totalAmount(BigDecimal.valueOf(100000.00))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.valueOf(110000.00))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .createdAt(LocalDateTime.now())
                .items(Collections.singletonList(itemReq))
                .build();

        SyncResolveRequest resolveReq = SyncResolveRequest.builder()
                .orderNumber("ORD-CONF-002")
                .resolutionStrategy(ConflictResolutionStrategy.OVERWRITE_SERVER)
                .clientOrderData(clientData)
                .build();

        mockMvc.perform(post("/api/v1/sync/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.customerId").value(newCustomer.getId()))
                .andExpect(jsonPath("$.result.shiftId").value(newShift.getId()));
    }
}
