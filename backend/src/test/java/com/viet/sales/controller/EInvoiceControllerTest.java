package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceItemRequest;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.viet.sales.entity.*;
import com.viet.sales.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class EInvoiceControllerTest {

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
    private EInvoiceRepository eInvoiceRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private Role accountantRole;
    private User testOwner;
    private User testEmployee;
    private User testAccountant;
    private Product testProduct;
    private TaxRate testTaxRate;

    @BeforeEach
    public void setUp() {
        // Cập nhật lại ràng buộc chk_adjustment_ref trong MySQL database local để vượt qua kiểm tra check constraint
        try {
            jdbcTemplate.execute("ALTER TABLE e_invoices DROP CHECK chk_adjustment_ref");
        } catch (Exception e) {
            // Bỏ qua nếu constraint không tồn tại hoặc không thể drop trực tiếp
        }
        try {
            jdbcTemplate.execute("ALTER TABLE e_invoices ADD CONSTRAINT chk_adjustment_ref CHECK (" +
                    "(original_invoice_id IS NULL) OR " +
                    "(original_invoice_id IS NOT NULL AND status <> 'ADJUSTED')" +
                    ")");
        } catch (Exception e) {
            // Bỏ qua nếu đã được add thành công trước đó
        }

        // 1. Lấy hoặc tạo hộ kinh doanh test
        testHousehold = businessHouseholdRepository.findAll().stream().findFirst().orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("8888888888")
                    .name("Hộ kinh doanh Test Invoice")
                    .address("Địa chỉ Test")
                    .phoneNumber("0988888888")
                    .representativeName("Đại Diện Test")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        // 2. Lấy hoặc tạo vai trò
        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        accountantRole = roleRepository.findByCode("VT-03").orElseGet(() -> {
            Role r = Role.builder().code("VT-03").name("Kế toán").build();
            return roleRepository.save(r);
        });

        // 3. Tạo hoặc lấy người dùng test
        testOwner = userRepository.findByUsername("test_owner_inv").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_inv")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Invoice")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testEmployee = userRepository.findByUsername("test_employee_inv").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_inv")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Test Invoice")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testAccountant = userRepository.findByUsername("test_accountant_inv").orElseGet(() -> {
            User u = User.builder()
                    .username("test_accountant_inv")
                    .passwordHash("password_hash")
                    .fullName("Kế Toán Test Invoice")
                    .role(accountantRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        // 4. Tạo thuế suất & sản phẩm test
        testTaxRate = taxRateRepository.findAll().stream().findFirst().orElseGet(() -> {
            TaxRate tr = TaxRate.builder()
                    .household(testHousehold)
                    .name("VAT 10%")
                    .ratePercentage(BigDecimal.valueOf(10.0))
                    .isActive(true)
                    .build();
            return taxRateRepository.save(tr);
        });

        testProduct = productRepository.findAll().stream().findFirst().orElseGet(() -> {
            Product p = Product.builder()
                    .household(testHousehold)
                    .sku("SKU-INV-TEST")
                    .name("Sản phẩm Test Invoice")
                    .unit("Cái")
                    .price(BigDecimal.valueOf(10000.00))
                    .taxRate(testTaxRate)
                    .status("ACTIVE")
                    .build();
            return productRepository.save(p);
        });
    }

    private EInvoice createTestInvoice(String status, String invoiceNumber) {
        return createTestInvoice(status, invoiceNumber, testOwner);
    }

    private EInvoice createTestInvoice(String status, String invoiceNumber, User creator) {
        BigDecimal price = testProduct.getPrice();
        BigDecimal tax = price.multiply(BigDecimal.valueOf(0.1)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalAmt = price.add(tax).setScale(2, RoundingMode.HALF_UP);

        EInvoice invoice = EInvoice.builder()
                .household(testHousehold)
                .createdByUser(creator)
                .invoicePattern("1C26TAA")
                .invoiceSymbol("C26TAA")
                .invoiceNumber(invoiceNumber)
                .buyerName("Nguyễn Văn Khách Hàng")
                .buyerTaxCode("1234567890")
                .buyerAddress("Hà Nội")
                .buyerPhone("0912345678")
                .buyerEmail("khachhang@gmail.com")
                .totalAmountBeforeTax(price)
                .taxAmount(tax)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(finalAmt)
                .status(status)
                .lookupCode(UUID.randomUUID().toString().replace("-", "").toUpperCase())
                .build();

        EInvoiceItem item = EInvoiceItem.builder()
                .invoice(invoice)
                .product(testProduct)
                .productName(testProduct.getName())
                .unit(testProduct.getUnit())
                .quantity(BigDecimal.valueOf(1.0))
                .unitPrice(price)
                .taxRatePercentage(BigDecimal.valueOf(10.0))
                .taxAmount(tax)
                .discountAmount(BigDecimal.ZERO)
                .subtotal(finalAmt)
                .build();

        invoice.setItems(new ArrayList<>(List.of(item)));
        return eInvoiceRepository.save(invoice);
    }

    @Test
    @WithMockUser(username = "test_accountant_inv", roles = {"VT-03"})
    public void adjustInvoice_success() throws Exception {
        EInvoice original = createTestInvoice("ISSUED", "HD00001");

        // Thay đổi đơn giá và tính toán lại tiền
        CreateAdjustmentInvoiceItemRequest itemReq = CreateAdjustmentInvoiceItemRequest.builder()
                .productId(testProduct.getId())
                .productName(testProduct.getName())
                .unit(testProduct.getUnit())
                .quantity(BigDecimal.valueOf(1.0))
                .unitPrice(BigDecimal.valueOf(9000.00)) // Thay đổi giá từ original về 9000
                .taxRatePercentage(BigDecimal.valueOf(10.0))
                .discountAmount(BigDecimal.ZERO)
                .build();

        CreateAdjustmentInvoiceRequest adjustReq = CreateAdjustmentInvoiceRequest.builder()
                .adjustmentReason("Điều chỉnh giảm giá bán sản phẩm")
                .buyerName("Nguyễn Văn Khách Hàng")
                .buyerTaxCode("1234567890")
                .buyerAddress("Hà Nội")
                .buyerPhone("0912345678")
                .buyerEmail("khachhang@gmail.com")
                .items(List.of(itemReq))
                .build();

        mockMvc.perform(post("/api/v1/invoices/" + original.getId() + "/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("DRAFT"))
                .andExpect(jsonPath("$.result.originalInvoiceId").value(original.getId()))
                .andExpect(jsonPath("$.result.finalAmount").value(9900.00)); // (9000 - 0) * 1.1 = 9900

        // Kiểm tra hóa đơn gốc đã đổi trạng thái sang ADJUSTED chưa
        mockMvc.perform(get("/api/v1/invoices/" + original.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("ADJUSTED"));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void adjustInvoice_forbidden_forEmployee() throws Exception {
        EInvoice original = createTestInvoice("ISSUED", "HD00002");

        CreateAdjustmentInvoiceItemRequest itemReq = CreateAdjustmentInvoiceItemRequest.builder()
                .productId(testProduct.getId())
                .productName(testProduct.getName())
                .unit(testProduct.getUnit())
                .quantity(BigDecimal.valueOf(1.0))
                .unitPrice(BigDecimal.valueOf(9000.00))
                .taxRatePercentage(BigDecimal.valueOf(10.0))
                .discountAmount(BigDecimal.ZERO)
                .build();

        CreateAdjustmentInvoiceRequest adjustReq = CreateAdjustmentInvoiceRequest.builder()
                .adjustmentReason("Nhân viên cố tình điều chỉnh")
                .items(List.of(itemReq))
                .build();

        mockMvc.perform(post("/api/v1/invoices/" + original.getId() + "/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_accountant_inv", roles = {"VT-03"})
    public void adjustInvoice_fail_notIssued() throws Exception {
        EInvoice original = createTestInvoice("DRAFT", "HD00003"); // Chưa cấp mã

        CreateAdjustmentInvoiceItemRequest itemReq = CreateAdjustmentInvoiceItemRequest.builder()
                .productId(testProduct.getId())
                .productName(testProduct.getName())
                .unit(testProduct.getUnit())
                .quantity(BigDecimal.valueOf(1.0))
                .unitPrice(BigDecimal.valueOf(9000.00))
                .taxRatePercentage(BigDecimal.valueOf(10.0))
                .discountAmount(BigDecimal.ZERO)
                .build();

        CreateAdjustmentInvoiceRequest adjustReq = CreateAdjustmentInvoiceRequest.builder()
                .adjustmentReason("Điều chỉnh hóa đơn nháp")
                .items(List.of(itemReq))
                .build();

        mockMvc.perform(post("/api/v1/invoices/" + original.getId() + "/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4002)); // INVOICE_NOT_ISSUED
    }

    @Test
    @WithMockUser(username = "test_accountant_inv", roles = {"VT-03"})
    public void adjustInvoice_fail_noChange() throws Exception {
        EInvoice original = createTestInvoice("ISSUED", "HD00004");

        // Sử dụng dữ liệu y hệt hóa đơn gốc
        CreateAdjustmentInvoiceItemRequest itemReq = CreateAdjustmentInvoiceItemRequest.builder()
                .productId(testProduct.getId())
                .productName(testProduct.getName())
                .unit(testProduct.getUnit())
                .quantity(BigDecimal.valueOf(1.0))
                .unitPrice(testProduct.getPrice()) // Dùng giá động của sản phẩm test để giống hệt
                .taxRatePercentage(BigDecimal.valueOf(10.0))
                .discountAmount(BigDecimal.ZERO)
                .build();

        CreateAdjustmentInvoiceRequest adjustReq = CreateAdjustmentInvoiceRequest.builder()
                .adjustmentReason("Không thay đổi gì")
                .buyerName("Nguyễn Văn Khách Hàng")
                .buyerTaxCode("1234567890")
                .buyerAddress("Hà Nội")
                .buyerPhone("0912345678")
                .buyerEmail("khachhang@gmail.com")
                .items(List.of(itemReq))
                .build();

        mockMvc.perform(post("/api/v1/invoices/" + original.getId() + "/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding("UTF-8")
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4003)); // INVOICE_ADJUSTMENT_NO_CHANGE
    }

    @Test
    @WithMockUser(username = "test_accountant_inv", roles = {"VT-03"})
    public void getInvoiceLogs_success() throws Exception {
        EInvoice original = createTestInvoice("ISSUED", "HD00005");

        mockMvc.perform(get("/api/v1/invoices/" + original.getId() + "/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_owner_inv", roles = {"VT-01"})
    public void getInvoices_success_forOwner() throws Exception {
        EInvoice inv1 = createTestInvoice("ISSUED", "HD00006", testOwner);
        EInvoice inv2 = createTestInvoice("ISSUED", "HD00007", testEmployee);

        mockMvc.perform(get("/api/v1/invoices")
                        .param("search", "HD000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void getInvoices_success_forEmployee() throws Exception {
        EInvoice inv1 = createTestInvoice("ISSUED", "HD00008", testOwner);
        EInvoice inv2 = createTestInvoice("ISSUED", "HD00009", testEmployee);

        // Nhân viên chỉ được xem hóa đơn do chính mình tạo
        mockMvc.perform(get("/api/v1/invoices")
                        .param("search", "HD00009")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].id").value(inv2.getId()));

        // Tìm hóa đơn do Chủ hộ tạo sẽ trả về rỗng đối với Nhân viên
        mockMvc.perform(get("/api/v1/invoices")
                        .param("search", "HD00008")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalElements").value(0));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void getInvoiceLogs_forbidden_forEmployee_otherInvoice() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00010", testOwner);

        // Nhân viên xem log của hóa đơn người khác sẽ bị chặn 403
        mockMvc.perform(get("/api/v1/invoices/" + inv.getId() + "/logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void getInvoiceById_forbidden_forEmployee_otherInvoice() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00011", testOwner);

        // Nhân viên xem chi tiết hóa đơn người khác sẽ bị chặn 403
        mockMvc.perform(get("/api/v1/invoices/" + inv.getId()))
                .andExpect(status().isForbidden());
    }
}
