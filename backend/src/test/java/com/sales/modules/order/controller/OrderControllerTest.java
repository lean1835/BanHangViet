package com.sales.modules.order.controller;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.customer.entity.Customer;
import com.sales.modules.customer.repository.CustomerRepository;
import com.sales.modules.order.dto.request.ApplyDiscountRequest;
import com.sales.modules.order.dto.request.CompleteOrderRequest;
import com.sales.modules.order.dto.request.ConfirmBankTransferRequest;
import com.sales.modules.order.dto.request.CreateOrderItemRequest;
import com.sales.modules.order.dto.request.CreateOrderRequest;
import com.sales.modules.order.dto.request.OrderPaymentRequest;
import com.sales.modules.order.dto.request.SetPaymentMethodRequest;
import com.sales.modules.order.dto.request.UpdateOrderItemRequest;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.repository.OrderRepository;
import com.sales.modules.pos.entity.PointOfSale;
import com.sales.modules.pos.entity.PosInventory;
import com.sales.modules.pos.entity.Shift;
import com.sales.modules.pos.repository.PointOfSaleRepository;
import com.sales.modules.pos.repository.PosInventoryRepository;
import com.sales.modules.pos.repository.ShiftRepository;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.tax.entity.TaxRate;
import com.sales.modules.tax.repository.TaxRateRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.common.constant.ShiftStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Assertions;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("unused")
public class OrderControllerTest {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

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
    private ShiftRepository shiftRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PointOfSaleRepository pointOfSaleRepository;

    @Autowired
    private PosInventoryRepository posInventoryRepository;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private User testOwner;
    private User testEmployee;
    private TaxRate testTaxRate;
    private Product testProduct;
    private Customer testCustomer;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("8888888888").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("8888888888")
                    .name("Hộ kinh doanh Test Order")
                    .address("Địa chỉ Test")
                    .phoneNumber("0888888888")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        testOwner = userRepository.findByUsername("test_owner_order").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_order")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Order")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testEmployee = userRepository.findByUsername("test_employee_order").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_order")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Test Order")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testTaxRate = taxRateRepository.findAll().stream()
                .filter(t -> t.getHousehold().getId().equals(testHousehold.getId()) && t.getIsActive() && "Thuế VAT 10%".equals(t.getName()))
                .findFirst().orElseGet(() -> {
                    TaxRate t = TaxRate.builder()
                            .household(testHousehold)
                            .name("Thuế VAT 10%")
                            .ratePercentage(new BigDecimal("10.00"))
                            .isActive(true)
                            .build();
                    return taxRateRepository.save(t);
                });

        testProduct = productRepository.findAll().stream()
                .filter(p -> p.getHousehold().getId().equals(testHousehold.getId()) && "SKU-ORDER-TEST".equals(p.getSku()) && p.getDeletedAt() == null)
                .findFirst().orElseGet(() -> {
                    Product p = Product.builder()
                            .household(testHousehold)
                            .taxRate(testTaxRate)
                            .sku("SKU-ORDER-TEST")
                            .name("Nước ép dứa")
                            .unit("Chai")
                            .price(new BigDecimal("20000.00"))
                            .stockQuantity(new BigDecimal("50.000"))
                            .status("ACTIVE")
                            .build();
                    return productRepository.save(p);
                });
        testProduct.setStockQuantity(new BigDecimal("50.000"));
        testProduct = productRepository.saveAndFlush(testProduct);

        testCustomer = customerRepository.findAll().stream()
                .filter(c -> c.getHousehold().getId().equals(testHousehold.getId()) && "0999888777".equals(c.getPhoneNumber()) && c.getDeletedAt() == null)
                .findFirst().orElseGet(() -> {
                    Customer c = Customer.builder()
                            .household(testHousehold)
                            .name("Nguyễn Văn Khách")
                            .phoneNumber("0999888777")
                            .creditLimit(new BigDecimal("1000000.00"))
                            .currentDebt(BigDecimal.ZERO)
                            .build();
                    return customerRepository.save(c);
                });

        shiftRepository.findAll().stream()
                .filter(s -> (s.getUser().getId().equals(testOwner.getId()) || s.getUser().getId().equals(testEmployee.getId()))
                        && s.getStatus() == ShiftStatus.OPEN)
                .forEach(s -> {
                    s.setStatus(ShiftStatus.CLOSED);
                    s.setClosedAt(LocalDateTime.now());
                    shiftRepository.save(s);
                });
    }

    private void openShiftForUser(User user) {
        Shift activeShift = Shift.builder()
                .household(testHousehold)
                .user(user)
                .openedAt(LocalDateTime.now())
                .openingCash(new BigDecimal("100000.00"))
                .status(ShiftStatus.OPEN)
                .build();
        shiftRepository.save(activeShift);
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void createOrder_success() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerId(testCustomer.getId())
                .build();

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CREATING"))
                .andExpect(jsonPath("$.result.customerId").value(testCustomer.getId()));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void createOrder_fail_noActiveShift() throws Exception {
        CreateOrderRequest request = CreateOrderRequest.builder().build();

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(3006))
                .andExpect(jsonPath("$.message").value("Không tìm thấy ca bán hàng hoạt động của nhân viên"));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void addOrderItem_and_update_and_delete_success() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(110000.00))
                .andExpect(jsonPath("$.result.items[0].productName").value("Nước ép dứa"))
                .andExpect(jsonPath("$.result.items[0].subtotal").value(110000.00));

        UpdateOrderItemRequest updateReq = UpdateOrderItemRequest.builder()
                .quantity(new BigDecimal("10.000"))
                .build();

        responseStr = mockMvc.perform(get("/api/v1/orders/" + orderId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String itemId = objectMapper.readTree(responseStr).get("result").get("items").get(0).get("id").asText();

        mockMvc.perform(put("/api/v1/orders/" + orderId + "/items/" + itemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(220000.00));

        mockMvc.perform(delete("/api/v1/orders/" + orderId + "/items/" + itemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(0.00));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void addOrderItem_stockWarning_success() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("60.000"))
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.warningMessages[0]").exists());
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void applyDiscount_owner_success() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        ApplyDiscountRequest discountReq = ApplyDiscountRequest.builder()
                .discountType("PERCENTAGE")
                .discountValue(new BigDecimal("50.00"))
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/discount")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(discountReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.discountAmount").value(50000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(55000.00));
    }

    @Test
    @WithMockUser(username = "test_employee_order", roles = {"VT-02"})
    public void applyDiscount_employee_limitExceeded_fails() throws Exception {
        openShiftForUser(testEmployee);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        ApplyDiscountRequest discountReq = ApplyDiscountRequest.builder()
                .discountType("PERCENTAGE")
                .discountValue(new BigDecimal("15.00"))
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/discount")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(discountReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3012));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_cash_success() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        SetPaymentMethodRequest payReq = SetPaymentMethodRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)));

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("120000.00"))
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("COMPLETED"))
                .andExpect(jsonPath("$.result.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.result.changeAmount").value(10000.00));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_insufficientCash_fails() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        SetPaymentMethodRequest payReq = SetPaymentMethodRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)));

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("100000.00"))
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3018));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_bankTransfer_success() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        SetPaymentMethodRequest payReq = SetPaymentMethodRequest.builder()
                .paymentMethod("BANK_TRANSFER")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.qrCodeUrl").exists());

        ConfirmBankTransferRequest confirmReq = ConfirmBankTransferRequest.builder()
                .transactionCode("FT12345678")
                .build();
        mockMvc.perform(put("/api/v1/orders/" + orderId + "/confirm-bank-transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk());

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder().build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("COMPLETED"))
                .andExpect(jsonPath("$.result.paymentStatus").value("PAID"));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_combinedPayment_cashAndBankTransfer_success() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        ConfirmBankTransferRequest confirmReq = ConfirmBankTransferRequest.builder()
                .transactionCode("FT-COMBINED-01")
                .build();
        mockMvc.perform(put("/api/v1/orders/" + orderId + "/confirm-bank-transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk());

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .payments(List.of(
                        OrderPaymentRequest.builder()
                                .paymentMethod("CASH")
                                .amount(new BigDecimal("50000.00"))
                                .amountGiven(new BigDecimal("50000.00"))
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod("BANK_TRANSFER")
                                .amount(new BigDecimal("60000.00"))
                                .transactionCode("FT-COMBINED-01")
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("COMPLETED"))
                .andExpect(jsonPath("$.result.paymentMethod").value("COMBINED"))
                .andExpect(jsonPath("$.result.paymentStatus").value("PAID"));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_debt_success_and_fails_if_creditLimitExceeded() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .customerId(testCustomer.getId())
                .build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        SetPaymentMethodRequest payReq = SetPaymentMethodRequest.builder()
                .paymentMethod("DEBT")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.paymentStatus").value("DEBT"));

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder().build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("COMPLETED"));

        responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId2 = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq2 = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("45.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId2 + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq2)));

        mockMvc.perform(post("/api/v1/orders/" + orderId2 + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3015));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_stockDeducted_success() throws Exception {
        openShiftForUser(testOwner);
        testProduct.setStockQuantity(new BigDecimal("50.000"));
        testProduct = productRepository.saveAndFlush(testProduct);
        entityManager.clear();

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        SetPaymentMethodRequest payReq = SetPaymentMethodRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)));

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("120000.00"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk());

        entityManager.flush();

        Product updatedProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        entityManager.refresh(updatedProduct);
        Assertions.assertEquals(0, new BigDecimal("45.000").compareTo(updatedProduct.getStockQuantity()));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_withPointOfSale_deductsBothStocksCorrectly() throws Exception {
        openShiftForUser(testOwner);

        PointOfSale pos1 = pointOfSaleRepository.save(PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-CS1")
                .name("Điểm bán CS1")
                .address("Địa chỉ CS1")
                .isDefault(false)
                .isActive(true)
                .build());

        testProduct.setStockQuantity(new BigDecimal("994.000"));
        testProduct = productRepository.saveAndFlush(testProduct);

        PosInventory posInv = posInventoryRepository.save(PosInventory.builder()
                .household(testHousehold)
                .pointOfSale(pos1)
                .product(testProduct)
                .stockQuantity(new BigDecimal("7.000"))
                .minStockQuantity(new BigDecimal("2.000"))
                .build());

        Shift openShift = shiftRepository.findByUserIdAndStatus(testOwner.getId(), ShiftStatus.OPEN).orElseThrow();
        openShift.setPointOfSale(pos1);
        shiftRepository.saveAndFlush(openShift);

        entityManager.clear();

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("1.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)))
                .andExpect(status().isOk());

        SetPaymentMethodRequest payReq = SetPaymentMethodRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk());

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("50000.00"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk());

        entityManager.flush();
        entityManager.clear();

        Product finalProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        Assertions.assertEquals(0, new BigDecimal("993.000").compareTo(finalProduct.getStockQuantity()));

        PosInventory finalPosInv = posInventoryRepository.findById(posInv.getId()).orElseThrow();
        Assertions.assertEquals(0, new BigDecimal("6.000").compareTo(finalPosInv.getStockQuantity()));
    }

    @Test
    @WithMockUser(username = "test_employee_order", roles = {"VT-02"})
    public void getOrder_salespersonOwnOrder_success() throws Exception {
        openShiftForUser(testEmployee);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        mockMvc.perform(get("/api/v1/orders/" + orderId))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "test_employee2_order", roles = {"VT-02"})
    public void getOrder_salespersonForbidden_success() throws Exception {
        User employee2 = userRepository.findByUsername("test_employee2_order").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee2_order")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên 2 Test Order")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });
        openShiftForUser(employee2);

        Order order = Order.builder()
                .household(testHousehold)
                .createdByUser(testEmployee)
                .orderNumber("OD-FORBIDDEN-TEST")
                .totalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .paymentMethod("CASH")
                .paymentStatus("PENDING")
                .status("CREATING")
                .syncStatus("SYNCED")
                .isOffline(false)
                .build();
        order = orderRepository.save(order);

        mockMvc.perform(get("/api/v1/orders/" + order.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(2009));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_bankTransfer_dynamicQrCode_success() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("2.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        SetPaymentMethodRequest payReq = SetPaymentMethodRequest.builder()
                .paymentMethod("BANK_TRANSFER")
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.qrCodeUrl").value(Matchers.containsString("8888888888")))
                .andExpect(jsonPath("$.result.qrCodeUrl").value(Matchers.containsString("H%E1%BB%99+kinh+doanh+Test+Order")));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_overStock_success_withWarning() throws Exception {
        openShiftForUser(testOwner);
        testProduct.setStockQuantity(new BigDecimal("50.000"));
        testProduct = productRepository.saveAndFlush(testProduct);
        entityManager.clear();

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("60.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        SetPaymentMethodRequest payReq = SetPaymentMethodRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)));

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("1500000.00"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.warningMessages").isArray())
                .andExpect(jsonPath("$.result.warningMessages[0]").value(Matchers.containsString("vượt quá số lượng tồn kho khả dụng")));

        entityManager.flush();

        Product updatedProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        entityManager.refresh(updatedProduct);
        Assertions.assertEquals(0, new BigDecimal("-10.000").compareTo(updatedProduct.getStockQuantity()));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void applyDiscount_percentage_recalculatedOnItemChange() throws Exception {
        openShiftForUser(testOwner);

        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("2.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        ApplyDiscountRequest discountReq = ApplyDiscountRequest.builder()
                .discountType("PERCENTAGE")
                .discountValue(new BigDecimal("10.00"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/discount")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(discountReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(44000.00))
                .andExpect(jsonPath("$.result.discountAmount").value(4000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(39600.00));

        CreateOrderItemRequest addMoreReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("3.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addMoreReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(110000.00))
                .andExpect(jsonPath("$.result.discountAmount").value(10000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(99000.00));

        String orderDetails = mockMvc.perform(get("/api/v1/orders/" + orderId))
                .andReturn().getResponse().getContentAsString();
        String itemId = objectMapper.readTree(orderDetails).get("result").get("items").get(0).get("id").asText();

        UpdateOrderItemRequest updateReq = UpdateOrderItemRequest.builder()
                .quantity(new BigDecimal("1.000"))
                .build();
        mockMvc.perform(put("/api/v1/orders/" + orderId + "/items/" + itemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(22000.00))
                .andExpect(jsonPath("$.result.discountAmount").value(2000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(19800.00));

        mockMvc.perform(delete("/api/v1/orders/" + orderId + "/items/" + itemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(0.00))
                .andExpect(jsonPath("$.result.discountAmount").value(0.00))
                .andExpect(jsonPath("$.result.finalAmount").value(0.00));
    }
}
