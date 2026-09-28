package com.sales.modules.invoice.controller;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.customer.entity.Customer;
import com.sales.modules.customer.repository.CustomerRepository;
import com.sales.modules.invoice.entity.EInvoice;
import com.sales.modules.invoice.entity.EInvoiceItem;
import com.sales.modules.invoice.entity.InvoiceNumberRange;
import com.sales.modules.invoice.entity.InvoiceTemplate;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.invoice.repository.InvoiceNumberRangeRepository;
import com.sales.modules.invoice.repository.InvoiceTemplateRepository;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.entity.OrderItem;
import com.sales.modules.order.repository.OrderRepository;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.tax.entity.TaxRate;
import com.sales.modules.tax.repository.TaxRateRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.invoice.dto.request.CancelInvoiceRequest;
import com.sales.modules.invoice.dto.request.CreateAdjustmentInvoiceItemRequest;
import com.sales.modules.invoice.dto.request.CreateAdjustmentInvoiceRequest;
import com.sales.modules.tax.dto.request.TaxAuthorityActionRequest;
import com.sales.modules.invoice.dto.request.UpdateInvoiceRequest;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.hamcrest.Matchers;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("unused")
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
    private InvoiceNumberRangeRepository invoiceNumberRangeRepository;

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
        testHousehold = businessHouseholdRepository.findByTaxCode("9999999999").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("9999999999")
                    .name("Hộ kinh doanh Test Invoice")
                    .address("Địa chỉ Test")
                    .phoneNumber("0999999999")
                    .representativeName("Đại Diện Test")
                    .revenueThresholdEnabled(true)
                    .build();
            return businessHouseholdRepository.save(household);
        });
        if (testHousehold.getRevenueThresholdEnabled() == null || !testHousehold.getRevenueThresholdEnabled()) {
            testHousehold.setRevenueThresholdEnabled(true);
            testHousehold = businessHouseholdRepository.save(testHousehold);
        }

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

    @Test
    @WithMockUser(username = "test_accountant_inv", roles = {"VT-03"})
    public void adjustInvoice_success() throws Exception {
        EInvoice original = createTestInvoice("ISSUED", "HD00001");

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
                .andExpect(jsonPath("$.result.finalAmount").value(9900.00));

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
        EInvoice original = createTestInvoice("DRAFT", "HD00003");

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
                .andExpect(jsonPath("$.code").value(4009));
    }

    @Test
    @WithMockUser(username = "test_accountant_inv", roles = {"VT-03"})
    public void adjustInvoice_fail_noChange() throws Exception {
        EInvoice original = createTestInvoice("ISSUED", "HD00004");

        CreateAdjustmentInvoiceItemRequest itemReq = CreateAdjustmentInvoiceItemRequest.builder()
                .productId(testProduct.getId())
                .productName(testProduct.getName())
                .unit(testProduct.getUnit())
                .quantity(BigDecimal.valueOf(1.0))
                .unitPrice(testProduct.getPrice())
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
                .andExpect(jsonPath("$.code").value(4010));
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
        createTestInvoice("ISSUED", "HD00006", testOwner);
        createTestInvoice("ISSUED", "HD00007", testEmployee);

        mockMvc.perform(get("/api/v1/invoices")
                        .param("search", "HD000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalElements").value(Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void getInvoices_success_forEmployee() throws Exception {
        createTestInvoice("ISSUED", "HD00008", testOwner);
        EInvoice inv2 = createTestInvoice("ISSUED", "HD00009", testEmployee);

        mockMvc.perform(get("/api/v1/invoices")
                        .param("search", "HD00009")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].id").value(inv2.getId()));

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

        mockMvc.perform(get("/api/v1/invoices/" + inv.getId() + "/logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void getInvoiceById_forbidden_forEmployee_otherInvoice() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00011", testOwner);

        mockMvc.perform(get("/api/v1/invoices/" + inv.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void createInvoiceDraft_orderNotCompleted_fails() throws Exception {
        mockMvc.perform(post("/api/v1/invoices/draft")
                        .param("orderId", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4002));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void createInvoiceDraft_missingTemplate_autoInitializesDefault() throws Exception {
        testOrder.setStatus("COMPLETED");
        testOrder.setPaymentStatus("PAID");
        orderRepository.save(testOrder);

        invoiceTemplateRepository.findByHouseholdId(testHousehold.getId())
                .ifPresent(invoiceTemplateRepository::delete);

        mockMvc.perform(post("/api/v1/invoices/draft")
                        .param("orderId", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("DRAFT"))
                .andExpect(jsonPath("$.result.invoicePattern").value("1"))
                .andExpect(jsonPath("$.result.invoiceSymbol").value("1C26TAA"));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void createInvoiceDraft_debtOrder_success() throws Exception {
        Order debtOrder = Order.builder()
                .household(testHousehold)
                .createdByUser(testEmployee)
                .customer(testCustomer)
                .orderNumber("ORD-DEBT-" + System.currentTimeMillis())
                .totalAmount(new BigDecimal("20000.00"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("20000.00"))
                .paymentMethod("DEBT")
                .paymentStatus("DEBT")
                .status("COMPLETED")
                .items(new ArrayList<>())
                .build();
        OrderItem item = OrderItem.builder()
                .order(debtOrder)
                .product(testProduct)
                .productName(testProduct.getName())
                .quantity(BigDecimal.ONE)
                .unitPrice(testProduct.getPrice())
                .discountAmount(BigDecimal.ZERO)
                .taxRatePercentage(testTaxRate.getRatePercentage())
                .taxAmount(new BigDecimal("100.00"))
                .subtotal(new BigDecimal("10100.00"))
                .build();
        debtOrder.getItems().add(item);
        debtOrder = orderRepository.save(debtOrder);

        mockMvc.perform(post("/api/v1/invoices/draft")
                        .param("orderId", debtOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("DRAFT"))
                .andExpect(jsonPath("$.result.paymentMethod").value("DEBT"));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void eInvoiceLifecycle_success() throws Exception {
        InvoiceTemplate template = InvoiceTemplate.builder()
                .household(testHousehold)
                .invoicePattern("1C26TAA")
                .invoiceSymbol("C26TAA")
                .title("MẪU HĐĐT MÔ PHỎNG")
                .footerNote("Cảm ơn đã mua hàng")
                .build();
        invoiceTemplateRepository.save(template);

        testOrder.setStatus("COMPLETED");
        testOrder.setPaymentStatus("PAID");
        orderRepository.save(testOrder);

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

        ensureActiveInvoiceNumberRangeForTest();

        mockMvc.perform(post("/api/v1/invoices/" + invoiceId + "/submit")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("WAITING_TAX_CODE"));

        approveInvoiceAsTax(invoiceId, "CQT-TEST-CODE-123456");

        EInvoice invAfterApprove = eInvoiceRepository.findById(invoiceId).orElse(null);
        assertNotNull(invAfterApprove);
        assertEquals("ISSUED", invAfterApprove.getStatus());
        assertEquals("CQT-TEST-CODE-123456", invAfterApprove.getTaxAuthorityCode());
        assertNotNull(invAfterApprove.getInvoiceNumber());

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

        mockMvc.perform(post("/api/v1/tax-authority/invoices/" + invoiceId + "/approve")
                        .with(SecurityMockMvcRequestPostProcessors.user("test_tax_inv").roles("VT-05"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    private void ensureActiveInvoiceNumberRangeForTest() {
        InvoiceNumberRange range = InvoiceNumberRange.builder()
                .household(testHousehold)
                .invoicePattern("1C26TAA")
                .invoiceSymbol("C26TAA")
                .startNumber(1)
                .endNumber(100000)
                .currentNumber(0)
                .warningThreshold(50)
                .status("ACTIVE")
                .build();
        invoiceNumberRangeRepository.save(range);
    }

    private void cancelInvoiceAsOwner(String invoiceId, CancelInvoiceRequest req) throws Exception {
        mockMvc.perform(post("/api/v1/invoices/" + invoiceId + "/cancel")
                        .with(SecurityMockMvcRequestPostProcessors.user("test_owner_inv").roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void updateInvoice_successAndFailed() throws Exception {
        InvoiceTemplate template = InvoiceTemplate.builder()
                .household(testHousehold)
                .invoicePattern("1C26TAA")
                .invoiceSymbol("C26TAA")
                .title("MẪU HĐĐT MÔ PHỎNG")
                .footerNote("Cảm ơn đã mua hàng")
                .build();
        invoiceTemplateRepository.save(template);

        testOrder.setStatus("COMPLETED");
        testOrder.setPaymentStatus("PAID");
        orderRepository.save(testOrder);

        String content = mockMvc.perform(post("/api/v1/invoices/draft")
                        .param("orderId", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();

        String invoiceId = objectMapper.readTree(content).path("result").path("id").asText();

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

        EInvoice inv = eInvoiceRepository.findById(invoiceId).orElse(null);
        assertNotNull(inv);
        assertEquals("Nguyen Van B Updated", inv.getBuyerName());
        assertEquals("1234567890", inv.getBuyerTaxCode());

        mockMvc.perform(post("/api/v1/invoices/" + invoiceId + "/submit")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/invoices/" + invoiceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4008));
    }

    @Test
    @WithMockUser(username = "test_owner_inv", roles = {"VT-01"})
    public void createInvoiceDraft_revenueThresholdDisabled_fails() throws Exception {
        testHousehold.setRevenueThresholdEnabled(false);
        businessHouseholdRepository.save(testHousehold);

        try {
            mockMvc.perform(post("/api/v1/invoices/draft")
                            .param("orderId", testOrder.getId())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(4012));
        } finally {
            testHousehold.setRevenueThresholdEnabled(true);
            businessHouseholdRepository.save(testHousehold);
        }
    }
}
