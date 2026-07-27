package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.InvoiceTemplateRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.InvoiceTemplate;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.InvoiceTemplateRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class InvoiceTemplateControllerTest {

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
    private InvoiceTemplateRepository invoiceTemplateRepository;

    private BusinessHousehold testHousehold;
    private User testOwner;
    private User testEmployee;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("8888888888").orElseGet(() -> {
            BusinessHousehold h = BusinessHousehold.builder()
                    .taxCode("8888888888")
                    .name("Hộ kinh doanh Test Template")
                    .address("Số 88 Đường Cấu Hình, Hà Nội")
                    .phoneNumber("0888888888")
                    .representativeName("Chủ Hộ Template")
                    .revenueThresholdEnabled(true)
                    .build();
            return businessHouseholdRepository.save(h);
        });

        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build();
            return roleRepository.save(r);
        });

        Role employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
            return roleRepository.save(r);
        });

        testOwner = userRepository.findByUsername("test_owner_tmpl").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_tmpl")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Template Test")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testEmployee = userRepository.findByUsername("test_employee_tmpl").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_tmpl")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Template Test")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });
    }

    @Test
    @WithMockUser(username = "test_owner_tmpl", roles = {"VT-01"})
    public void getTemplate_autoInitializesDefaultIfAbsent() throws Exception {
        // Clear any existing template for household
        invoiceTemplateRepository.findByHouseholdId(testHousehold.getId())
                .ifPresent(invoiceTemplateRepository::delete);

        mockMvc.perform(get("/api/v1/invoice-templates")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.invoicePattern").value("1"))
                .andExpect(jsonPath("$.result.invoiceSymbol").value("1C26TAA"))
                .andExpect(jsonPath("$.result.title").value("HÓA ĐƠN GIÁ TRỊ GIA TĂNG"));
    }

    @Test
    @WithMockUser(username = "test_owner_tmpl", roles = {"VT-01"})
    public void updateTemplate_success() throws Exception {
        InvoiceTemplateRequest req = InvoiceTemplateRequest.builder()
                .invoicePattern("2")
                .invoiceSymbol("2C26TBB")
                .title("HÓA ĐƠN BÁN HÀNG GTGT")
                .footerNote("Cảm ơn quý khách đã tin tưởng và ủng hộ!")
                .build();

        mockMvc.perform(put("/api/v1/invoice-templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.invoicePattern").value("2"))
                .andExpect(jsonPath("$.result.invoiceSymbol").value("2C26TBB"))
                .andExpect(jsonPath("$.result.title").value("HÓA ĐƠN BÁN HÀNG GTGT"))
                .andExpect(jsonPath("$.result.footerNote").value("Cảm ơn quý khách đã tin tưởng và ủng hộ!"));

        InvoiceTemplate saved = invoiceTemplateRepository.findByHouseholdId(testHousehold.getId()).orElse(null);
        assertNotNull(saved);
        assertEquals("2", saved.getInvoicePattern());
        assertEquals("2C26TBB", saved.getInvoiceSymbol());
        assertEquals("HÓA ĐƠN BÁN HÀNG GTGT", saved.getTitle());
    }

    @Test
    @WithMockUser(username = "test_employee_tmpl", roles = {"VT-02"})
    public void getTemplate_allowed_forEmployee() throws Exception {
        mockMvc.perform(get("/api/v1/invoice-templates")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "test_employee_tmpl", roles = {"VT-02"})
    public void updateTemplate_forbidden_forEmployee() throws Exception {
        InvoiceTemplateRequest req = InvoiceTemplateRequest.builder()
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .title("THỬ SỬA MẪU HÓA ĐƠN")
                .build();

        mockMvc.perform(put("/api/v1/invoice-templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }
}
