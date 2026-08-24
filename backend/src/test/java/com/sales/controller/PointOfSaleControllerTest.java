package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.PointOfSaleRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.UserRepository;
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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PointOfSaleControllerTest {

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
    private PointOfSaleRepository pointOfSaleRepository;

    private BusinessHousehold testHousehold;
    private User testOwner;
    private User testStaff;
    private User testAccountant;
    private PointOfSale pos1;
    private PointOfSale pos2;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("7777777777").orElseGet(() -> {
            BusinessHousehold h = BusinessHousehold.builder()
                    .taxCode("7777777777")
                    .name("Hộ kinh doanh Test POS")
                    .address("Số 77 Đường Bán Hàng, TP. HCM")
                    .phoneNumber("0777777777")
                    .representativeName("Chủ Hộ POS")
                    .revenueThresholdEnabled(true)
                    .build();
            return businessHouseholdRepository.save(h);
        });

        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build();
            return roleRepository.save(r);
        });

        Role staffRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
            return roleRepository.save(r);
        });

        Role accountantRole = roleRepository.findByCode("VT-03").orElseGet(() -> {
            Role r = Role.builder().code("VT-03").name("Kế toán").build();
            return roleRepository.save(r);
        });

        testOwner = userRepository.findByUsername("test_owner_pos").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_pos")
                    .passwordHash("hash")
                    .fullName("Chủ Hộ POS Test")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testStaff = userRepository.findByUsername("test_staff_pos").orElseGet(() -> {
            User u = User.builder()
                    .username("test_staff_pos")
                    .passwordHash("hash")
                    .fullName("Nhân Viên POS Test")
                    .role(staffRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testAccountant = userRepository.findByUsername("test_accountant_pos").orElseGet(() -> {
            User u = User.builder()
                    .username("test_accountant_pos")
                    .passwordHash("hash")
                    .fullName("Kế Toán POS Test")
                    .role(accountantRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        pos1 = PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-01")
                .name("Quầy Số 1")
                .address("Số 77 Đường Bán Hàng")
                .phoneNumber("0777777777")
                .invoiceSymbol("C26POS1")
                .isDefault(true)
                .isActive(true)
                .build();
        pos1 = pointOfSaleRepository.save(pos1);

        pos2 = PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-02")
                .name("Quầy Số 2")
                .address("Số 79 Đường Bán Hàng")
                .phoneNumber("0777777778")
                .invoiceSymbol("C26POS2")
                .isDefault(false)
                .isActive(true)
                .build();
        pos2 = pointOfSaleRepository.save(pos2);
    }

    @Test
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    @DisplayName("NCL-17-CN-001-TC-01: Chủ hộ tạo điểm bán mới thành công")
    public void createPointOfSale_Owner_Success() throws Exception {
        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .posCode("POS-03")
                .name("Quầy Số 3 - Chi nhánh mới")
                .address("Số 100 Đường Bán Hàng")
                .phoneNumber("0777777779")
                .invoiceSymbol("C26POS3")
                .isDefault(false)
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/v1/points-of-sale")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Quầy Số 3 - Chi nhánh mới"))
                .andExpect(jsonPath("$.result.posCode").value("POS-03"))
                .andExpect(jsonPath("$.result.invoiceSymbol").value("C26POS3"))
                .andExpect(jsonPath("$.result.isDefault").value(false));
    }

    @Test
    @WithMockUser(username = "test_staff_pos", roles = {"VT-02"})
    @DisplayName("NCL-17-CN-001-TC-03: Nhân viên bán hàng tạo điểm bán -> Chặn 403 Forbidden")
    public void createPointOfSale_Staff_Forbidden() throws Exception {
        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Quầy Thử Nghiệm")
                .address("123 Test")
                .build();

        mockMvc.perform(post("/api/v1/points-of-sale")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    @DisplayName("NCL-17-CN-001-TC-02: Trùng ký hiệu hóa đơn riêng -> Chặn 400 Bad Request (Code 7004)")
    public void createPointOfSale_DuplicateInvoiceSymbol_BadRequest() throws Exception {
        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Quầy Mới Trùng Symbol")
                .address("123 Test")
                .invoiceSymbol("C26POS1") // Trùng với pos1
                .build();

        mockMvc.perform(post("/api/v1/points-of-sale")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(7004));
    }

    @Test
    @WithMockUser(username = "test_staff_pos", roles = {"VT-02"})
    @DisplayName("Nhân viên bán hàng xem danh sách điểm bán đang hoạt động (Dropdown) thành công")
    public void getActivePointsOfSale_Staff_Success() throws Exception {
        mockMvc.perform(get("/api/v1/points-of-sale/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(2)));
    }

    @Test
    @WithMockUser(username = "test_accountant_pos", roles = {"VT-03"})
    @DisplayName("Kế toán xem danh sách điểm bán có phân trang thành công")
    public void getAllPointsOfSale_Accountant_Success() throws Exception {
        mockMvc.perform(get("/api/v1/points-of-sale?keyword=Quầy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content", hasSize(2)));
    }

    @Test
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    @DisplayName("Cập nhật thông tin điểm bán thành công")
    public void updatePointOfSale_Owner_Success() throws Exception {
        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Quầy Số 2 - Đã Sửa Tên")
                .address("Địa chỉ mới cập nhật")
                .phoneNumber("0988776655")
                .isActive(true)
                .build();

        mockMvc.perform(put("/api/v1/points-of-sale/" + pos2.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Quầy Số 2 - Đã Sửa Tên"));
    }

    @Test
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    @DisplayName("Thiết lập điểm bán 2 làm mặc định -> Điểm 1 tự động chuyển non-default")
    public void setDefaultPointOfSale_Owner_Success() throws Exception {
        mockMvc.perform(patch("/api/v1/points-of-sale/" + pos2.getId() + "/default"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.isDefault").value(true));
    }

    @Test
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    @DisplayName("Chặn xóa điểm bán mặc định (Code 7005)")
    public void deletePointOfSale_DefaultPOS_BadRequest() throws Exception {
        mockMvc.perform(delete("/api/v1/points-of-sale/" + pos1.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(7005));
    }

    @Test
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    @DisplayName("Xóa điểm bán phụ thành công")
    public void deletePointOfSale_SecondaryPOS_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/points-of-sale/" + pos2.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_owner_pos", roles = {"VT-01"})
    @DisplayName("Chặn thiết lập điểm bán ngưng hoạt động làm mặc định -> Chặn 400 Bad Request (Code 7007)")
    public void setDefaultPointOfSale_InactivePOS_BadRequest() throws Exception {
        pos2.setIsActive(false);
        pointOfSaleRepository.save(pos2);

        mockMvc.perform(patch("/api/v1/points-of-sale/" + pos2.getId() + "/default"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(7007));
    }
}
