package com.sales.modules.inventory.controller;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.entity.ProductGroup;
import com.sales.modules.product.repository.ProductGroupRepository;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.tax.entity.TaxRate;
import com.sales.modules.tax.repository.TaxRateRepository;
import com.sales.common.security.AccountantSecurityService;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class InventoryValuationReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductGroupRepository productGroupRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @MockBean
    private ActivityLogHelper activityLogHelper;

    @MockBean
    private AccountantSecurityService accountantSecurityService;

    private BusinessHousehold testHousehold;
    private ProductGroup testGroup;
    private TaxRate testTaxRate;
    private Product product1;
    private Product productMissingCost;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("9999999999").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("9999999999")
                    .name("Hộ kinh doanh Test Định Giá Kho")
                    .address("123 Phố Huế, Hà Nội")
                    .phoneNumber("0999999999")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        Role employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        Role accountantRole = roleRepository.findByCode("VT-03").orElseGet(() -> {
            Role r = Role.builder().code("VT-03").name("Kế toán").build();
            return roleRepository.save(r);
        });

        userRepository.findByUsername("test_owner_valuation").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_valuation")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Valuation")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_staff_valuation").orElseGet(() -> {
            User u = User.builder()
                    .username("test_staff_valuation")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Test Valuation")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_accountant_valuation").orElseGet(() -> {
            User u = User.builder()
                    .username("test_accountant_valuation")
                    .passwordHash("password_hash")
                    .fullName("Kế Toán Test Valuation")
                    .role(accountantRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testTaxRate = taxRateRepository.findAll().stream().findFirst().orElseGet(() -> {
            TaxRate tr = TaxRate.builder().name("Thuế 10%").ratePercentage(new BigDecimal("10.00")).household(testHousehold).build();
            return taxRateRepository.save(tr);
        });

        testGroup = ProductGroup.builder()
                .name("Nhóm Nước Giải Khát")
                .household(testHousehold)
                .build();
        testGroup = productGroupRepository.save(testGroup);

        product1 = Product.builder()
                .sku("VAL-SKU-01")
                .name("Nước Cam Ép Twister")
                .unit("Chai")
                .price(new BigDecimal("12000.00"))
                .costPrice(new BigDecimal("9000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .household(testHousehold)
                .group(testGroup)
                .taxRate(testTaxRate)
                .status("ACTIVE")
                .build();
        productRepository.save(product1);

        productMissingCost = Product.builder()
                .sku("VAL-SKU-02")
                .name("Kẹo Ngậm Bạc Hà Mới")
                .unit("Gói")
                .price(new BigDecimal("5000.00"))
                .costPrice(BigDecimal.ZERO)
                .stockQuantity(new BigDecimal("20.000"))
                .household(testHousehold)
                .group(testGroup)
                .taxRate(testTaxRate)
                .status("ACTIVE")
                .build();
        productRepository.save(productMissingCost);
    }

    @Test
    @WithMockUser(username = "test_owner_valuation", roles = {"VT-01"})
    @DisplayName("NCL-13-CN-007-TC-01 & TC-02: Chủ hộ xem báo cáo giá trị tồn kho thành công, tính đúng định giá và tách nhóm thiếu giá vốn")
    public void testGetInventoryValuationReport_asOwner_success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/inventory-valuation")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.summary").exists())
                .andExpect(jsonPath("$.result.summary.totalProducts").value(2))
                .andExpect(jsonPath("$.result.summary.valuedProductsCount").value(1))
                .andExpect(jsonPath("$.result.summary.missingCostProductsCount").value(1))
                .andExpect(jsonPath("$.result.summary.totalStockQuantity").value(50.0))
                .andExpect(jsonPath("$.result.summary.totalInventoryValue").value(450000.0)) // 50 * 9000
                .andExpect(jsonPath("$.result.summary.totalRetailValue").value(600000.0))    // 50 * 12000
                .andExpect(jsonPath("$.result.summary.potentialGrossProfit").value(150000.0))
                .andExpect(jsonPath("$.result.items[0].sku").value("VAL-SKU-01"))
                .andExpect(jsonPath("$.result.missingCostItems[0].sku").value("VAL-SKU-02"));
    }

    @Test
    @WithMockUser(username = "test_staff_valuation", roles = {"VT-02"})
    @DisplayName("NCL-13-CN-007-TC-03: Nhân viên bán hàng bị chặn truy cập với 403 Forbidden")
    public void testGetInventoryValuationReport_asStaff_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/reports/inventory-valuation")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_accountant_valuation", roles = {"VT-03"})
    @DisplayName("TC-04: Kế toán có quyền REPORT được phép xem báo cáo giá trị tồn kho")
    public void testGetInventoryValuationReport_asAccountant_success() throws Exception {
        when(accountantSecurityService.hasScope(any(), eq("REPORT"))).thenReturn(true);

        mockMvc.perform(get("/api/v1/reports/inventory-valuation")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_owner_valuation", roles = {"VT-01"})
    @DisplayName("TC-06: Tra cứu ngày trong tương lai bị từ chối với 400 Bad Request")
    public void testGetInventoryValuationReport_futureDate_badRequest() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(2);
        mockMvc.perform(get("/api/v1/reports/inventory-valuation")
                        .param("asOfDate", tomorrow.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3170));
    }

    @Test
    @WithMockUser(username = "test_owner_valuation", roles = {"VT-01"})
    @DisplayName("TC-10: Chủ hộ xuất file Excel báo cáo giá trị tồn kho thành công")
    public void testExportInventoryValuationExcel_asOwner_success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/inventory-valuation/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().exists("Content-Disposition"));
    }

    @Test
    @WithMockUser(username = "test_staff_valuation", roles = {"VT-02"})
    @DisplayName("TC-03: Nhân viên bán hàng cố xuất file Excel bị chặn 403 Forbidden")
    public void testExportInventoryValuationExcel_asStaff_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/reports/inventory-valuation/export"))
                .andExpect(status().isForbidden());
    }
}
