package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CalculateWeightRequest;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class WeightBasedSellingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    private BusinessHousehold testHousehold;
    private User testCashier;
    private TaxRate testTaxRate;
    private Product weightProduct;
    private Product standardProduct;

    @BeforeEach
    void setUp() {
        testHousehold = businessHouseholdRepository.save(BusinessHousehold.builder()
                .name("Hộ kinh doanh Thực phẩm sạch")
                .taxCode("9991112223")
                .address("456 Phố Ẩm Thực")
                .phoneNumber("0912345678")
                .roundingRule("ROUND_TO_1000")
                .build());

        Role cashierRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Thu ngân").build()));

        testCashier = userRepository.save(User.builder()
                .username("weight_cashier")
                .passwordHash("encoded_pass")
                .fullName("Thu ngân bán cân")
                .role(cashierRole)
                .household(testHousehold)
                .isActive(true)
                .build());

        testTaxRate = taxRateRepository.save(TaxRate.builder()
                .household(testHousehold)
                .name("VAT 0%")
                .ratePercentage(BigDecimal.ZERO)
                .isActive(true)
                .build());

        weightProduct = productRepository.save(Product.builder()
                .household(testHousehold)
                .sku("BEEF-001")
                .name("Thịt Bò Tươi")
                .unit("Kg")
                .price(new BigDecimal("250000.00"))
                .costPrice(new BigDecimal("200000.00"))
                .stockQuantity(new BigDecimal("20.000"))
                .isSoldByWeight(true)
                .decimalPlaces(3)
                .minWeightStep(new BigDecimal("0.001"))
                .taxRate(testTaxRate)
                .status("ACTIVE")
                .build());

        standardProduct = productRepository.save(Product.builder()
                .household(testHousehold)
                .sku("SNACK-001")
                .name("Bánh Snack Oishi")
                .unit("Gói")
                .price(new BigDecimal("5000.00"))
                .costPrice(new BigDecimal("4000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .isSoldByWeight(false)
                .decimalPlaces(0)
                .minWeightStep(BigDecimal.ONE)
                .taxRate(testTaxRate)
                .status("ACTIVE")
                .build());
    }

    @Test
    @DisplayName("API calculate-weight: Tính trọng lượng thành công từ số tiền mua")
    @WithMockUser(username = "weight_cashier", roles = {"VT-02"})
    void calculateWeight_success_returns200() throws Exception {
        CalculateWeightRequest req = CalculateWeightRequest.builder()
                .productId(weightProduct.getId())
                .buyAmount(new BigDecimal("50000")) // 50,000 / 250,000 = 0.200 kg
                .build();

        mockMvc.perform(post("/api/v1/orders/calculate-weight")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.productId").value(weightProduct.getId()))
                .andExpect(jsonPath("$.result.calculatedQuantity").value(0.2))
                .andExpect(jsonPath("$.result.exactSubtotal").value(50000.0))
                .andExpect(jsonPath("$.result.roundedSubtotal").value(50000.0))
                .andExpect(jsonPath("$.result.roundingDifference").value(0.0));
    }

    @Test
    @DisplayName("API calculate-weight: Chặn khi sản phẩm không bán theo cân (code 3082)")
    @WithMockUser(username = "weight_cashier", roles = {"VT-02"})
    void calculateWeight_nonWeightProduct_returns400() throws Exception {
        CalculateWeightRequest req = CalculateWeightRequest.builder()
                .productId(standardProduct.getId())
                .buyAmount(new BigDecimal("20000"))
                .build();

        mockMvc.perform(post("/api/v1/orders/calculate-weight")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3082));
    }

    @Test
    @DisplayName("API calculate-weight: Chặn khi thiếu productId hoặc buyAmount <= 0")
    @WithMockUser(username = "weight_cashier", roles = {"VT-02"})
    void calculateWeight_invalidInput_returns400() throws Exception {
        CalculateWeightRequest req = CalculateWeightRequest.builder()
                .productId("")
                .buyAmount(BigDecimal.ZERO)
                .build();

        mockMvc.perform(post("/api/v1/orders/calculate-weight")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("API calculate-weight: Chặn khi chưa đăng nhập (401 Unauthorized)")
    void calculateWeight_unauthorized_returns401() throws Exception {
        CalculateWeightRequest req = CalculateWeightRequest.builder()
                .productId(weightProduct.getId())
                .buyAmount(new BigDecimal("50000"))
                .build();

        mockMvc.perform(post("/api/v1/orders/calculate-weight")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }
}
