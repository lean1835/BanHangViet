package com.sales.modules.platform.controller;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.platform.repository.HouseholdSubscriptionRepository;
import com.sales.modules.platform.repository.HouseholdUsageStatsRepository;
import com.sales.modules.platform.repository.ServicePackageRepository;
import com.sales.modules.pos.repository.PointOfSaleRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.platform.dto.request.AssignSubscriptionRequest;
import com.sales.modules.platform.dto.request.CreateServicePackageRequest;
import com.sales.modules.platform.dto.response.HouseholdUsageStatsResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.pos.entity.PointOfSale;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.platform.entity.ServicePackage;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.platform.service.ServicePackageService;
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
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("unused")
public class ServicePackageQuotaIntegrationTest {

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
    private ServicePackageRepository servicePackageRepository;

    @Autowired
    private HouseholdSubscriptionRepository subscriptionRepository;

    @Autowired
    private HouseholdUsageStatsRepository usageStatsRepository;

    @Autowired
    private PointOfSaleRepository pointOfSaleRepository;

    @Autowired
    private ServicePackageService servicePackageService;

    private BusinessHousehold testHousehold;
    private User platformAdmin;
    private User householdOwner;
    private ServicePackage starterPackage;

    @BeforeEach
    public void setUp() {
        Role adminRole = roleRepository.findByCode("VT-04").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-04").name("Quản trị nền tảng").build()));
        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));

        testHousehold = businessHouseholdRepository.findByTaxCode("7777777777").orElseGet(() ->
                businessHouseholdRepository.save(BusinessHousehold.builder()
                        .taxCode("7777777777")
                        .name("Hộ Kinh Doanh Gói Dịch Vụ")
                        .address("777 Hoàng Hoa Thám, Hà Nội")
                        .phoneNumber("0977777777")
                        .build()));

        platformAdmin = userRepository.findByUsername("admin_pkg").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("admin_pkg")
                        .passwordHash("hashed")
                        .fullName("Quản Trị Gói")
                        .role(adminRole)
                        .isActive(true)
                        .build()));

        householdOwner = userRepository.findByUsername("owner_pkg").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("owner_pkg")
                        .passwordHash("hashed")
                        .fullName("Chủ Hộ Gói Test")
                        .role(ownerRole)
                        .household(testHousehold)
                        .isActive(true)
                        .build()));

        starterPackage = servicePackageRepository.findByCode("PKG_STARTER").orElseGet(() ->
                servicePackageRepository.save(ServicePackage.builder()
                        .code("PKG_STARTER")
                        .name("Gói Khởi Nghiệp")
                        .description("Dành cho hộ kinh doanh nhỏ")
                        .maxUsers(2)
                        .maxPosPoints(2)
                        .maxInvoicesPerMonth(5)
                        .dataRetentionDays(365)
                        .price(BigDecimal.valueOf(100000))
                        .isActive(true)
                        .build()));
    }

    @Test
    @WithMockUser(username = "admin_pkg", roles = {"VT-04"})
    @DisplayName("TC-01: Quản trị nền tảng tạo gói dịch vụ mới thành công")
    public void createServicePackage_Success() throws Exception {
        CreateServicePackageRequest request = CreateServicePackageRequest.builder()
                .code("PKG_PRO_2026")
                .name("Gói Chuyên Nghiệp")
                .description("Không giới hạn tính năng")
                .maxUsers(10)
                .maxPosPoints(5)
                .maxInvoicesPerMonth(500)
                .dataRetentionDays(730)
                .price(BigDecimal.valueOf(300000))
                .build();

        mockMvc.perform(post("/api/v1/platform/packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.code").value("PKG_PRO_2026"))
                .andExpect(jsonPath("$.result.maxUsers").value(10));
    }

    @Test
    @WithMockUser(username = "admin_pkg", roles = {"VT-04"})
    @DisplayName("TC-01: Gán gói dịch vụ cho hộ kinh doanh")
    public void assignSubscription_Success() throws Exception {
        AssignSubscriptionRequest request = AssignSubscriptionRequest.builder()
                .packageId(starterPackage.getId())
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusYears(1))
                .build();

        mockMvc.perform(post("/api/v1/platform/households/" + testHousehold.getId() + "/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.packageCode").value("PKG_STARTER"))
                .andExpect(jsonPath("$.result.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(username = "owner_pkg", roles = {"VT-01"})
    @DisplayName("Chủ hộ xem gói cước và thống kê sử dụng")
    public void getHouseholdSubscription_Success() throws Exception {
        AssignSubscriptionRequest assignRequest = AssignSubscriptionRequest.builder()
                .packageId(starterPackage.getId())
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusYears(1))
                .build();
        servicePackageService.assignSubscription("admin_pkg", testHousehold.getId(), assignRequest);

        mockMvc.perform(get("/api/v1/households/my-subscription-usage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.packageCode").value("PKG_STARTER"))
                .andExpect(jsonPath("$.result.maxUsers").value(2))
                .andExpect(jsonPath("$.result.maxInvoicesPerMonth").value(5));
    }

    @Test
    @DisplayName("TC-02: Kiểm tra hạn mức User - Vượt số lượng người dùng tối đa bị chặn mã 2054")
    public void userQuota_LimitExceeded_ThrowsException() {
        AssignSubscriptionRequest assignRequest = AssignSubscriptionRequest.builder()
                .packageId(starterPackage.getId())
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusYears(1))
                .build();
        servicePackageService.assignSubscription("admin_pkg", testHousehold.getId(), assignRequest);

        // Current users = 1 (householdOwner)
        // Add a 2nd user -> reached limit 2
        Role empRole = roleRepository.findByCode("VT-02").orElseThrow();
        userRepository.save(User.builder()
                .username("user_limit_2")
                .passwordHash("hashed")
                .fullName("User 2")
                .role(empRole)
                .household(testHousehold)
                .isActive(true)
                .build());

        // Now household has 2 users, maxUsers is 2. Attempting to add a 3rd user triggers validation
        AppException exception = assertThrows(AppException.class, () ->
                servicePackageService.validateUserQuota(testHousehold.getId()));

        assertEquals(ErrorCode.PACKAGE_USER_LIMIT_EXCEEDED, exception.getErrorCode());
    }

    @Test
    @DisplayName("TC-03 (GAP 48 & QTN-01): Vượt hạn mức hóa đơn trong tháng KHÔNG CHẶN, ghi nhận cờ isInvoiceOverQuota")
    public void invoiceQuota_OverLimit_DoesNotBlockIssuance() {
        AssignSubscriptionRequest assignRequest = AssignSubscriptionRequest.builder()
                .packageId(starterPackage.getId())
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusYears(1))
                .build();
        servicePackageService.assignSubscription("admin_pkg", testHousehold.getId(), assignRequest);

        // Package maxInvoicesPerMonth = 5
        // Issue 5 invoices
        for (int i = 0; i < 5; i++) {
            servicePackageService.recordInvoiceIssued(testHousehold.getId());
        }

        HouseholdUsageStatsResponse stats = servicePackageService.getUsageStats(testHousehold.getId());
        assertEquals(5, stats.getInvoicesIssuedThisMonth());
        assertFalse(stats.getIsInvoiceOverQuota(), "Chưa vượt quá hạn mức, cờ isInvoiceOverQuota phải là false");

        // Issue 6th invoice: MUST NOT THROW EXCEPTION (GAP 48 & QTN-01 rule)
        assertDoesNotThrow(() -> servicePackageService.recordInvoiceIssued(testHousehold.getId()));

        HouseholdUsageStatsResponse overStats = servicePackageService.getUsageStats(testHousehold.getId());
        assertEquals(6, overStats.getInvoicesIssuedThisMonth());
        assertTrue(overStats.getIsInvoiceOverQuota(), "Đã vượt quá hạn mức hóa đơn, cờ isInvoiceOverQuota phải được bật true để cảnh báo");
    }

    @Test
    @DisplayName("Kiểm tra hạn mức Điểm bán (POS) - Vượt số lượng điểm bán tối đa bị chặn mã 2062")
    public void posQuota_LimitExceeded_ThrowsException() {
        AssignSubscriptionRequest assignRequest = AssignSubscriptionRequest.builder()
                .packageId(starterPackage.getId())
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusYears(1))
                .build();
        servicePackageService.assignSubscription("admin_pkg", testHousehold.getId(), assignRequest);

        // starterPackage allows maxPosPoints = 2
        pointOfSaleRepository.save(PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-T1")
                .name("Điểm bán 1")
                .address("Địa chỉ 1")
                .isDefault(true)
                .isActive(true)
                .build());

        pointOfSaleRepository.save(PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-T2")
                .name("Điểm bán 2")
                .address("Địa chỉ 2")
                .isDefault(false)
                .isActive(true)
                .build());

        // Now household has 2 POS points. Adding 3rd triggers validation
        AppException exception = assertThrows(AppException.class, () ->
                servicePackageService.validatePosQuota(testHousehold.getId()));

        assertEquals(ErrorCode.PACKAGE_POS_LIMIT_EXCEEDED, exception.getErrorCode());
    }

    @Test
    @DisplayName("ISSUE-06 (P2): Gán gói dịch vụ với ngày kết thúc trước ngày bắt đầu bị chặn mã INVALID_DATE_RANGE")
    public void assignSubscription_InvalidDateRange_ThrowsException() {
        AssignSubscriptionRequest invalidRequest = AssignSubscriptionRequest.builder()
                .packageId(starterPackage.getId())
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(2)) // endDate < startDate
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                servicePackageService.assignSubscription("admin_pkg", testHousehold.getId(), invalidRequest));

        assertEquals(ErrorCode.INVALID_DATE_RANGE, exception.getErrorCode());
    }
}
