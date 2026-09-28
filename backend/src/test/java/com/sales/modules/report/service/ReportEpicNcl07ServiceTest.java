package com.sales.modules.report.service;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.customer.entity.Customer;
import com.sales.modules.customer.entity.CustomerDebt;
import com.sales.modules.customer.repository.CustomerDebtRepository;
import com.sales.modules.customer.repository.CustomerRepository;
import com.sales.modules.invoice.entity.EInvoice;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.entity.OrderItem;
import com.sales.modules.order.entity.OrderPayment;
import com.sales.modules.order.entity.ReturnTicket;
import com.sales.modules.order.entity.ReturnTicketItem;
import com.sales.modules.order.repository.OrderItemRepository;
import com.sales.modules.order.repository.OrderPaymentRepository;
import com.sales.modules.order.repository.OrderRepository;
import com.sales.modules.order.repository.ReturnTicketItemRepository;
import com.sales.modules.order.repository.ReturnTicketRepository;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.entity.ProductGroup;
import com.sales.modules.product.repository.ProductGroupRepository;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.tax.entity.TaxRate;
import com.sales.modules.tax.repository.TaxRateRepository;
import com.sales.modules.report.dto.response.GrossProfitReportResponse;
import com.sales.modules.report.dto.response.PaymentMethodReportResponse;
import com.sales.modules.report.dto.response.ProductGroupReportResponse;
import com.sales.modules.product.dto.response.ProductGroupRevenueDetailResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
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
import java.util.UUID;

@SpringBootTest
@Transactional
@SuppressWarnings("unused")
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

        assertEquals(0, new BigDecimal("190000").compareTo(report.getSummary().getTotalNetRevenue()));
        assertEquals(0, new BigDecimal("120000").compareTo(report.getSummary().getTotalCogs()));
        assertEquals(0, new BigDecimal("70000").compareTo(report.getSummary().getTotalGrossProfit()));

        assertTrue(report.getSummary().getGrossProfitMarginPercentage().compareTo(BigDecimal.ZERO) > 0);

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

        assertEquals(0, new BigDecimal("300000").compareTo(report.getTotalRevenue()));

        assertNotNull(report.getDebtDetails());
        assertEquals(0, new BigDecimal("50000").compareTo(report.getDebtDetails().getTotalDebtCreated()));
        assertEquals(0, new BigDecimal("50000").compareTo(report.getDebtDetails().getTotalDebtRemaining()));
    }

    @Test
    public void testNCL07_CN012_ProductGroupReport_And_DrillDown() {
        LocalDate today = LocalDate.now();

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

        boolean hasG1 = report.getGroups().stream().anyMatch(g -> "Bánh kẹo".equals(g.getGroupName()));
        assertTrue(hasG1);
        assertTrue(Boolean.TRUE.equals(report.getHasUnassignedProducts()));
        assertNotNull(report.getUnassignedSummary());
        assertEquals("Chưa phân nhóm", report.getUnassignedSummary().getGroupName());

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

        LocalDate past1 = LocalDate.of(2020, 1, 1);
        LocalDate past2 = LocalDate.of(2020, 1, 2);

        AppException ex = assertThrows(AppException.class, () -> {
            reportExportService.exportReportToExcel(owner.getUsername(), "GROSS_PROFIT", past1, past2, null, null);
        });
        assertEquals(ErrorCode.NO_DATA_TO_EXPORT, ex.getErrorCode());

        AppException exPay = assertThrows(AppException.class, () -> {
            reportExportService.exportReportToExcel(owner.getUsername(), "PAYMENT_METHOD", past1, past2, null, null);
        });
        assertEquals(ErrorCode.NO_DATA_TO_EXPORT, exPay.getErrorCode());

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

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            assertEquals(2, wb.getNumberOfSheets());
            Sheet metaSheet = wb.getSheet("Thong_Tin_Bao_Cao");
            Sheet dataSheet = wb.getSheet("Du_Lieu_Lai_Gop");
            assertNotNull(metaSheet);
            assertNotNull(dataSheet);
        }

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

        assertEquals(0, new BigDecimal("192000").compareTo(report.getSummary().getTotalCogs()));

        assertEquals(0, new BigDecimal("48000").compareTo(report.getSummary().getTotalGrossProfit()));
    }

    @Test
    public void testNCL07_CN008_GrossProfitReport_WithReturnTicket_Deduction() {
        LocalDate today = LocalDate.now();

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

        EInvoice invoice = eInvoiceRepository.save(EInvoice.builder()
                .household(household)
                .order(order)
                .createdByUser(owner)
                .invoiceSymbol("1C26TAA")
                .invoiceNumber("0999901")
                .lookupCode("TEST-" + UUID.randomUUID().toString().substring(0, 8))
                .status("ISSUED")
                .totalAmountBeforeTax(new BigDecimal("200000"))
                .finalAmount(new BigDecimal("200000"))
                .build());

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

        GrossProfitReportResponse report = reportService.getGrossProfitReport(owner.getUsername(), today, today, null);

        assertNotNull(report);
        assertNotNull(report.getSummary());

        assertEquals(0, new BigDecimal("100000").compareTo(report.getSummary().getTotalNetRevenue()));
        assertEquals(0, new BigDecimal("60000").compareTo(report.getSummary().getTotalCogs()));
        assertEquals(0, new BigDecimal("40000").compareTo(report.getSummary().getTotalGrossProfit()));

        assertEquals(0, new BigDecimal("40.00").compareTo(report.getSummary().getGrossProfitMarginPercentage()));

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

    @Test
    public void testNCL07_GrossProfit_WithOrderLevelDiscount_Allocation() {
        LocalDate today = LocalDate.now();

        Order order = orderRepository.save(Order.builder()
                .orderNumber("ORD-NCL07-DISC-01")
                .household(household)
                .createdByUser(owner)
                .totalAmount(new BigDecimal("250000"))
                .discountAmount(new BigDecimal("50000"))
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
                .discountAmount(new BigDecimal("10000"))
                .subtotal(new BigDecimal("190000"))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(productB)
                .productName(productB.getName())
                .quantity(new BigDecimal("1"))
                .unitPrice(new BigDecimal("60000"))
                .costPrice(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .subtotal(new BigDecimal("60000"))
                .build());

        GrossProfitReportResponse report = reportService.getGrossProfitReport(owner.getUsername(), today, today, null);

        assertNotNull(report);

        assertEquals(0, new BigDecimal("159600.00").compareTo(report.getSummary().getTotalNetRevenue()));
        assertEquals(0, new BigDecimal("120000.00").compareTo(report.getSummary().getTotalCogs()));
        assertEquals(0, new BigDecimal("39600.00").compareTo(report.getSummary().getTotalGrossProfit()));
    }

    @Test
    public void testNCL07_PaymentMethodReport_WithUserFilter() {
        LocalDate today = LocalDate.now();

        Customer customer = customerRepository.save(Customer.builder()
                .name("Khách hàng Test Filter")
                .phoneNumber("0912888999")
                .household(household)
                .build());

        User emp = userRepository.save(User.builder()
                .username("emp_test_filter")
                .fullName("Nhân viên Filter")
                .passwordHash("password")
                .role(owner.getRole())
                .household(household)
                .isActive(true)
                .build());

        customerDebtRepository.save(CustomerDebt.builder()
                .customer(customer)
                .household(household)
                .createdByUser(owner)
                .type("DEBT_CREATED")
                .amount(new BigDecimal("30000"))
                .remainingAmount(new BigDecimal("30000"))
                .dueDate(LocalDateTime.now().plusDays(30))
                .createdAt(LocalDateTime.now())
                .build());

        customerDebtRepository.save(CustomerDebt.builder()
                .customer(customer)
                .household(household)
                .createdByUser(emp)
                .type("DEBT_CREATED")
                .amount(new BigDecimal("70000"))
                .remainingAmount(new BigDecimal("70000"))
                .dueDate(LocalDateTime.now().plusDays(30))
                .createdAt(LocalDateTime.now())
                .build());

        PaymentMethodReportResponse reportEmp = reportService.getPaymentMethodReport(
                owner.getUsername(), today, today, emp.getId(), null);
        assertNotNull(reportEmp);
        assertEquals(0, new BigDecimal("70000").compareTo(reportEmp.getDebtDetails().getTotalDebtCreated()));

        PaymentMethodReportResponse reportOwner = reportService.getPaymentMethodReport(
                owner.getUsername(), today, today, owner.getId(), null);
        assertNotNull(reportOwner);
        assertEquals(0, new BigDecimal("30000").compareTo(reportOwner.getDebtDetails().getTotalDebtCreated()));
    }

    @Test
    public void testNCL07_ExcelExport_InvalidReportType_ThrowsException() {
        LocalDate today = LocalDate.now();
        AppException ex = assertThrows(AppException.class, () ->
                reportExportService.exportReportToExcel(owner.getUsername(), "INVALID_TYPE", today, today, null, null));
        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }
}
