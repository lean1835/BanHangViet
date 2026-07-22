package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.DeliverInvoiceEmailRequest;
import com.viet.sales.dto.request.DeliverInvoiceZaloRequest;
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
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class EInvoiceDeliveryIntegrationTest {

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
    private EInvoiceRepository eInvoiceRepository;

    @Autowired
    private InvoiceDeliveryLogRepository invoiceDeliveryLogRepository;

    private BusinessHousehold testHousehold;
    private User testEmployee;
    private Product testProduct;
    private TaxRate testTaxRate;

    @BeforeEach
    public void setUp() {
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

        Role employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
            return roleRepository.save(r);
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

        testTaxRate = taxRateRepository.findAll().stream()
                .filter(tr -> tr.getHousehold().getId().equals(testHousehold.getId()))
                .findFirst().orElseGet(() -> {
                    TaxRate tr = TaxRate.builder()
                            .household(testHousehold)
                            .name("VAT 10%")
                            .ratePercentage(BigDecimal.valueOf(10.0))
                            .isActive(true)
                            .build();
                    return taxRateRepository.save(tr);
                });

        testProduct = productRepository.findAll().stream()
                .filter(p -> p.getHousehold().getId().equals(testHousehold.getId()))
                .findFirst().orElseGet(() -> {
                    Product p = Product.builder()
                            .household(testHousehold)
                            .taxRate(testTaxRate)
                            .sku("SP001")
                            .name("Sản phẩm test")
                            .unit("Cái")
                            .price(BigDecimal.valueOf(100000.00))
                            .stockQuantity(BigDecimal.valueOf(10.0))
                            .status("ACTIVE")
                            .build();
                    return productRepository.save(p);
                });
    }

    private EInvoice createTestInvoice(String statusVal, String invoiceNumber) {
        BigDecimal price = testProduct.getPrice();
        BigDecimal tax = price.multiply(BigDecimal.valueOf(0.1)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalAmt = price.add(tax).setScale(2, RoundingMode.HALF_UP);

        EInvoice invoice = EInvoice.builder()
                .household(testHousehold)
                .createdByUser(testEmployee)
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
                .status(statusVal)
                .lookupCode("LK" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase())
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
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void getInvoiceQr_Success() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00101");

        mockMvc.perform(get("/api/v1/invoices/" + inv.getId() + "/qr")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.lookupCode").value(inv.getLookupCode()))
                .andExpect(jsonPath("$.result.qrCodeBase64").isNotEmpty());
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void deliverViaZalo_Success() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00102");
        DeliverInvoiceZaloRequest request = DeliverInvoiceZaloRequest.builder()
                .phoneNumber("0987654321")
                .build();

        mockMvc.perform(post("/api/v1/invoices/" + inv.getId() + "/deliver/zalo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        List<InvoiceDeliveryLog> logs = invoiceDeliveryLogRepository.findByInvoiceIdOrderBySentAtDesc(inv.getId());
        assertFalse(logs.isEmpty());
        assertEquals("ZALO", logs.get(0).getChannel());
        assertEquals("0987654321", logs.get(0).getRecipientAddress());
        assertEquals("SUCCESS", logs.get(0).getStatus());
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void deliverViaEmail_Success() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00103");
        DeliverInvoiceEmailRequest request = DeliverInvoiceEmailRequest.builder()
                .email("test_client@gmail.com")
                .build();

        mockMvc.perform(post("/api/v1/invoices/" + inv.getId() + "/deliver/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        List<InvoiceDeliveryLog> logs = invoiceDeliveryLogRepository.findByInvoiceIdOrderBySentAtDesc(inv.getId());
        assertFalse(logs.isEmpty());
        assertEquals("EMAIL", logs.get(0).getChannel());
        assertEquals("test_client@gmail.com", logs.get(0).getRecipientAddress());
        assertEquals("SUCCESS", logs.get(0).getStatus());
    }

    @Test
    @WithMockUser(username = "test_employee_inv", roles = {"VT-02"})
    public void getInvoicePrint_Success() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00104");

        mockMvc.perform(get("/api/v1/invoices/" + inv.getId() + "/print")
                        .param("pageSize", "K80")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.pageSize").value("K80"))
                .andExpect(jsonPath("$.result.htmlContent").value(org.hamcrest.Matchers.containsString("Mã tra cứu:")));

        List<InvoiceDeliveryLog> logs = invoiceDeliveryLogRepository.findByInvoiceIdOrderBySentAtDesc(inv.getId());
        assertFalse(logs.isEmpty());
        assertEquals("PRINT", logs.get(0).getChannel());
        assertEquals("SUCCESS", logs.get(0).getStatus());
    }

    @Test
    public void lookupInvoicePublicly_Success() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00105");

        mockMvc.perform(get("/api/v1/public/invoices/lookup")
                        .param("code", inv.getLookupCode())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.invoiceNumber").value("HD00105"))
                .andExpect(jsonPath("$.result.buyerName").value(inv.getBuyerName()));
    }

    @Test
    public void lookupInvoicePublicly_DraftBlocked() throws Exception {
        EInvoice inv = createTestInvoice("DRAFT", "HD00106");

        mockMvc.perform(get("/api/v1/public/invoices/lookup")
                        .param("code", inv.getLookupCode())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound()); // DRAFT status shouldn't be publicly visible
    }

    @Test
    public void downloadInvoiceFilePublicly_XML_Success() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00107");

        mockMvc.perform(get("/api/v1/public/invoices/download")
                        .param("code", inv.getLookupCode())
                        .param("format", "xml")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("HoaDon_")))
                .andExpect(content().contentType(MediaType.APPLICATION_XML));
    }

    @Test
    public void downloadInvoiceFilePublicly_HTML_Success() throws Exception {
        EInvoice inv = createTestInvoice("ISSUED", "HD00108");

        mockMvc.perform(get("/api/v1/public/invoices/download")
                        .param("code", inv.getLookupCode())
                        .param("format", "pdf")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("HoaDon_")))
                .andExpect(content().contentType(MediaType.TEXT_HTML));
    }
}
