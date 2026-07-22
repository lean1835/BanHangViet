package com.viet.sales.controller;

import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.repository.BusinessHouseholdRepository;
import com.viet.sales.repository.RoleRepository;
import com.viet.sales.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class TaxAuthorityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    private BusinessHousehold testHousehold;
    private Role taxRole;
    private Role ownerRole;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("7777777777").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("7777777777")
                    .name("Hộ kinh doanh Test Tax")
                    .address("Địa chỉ Test Tax")
                    .phoneNumber("0777777777")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        taxRole = roleRepository.findByCode("VT-05").orElseGet(() -> {
            Role r = Role.builder().code("VT-05").name("Cơ quan Thuế").build();
            return roleRepository.save(r);
        });

        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        userRepository.findByUsername("test_tax_officer").orElseGet(() -> {
            User u = User.builder()
                    .username("test_tax_officer")
                    .passwordHash("password_hash")
                    .fullName("Cán bộ Thuế Test")
                    .role(taxRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_owner_tax").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_tax")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Tax")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });
    }

    @Test
    @WithMockUser(username = "test_tax_officer", roles = {"VT-05"})
    public void getWaitingInvoices_asTax_success() throws Exception {
        mockMvc.perform(get("/api/v1/tax-authority/invoices/waiting")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_tax_officer", roles = {"VT-05"})
    public void getProcessedInvoices_asTax_success() throws Exception {
        mockMvc.perform(get("/api/v1/tax-authority/invoices/history")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_owner_tax", roles = {"VT-01"})
    public void getProcessedInvoices_asOwner_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/tax-authority/invoices/history")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_tax_officer", roles = {"VT-05"})
    public void getWaitingInvoices_invalidPage_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/tax-authority/invoices/waiting")
                        .param("page", "-1")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006));
    }

    @Test
    @WithMockUser(username = "test_tax_officer", roles = {"VT-05"})
    public void getWaitingInvoices_invalidSize_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/tax-authority/invoices/waiting")
                        .param("page", "0")
                        .param("size", "101")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006));
    }
}
