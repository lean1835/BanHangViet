package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
public class ReturnTicketControllerTest {

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
    private TaxRateRepository taxRateRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private EInvoiceRepository eInvoiceRepository;

    @Autowired
    private ReturnTicketRepository returnTicketRepository;

    private BusinessHousehold household;
    private User ownerUser;
    private User accountantUser;
    private User sellerUser;
    private EInvoice issuedInvoice;
    private ReturnTicket approvedReturnTicket;

    @BeforeEach
    void setUp() {
        household = businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("MST-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Kinh Doanh Test Return Ticket")
                .address("123 Phố Test, Hà Nội")
                .phoneNumber("0981112223")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01").orElseThrow();
        Role sellerRole = roleRepository.findByCode("VT-02").orElseThrow();
        Role accountantRole = roleRepository.findByCode("VT-03").orElseThrow();

        ownerUser = userRepository.save(User.builder()
                .username("owner_test_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("password_hash")
                .fullName("Chủ Hộ Test")
                .household(household)
                .role(ownerRole)
                .isActive(true)
                .build());

        accountantUser = userRepository.save(User.builder()
                .username("accountant_test_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("password_hash")
                .fullName("Kế Toán Test")
                .household(household)
                .role(accountantRole)
                .isActive(true)
                .build());

        sellerUser = userRepository.save(User.builder()
                .username("seller_test_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("password_hash")
                .fullName("Nhân Viên Bán Hàng")
                .household(household)
                .role(sellerRole)
                .isActive(true)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .household(household)
                .name("VAT 8%")
                .ratePercentage(new BigDecimal("8.00"))
                .isActive(true)
                .build());

        Product product = productRepository.save(Product.builder()
                .household(household)
                .taxRate(taxRate)
                .sku("SKU-RT-01")
                .name("Sản phẩm Test Trả Hàng")
                .unit("Cái")
                .price(new BigDecimal("100000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .status("ACTIVE")
                .build());

        issuedInvoice = eInvoiceRepository.save(EInvoice.builder()
                .household(household)
                .createdByUser(ownerUser)
                .invoiceNumber("00008888")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .buyerName("Nguyễn Văn Khách")
                .buyerTaxCode("0101010101")
                .totalAmountBeforeTax(new BigDecimal("200000.00"))
                .taxAmount(new BigDecimal("16000.00"))
                .finalAmount(new BigDecimal("216000.00"))
                .status("ISSUED")
                .lookupCode(UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10).toUpperCase())
                .build());

        List<ReturnTicketItem> ticketItems = new ArrayList<>();
        ReturnTicket ticket = ReturnTicket.builder()
                .household(household)
                .originalInvoice(issuedInvoice)
                .ticketNumber("PTH-TEST-" + UUID.randomUUID().toString().substring(0, 6))
                .createdByUser(sellerUser)
                .approvedByUser(ownerUser)
                .totalReturnAmount(new BigDecimal("108000.00"))
                .refundPaymentMethod("CASH")
                .status("APPROVED")
                .reason("Khách trả bớt 1 cái")
                .approvedAt(LocalDateTime.now())
                .build();

        ticketItems.add(ReturnTicketItem.builder()
                .returnTicket(ticket)
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .quantity(new BigDecimal("1.000"))
                .unitPrice(product.getPrice())
                .taxRatePercentage(new BigDecimal("8.00"))
                .taxAmount(new BigDecimal("8000.00"))
                .subtotal(new BigDecimal("108000.00"))
                .build());

        ticket.setItems(ticketItems);
        approvedReturnTicket = returnTicketRepository.save(ticket);
    }

    @Test
    @DisplayName("POST /api/v1/return-tickets/{id}/create-adjustment-invoice - Chủ hộ (VT-01) lập thành công")
    void testCreateDecreaseAdjustmentInvoice_OwnerRole_Success() throws Exception {
        mockMvc.perform(post("/api/v1/return-tickets/" + approvedReturnTicket.getId() + "/create-adjustment-invoice")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Lập hóa đơn điều chỉnh giảm từ phiếu trả hàng thành công"))
                .andExpect(jsonPath("$.result.id").value(approvedReturnTicket.getId()));

        EInvoice updatedOrigInvoice = eInvoiceRepository.findById(issuedInvoice.getId()).orElseThrow();
        assertEquals("ADJUSTED", updatedOrigInvoice.getStatus());

        List<EInvoice> adjInvoices = eInvoiceRepository.findAll().stream()
                .filter(inv -> approvedReturnTicket.getId().equals(inv.getReturnTicket() != null ? inv.getReturnTicket().getId() : null))
                .toList();

        assertEquals(1, adjInvoices.size());
        EInvoice adjInvoice = adjInvoices.get(0);
        assertEquals("HÓA ĐƠN ĐIỀU CHỈNH GIẢM", adjInvoice.getTitle());
        assertEquals("ISSUED", adjInvoice.getStatus());
        assertEquals(issuedInvoice.getId(), adjInvoice.getOriginalInvoice().getId());
    }

    @Test
    @DisplayName("POST /api/v1/return-tickets/{id}/create-adjustment-invoice - Kế toán (VT-03) lập thành công")
    void testCreateDecreaseAdjustmentInvoice_AccountantRole_Success() throws Exception {
        mockMvc.perform(post("/api/v1/return-tickets/" + approvedReturnTicket.getId() + "/create-adjustment-invoice")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(accountantUser.getUsername()).roles("VT-03"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @DisplayName("POST /api/v1/return-tickets/{id}/create-adjustment-invoice - Nhân viên bán hàng (VT-02) bị từ chối 403 Forbidden")
    void testCreateDecreaseAdjustmentInvoice_SellerRole_Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/return-tickets/" + approvedReturnTicket.getId() + "/create-adjustment-invoice")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(sellerUser.getUsername()).roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/return-tickets/{id}/create-adjustment-invoice - Từ chối khi phiếu trả hàng chưa được duyệt")
    void testCreateDecreaseAdjustmentInvoice_PendingTicket_BadRequest() throws Exception {
        ReturnTicket pendingTicket = returnTicketRepository.save(ReturnTicket.builder()
                .household(household)
                .originalInvoice(issuedInvoice)
                .ticketNumber("PTH-PENDING-" + UUID.randomUUID().toString().substring(0, 6))
                .createdByUser(sellerUser)
                .totalReturnAmount(new BigDecimal("50000.00"))
                .refundPaymentMethod("CASH")
                .status("PENDING")
                .build());

        mockMvc.perform(post("/api/v1/return-tickets/" + pendingTicket.getId() + "/create-adjustment-invoice")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(4025));
    }
}
