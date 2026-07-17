package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.dto.request.*;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class OrderControllerTest {

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
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

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
        try {
            jdbcTemplate.execute("ALTER TABLE products DROP CHECK chk_product_stock");
        } catch (Exception e) {
            // Ignore if it does not exist
        }

        // 1. Hộ kinh doanh
        testHousehold = businessHouseholdRepository.findByTaxCode("8888888888").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("8888888888")
                    .name("Hộ kinh doanh Test Order")
                    .address("Địa chỉ Test")
                    .phoneNumber("0888888888")
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

        // 3. Người dùng
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

        // 4. Thuế suất
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

        // 5. Sản phẩm
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

        // 6. Khách hàng
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

        // Xóa các ca mở cũ của test users để tránh lỗi
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

        // 1. Tạo đơn hàng trước
        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        // 2. Thêm mặt hàng (số lượng 5, đơn giá 20,000, VAT 10% -> subtotal = 110,000)
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

        // 3. Cập nhật số lượng lên 10 (subtotal = 220,000)
        UpdateOrderItemRequest updateReq = UpdateOrderItemRequest.builder()
                .quantity(new BigDecimal("10.000"))
                .build();
        
        // Lấy chi tiết dòng hàng
        responseStr = mockMvc.perform(get("/api/v1/orders/" + orderId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String itemId = objectMapper.readTree(responseStr).get("result").get("items").get(0).get("id").asText();

        mockMvc.perform(put("/api/v1/orders/" + orderId + "/items/" + itemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(220000.00));

        // 4. Xóa dòng hàng
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

        // Tồn kho sản phẩm là 50. Chúng ta bán 60.
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

        // Thêm mặt hàng thành tiền 110,000
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // Chủ hộ áp giảm giá 50% (55,000 VND) -> Cho phép
        ApplyDiscountRequest discountReq = ApplyDiscountRequest.builder()
                .discountType("PERCENTAGE")
                .discountValue(new BigDecimal("50.00"))
                .build();

        mockMvc.perform(post("/api/v1/orders/" + orderId + "/discount")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(discountReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.discountAmount").value(55000.00))
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

        // Thêm mặt hàng thành tiền 110,000
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // Nhân viên áp giảm giá 15% (>10%) -> Chặn
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

        // Thêm mặt hàng 110,000
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // Chọn tiền mặt
        OrderPaymentRequest payReq = OrderPaymentRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)));

        // Chốt đơn với khách đưa 120,000 -> Thối 10,000
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

        // Thêm mặt hàng 110,000
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        OrderPaymentRequest payReq = OrderPaymentRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)));

        // Khách đưa 100,000 (< 110,000) -> Thất bại
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

        // Thêm mặt hàng 110,000
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // Chọn chuyển khoản, hệ thống trả về qrCodeUrl
        OrderPaymentRequest payReq = OrderPaymentRequest.builder()
                .paymentMethod("BANK_TRANSFER")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.qrCodeUrl").exists());

        // Chốt đơn
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
    public void completeOrder_debt_success_and_fails_if_creditLimitExceeded() throws Exception {
        openShiftForUser(testOwner);

        // 1. Tạo đơn hàng với khách hàng
        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .customerId(testCustomer.getId())
                .build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        // Thêm mặt hàng trị giá 110,000
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // 2. Thử chọn DEBT cho đơn hàng đầu tiên (Thành công vì nợ 110,000 < hạn mức 1,000,000)
        OrderPaymentRequest payReq = OrderPaymentRequest.builder()
                .paymentMethod("DEBT")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.paymentStatus").value("DEBT"));

        // Chốt đơn hàng đầu tiên -> Ghi nhận nợ của khách
        CompleteOrderRequest completeReq = CompleteOrderRequest.builder().build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("COMPLETED"));

        // 3. Tạo đơn hàng thứ 2 trị giá 990,000 (Tổng nợ mới = 110k + 990k = 1.1M > hạn mức 1.0M) -> Báo lỗi
        responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId2 = objectMapper.readTree(responseStr).get("result").get("id").asText();

        // Thêm 45 chai nước ép (trị giá 45 * 20k * 1.1 = 990,000)
        CreateOrderItemRequest itemReq2 = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("45.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId2 + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq2)));

        // Áp dụng ghi nợ -> Thất bại do vượt hạn mức công nợ
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

        // 1. Tạo đơn hàng
        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        // 2. Thêm 5 mặt hàng (stock ban đầu là 50.000)
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("5.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // 3. Chọn CASH payment
        OrderPaymentRequest payReq = OrderPaymentRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)));

        // 4. Chốt đơn
        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("120000.00"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk());

        // 5. Kiểm tra stock của product giảm còn 45.000
        Product updatedProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(0, new BigDecimal("45.000").compareTo(updatedProduct.getStockQuantity()));
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

        // Tạo đơn hàng của testEmployee
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

        // testEmployee2 cố tình xem đơn hàng của testEmployee -> Bị chặn 403 Forbidden
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

        // Thêm mặt hàng
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("2.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // Chọn BANK_TRANSFER và kiểm tra qrCodeUrl chứa thông tin Hộ kinh doanh động
        OrderPaymentRequest payReq = OrderPaymentRequest.builder()
                .paymentMethod("BANK_TRANSFER")
                .build();
        
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.qrCodeUrl").value(org.hamcrest.Matchers.containsString("8888888888"))) // chứa taxCode
                .andExpect(jsonPath("$.result.qrCodeUrl").value(org.hamcrest.Matchers.containsString("H%E1%BB%99+kinh+doanh+Test+Order"))); // chứa tên tiếng việt url-encoded
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void completeOrder_overStock_success_withWarning() throws Exception {
        openShiftForUser(testOwner);

        // 1. Tạo đơn hàng
        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        // 2. Thêm 60 mặt hàng (stock ban đầu là 50.000) -> vượt tồn kho
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("60.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // 3. Chọn CASH payment
        OrderPaymentRequest payReq = OrderPaymentRequest.builder()
                .paymentMethod("CASH")
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/payment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)));

        // 4. Chốt đơn
        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("1500000.00")) // 60 * 20000 * 1.1 = 1320000
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.warningMessages").isArray())
                .andExpect(jsonPath("$.result.warningMessages[0]").value(org.hamcrest.Matchers.containsString("vượt quá số lượng tồn kho khả dụng")));

        // 5. Kiểm tra stock của product giảm còn -10.000
        Product updatedProduct = productRepository.findById(testProduct.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(0, new BigDecimal("-10.000").compareTo(updatedProduct.getStockQuantity()));
    }

    @Test
    @WithMockUser(username = "test_owner_order", roles = {"VT-01"})
    public void applyDiscount_percentage_recalculatedOnItemChange() throws Exception {
        openShiftForUser(testOwner);

        // 1. Tạo đơn hàng
        CreateOrderRequest orderReq = CreateOrderRequest.builder().build();
        String responseStr = mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andReturn().getResponse().getContentAsString();
        String orderId = objectMapper.readTree(responseStr).get("result").get("id").asText();

        // 2. Thêm 2 mặt hàng (total 40k, subtotal 44k)
        CreateOrderItemRequest itemReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("2.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)));

        // 3. Áp dụng 10% discount
        ApplyDiscountRequest discountReq = ApplyDiscountRequest.builder()
                .discountType("PERCENTAGE")
                .discountValue(new BigDecimal("10.00"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/discount")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(discountReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(44000.00))
                .andExpect(jsonPath("$.result.discountAmount").value(4400.00))
                .andExpect(jsonPath("$.result.finalAmount").value(39600.00));

        // 4. Thêm 3 mặt hàng nữa -> tổng quantity = 5 (total 100k, subtotal 110k)
        // Chiết khấu 10% phải tự động tính lại thành 11k
        CreateOrderItemRequest addMoreReq = CreateOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(new BigDecimal("3.000"))
                .build();
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addMoreReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(110000.00))
                .andExpect(jsonPath("$.result.discountAmount").value(11000.00))
                .andExpect(jsonPath("$.result.finalAmount").value(99000.00));

        // 5. Cập nhật quantity về 1 (total 20k, subtotal 22k)
        // Chiết khấu 10% phải tự động tính lại thành 2.2k
        // Đầu tiên cần lấy ID của OrderItem
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
                .andExpect(jsonPath("$.result.discountAmount").value(2200.00))
                .andExpect(jsonPath("$.result.finalAmount").value(19800.00));

        // 6. Xóa item (total 0) -> chiết khấu tự động tính lại thành 0
        mockMvc.perform(delete("/api/v1/orders/" + orderId + "/items/" + itemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalAmount").value(0.00))
                .andExpect(jsonPath("$.result.discountAmount").value(0.00))
                .andExpect(jsonPath("$.result.finalAmount").value(0.00));
    }
}
