package com.sales.service;

import com.sales.dto.response.GrossProfitReportResponse;
import com.sales.dto.response.PaymentMethodReportResponse;
import com.sales.dto.response.ProductGroupReportResponse;
import com.sales.dto.response.ProductGroupRevenueDetailResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.interfaces.ReportExportService;
import com.sales.service.interfaces.ReportService;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ReportEpicNcl07ServiceTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private ReportExportService reportExportService;

    @Autowired
    private BusinessHouseholdRepository householdRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductGroupRepository productGroupRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderPaymentRepository orderPaymentRepository;

    @Autowired
    private CustomerDebtRepository customerDebtRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ReturnTicketRepository returnTicketRepository;

    @Autowired
    private ReturnTicketItemRepository returnTicketItemRepository;

    @Autowired
    private EInvoiceRepository eInvoiceRepository;

    @MockBean
    private ActivityLogHelper activityLogHelper;

    private BusinessHousehold household;
    private User owner;
    private Product productA;
    private Product productB;
    private ProductGroup groupG1;
    private TaxRate taxRate;

    @BeforeEach
    public void setup() {
        household = householdRepository.findByTaxCode("9999999999").orElseGet(() -> {
            BusinessHousehold h = BusinessHousehold.builder()
                    .taxCode("9999999999")
                    .name("Hộ kinh doanh Test NCL07")
                    .address("123 Test Street")
                    .phoneNumber("0999999999")
                    .build();
            return householdRepository.save(h);
        });

        Role roleOwner = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        owner = userRepository.findByUsername("owner_test_ncl07").orElseGet(() -> {
            User u = User.builder()
                    .username("owner_test_ncl07")
                    .fullName("Chủ Hộ NCL-07")
                    .passwordHash("password")
                    .role(roleOwner)
                    .household(household)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        taxRate = taxRateRepository.findByHouseholdIdAndIsActiveTrue(household.getId()).stream().findFirst().orElseGet(() -> {
            TaxRate tr = TaxRate.builder()
                    .name("Thuế suất mặc định 0%")
                    .ratePercentage(BigDecimal.ZERO)
                    .household(household)
                    .isActive(true)
                    .build();
            return taxRateRepository.save(tr);
        });

        groupG1 = productGroupRepository.save(ProductGroup.builder()
                .name("Bánh kẹo")
                .household(household)
                .build());

        // Sản phẩm A: có giá vốn 60,000, giá bán 100,000, thuộc nhóm G1
        productA = productRepository.save(Product.builder()
                .sku("SKU-A")
                .name("Kẹo Socola")
                .unit("Hộp")
                .price(new BigDecimal("100000"))
                .costPrice(new BigDecimal("60000"))
                .stockQuantity(new BigDecimal("100"))
                .taxRate(taxRate)
                .group(groupG1)
                .household(household)
                .build());

        // Sản phẩm B: KHÔNG có giá vốn (costPrice = 0), giá bán 50,000, chưa phân nhóm
        productB = productRepository.save(Product.builder()
                .sku("SKU-B")
                .name("Bánh Quy Bơ")
                .unit("Gói")
                .price(new BigDecimal("50000"))
                .costPrice(BigDecimal.ZERO)
                .stockQuantity(new BigDecimal("50"))
                .taxRate(taxRate)
                .group(null)
                .household(household)
                .build());
    }

    @Test
    public void testNCL07_CN008_GrossProfitReport_Success() {
        // Tạo đơn hàng hoàn tất chứa sản phẩm A và sản phẩm B
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-NCL07-01")
                .household(household)
                .createdByUser(owner)
                .totalAmount(new BigDecimal("250000"))
                .discountAmount(new BigDecimal("10000"))
                .finalAmount(new BigDecimal("240000"))
                .status("COMPLETED")
                .paymentMethod("CASH")
                .createdAt(LocalDateTime.now())
                .build());

        // Item 1: 2 hộp SP A, giá bán 100k, giá vốn 60k, giảm 10k -> subtotal 190k
        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(productA)
                .productName(productA.getName())
                .quantity(new BigDecimal("2"))
                .unitPrice(new BigDecimal("100000"))
                .costPrice(new BigDecimal("60000"))
                .discountAmount(new BigDecimal("10000"))
                .subtotal(new BigDecimal("190000"))
                .build());

        // Item 2: 1 gói SP B, giá bán 50k, không có giá vốn (0) -> subtotal 50k
        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(productB)
                .productName(productB.getName())
                .quantity(new BigDecimal("1"))
                .unitPrice(new BigDecimal("50000"))
                .costPrice(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .subtotal(new BigDecimal("50000"))
                .build());

        LocalDate today = LocalDate.now();
        GrossProfitReportResponse report = reportService.getGrossProfitReport(owner.getUsername(), today, today, null);

        assertNotNull(report);
        assertNotNull(report.getSummary());

        // Sản phẩm A: Doanh thu thuần 190k, COGS = 2 * 60k = 120k, Lãi gộp = 70k
        assertEquals(0, new BigDecimal("190000").compareTo(report.getSummary().getTotalNetRevenue()));
        assertEquals(0, new BigDecimal("120000").compareTo(report.getSummary().getTotalCogs()));
        assertEquals(0, new BigDecimal("70000").compareTo(report.getSummary().getTotalGrossProfit()));

        // Tỷ suất lãi gộp: 70k / 190k * 100 ≈ 36.84%
        assertTrue(report.getSummary().getGrossProfitMarginPercentage().compareTo(BigDecimal.ZERO) > 0);

        // Sản phẩm B phải nằm trong missingCostPriceItems
        assertEquals(1, report.getMissingCostPriceItems().size());
        assertEquals("SKU-B", report.getMissingCostPriceItems().get(0).getProductSku());
    }

    @Test
    public void testNCL07_CN011_PaymentMethodReport_WithSplitAndDebt() {
        LocalDate today = LocalDate.now();

        Customer customer = customerRepository.save(Customer.builder()
                .name("Khách hàng Test")
                .phoneNumber("0912345678")
                .household(household)
                .build());

        // Đơn 1: Thanh toán hỗn hợp COMBINED (100k tiền mặt, 150k chuyển khoản)
        Order order1 = orderRepository.save(Order.builder()
                .orderNumber("ORD-NCL07-PAY-01")
                .household(household)
                .createdByUser(owner)
                .customer(customer)
                .totalAmount(new BigDecimal("250000"))
                .finalAmount(new BigDecimal("250000"))
                .status("COMPLETED")
                .paymentMethod("COMBINED")
                .createdAt(LocalDateTime.now())
                .build());

        orderPaymentRepository.save(OrderPayment.builder()
                .order(order1)
                .household(household)
                .paymentMethod("CASH")
                .amount(new BigDecimal("100000"))
                .build());

        orderPaymentRepository.save(OrderPayment.builder()
                .order(order1)
                .household(household)
                .paymentMethod("BANK_TRANSFER")
                .amount(new BigDecimal("150000"))
                .build());

        // Đơn 2: Ghi nợ 50k
        Order order2 = orderRepository.save(Order.builder()
                .orderNumber("ORD-NCL07-PAY-02")
                .household(household)
                .createdByUser(owner)
                .customer(customer)
                .totalAmount(new BigDecimal("50000"))
                .finalAmount(new BigDecimal("50000"))
                .status("COMPLETED")
                .paymentMethod("DEBT")
                .createdAt(LocalDateTime.now())
                .build());

        customerDebtRepository.save(CustomerDebt.builder()
                .customer(customer)
                .household(household)
                .createdByUser(owner)
                .order(order2)
                .type("DEBT_CREATED")
                .amount(new BigDecimal("50000"))
                .remainingAmount(new BigDecimal("50000"))
                .dueDate(LocalDateTime.now().plusDays(30))
                .createdAt(LocalDateTime.now())
                .build());

        PaymentMethodReportResponse report = reportService.getPaymentMethodReport(
                owner.getUsername(), today, today, null, null);

        assertNotNull(report);
        // Doanh thu tổng: 100k + 150k + 50k = 300k
        assertEquals(0, new BigDecimal("300000").compareTo(report.getTotalRevenue()));

        // Kiểm tra chi tiết công nợ phát sinh mới
        assertNotNull(report.getDebtDetails());
        assertEquals(0, new BigDecimal("50000").compareTo(report.getDebtDetails().getTotalDebtCreated()));
        assertEquals(0, new BigDecimal("50000").compareTo(report.getDebtDetails().getTotalDebtRemaining()));
    }

    @Test
    public void testNCL07_CN012_ProductGroupReport_And_DrillDown() {
        LocalDate today = LocalDate.now();

        // Đơn hàng bán 3 hộp SP A (nhóm G1: Bánh kẹo) và 2 gói SP B (Chưa phân nhóm)
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-NCL07-GRP-01")
                .household(household)
                .createdByUser(owner)
                .totalAmount(new BigDecimal("400000"))
                .finalAmount(new BigDecimal("400000"))
                .status("COMPLETED")
                .paymentMethod("CASH")
                .createdAt(LocalDateTime.now())
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(productA)
                .productName(productA.getName())
                .quantity(new BigDecimal("3"))
                .unitPrice(new BigDecimal("100000"))
                .costPrice(new BigDecimal("60000"))
                .subtotal(new BigDecimal("300000"))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(productB)
                .productName(productB.getName())
                .quantity(new BigDecimal("2"))
                .unitPrice(new BigDecimal("50000"))
                .costPrice(BigDecimal.ZERO)
                .subtotal(new BigDecimal("100000"))
                .build());

        ProductGroupReportResponse report = reportService.getProductGroupReport(owner.getUsername(), today, today);

        assertNotNull(report);
        assertEquals(0, new BigDecimal("400000").compareTo(report.getTotalRevenue()));

        // Kiểm tra có nhóm Bánh kẹo và có sản phẩm chưa phân nhóm
        boolean hasG1 = report.getGroups().stream().anyMatch(g -> "Bánh kẹo".equals(g.getGroupName()));
        assertTrue(hasG1);
        assertTrue(Boolean.TRUE.equals(report.getHasUnassignedProducts()));
        assertNotNull(report.getUnassignedSummary());
        assertEquals("Chưa phân nhóm", report.getUnassignedSummary().getGroupName());

        // Drill-down nhóm G1
        ProductGroupRevenueDetailResponse drillDown = reportService.getProductGroupDetail(
                owner.getUsername(), groupG1.getId(), today, today);
        assertNotNull(drillDown);
        assertEquals("Bánh kẹo", drillDown.getGroupName());
        assertEquals(0, new BigDecimal("300000").compareTo(drillDown.getTotalRevenue()));
        assertEquals(1, drillDown.getItems().size());
        assertEquals("SKU-A", drillDown.getItems().get(0).getProductSku());
    }

    @Test
    public void testNCL07_CN009_ExcelExport_Success_And_NoDataException() throws IOException {
        LocalDate today = LocalDate.now();

        // 1. Khi không có đơn nào trong khoảng ngày xa -> ném NO_DATA_TO_EXPORT
        LocalDate past1 = LocalDate.of(2020, 1, 1);
        LocalDate past2 = LocalDate.of(2020, 1, 2);

        AppException ex = assertThrows(AppException.class, () -> {
            reportExportService.exportReportToExcel(owner.getUsername(), "GROSS_PROFIT", past1, past2, null, null);
        });
        assertEquals(ErrorCode.NO_DATA_TO_EXPORT, ex.getErrorCode());

        // Kiểm tra xuất báo cáo PAYMENT_METHOD khi không có dữ liệu cũng phải ném NO_DATA_TO_EXPORT (P1-02)
        AppException exPay = assertThrows(AppException.class, () -> {
            reportExportService.exportReportToExcel(owner.getUsername(), "PAYMENT_METHOD", past1, past2, null, null);
        });
        assertEquals(ErrorCode.NO_DATA_TO_EXPORT, exPay.getErrorCode());

        // 2. Tạo dữ liệu cho ngày hôm nay và xuất Excel
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-NCL07-EXP-01")
                .household(household)
                .createdByUser(owner)
                .totalAmount(new BigDecimal("100000"))
                .finalAmount(new BigDecimal("100000"))
                .status("COMPLETED")
                .paymentMethod("CASH")
                .createdAt(LocalDateTime.now())
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(productA)
                .productName(productA.getName())
                .quantity(new BigDecimal("1"))
                .unitPrice(new BigDecimal("100000"))
                .costPrice(new BigDecimal("60000"))
                .subtotal(new BigDecimal("100000"))
                .build());

        byte[] excelBytes = reportExportService.exportReportToExcel(
                owner.getUsername(), "GROSS_PROFIT", today, today, null, null);

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        // Đọc workbook kiểm tra 2 sheet
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            assertEquals(2, wb.getNumberOfSheets());
            Sheet metaSheet = wb.getSheet("Thong_Tin_Bao_Cao");
            Sheet dataSheet = wb.getSheet("Du_Lieu_Lai_Gop");
            assertNotNull(metaSheet);
            assertNotNull(dataSheet);
        }

        // 3. Xuất báo cáo PRODUCT_GROUP kiểm tra sheet Du_Lieu_Nhom_Hang (P1-03)
        byte[] pgExcelBytes = reportExportService.exportReportToExcel(
                owner.getUsername(), "PRODUCT_GROUP", today, today, null, null);
        assertNotNull(pgExcelBytes);
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(pgExcelBytes))) {
            Sheet dataSheet = wb.getSheet("Du_Lieu_Nhom_Hang");
            assertNotNull(dataSheet);
            assertTrue(dataSheet.getPhysicalNumberOfRows() >= 4);
        }
    }

    @Test
    public void testNCL07_GrossProfit_WithConversionFactor() {
        LocalDate today = LocalDate.now();
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-NCL07-CONV-01")
                .household(household)
                .createdByUser(owner)
                .totalAmount(new BigDecimal("240000"))
                .finalAmount(new BigDecimal("240000"))
                .status("COMPLETED")
                .paymentMethod("CASH")
                .createdAt(LocalDateTime.now())
                .build());

        // 1 thùng (quantity = 1, baseQuantity = 24), giá vốn 8k/lon cơ bản, bán 240k/thùng
        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(productA)
                .productName(productA.getName())
                .quantity(new BigDecimal("1"))
                .conversionFactor(new BigDecimal("24"))
                .baseQuantity(new BigDecimal("24"))
                .unitPrice(new BigDecimal("240000"))
                .costPrice(new BigDecimal("8000"))
                .subtotal(new BigDecimal("240000"))
                .build());

        GrossProfitReportResponse report = reportService.getGrossProfitReport(owner.getUsername(), today, today, null);
        assertNotNull(report);
        // COGS phải là 24 * 8000 = 192,000 (không phải 1 * 8000 = 8,000)
        assertEquals(0, new BigDecimal("192000").compareTo(report.getSummary().getTotalCogs()));
        // Lãi gộp = 240,000 - 192,000 = 48,000
        assertEquals(0, new BigDecimal("48000").compareTo(report.getSummary().getTotalGrossProfit()));
    }

    @Test
    public void testNCL07_CN008_GrossProfitReport_WithReturnTicket_Deduction() {
        LocalDate today = LocalDate.now();

        // 1. Tạo đơn hàng 2 hộp SP A, giá bán 100k, giá vốn 60k -> Subtotal = 200k, COGS = 120k, Lãi = 80k
        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-NCL07-RET-01")
                .household(household)
                .createdByUser(owner)
                .totalAmount(new BigDecimal("200000"))
                .finalAmount(new BigDecimal("200000"))
                .status("COMPLETED")
                .paymentMethod("CASH")
                .createdAt(LocalDateTime.now())
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(productA)
                .productName(productA.getName())
                .quantity(new BigDecimal("2"))
                .unitPrice(new BigDecimal("100000"))
                .costPrice(new BigDecimal("60000"))
                .subtotal(new BigDecimal("200000"))
                .build());

        // 2. Tạo hóa đơn gốc để liên kết với phiếu trả hàng
        EInvoice invoice = eInvoiceRepository.save(EInvoice.builder()
                .household(household)
                .order(order)
                .createdByUser(owner)
                .invoiceSymbol("1C26TAA")
                .invoiceNumber("0999901")
                .lookupCode("TEST-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                .status("ISSUED")
                .totalAmountBeforeTax(new BigDecimal("200000"))
                .finalAmount(new BigDecimal("200000"))
                .build());

        // 3. Tạo phiếu trả hàng 1 hộp SP A (hoàn tiền 100k, đã duyệt APPROVED)
        ReturnTicket ticket = ReturnTicket.builder()
                .household(household)
                .originalInvoice(invoice)
                .originalOrder(order)
                .ticketNumber("PTH-TEST-01")
                .createdByUser(owner)
                .approvedByUser(owner)
                .totalReturnAmount(new BigDecimal("100000"))
                .refundPaymentMethod("CASH")
                .status("APPROVED")
                .reason("Khách trả 1 hộp do mua thừa")
                .approvedAt(LocalDateTime.now())
                .build();

        ReturnTicketItem item = ReturnTicketItem.builder()
                .returnTicket(ticket)
                .product(productA)
                .productName(productA.getName())
                .unit(productA.getUnit())
                .quantity(new BigDecimal("1"))
                .unitPrice(new BigDecimal("100000"))
                .taxRatePercentage(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .subtotal(new BigDecimal("100000"))
                .build();

        ticket.getItems().add(item);
        returnTicketRepository.save(ticket);

        // 4. Lấy báo cáo lãi gộp và kiểm tra đã trừ hàng trả lại
        GrossProfitReportResponse report = reportService.getGrossProfitReport(owner.getUsername(), today, today, null);

        assertNotNull(report);
        assertNotNull(report.getSummary());

        // Sau khi trừ hàng trả lại:
        // Doanh thu thuần = 200,000 - 100,000 = 100,000
        // COGS = 120,000 - 60,000 = 60,000
        // Lãi gộp = 100,000 - 60,000 = 40,000
        assertEquals(0, new BigDecimal("100000").compareTo(report.getSummary().getTotalNetRevenue()));
        assertEquals(0, new BigDecimal("60000").compareTo(report.getSummary().getTotalCogs()));
        assertEquals(0, new BigDecimal("40000").compareTo(report.getSummary().getTotalGrossProfit()));

        // Tỷ suất lãi gộp = 40,000 / 100,000 * 100 = 40.00%
        assertEquals(0, new BigDecimal("40.00").compareTo(report.getSummary().getGrossProfitMarginPercentage()));

        // Mặt hàng A: Số lượng bán thuần = 2 - 1 = 1
        assertFalse(report.getItemReports().isEmpty());
        GrossProfitReportResponse.ProductGrossProfitDto pDto = report.getItemReports().get(0);
        assertEquals(0, new BigDecimal("1").compareTo(pDto.getQuantitySold()));
        assertEquals(0, new BigDecimal("100000").compareTo(pDto.getNetRevenue()));
        assertEquals(0, new BigDecimal("60000").compareTo(pDto.getCogs()));
        assertEquals(0, new BigDecimal("40000").compareTo(pDto.getGrossProfit()));
    }

    @Test
    public void testNCL07_DateValidation_ThrowsInvalidInput() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        assertThrows(AppException.class, () ->
                reportService.getGrossProfitReport(owner.getUsername(), today, yesterday, null));

        assertThrows(AppException.class, () ->
                reportService.getPaymentMethodReport(owner.getUsername(), today, yesterday, null, null));

        assertThrows(AppException.class, () ->
                reportService.getProductGroupReport(owner.getUsername(), today, yesterday));

        assertThrows(AppException.class, () ->
                reportService.getProductGroupDetail(owner.getUsername(), "G1", today, yesterday));
    }
}
