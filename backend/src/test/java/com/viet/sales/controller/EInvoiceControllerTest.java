package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CancelInvoiceRequest;
import com.viet.sales.dto.request.TaxAuthorityActionRequest;
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
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
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
    private TaxRateRepository taxRateRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InvoiceTemplateRepository invoiceTemplateRepository;

    @Autowired
    private EInvoiceRepository eInvoiceRepository;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private Role taxAuthorityRole;
    private User testOwner;
    private User testEmployee;
    private User testTaxAuthority;
    private TaxRate testTaxRate;
    private Product testProduct;
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
                    .build();
            return businessHouseholdRepository.save(household);
        });

        // 2. Vai trò
        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
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
                .andExpect(jsonPath("$.code").value(4001));
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
        TaxAuthorityActionRequest approveReq = TaxAuthorityActionRequest.builder()
                .taxAuthorityCode("CQT-TEST-CODE-123456")
                .build();

        // Sử dụng WithMockUser với vai trò VT-05
        mockMvc.perform(post("/api/v1/tax-authority/invoices/" + invoiceId + "/approve")
                        .header("Authorization", "Bearer mock-token") // WithMockUser overrides authentication
                        .with(request -> {
                            // Giả lập người dùng là Thuế
                            return request;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andDo(result -> {
                    // Cấp quyền VT-05 thủ công bằng cách mock user có role VT-05
                });

        // Hãy chạy phê duyệt thuế qua mock user VT-05
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
        
        // Cần chạy với quyền VT-05
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
}
