package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PosTransferStatus;
import com.sales.dto.request.CancelPosTransferRequest;
import com.sales.dto.request.CreatePosTransferRequest;
import com.sales.dto.request.PosTransferItemRequest;
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
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PosTransferControllerTest {

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

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private PosInventoryRepository posInventoryRepository;

    @Autowired
    private PosTransferRepository posTransferRepository;

    @Autowired
    private PosTransferItemRepository posTransferItemRepository;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private BusinessHousehold testHousehold;
    private User testOwner;
    private User testStaffPos1;
    private User testStaffPos2;
    private PointOfSale pos1;
    private PointOfSale pos2;
    private Product product1;
    private PosInventory inventoryPos1;
    private PosInventory inventoryPos2;

    @BeforeEach
    public void setUp() {
        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));
        Role staffRole = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên bán hàng").build()));

        testHousehold = businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("8888777766")
                .name("Hộ kinh doanh Test Transfer")
                .address("123 Phố Chuyển Hàng")
                .phoneNumber("0912345679")
                .build());

        pos1 = pointOfSaleRepository.save(PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-TR1")
                .name("Quầy 1 - Gửi hàng")
                .address("Số 1 Đường Chuyển")
                .isDefault(true)
                .isActive(true)
                .build());

        pos2 = pointOfSaleRepository.save(PointOfSale.builder()
                .household(testHousehold)
                .posCode("POS-TR2")
                .name("Quầy 2 - Nhận hàng")
                .address("Số 2 Đường Chuyển")
                .isDefault(false)
                .isActive(true)
                .build());

        testOwner = userRepository.save(User.builder()
                .household(testHousehold)
                .role(ownerRole)
                .username("test_owner_transfer")
                .passwordHash("$2a$10$hash")
                .fullName("Chủ hộ Test Transfer")
                .phoneNumber("0912345679")
                .isActive(true)
                .build());

        testStaffPos1 = userRepository.save(User.builder()
                .household(testHousehold)
                .role(staffRole)
                .username("test_staff_pos1")
                .passwordHash("$2a$10$hash")
                .fullName("Nhân viên Quầy 1")
                .phoneNumber("0987654322")
                .pointOfSale(pos1)
                .isActive(true)
                .build());

        testStaffPos2 = userRepository.save(User.builder()
                .household(testHousehold)
                .role(staffRole)
                .username("test_staff_pos2")
                .passwordHash("$2a$10$hash")
                .fullName("Nhân viên Quầy 2")
                .phoneNumber("0987654323")
                .pointOfSale(pos2)
                .isActive(true)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .household(testHousehold)
                .name("Thuế VAT 1% Transfer")
                .ratePercentage(BigDecimal.valueOf(1.00))
                .isActive(true)
                .build());

        product1 = productRepository.save(Product.builder()
                .household(testHousehold)
                .sku("SKU-TR-001")
                .name("Sản phẩm Chuyển Kho 01")
                .unit("Thùng")
                .price(BigDecimal.valueOf(120000))
                .stockQuantity(BigDecimal.valueOf(50))
                .taxRate(taxRate)
                .status("ACTIVE")
                .build());

        inventoryPos1 = posInventoryRepository.save(PosInventory.builder()
                .household(testHousehold)
                .pointOfSale(pos1)
                .product(product1)
                .stockQuantity(BigDecimal.valueOf(30))
                .minStockQuantity(BigDecimal.valueOf(5))
                .build());

        inventoryPos2 = posInventoryRepository.save(PosInventory.builder()
                .household(testHousehold)
                .pointOfSale(pos2)
                .product(product1)
                .stockQuantity(BigDecimal.valueOf(5))
                .minStockQuantity(BigDecimal.valueOf(5))
                .build());
    }

    @Test
    @WithMockUser(username = "test_owner_transfer", roles = {"VT-01"})
    @DisplayName("NCL-17-CN-003-TC-01: Chủ hộ tạo phiếu chuyển hàng thành công -> 200 OK (Code 1000)")
    public void createTransfer_Owner_Success() throws Exception {
        CreatePosTransferRequest request = CreatePosTransferRequest.builder()
                .fromPointOfSaleId(pos1.getId())
                .toPointOfSaleId(pos2.getId())
                .notes("Chuyển bổ sung 10 thùng hàng")
                .items(List.of(
                        PosTransferItemRequest.builder()
                                .productId(product1.getId())
                                .quantity(BigDecimal.valueOf(10))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/pos-transfers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.fromPointOfSaleId").value(pos1.getId()))
                .andExpect(jsonPath("$.result.toPointOfSaleId").value(pos2.getId()))
                .andExpect(jsonPath("$.result.status").value("IN_TRANSIT"))
                .andExpect(jsonPath("$.result.totalItems").value(1))
                .andExpect(jsonPath("$.result.totalQuantity").value(10.0))
                .andExpect(jsonPath("$.result.items", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "test_staff_pos1", roles = {"VT-02"})
    @DisplayName("NCL-17-CN-003-TC-02: Nhân viên bán hàng tạo phiếu chuyển -> Chặn 403 Forbidden")
    public void createTransfer_Staff_Forbidden() throws Exception {
        CreatePosTransferRequest request = CreatePosTransferRequest.builder()
                .fromPointOfSaleId(pos1.getId())
                .toPointOfSaleId(pos2.getId())
                .items(List.of(
                        PosTransferItemRequest.builder()
                                .productId(product1.getId())
                                .quantity(BigDecimal.valueOf(5))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/pos-transfers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_owner_transfer", roles = {"VT-01"})
    @DisplayName("NCL-17-CN-003-TC-03: Tạo phiếu chuyển với điểm gửi trùng điểm nhận -> Chặn 400 Bad Request")
    public void createTransfer_SamePos_BadRequest() throws Exception {
        CreatePosTransferRequest request = CreatePosTransferRequest.builder()
                .fromPointOfSaleId(pos1.getId())
                .toPointOfSaleId(pos1.getId())
                .items(List.of(
                        PosTransferItemRequest.builder()
                                .productId(product1.getId())
                                .quantity(BigDecimal.valueOf(5))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/pos-transfers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(7021));
    }

    @Test
    @WithMockUser(username = "test_owner_transfer", roles = {"VT-01"})
    @DisplayName("NCL-17-CN-003-TC-04: Lấy danh sách phân trang phiếu chuyển hàng -> 200 OK")
    public void getTransfers_Owner_Success() throws Exception {
        // Tạo sẵn 1 phiếu chuyển
        PosTransfer transfer = PosTransfer.builder()
                .household(testHousehold)
                .transferNumber("CK-20260825-9991")
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(testOwner)
                .status(PosTransferStatus.IN_TRANSIT)
                .totalItems(1)
                .totalQuantity(BigDecimal.valueOf(5))
                .transferredAt(LocalDateTime.now())
                .build();
        posTransferRepository.save(transfer);

        entityManager.flush();
        entityManager.clear();

        mockMvc.perform(get("/api/v1/pos-transfers")
                        .param("fromPosId", pos1.getId())
                        .param("status", "IN_TRANSIT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content", hasSize(1)))
                .andExpect(jsonPath("$.result.content[0].transferNumber").value("CK-20260825-9991"))
                .andExpect(jsonPath("$.result.content[0].fromPointOfSaleName").value(pos1.getName()))
                .andExpect(jsonPath("$.result.content[0].items").doesNotExist());
    }

    @Test
    @WithMockUser(username = "test_owner_transfer", roles = {"VT-01"})
    @DisplayName("NCL-17-CN-003-TC-05: Xem chi tiết phiếu chuyển hàng theo ID -> 200 OK kèm items")
    public void getTransferById_Owner_Success() throws Exception {
        PosTransfer transfer = PosTransfer.builder()
                .household(testHousehold)
                .transferNumber("CK-20260825-9992")
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(testOwner)
                .status(PosTransferStatus.IN_TRANSIT)
                .totalItems(1)
                .totalQuantity(BigDecimal.valueOf(5))
                .transferredAt(LocalDateTime.now())
                .build();
        transfer = posTransferRepository.save(transfer);

        PosTransferItem item = PosTransferItem.builder()
                .transfer(transfer)
                .product(product1)
                .productSku(product1.getSku())
                .productName(product1.getName())
                .unit(product1.getUnit())
                .quantity(BigDecimal.valueOf(5))
                .build();
        posTransferItemRepository.save(item);

        entityManager.flush();
        entityManager.clear();

        mockMvc.perform(get("/api/v1/pos-transfers/" + transfer.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(transfer.getId()))
                .andExpect(jsonPath("$.result.transferNumber").value("CK-20260825-9992"))
                .andExpect(jsonPath("$.result.items", hasSize(1)))
                .andExpect(jsonPath("$.result.items[0].productSku").value(product1.getSku()));
    }

    @Test
    @WithMockUser(username = "test_staff_pos2", roles = {"VT-02"})
    @DisplayName("NCL-17-CN-003-TC-06: Nhân viên thuộc điểm nhận xác nhận nhận hàng -> 200 OK (COMPLETED)")
    public void receiveTransfer_StaffAtToPos_Success() throws Exception {
        PosTransfer transfer = PosTransfer.builder()
                .household(testHousehold)
                .transferNumber("CK-20260825-9993")
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(testOwner)
                .status(PosTransferStatus.IN_TRANSIT)
                .totalItems(1)
                .totalQuantity(BigDecimal.valueOf(5))
                .transferredAt(LocalDateTime.now())
                .build();
        transfer = posTransferRepository.save(transfer);

        PosTransferItem item = PosTransferItem.builder()
                .transfer(transfer)
                .product(product1)
                .productSku(product1.getSku())
                .productName(product1.getName())
                .unit(product1.getUnit())
                .quantity(BigDecimal.valueOf(5))
                .build();
        posTransferItemRepository.save(item);

        entityManager.flush();
        entityManager.clear();

        mockMvc.perform(post("/api/v1/pos-transfers/" + transfer.getId() + "/receive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("COMPLETED"))
                .andExpect(jsonPath("$.result.receivedByUserId").value(testStaffPos2.getId()));
    }

    @Test
    @WithMockUser(username = "test_staff_pos1", roles = {"VT-02"})
    @DisplayName("NCL-17-CN-003-TC-07: Nhân viên điểm gửi cố tình nhận hàng cho điểm nhận -> 403 Forbidden")
    public void receiveTransfer_StaffAtFromPos_Forbidden() throws Exception {
        PosTransfer transfer = PosTransfer.builder()
                .household(testHousehold)
                .transferNumber("CK-20260825-9994")
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(testOwner)
                .status(PosTransferStatus.IN_TRANSIT)
                .totalItems(1)
                .totalQuantity(BigDecimal.valueOf(5))
                .transferredAt(LocalDateTime.now())
                .build();
        transfer = posTransferRepository.save(transfer);

        entityManager.flush();
        entityManager.clear();

        mockMvc.perform(post("/api/v1/pos-transfers/" + transfer.getId() + "/receive"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(7026));
    }

    @Test
    @WithMockUser(username = "test_owner_transfer", roles = {"VT-01"})
    @DisplayName("NCL-17-CN-003-TC-08: Chủ hộ hủy phiếu chuyển hàng thành công -> 200 OK (CANCELED)")
    public void cancelTransfer_Owner_Success() throws Exception {
        PosTransfer transfer = PosTransfer.builder()
                .household(testHousehold)
                .transferNumber("CK-20260825-9995")
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(testOwner)
                .status(PosTransferStatus.IN_TRANSIT)
                .totalItems(1)
                .totalQuantity(BigDecimal.valueOf(5))
                .transferredAt(LocalDateTime.now())
                .build();
        transfer = posTransferRepository.save(transfer);

        PosTransferItem item = PosTransferItem.builder()
                .transfer(transfer)
                .product(product1)
                .productSku(product1.getSku())
                .productName(product1.getName())
                .unit(product1.getUnit())
                .quantity(BigDecimal.valueOf(5))
                .build();
        posTransferItemRepository.save(item);

        entityManager.flush();
        entityManager.clear();

        CancelPosTransferRequest request = CancelPosTransferRequest.builder()
                .cancelReason("Khách hàng điểm nhận hủy yêu cầu nhập thêm")
                .build();

        mockMvc.perform(post("/api/v1/pos-transfers/" + transfer.getId() + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CANCELED"))
                .andExpect(jsonPath("$.result.cancelReason").value("Khách hàng điểm nhận hủy yêu cầu nhập thêm"));
    }
}
