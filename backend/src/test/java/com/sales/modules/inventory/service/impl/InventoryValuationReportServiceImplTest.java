package com.sales.modules.inventory.service.impl;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.inventory.repository.GoodsReceiptDetailRepository;
import com.sales.modules.inventory.repository.InventoryAuditDetailRepository;
import com.sales.modules.order.repository.OrderItemRepository;
import com.sales.modules.order.repository.ReturnTicketItemRepository;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.entity.ProductGroup;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.supplier.repository.SupplierReturnItemRepository;
import com.sales.modules.inventory.dto.response.InventoryValuationItemResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationReportResponse;
import com.sales.modules.inventory.dto.response.MissingCostProductResponse;
import com.sales.modules.product.dto.response.ProductGroupValuationResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalTime;

@ExtendWith(MockitoExtension.class)
class InventoryValuationReportServiceImplTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ReturnTicketItemRepository returnTicketItemRepository;

    @Mock
    private SupplierReturnItemRepository supplierReturnItemRepository;

    @Mock
    private InventoryAuditDetailRepository inventoryAuditDetailRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private InventoryValuationReportServiceImpl service;

    private BusinessHousehold household;
    private Role ownerRole;
    private Role staffRole;
    private User ownerUser;
    private User staffUser;

    private ProductGroup groupDrinks;
    private ProductGroup groupFoods;

    private Product prodBeer;
    private Product prodSnack;
    private Product prodWater;
    private Product prodMissingCost;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-100")
                .name("Hộ Kinh Doanh Bách Hóa Việt")
                .taxCode("0123456789")
                .build();

        ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build();
        staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();

        ownerUser = User.builder()
                .id("u-owner")
                .username("chu_ho")
                .fullName("Nguyễn Văn Chủ")
                .household(household)
                .role(ownerRole)
                .build();

        staffUser = User.builder()
                .id("u-staff")
                .username("nhan_vien")
                .fullName("Trần Thị Nhân Viên")
                .household(household)
                .role(staffRole)
                .build();

        groupDrinks = ProductGroup.builder().id("grp-drinks").name("Đồ Uống").household(household).build();
        groupFoods = ProductGroup.builder().id("grp-foods").name("Thực Phẩm").household(household).build();

        prodBeer = Product.builder()
                .id("p-beer")
                .sku("BIA-01")
                .name("Bia Tiger 24 lon")
                .unit("Thùng")
                .household(household)
                .group(groupDrinks)
                .costPrice(new BigDecimal("300000.00"))
                .stockQuantity(new BigDecimal("80.000"))
                .price(new BigDecimal("350000.00"))
                .createdAt(LocalDateTime.now().minusDays(30))
                .build();

        prodWater = Product.builder()
                .id("p-water")
                .sku("NUOC-01")
                .name("Nước khoáng Lavie")
                .unit("Lốc")
                .household(household)
                .group(groupDrinks)
                .costPrice(new BigDecimal("50000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .price(new BigDecimal("60000.00"))
                .createdAt(LocalDateTime.now().minusDays(20))
                .build();

        prodSnack = Product.builder()
                .id("p-snack")
                .sku("SNACK-01")
                .name("Bánh Snack Oishi")
                .unit("Gói")
                .household(household)
                .group(groupFoods)
                .costPrice(new BigDecimal("8000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .price(new BigDecimal("10000.00"))
                .createdAt(LocalDateTime.now().minusDays(10))
                .build();

        prodMissingCost = Product.builder()
                .id("p-missing")
                .sku("NEW-01")
                .name("Mặt hàng mới chưa nhập phiếu")
                .unit("Cái")
                .household(household)
                .group(groupFoods)
                .costPrice(BigDecimal.ZERO)
                .stockQuantity(new BigDecimal("15.000"))
                .price(new BigDecimal("20000.00"))
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();
    }

    @Test
    @DisplayName("TC-01: Lập báo cáo giá trị tồn kho luồng thành công - tính đúng giá trị, nhóm, toàn kho, sắp xếp giảm dần")
    void testInventoryValuation_SuccessFlow_TC01() {
        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findProductsForValuationReport(eq("hh-100"), any(), any()))
                .thenReturn(List.of(prodBeer, prodWater, prodSnack));

        List<Object[]> receiptDates = new ArrayList<>();
        receiptDates.add(new Object[]{"p-beer", LocalDateTime.now().minusDays(10)});
        receiptDates.add(new Object[]{"p-water", LocalDateTime.now().minusDays(15)});
        receiptDates.add(new Object[]{"p-snack", LocalDateTime.now().minusDays(5)});
        when(goodsReceiptDetailRepository.findLatestReceiptDatesByHousehold("hh-100")).thenReturn(receiptDates);

        InventoryValuationReportResponse report = service.getInventoryValuationReport(
                "chu_ho", null, null, null, "inventoryValue", "desc");

        assertNotNull(report);
        assertNotNull(report.getSummary());

        assertEquals(new BigDecimal("29400000.00"), report.getSummary().getTotalInventoryValue());

        assertEquals(new BigDecimal("34500000.00"), report.getSummary().getTotalRetailValue());

        assertEquals(new BigDecimal("230.000"), report.getSummary().getTotalStockQuantity());

        assertEquals(new BigDecimal("5100000.00"), report.getSummary().getPotentialGrossProfit());

        List<InventoryValuationItemResponse> items = report.getItems();
        assertEquals(3, items.size());
        assertEquals("BIA-01", items.get(0).getSku());
        assertEquals(new BigDecimal("24000000.00"), items.get(0).getInventoryValue());
        assertEquals("NUOC-01", items.get(1).getSku());
        assertEquals(new BigDecimal("5000000.00"), items.get(1).getInventoryValue());
        assertEquals("SNACK-01", items.get(2).getSku());
        assertEquals(new BigDecimal("400000.00"), items.get(2).getInventoryValue());

        List<ProductGroupValuationResponse> groups = report.getGroupValuations();
        assertEquals(2, groups.size());
        assertEquals("Đồ Uống", groups.get(0).getGroupName());
        assertEquals(new BigDecimal("29000000.00"), groups.get(0).getTotalInventoryValue());
        assertEquals("Thực Phẩm", groups.get(1).getGroupName());
        assertEquals(new BigDecimal("400000.00"), groups.get(1).getTotalInventoryValue());

        assertTrue(report.getMissingCostItems().isEmpty());
    }

    @Test
    @DisplayName("TC-02: Mặt hàng chưa có giá vốn được tách riêng và không tính vào tổng giá trị tồn kho")
    void testInventoryValuation_MissingCostPriceException_TC02() {
        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findProductsForValuationReport(eq("hh-100"), any(), any()))
                .thenReturn(List.of(prodBeer, prodMissingCost));

        List<Object[]> receiptDates = new ArrayList<>();
        receiptDates.add(new Object[]{"p-beer", LocalDateTime.now().minusDays(5)});
        when(goodsReceiptDetailRepository.findLatestReceiptDatesByHousehold("hh-100")).thenReturn(receiptDates);

        InventoryValuationReportResponse report = service.getInventoryValuationReport(
                "chu_ho", null, null, null, "inventoryValue", "desc");

        assertNotNull(report);

        assertEquals(new BigDecimal("24000000.00"), report.getSummary().getTotalInventoryValue());
        assertEquals(1L, report.getSummary().getValuedProductsCount());
        assertEquals(1L, report.getSummary().getMissingCostProductsCount());
        assertEquals(new BigDecimal("15.000"), report.getSummary().getMissingCostStockQuantity());

        List<MissingCostProductResponse> missingList = report.getMissingCostItems();
        assertEquals(1, missingList.size());
        assertEquals("NEW-01", missingList.get(0).getSku());
        assertEquals(new BigDecimal("15.000"), missingList.get(0).getStockQuantity());
        assertNotNull(missingList.get(0).getWarningMessage());
    }

    @Test
    @DisplayName("TC-03: Nhân viên bán hàng (VT-02) bị chặn truy cập với 403 FORBIDDEN")
    void testInventoryValuation_StaffForbidden_TC03() {
        when(userRepository.findByUsername("nhan_vien")).thenReturn(Optional.of(staffUser));

        AppException ex = assertThrows(AppException.class, () ->
                service.getInventoryValuationReport("nhan_vien", null, null, null, "inventoryValue", "desc"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-06: Tra cứu ngày trong tương lai bị chặn với 400 Bad Request")
    void testInventoryValuation_FutureDateForbidden() {
        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        AppException ex = assertThrows(AppException.class, () ->
                service.getInventoryValuationReport("chu_ho", tomorrow, null, null, "inventoryValue", "desc"));

        assertEquals(ErrorCode.FUTURE_DATE_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-05: Tra cứu tồn kho tại thời điểm lịch sử (asOfDate quá khứ) tái dựng đúng số dư")
    void testInventoryValuation_HistoricalDate() {
        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        LocalDate pastDate = LocalDate.now().minusDays(10);
        LocalDateTime endDateTime = pastDate.atTime(LocalTime.MAX);

        when(productRepository.findProductsForValuationReport(eq("hh-100"), any(), any()))
                .thenReturn(List.of(prodBeer));

        List<Object[]> inList = Collections.singletonList(new Object[]{"p-beer", new BigDecimal("100.000")});
        List<Object[]> outList = Collections.singletonList(new Object[]{"p-beer", new BigDecimal("30.000")});
        when(goodsReceiptDetailRepository.sumQuantityBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(inList);
        when(orderItemRepository.sumQuantityBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(outList);
        when(returnTicketItemRepository.sumQuantityBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(Collections.emptyList());
        when(supplierReturnItemRepository.sumQuantityBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(Collections.emptyList());
        when(inventoryAuditDetailRepository.sumDifferenceBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(Collections.emptyList());

        when(goodsReceiptDetailRepository.findLatestReceiptDatesBefore("hh-100", endDateTime))
                .thenReturn(Collections.singletonList(new Object[]{"p-beer", pastDate.minusDays(5).atStartOfDay()}));

        InventoryValuationReportResponse report = service.getInventoryValuationReport(
                "chu_ho", pastDate, null, null, "inventoryValue", "desc");

        assertNotNull(report);
        assertTrue(report.getSummary().getIsHistorical());
        assertEquals(pastDate, report.getSummary().getAsOfDate());

        assertEquals(new BigDecimal("70.000"), report.getItems().get(0).getStockQuantity());

        assertEquals(new BigDecimal("21000000.00"), report.getItems().get(0).getInventoryValue());
    }

    @Test
    @DisplayName("TC-10: Xuất tệp bảng tính Excel thành công")
    void testExportInventoryValuationExcel_Success() {
        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findProductsForValuationReport(eq("hh-100"), any(), any()))
                .thenReturn(List.of(prodBeer, prodMissingCost));

        byte[] excelBytes = service.exportInventoryValuationExcel("chu_ho", null, null, null);

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);
    }

    @Test
    @DisplayName("TC-11: Xuất Excel khi không có dữ liệu thì ném lỗi NO_DATA_TO_EXPORT")
    void testExportInventoryValuationExcel_NoData() {
        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findProductsForValuationReport(eq("hh-100"), any(), any()))
                .thenReturn(Collections.emptyList());

        AppException ex = assertThrows(AppException.class, () ->
                service.exportInventoryValuationExcel("chu_ho", null, null, null));

        assertEquals(ErrorCode.NO_DATA_TO_EXPORT, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-12: Sắp xếp an toàn khi có mặt hàng chứa tên null hoặc giá trị null (Null-Safe Comparator)")
    void testInventoryValuation_NullSafeSorting() {
        Product prodNullName = Product.builder()
                .id("p-null")
                .sku("NULL-01")
                .name(null)
                .unit("Cái")
                .household(household)
                .group(groupFoods)
                .costPrice(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("15000.00"))
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findProductsForValuationReport(eq("hh-100"), any(), any()))
                .thenReturn(List.of(prodBeer, prodNullName));

        List<Object[]> receiptDates = new ArrayList<>();
        receiptDates.add(new Object[]{"p-beer", LocalDateTime.now().minusDays(5)});
        when(goodsReceiptDetailRepository.findLatestReceiptDatesByHousehold("hh-100")).thenReturn(receiptDates);

        InventoryValuationReportResponse report = service.getInventoryValuationReport(
                "chu_ho", null, null, null, "productName", "asc");

        assertNotNull(report);
        assertEquals(2, report.getItems().size());
        assertEquals("BIA-01", report.getItems().get(0).getSku());
        assertNull(report.getItems().get(1).getProductName());
    }

    @Test
    @DisplayName("TC-13: Người dùng có vai trò không nằm trong danh sách trắng (VT-01, VT-03) bị chặn với 403 FORBIDDEN")
    void testInventoryValuation_OtherRoleForbidden() {
        Role auditorRole = Role.builder().id(4).code("VT-04").name("Kiểm kho").build();
        User auditorUser = User.builder()
                .id("u-auditor")
                .username("kiem_kho")
                .household(household)
                .role(auditorRole)
                .build();

        when(userRepository.findByUsername("kiem_kho")).thenReturn(Optional.of(auditorUser));

        AppException ex = assertThrows(AppException.class, () ->
                service.getInventoryValuationReport("kiem_kho", null, null, null, "inventoryValue", "desc"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("P2-01: An toàn kiểu dữ liệu khi kết quả aggregate JPQL trả về Long hoặc Double thay vì BigDecimal")
    void testInventoryValuation_SafeTypeCast_P2_01() {
        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        LocalDate pastDate = LocalDate.now().minusDays(5);
        LocalDateTime endDateTime = pastDate.atTime(LocalTime.MAX);

        when(productRepository.findProductsForValuationReport(eq("hh-100"), any(), any()))
                .thenReturn(List.of(prodBeer));

        List<Object[]> inListWithLong = Collections.singletonList(new Object[]{"p-beer", 50L});
        List<Object[]> outListWithDouble = Collections.singletonList(new Object[]{"p-beer", 20.5});

        when(goodsReceiptDetailRepository.sumQuantityBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(inListWithLong);
        when(orderItemRepository.sumQuantityBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(outListWithDouble);
        when(returnTicketItemRepository.sumQuantityBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(Collections.emptyList());
        when(supplierReturnItemRepository.sumQuantityBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(Collections.emptyList());
        when(inventoryAuditDetailRepository.sumDifferenceBeforeGroupedByProduct("hh-100", endDateTime)).thenReturn(Collections.emptyList());

        when(goodsReceiptDetailRepository.findLatestReceiptDatesBefore("hh-100", endDateTime))
                .thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> {
            InventoryValuationReportResponse report = service.getInventoryValuationReport(
                    "chu_ho", pastDate, null, null, "inventoryValue", "desc");
            assertNotNull(report);
            assertEquals(1, report.getItems().size());

            assertEquals(new BigDecimal("29.500"), report.getItems().get(0).getStockQuantity());
        });
    }

    @Test
    @DisplayName("P2-02: Lọc sản phẩm truyền đúng tham số groupId và search xuống Repository")
    void testInventoryValuation_DbFiltering_P2_02() {
        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findProductsForValuationReport(eq("hh-100"), eq("grp-drinks"), eq("TIGER")))
                .thenReturn(List.of(prodBeer));

        when(goodsReceiptDetailRepository.findLatestReceiptDatesByHousehold("hh-100"))
                .thenReturn(Collections.emptyList());

        InventoryValuationReportResponse report = service.getInventoryValuationReport(
                "chu_ho", null, "  grp-drinks  ", "  TIGER  ", "inventoryValue", "desc");

        assertNotNull(report);
        assertEquals(1, report.getItems().size());
        assertEquals("BIA-01", report.getItems().get(0).getSku());
    }

    @Test
    @DisplayName("P2-03: Nhóm hàng âm kho không làm 0% tỷ trọng vốn của các nhóm hàng dương khác")
    void testInventoryValuation_NegativeStockGroup_DoesNotZeroPercentages() {
        Product prodNegative = Product.builder()
                .id("p-negative")
                .sku("NEG-01")
                .name("Hàng Bị Âm Kho")
                .unit("Lon")
                .household(household)
                .group(ProductGroup.builder().id("grp-neg").name("Nhóm Âm Kho").household(household).build())
                .costPrice(new BigDecimal("100000.00"))
                .stockQuantity(new BigDecimal("-100.000"))
                .price(new BigDecimal("120000.00"))
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        when(userRepository.findByUsername("chu_ho")).thenReturn(Optional.of(ownerUser));

        when(productRepository.findProductsForValuationReport(eq("hh-100"), any(), any()))
                .thenReturn(List.of(prodBeer, prodSnack, prodNegative));

        when(goodsReceiptDetailRepository.findLatestReceiptDatesByHousehold("hh-100"))
                .thenReturn(Collections.emptyList());

        InventoryValuationReportResponse report = service.getInventoryValuationReport(
                "chu_ho", null, null, null, "inventoryValue", "desc");

        assertNotNull(report);
        List<ProductGroupValuationResponse> groups = report.getGroupValuations();
        assertEquals(3, groups.size());

        ProductGroupValuationResponse beerGroup = groups.stream()
                .filter(g -> "Đồ Uống".equals(g.getGroupName()))
                .findFirst().orElseThrow();
        assertTrue(beerGroup.getValuePercentage().compareTo(BigDecimal.ZERO) > 0, "Tỷ trọng nhóm Đồ Uống phải > 0%");

        ProductGroupValuationResponse negGroup = groups.stream()
                .filter(g -> "Nhóm Âm Kho".equals(g.getGroupName()))
                .findFirst().orElseThrow();
        assertEquals(BigDecimal.ZERO, negGroup.getValuePercentage());
    }
}
