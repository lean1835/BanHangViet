package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.CashTransactionStatus;
import com.sales.constant.CashTransactionType;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CreateCashTransactionRequest;
import com.sales.dto.request.RejectCashExpenseRequest;
import com.sales.dto.request.UpdateExpenseThresholdRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class CashTransactionControllerTest {

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
    private ShiftRepository shiftRepository;

    @Autowired
    private CashTransactionRepository transactionRepository;

    @Autowired
    private CashTransactionCategoryRepository categoryRepository;

    @Autowired
    private BusinessHouseholdSettingsRepository settingsRepository;

    private BusinessHousehold testHousehold;
    private User testCashier;
    private User testOwner;
    private Shift testShift;

    @BeforeEach
    void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("9999999999").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("9999999999")
                    .name("Hộ kinh doanh Test Cash Tx")
                    .address("Địa chỉ Test Cash Tx")
                    .phoneNumber("0999999999")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role cashierRole = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên bán hàng").build()));

        testOwner = userRepository.findByUsername("test_owner_cash").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("test_owner_cash")
                        .fullName("Chủ Hộ Test Cash")
                        .passwordHash("$2a$10$DummyHashForTesting1234567890123456789012")
                        .role(ownerRole)
                        .household(testHousehold)
                        .isActive(true)
                        .build()));

        testCashier = userRepository.findByUsername("test_cashier_cash").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("test_cashier_cash")
                        .fullName("Thu Ngân Test Cash")
                        .passwordHash("$2a$10$DummyHashForTesting1234567890123456789012")
                        .role(cashierRole)
                        .household(testHousehold)
                        .isActive(true)
                        .build()));

        // Ensure settings with threshold 200,000 VND
        BusinessHouseholdSettings settings = settingsRepository.findByHouseholdId(testHousehold.getId())
                .orElseGet(() -> BusinessHouseholdSettings.builder().household(testHousehold).build());
        settings.setExpenseApprovalThreshold(new BigDecimal("200000.00"));
        settingsRepository.save(settings);

        // Ensure active shift for testCashier
        testShift = shiftRepository.findByUserIdAndStatus(testCashier.getId(), ShiftStatus.OPEN)
                .orElseGet(() -> shiftRepository.save(Shift.builder()
                        .household(testHousehold)
                        .user(testCashier)
                        .openingCash(new BigDecimal("1000000.00"))
                        .openedAt(LocalDateTime.now().minusHours(2))
                        .status(ShiftStatus.OPEN)
                        .build()));
    }

    @Test
    @DisplayName("API: Lập phiếu chi trong hạn mức (50k <= 200k) -> 201 Created, APPROVED")
    @WithMockUser(username = "test_cashier_cash", roles = {"VT-02"})
    void testCreateExpense_belowThreshold() throws Exception {
        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.EXPENSE)
                .categoryName("Mua túi gói hàng")
                .amount(new BigDecimal("50000.00"))
                .personName("Cửa hàng bao bì")
                .notes("Mua túi 2kg")
                .build();

        mockMvc.perform(post("/api/v1/cash-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.type").value("EXPENSE"))
                .andExpect(jsonPath("$.result.status").value("APPROVED"))
                .andExpect(jsonPath("$.result.amount").value(50000.00));
    }

    @Test
    @DisplayName("API: Lập phiếu thu nạp tiền lẻ (500k) -> 201 Created, APPROVED")
    @WithMockUser(username = "test_cashier_cash", roles = {"VT-02"})
    void testCreateIncome_autoApproved() throws Exception {
        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.INCOME)
                .categoryName("Nạp tiền lẻ thối")
                .amount(new BigDecimal("500000.00"))
                .personName("Chủ hộ")
                .notes("Nạp cọc 5k")
                .build();

        mockMvc.perform(post("/api/v1/cash-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.type").value("INCOME"))
                .andExpect(jsonPath("$.result.status").value("APPROVED"))
                .andExpect(jsonPath("$.result.amount").value(500000.00));
    }

    @Test
    @DisplayName("API: Lập phiếu chi vượt hạn mức (500k > 200k) -> 201 Created, PENDING_APPROVAL")
    @WithMockUser(username = "test_cashier_cash", roles = {"VT-02"})
    void testCreateExpense_aboveThreshold_pendingApproval() throws Exception {
        CreateCashTransactionRequest request = CreateCashTransactionRequest.builder()
                .type(CashTransactionType.EXPENSE)
                .categoryName("Trả cước shipper ngoài")
                .amount(new BigDecimal("500000.00"))
                .personName("Shipper Grab")
                .notes("Ship hàng đơn lớn")
                .build();

        mockMvc.perform(post("/api/v1/cash-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.type").value("EXPENSE"))
                .andExpect(jsonPath("$.result.status").value("PENDING_APPROVAL"))
                .andExpect(jsonPath("$.result.amount").value(500000.00));
    }

    @Test
    @DisplayName("API: Chủ hộ (VT-01) duyệt phiếu chi -> 200 OK, APPROVED")
    @WithMockUser(username = "test_owner_cash", roles = {"VT-01"})
    void testApproveTransaction_byOwner_success() throws Exception {
        CashTransaction pendingTx = transactionRepository.save(CashTransaction.builder()
                .code("PC-TEST-0001")
                .household(testHousehold)
                .shift(testShift)
                .type(CashTransactionType.EXPENSE)
                .amount(new BigDecimal("350000.00"))
                .categoryName("Chi mua phụ tùng")
                .status(CashTransactionStatus.PENDING_APPROVAL)
                .createdByUser(testCashier)
                .build());

        mockMvc.perform(post("/api/v1/cash-transactions/{id}/approve", pendingTx.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("APPROVED"))
                .andExpect(jsonPath("$.result.approvedByUserId").value(testOwner.getId()));
    }

    @Test
    @DisplayName("API: Chủ hộ (VT-01) từ chối phiếu chi -> 200 OK, REJECTED")
    @WithMockUser(username = "test_owner_cash", roles = {"VT-01"})
    void testRejectTransaction_byOwner_success() throws Exception {
        CashTransaction pendingTx = transactionRepository.save(CashTransaction.builder()
                .code("PC-TEST-0002")
                .household(testHousehold)
                .shift(testShift)
                .type(CashTransactionType.EXPENSE)
                .amount(new BigDecimal("350000.00"))
                .categoryName("Chi mua phụ tùng")
                .status(CashTransactionStatus.PENDING_APPROVAL)
                .createdByUser(testCashier)
                .build());

        RejectCashExpenseRequest request = new RejectCashExpenseRequest("Chi tiêu vượt thẩm quyền");

        mockMvc.perform(post("/api/v1/cash-transactions/{id}/reject", pendingTx.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("REJECTED"))
                .andExpect(jsonPath("$.result.rejectionReason").value("Chi tiêu vượt thẩm quyền"));
    }

    @Test
    @DisplayName("API: Thu ngân (VT-02) cố ý duyệt chi -> 403 Forbidden")
    @WithMockUser(username = "test_cashier_cash", roles = {"VT-02"})
    void testApproveTransaction_byCashier_forbidden() throws Exception {
        CashTransaction pendingTx = transactionRepository.save(CashTransaction.builder()
                .code("PC-TEST-0003")
                .household(testHousehold)
                .shift(testShift)
                .type(CashTransactionType.EXPENSE)
                .amount(new BigDecimal("350000.00"))
                .categoryName("Chi mua phụ tùng")
                .status(CashTransactionStatus.PENDING_APPROVAL)
                .createdByUser(testCashier)
                .build());

        mockMvc.perform(post("/api/v1/cash-transactions/{id}/approve", pendingTx.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("API: Lấy báo cáo dòng tiền ca /summary -> 200 OK")
    @WithMockUser(username = "test_cashier_cash", roles = {"VT-02"})
    void testGetShiftCashSummary_success() throws Exception {
        mockMvc.perform(get("/api/v1/cash-transactions/shift/{shiftId}/summary", testShift.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.shiftId").value(testShift.getId()))
                .andExpect(jsonPath("$.result.openingCash").value(1000000.00));
    }

    @Test
    @DisplayName("API: Lấy danh sách danh mục thu chi -> 200 OK")
    @WithMockUser(username = "test_cashier_cash", roles = {"VT-02"})
    void testGetCashCategories_success() throws Exception {
        mockMvc.perform(get("/api/v1/cash-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray());
    }

    @Test
    @DisplayName("API: Chủ hộ cập nhật hạn mức duyệt chi -> 200 OK")
    @WithMockUser(username = "test_owner_cash", roles = {"VT-01"})
    void testUpdateExpenseThreshold_success() throws Exception {
        UpdateExpenseThresholdRequest request = new UpdateExpenseThresholdRequest(new BigDecimal("300000.00"));

        mockMvc.perform(put("/api/v1/cash-transactions/threshold")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }
}
