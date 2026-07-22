package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CancelInvoiceRequest;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceItemRequest;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.viet.sales.dto.request.TaxAuthorityActionRequest;
import com.viet.sales.dto.request.UpdateInvoiceRequest;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class EInvoiceControllerTest {

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
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InvoiceTemplateRepository invoiceTemplateRepository;

    @Autowired
    private EInvoiceRepository eInvoiceRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private BusinessHousehold testHousehold;
    private Role accountantRole;
    private Role taxAuthorityRole;
    private User testOwner;
    private User testEmployee;
    private User testAccountant;
    private User testTaxAuthority;
    private Product testProduct;
    private TaxRate testTaxRate;
    private Customer testCustomer;
    private Order testOrder;

    @BeforeEach
    public void setUp() {
        // 1. Hộ kinh doanh
        testHousehold = businessHouseholdRepository.findByTaxCode("9999999999").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("9999999999")
                    .name("Hộ kinh doanh Test Invoice")
                    .address("Địa chỉ Test")
                    .phoneNumber("0999999999")
                    .representativeName("Đại Diện Test")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        // 2. Vai trò
        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build();
            return roleRepository.save(r);
        });

        Role employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
            return roleRepository.save(r);
        });

        accountantRole = roleRepository.findByCode("VT-03").orElseGet(() -> {
            Role r = Role.builder().code("VT-03").name("Kế toán").build();
            return roleRepository.save(r);
        });

        taxAuthorityRole = roleRepository.findByCode("VT-05").orElseGet(() -> {
            Role r = Role.builder().code("VT-05").name("Cơ quan thuế").build();
            return roleRepository.save(r);
        });

        // 3. Người dùng
        testOwner = userRepository.findByUsername("test_owner_inv").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_inv")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Inv")
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
                    .fullName("Nhân Viên Test Inv")
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

        testTaxAuthority = userRepository.findByUsername("test_tax_inv").orElseGet(() -> {
            User u = User.builder()
                    .username("test_tax_inv")
                    .passwordHash("password_hash")
                    .fullName("CQT Test Inv")
                    .role(taxAuthorityRole)
                    .household(null)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        // 4. Thuế suất
        testTaxRate = taxRateRepository.findAll().stream()
                .filter(t -> t.getHousehold().getId().equals(testHousehold.getId()) && t.getIsActive() && "Thuế VAT 1%".equals(t.getName()))
                .findFirst().orElseGet(() -> {
                    TaxRate t = TaxRate.builder()
                            .household(testHousehold)
                            .name("Thuế VAT 1%")
                            .ratePercentage(new BigDecimal("1.00"))
                            .isActive(true)
                            .build();
                    return taxRateRepository.save(t);
                });

        // 5. Sản phẩm
        testProduct = productRepository.findAll().stream()
                .filter(p -> p.getHousehold().getId().equals(testHousehold.getId()) && "SKU-INV-TEST".equals(p.getSku()) && p.getDeletedAt() == null)
                .findFirst().orElseGet(() -> {
                    Product p = Product.builder()
                            .household(testHousehold)
                            .taxRate(testTaxRate)
                            .sku("SKU-INV-TEST")
                            .name("Sản phẩm Test Invoice")
                            .unit("Lon")
                            .price(new BigDecimal("10000.00"))
                            .stockQuantity(new BigDecimal("100.00"))
                            .status("ACTIVE")
                            .build();
                    return productRepository.save(p);
                });

        // 6. Khách hàng
        testCustomer = customerRepository.findAll().stream()
                .filter(c -> c.getHousehold().getId().equals(testHousehold.getId()) && "0999888888".equals(c.getPhoneNumber()))
                .findFirst().orElseGet(() -> {
                    Customer c = Customer.builder()
                            .household(testHousehold)
                            .name("Khách Test Inv")
                            .phoneNumber("0999888888")
                            .email("test.inv@gmail.com")
                            .address("Hà Nội")
                            .build();
                    return customerRepository.save(c);
                });

        // 7. Đơn bán hàng (Mặc định ở trạng thái đang tạo, chưa hoàn thành)
        testOrder = orderRepository.findAll().stream()
                .filter(o -> o.getHousehold().getId().equals(testHousehold.getId()) && "ORD-TEST-001".equals(o.getOrderNumber()))
                .findFirst().orElseGet(() -> {
                    Order o = Order.builder()
                            .household(testHousehold)
                            .createdByUser(testEmployee)
                            .customer(testCustomer)
                            .orderNumber("ORD-TEST-001")
                            .totalAmount(new BigDecimal("10000.00"))
                            .discountAmount(BigDecimal.ZERO)
                            .finalAmount(new BigDecimal("10000.00"))
                            .paymentMethod("CASH")
                            .paymentStatus("PENDING")
                            .status("CREATING")
                            .items(new ArrayList<>())
                            .build();
                    
                    OrderItem item = OrderItem.builder()
                            .order(o)
                            .product(testProduct)
                            .productName(testProduct.getName())
                            .quantity(BigDecimal.ONE)
                            .unitPrice(testProduct.getPrice())
                            .discountAmount(BigDecimal.ZERO)
                            .taxRatePercentage(testTaxRate.getRatePercentage())
                            .taxAmount(new BigDecimal("100.00"))
                            .subtotal(new BigDecimal("10100.00"))
                            .build();
                    
                    o.getItems().add(item);
                    return orderRepository.save(o);
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

    // ==========================================
    // CÁC TEST CASES CỦA CHÚNG TA (ĐÃ RENUMBER ERROR CODES)
    // ==========================================

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
                .andExpect(jsonPath("$.code").value(4009)); // INVOICE_NOT_ISSUED (Renumbered)
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
                .andExpect(jsonPath("$.code").value(4010)); // INVOICE_ADJUSTMENT_NO_CHANGE (Renumbered)
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

    // ============================================
    // CÁC TEST CASES CỦA NHÁNH DEVELOP (MỚI PULL)
    // ============================================

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void createInvoiceDraft_orderNotCompleted_fails() throws Exception {
        mockMvc.perform(post("/api/v1/invoices/draft")
                        .param("orderId", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4002)); // ORDER_NOT_COMPLETED
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void createInvoiceDraft_missingTemplate_fails() throws Exception {
        // Đảm bảo đơn đã hoàn thành
        testOrder.setStatus("COMPLETED");
        testOrder.setPaymentStatus("PAID");
        orderRepository.save(testOrder);

        // Đảm bảo không có cấu hình mẫu hóa đơn
        invoiceTemplateRepository.findByHouseholdId(testHousehold.getId())
                .ifPresent(invoiceTemplateRepository::delete);

        mockMvc.perform(post("/api/v1/invoices/draft")
                        .param("orderId", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4001)); // INVOICE_TEMPLATE_NOT_FOUND
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void eInvoiceLifecycle_success() throws Exception {
        // 1. Cấu hình mẫu hóa đơn
        InvoiceTemplate template = InvoiceTemplate.builder()
                .household(testHousehold)
                .invoicePattern("1C26TAA")
                .invoiceSymbol("C26TAA")
                .title("MẪU HĐĐT MÔ PHỎNG")
                .footerNote("Cảm ơn đã mua hàng")
                .build();
        invoiceTemplateRepository.save(template);

        // 2. Chốt đơn hàng hoàn thành
        testOrder.setStatus("COMPLETED");
        testOrder.setPaymentStatus("PAID");
        orderRepository.save(testOrder);

        // 3. Tạo hóa đơn nháp
        String content = mockMvc.perform(post("/api/v1/invoices/draft")
                        .param("orderId", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("DRAFT"))
                .andExpect(jsonPath("$.result.lookupCode").exists())
                .andReturn().getResponse().getContentAsString();

        String invoiceId = objectMapper.readTree(content).path("result").path("id").asText();
        assertNotNull(invoiceId);

        // 4. Đẩy lên chờ duyệt thuế
        mockMvc.perform(post("/api/v1/invoices/" + invoiceId + "/submit")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("WAITING_TAX_CODE"));

        // 5. Cổng thuế (VT-05) duyệt cấp mã
        approveInvoiceAsTax(invoiceId, "CQT-TEST-CODE-123456");

        // 6. Kiểm tra lại trạng thái hóa đơn điện tử là ISSUED
        EInvoice invAfterApprove = eInvoiceRepository.findById(invoiceId).orElse(null);
        assertNotNull(invAfterApprove);
        assertEquals("ISSUED", invAfterApprove.getStatus());
        assertEquals("CQT-TEST-CODE-123456", invAfterApprove.getTaxAuthorityCode());
        assertNotNull(invAfterApprove.getInvoiceNumber());

        // 7. Thử nghiệm hủy hóa đơn bởi Chủ Hộ (VT-01)
        CancelInvoiceRequest cancelReq = CancelInvoiceRequest.builder()
                .cancelReason("Khách hàng hủy dịch vụ trả hàng")
                .build();

        cancelInvoiceAsOwner(invoiceId, cancelReq);

        EInvoice invAfterCancel = eInvoiceRepository.findById(invoiceId).orElse(null);
        assertNotNull(invAfterCancel);
        assertEquals("CANCELED", invAfterCancel.getStatus());
        assertEquals("Khách hàng hủy dịch vụ trả hàng", invAfterCancel.getCancelReason());
        assertNotNull(invAfterCancel.getCanceledAt());
        assertEquals(testOwner.getId(), invAfterCancel.getCanceledByUser().getId());
    }

    private void approveInvoiceAsTax(String invoiceId, String taxCode) throws Exception {
        TaxAuthorityActionRequest req = TaxAuthorityActionRequest.builder()
                .taxAuthorityCode(taxCode)
                .build();
        
        // Chạy với quyền VT-05
        mockMvc.perform(post("/api/v1/tax-authority/invoices/" + invoiceId + "/approve")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("test_tax_inv").roles("VT-05"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    private void cancelInvoiceAsOwner(String invoiceId, CancelInvoiceRequest req) throws Exception {
        mockMvc.perform(post("/api/v1/invoices/" + invoiceId + "/cancel")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("test_owner_inv").roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void updateInvoice_successAndFailed() throws Exception {
        // Setup Template
        InvoiceTemplate template = InvoiceTemplate.builder()
                .household(testHousehold)
                .invoicePattern("1C26TAA")
                .invoiceSymbol("C26TAA")
                .title("MẪU HĐĐT MÔ PHỎNG")
                .footerNote("Cảm ơn đã mua hàng")
                .build();
        invoiceTemplateRepository.save(template);

        // Complete order
        testOrder.setStatus("COMPLETED");
        testOrder.setPaymentStatus("PAID");
        orderRepository.save(testOrder);

        // 1. Create Draft
        String content = mockMvc.perform(post("/api/v1/invoices/draft")
                        .param("orderId", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();

        String invoiceId = objectMapper.readTree(content).path("result").path("id").asText();

        // 2. Update Draft (Success)
        UpdateInvoiceRequest updateReq = UpdateInvoiceRequest.builder()
                .buyerName("Nguyen Van B Updated")
                .buyerTaxCode("1234567890")
                .buyerAddress("Ha Noi, Viet Nam")
                .buyerPhone("0987654321")
                .buyerEmail("updated@gmail.com")
                .build();

        mockMvc.perform(put("/api/v1/invoices/" + invoiceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.buyerName").value("Nguyen Van B Updated"))
                .andExpect(jsonPath("$.result.buyerTaxCode").value("1234567890"));

        // Verify in DB
        EInvoice inv = eInvoiceRepository.findById(invoiceId).orElse(null);
        assertNotNull(inv);
        assertEquals("Nguyen Van B Updated", inv.getBuyerName());
        assertEquals("1234567890", inv.getBuyerTaxCode());

        // 3. Submit to Tax (Transitions to WAITING_TAX_CODE)
        mockMvc.perform(post("/api/v1/invoices/" + invoiceId + "/submit")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // 4. Try updating while WAITING_TAX_CODE (Failed - status 400)
        mockMvc.perform(put("/api/v1/invoices/" + invoiceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4008)); // INVOICE_NOT_EDITABLE
    }
}
