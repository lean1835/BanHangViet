package com.sales.modules.chatbot.service.impl;
import com.sales.common.dto.PageResponse;
import com.sales.modules.chatbot.dto.response.ChatbotMessageResponse;
import com.sales.modules.chatbot.dto.response.ChatbotSuggestionResponse;
import com.sales.modules.customer.dto.response.DebtSummaryResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationReportResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationSummaryResponse;
import com.sales.modules.inventory.dto.response.LowStockWarningListResponse;
import com.sales.modules.inventory.dto.response.LowStockWarningResponse;
import com.sales.modules.report.dto.response.DailyRevenueProjection;
import com.sales.modules.report.dto.response.GrossProfitReportResponse;
import com.sales.modules.report.dto.response.PaymentMethodReportResponse;
import com.sales.modules.supplier.dto.response.SupplierDebtSummaryResponse;
import com.sales.modules.tax.dto.response.TaxPeriodReminderResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.chatbot.dto.request.ChatbotMessageRequest;
import com.sales.common.constant.ShiftStatus;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.customer.entity.Customer;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.pos.entity.Shift;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.customer.repository.CustomerRepository;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.pos.repository.ShiftRepository;
import com.sales.modules.supplier.repository.SupplierRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.tax.service.AnnualRevenueTrackingService;
import com.sales.modules.pos.service.CashTransactionService;
import com.sales.modules.customer.service.CustomerDebtService;
import com.sales.modules.support.service.FaqService;
import com.sales.modules.inventory.service.InventoryValuationReportService;
import com.sales.modules.inventory.service.InventoryWarningService;
import com.sales.modules.report.service.ReportService;
import com.sales.modules.supplier.service.SupplierDebtService;
import com.sales.modules.tax.service.TaxReminderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ChatbotServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReportService reportService;

    @Mock
    private InventoryWarningService inventoryWarningService;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private CustomerDebtService customerDebtService;

    @Mock
    private SupplierDebtService supplierDebtService;

    @Mock
    private InventoryValuationReportService inventoryValuationReportService;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private TaxReminderService taxReminderService;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CashTransactionService cashTransactionService;

    @Mock
    private AnnualRevenueTrackingService annualRevenueTrackingService;

    @Mock
    private FaqService faqService;

    @Mock
    private com.sales.modules.report.service.SalesAnalyticsService salesAnalyticsService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ChatbotServiceImpl chatbotService;

    private User mockUser;
    private BusinessHousehold mockHousehold;

    @BeforeEach
    void setUp() {
        mockHousehold = BusinessHousehold.builder()
                .id("HH-001")
                .name("Tạp hóa An Bình")
                .taxCode("0123456789")
                .build();

        mockUser = User.builder()
                .id("USR-001")
                .username("owner_anbinh")
                .household(mockHousehold)
                .build();

        // Không set API key để test Smart Local Fallback
        ReflectionTestUtils.setField(chatbotService, "geminiApiKey", "");
        ReflectionTestUtils.setField(chatbotService, "geminiModel", "gemini-3.5-flash-lite");
        ReflectionTestUtils.setField(chatbotService, "geminiApiUrl", "https://generativelanguage.googleapis.com/v1beta/models");
    }

    @Test
    @DisplayName("Ném AppException khi không tìm thấy người dùng")
    void testProcessMessage_UserNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Chào trợ lý")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                chatbotService.processMessage("unknown", request));

        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Local Fallback: Hỏi doanh thu hôm nay trả về báo cáo và deep link VIEW_REPORT")
    void testProcessMessage_RevenueIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        DailyRevenueProjection projection = mock(DailyRevenueProjection.class);
        when(projection.getNetRevenue()).thenReturn(new BigDecimal("15500000"));
        when(projection.getOrderCount()).thenReturn(42L);

        when(reportService.getDailyRevenue(eq("owner_anbinh"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(projection));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Doanh thu hôm nay của quán thế nào?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertFalse(response.isGeminiPowered());
        assertEquals("VIEW_REPORT", response.getActionType());
        assertEquals("/reports/revenue", response.getActionUrl());
        assertTrue(response.getReply().contains("15.500.000"));
        assertTrue(response.getReply().contains("42 đơn"));
    }

    @Test
    @DisplayName("Local Fallback: Hỏi tồn kho trả về cảnh báo sản phẩm sắp hết và deep link VIEW_INVENTORY")
    void testProcessMessage_LowStockIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        LowStockWarningResponse item = LowStockWarningResponse.builder()
                .productId("P-01")
                .productName("Sữa chua Vinamilk")
                .stockQuantity(new BigDecimal("2"))
                .minStockQuantity(new BigDecimal("10"))
                .build();

        PageResponse<LowStockWarningResponse> page = PageResponse.<LowStockWarningResponse>builder()
                .content(List.of(item))
                .totalElements(1)
                .build();

        LowStockWarningListResponse warningList = LowStockWarningListResponse.builder()
                .page(page)
                .build();

        when(inventoryWarningService.getLowStockWarnings(eq("owner_anbinh"), isNull(), isNull(), eq(0), eq(5)))
                .thenReturn(warningList);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Có hàng nào sắp hết trong kho không?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_INVENTORY", response.getActionType());
        assertEquals("/products/inventory-warnings", response.getActionUrl());
        assertTrue(response.getReply().contains("Sữa chua Vinamilk"));
        assertTrue(response.getReply().contains("Tồn hiện tại **2**"));
    }

    @Test
    @DisplayName("Local Fallback: Hỏi công nợ trả về tổng nợ cần thu và deep link VIEW_DEBT")
    void testProcessMessage_DebtIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));
        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(anyString())).thenReturn(Collections.emptyList());

        DebtSummaryResponse debtSummary = DebtSummaryResponse.builder()
                .totalActiveDebt(new BigDecimal("8200000"))
                .totalOverdueDebt(new BigDecimal("1500000"))
                .totalDebtors(5)
                .build();

        when(customerDebtService.getDebtSummary("owner_anbinh")).thenReturn(debtSummary);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Tổng công nợ khách hàng hiện tại bao nhiêu?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_DEBT", response.getActionType());
        assertEquals("/customers", response.getActionUrl());
        assertTrue(response.getReply().contains("8.200.000"));
        assertTrue(response.getReply().contains("5 khách hàng"));
    }

    @Test
    @DisplayName("Local Fallback: Hỏi hóa đơn lỗi thuế trả về số hóa đơn pending/error và deep link VIEW_INVOICES")
    void testProcessMessage_InvoiceIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));
        lenient().when(eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(eq("HH-001"), anyString()))
                .thenReturn(Collections.emptyList());

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Kiểm tra hóa đơn lỗi truyền sang cơ quan thuế")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_INVOICES", response.getActionType());
        assertEquals("/e-invoices", response.getActionUrl());
        assertTrue(response.getReply().contains("Trạng Thái Hóa Đơn Điện Tử"));
    }

    @Test
    @DisplayName("Local Fallback: Hỏi giờ cao điểm trong ngày trả về khung giờ đông khách và deep link VIEW_PEAK_HOURS")
    void testProcessMessage_PeakHoursIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        com.sales.modules.report.dto.response.PeakSalesInsight insights = com.sales.modules.report.dto.response.PeakSalesInsight.builder()
                .peakHourLabel("09:00 - 10:00")
                .peakHourRevenue(new BigDecimal("267706082"))
                .peakHourOrderCount(16L)
                .lowestHourLabel("01:00 - 02:00")
                .lowestHourRevenue(BigDecimal.ZERO)
                .busiestDayName("Thứ Năm")
                .busiestDayRevenue(new BigDecimal("238836731"))
                .busiestDayOrderCount(56L)
                .recommendations(List.of("Khung giờ cao điểm nhất là 09:00 - 10:00 với doanh thu 267.706.082 đ"))
                .build();

        com.sales.modules.report.dto.response.PeakHoursAndDaysResponse peakResponse = com.sales.modules.report.dto.response.PeakHoursAndDaysResponse.builder()
                .insights(insights)
                .build();

        when(salesAnalyticsService.getPeakHoursAndDaysAnalysis(eq("owner_anbinh"), any(), any(), isNull()))
                .thenReturn(peakResponse);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("giờ nào trong ngày cao điểm nhất")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_PEAK_HOURS", response.getActionType());
        assertEquals("/reports/peak-hours", response.getActionUrl());
        assertTrue(response.getReply().contains("09:00 - 10:00"));
        assertTrue(response.getReply().contains("267.706.082"));
    }

    @Test
    @DisplayName("Lấy danh sách gợi ý nhanh theo màn hình POS")
    void testGetQuickSuggestions_PosScreen() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        List<ChatbotSuggestionResponse> suggestions = chatbotService.getQuickSuggestions("owner_anbinh", "/pos");

        assertNotNull(suggestions);
        assertFalse(suggestions.isEmpty());
        // Kiểm tra có danh mục Bán hàng & Thu ngân
        boolean hasPosCategory = suggestions.stream()
                .anyMatch(s -> s.getCategory().contains("Bán hàng") || s.getCategory().contains("Thu ngân"));
        assertTrue(hasPosCategory);
    }

    @Test
    @DisplayName("Local Fallback: Hỏi công nợ nhà cung cấp trả về tổng nợ phải trả và deep link VIEW_SUPPLIER_DEBT")
    void testProcessMessage_SupplierDebtIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));
        when(supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull(anyString())).thenReturn(Collections.emptyList());

        SupplierDebtSummaryResponse debtSummary = SupplierDebtSummaryResponse.builder()
                .totalOutstandingDebt(new BigDecimal("35000000"))
                .totalOverdueDebt(new BigDecimal("5000000"))
                .totalSuppliersWithDebt(3)
                .build();

        when(supplierDebtService.getSupplierDebtSummary("owner_anbinh")).thenReturn(debtSummary);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Cửa hàng đang nợ nhà cung cấp bao nhiêu tiền?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_SUPPLIER_DEBT", response.getActionType());
        assertEquals("/products/suppliers", response.getActionUrl());
        assertTrue(response.getReply().contains("35.000.000"));
        assertTrue(response.getReply().contains("0 nhà cung cấp"));
    }

    @Test
    @DisplayName("Local Fallback: Hỏi lợi nhuận gộp trả về doanh thu, giá vốn, lãi gộp và deep link VIEW_GROSS_PROFIT")
    void testProcessMessage_GrossProfitIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        GrossProfitReportResponse.GrossProfitSummaryDto summary = GrossProfitReportResponse.GrossProfitSummaryDto.builder()
                .totalNetRevenue(new BigDecimal("20000000"))
                .totalCogs(new BigDecimal("14000000"))
                .totalGrossProfit(new BigDecimal("6000000"))
                .grossProfitMarginPercentage(new BigDecimal("30.00"))
                .build();

        GrossProfitReportResponse report = GrossProfitReportResponse.builder()
                .summary(summary)
                .build();

        when(reportService.getGrossProfitReport(eq("owner_anbinh"), any(LocalDate.class), any(LocalDate.class), isNull()))
                .thenReturn(report);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Lợi nhuận gộp hôm nay của quán là bao nhiêu?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_GROSS_PROFIT", response.getActionType());
        assertEquals("/reports/gross-profit", response.getActionUrl());
        assertTrue(response.getReply().contains("6.000.000"));
        assertTrue(response.getReply().contains("30.00%"));
    }

    @Test
    @DisplayName("Local Fallback: Hỏi định giá kho trả về tổng giá trị kho theo giá vốn/bán lẻ và deep link VIEW_INVENTORY_VALUATION")
    void testProcessMessage_InventoryValuationIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        InventoryValuationSummaryResponse summary = InventoryValuationSummaryResponse.builder()
                .totalInventoryValue(new BigDecimal("120000000"))
                .totalRetailValue(new BigDecimal("160000000"))
                .potentialGrossProfit(new BigDecimal("40000000"))
                .potentialProfitMargin(new BigDecimal("25.00"))
                .totalProducts(50L)
                .build();

        InventoryValuationReportResponse report = InventoryValuationReportResponse.builder()
                .summary(summary)
                .build();

        when(inventoryValuationReportService.getInventoryValuationReport(eq("owner_anbinh"), isNull(), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(report);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Tổng giá trị kho hàng hiện tại bao nhiêu?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_INVENTORY_VALUATION", response.getActionType());
        assertEquals("/reports/inventory-valuation", response.getActionUrl());
        assertTrue(response.getReply().contains("120.000.000"));
        assertTrue(response.getReply().contains("160.000.000"));
        assertTrue(response.getReply().contains("50 sản phẩm"));
    }

    @Test
    @DisplayName("Local Fallback: Hỏi hạn nộp thuế TT88 trả về danh sách kỳ tính thuế và deep link VIEW_TAX_DECLARATION")
    void testProcessMessage_TaxReminderIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        TaxPeriodReminderResponse reminder = TaxPeriodReminderResponse.builder()
                .periodName("Quý 3/2026")
                .filingDeadline(LocalDate.of(2026, 10, 31))
                .daysRemaining(39)
                .isOverdue(false)
                .status("DRAFT")
                .build();

        when(taxReminderService.getActiveReminders("owner_anbinh")).thenReturn(List.of(reminder));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Hạn nộp tờ khai thuế quý này khi nào?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_TAX_DECLARATION", response.getActionType());
        assertEquals("/reports/tax-declaration", response.getActionUrl());
        assertTrue(response.getReply().contains("Quý 3/2026"));
        assertTrue(response.getReply().contains("2026-10-31"));
    }

    @Test
    @DisplayName("RBAC: Nhân viên bán hàng (VT-02) hỏi công nợ NCC bị từ chối bảo mật")
    void testProcessMessage_CashierAccessDenied_SupplierDebt() {
        com.sales.modules.auth.entity.Role cashierRole = com.sales.modules.auth.entity.Role.builder().code("VT-02").name("Nhân viên").build();
        User cashierUser = User.builder()
                .id("USR-002")
                .username("cashier_user")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_user")).thenReturn(Optional.of(cashierUser));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Tổng nợ phải trả nhà cung cấp?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_user", request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật"));
        assertTrue(response.getReply().contains("Nhân viên bán hàng / Thu ngân"));
        // Đảm bảo không gọi tới supplierDebtService
        verify(supplierDebtService, never()).getSupplierDebtSummary(anyString());
    }

    @Test
    @DisplayName("RBAC: Kế toán (VT-03) có toàn quyền tra cứu lợi nhuận gộp")
    void testProcessMessage_AccountantAccess_GrossProfit() {
        com.sales.modules.auth.entity.Role accountantRole = com.sales.modules.auth.entity.Role.builder().code("VT-03").name("Kế toán").build();
        User accountantUser = User.builder()
                .id("USR-003")
                .username("accountant_user")
                .role(accountantRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("accountant_user")).thenReturn(Optional.of(accountantUser));

        GrossProfitReportResponse.GrossProfitSummaryDto summary = new GrossProfitReportResponse.GrossProfitSummaryDto();
        summary.setTotalNetRevenue(new BigDecimal("50000000"));
        summary.setTotalCogs(new BigDecimal("30000000"));
        summary.setTotalGrossProfit(new BigDecimal("20000000"));
        summary.setGrossProfitMarginPercentage(new BigDecimal("40.00"));

        GrossProfitReportResponse reportResponse = new GrossProfitReportResponse();
        reportResponse.setSummary(summary);

        when(reportService.getGrossProfitReport(eq("accountant_user"), any(LocalDate.class), any(LocalDate.class), isNull()))
                .thenReturn(reportResponse);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Báo cáo lợi nhuận gộp hôm nay")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("accountant_user", request);

        assertNotNull(response);
        assertEquals("VIEW_GROSS_PROFIT", response.getActionType());
        assertTrue(response.getReply().contains("Báo Cáo Lợi Nhuận Gộp"));
        assertTrue(response.getReply().contains("20.000.000 VNĐ"));
    }

    @Test
    @DisplayName("Failover: Candidate models kết hợp model chính và chuỗi fallback theo thứ tự ưu tiên")
    void testCandidateModels_PriorityOrder() {
        ReflectionTestUtils.setField(chatbotService, "geminiModel", "gemini-3.5-flash-lite");
        ReflectionTestUtils.setField(chatbotService, "geminiFallbackModels", "gemini-3.1-flash-lite,gemini-2.5-flash-lite,gemini-3.5-flash");

        @SuppressWarnings("unchecked")
        List<String> candidates = (List<String>) ReflectionTestUtils.invokeMethod(chatbotService, "getCandidateModels");

        assertNotNull(candidates);
        assertEquals(4, candidates.size());
        assertEquals("gemini-3.5-flash-lite", candidates.get(0));
        assertEquals("gemini-3.1-flash-lite", candidates.get(1));
        assertEquals("gemini-2.5-flash-lite", candidates.get(2));
        assertEquals("gemini-3.5-flash", candidates.get(3));
    }

    @Test
    @DisplayName("Failover: Cơ chế Cooldown 60s khi model gặp lỗi 429 Rate Limit")
    void testModelCooldown_Behavior() {
        String testModel = "gemini-3.5-flash-lite";

        // Ban đầu model chưa bị cooldown
        Boolean beforeCooldown = ReflectionTestUtils.invokeMethod(chatbotService, "isModelCoolingDown", testModel);
        assertNotNull(beforeCooldown);
        assertFalse(beforeCooldown);

        // Đánh dấu hạ nhiệt 60s
        ReflectionTestUtils.invokeMethod(chatbotService, "markModelCooldown", testModel);

        // Kiểm tra model đã chuyển sang trạng thái cooldown
        Boolean duringCooldown = ReflectionTestUtils.invokeMethod(chatbotService, "isModelCoolingDown", testModel);
        assertNotNull(duringCooldown);
        assertTrue(duringCooldown);
    }

    @Test
    @DisplayName("Failover: Nhận diện chính xác ngoại lệ 429 Rate Limit / Quota Exceeded")
    void testIsRateLimitOrQuotaException() {
        Exception e429 = new RuntimeException("429 RESOURCE_EXHAUSTED: Quota exceeded for quota metric 'Queries' and limit 'Queries per minute'");
        Boolean is429 = ReflectionTestUtils.invokeMethod(chatbotService, "isRateLimitOrQuotaException", e429);
        assertNotNull(is429);
        assertTrue(is429);

        Exception normalError = new IllegalArgumentException("Invalid input value");
        Boolean isNormal = ReflectionTestUtils.invokeMethod(chatbotService, "isRateLimitOrQuotaException", normalError);
        assertNotNull(isNormal);
        assertFalse(isNormal);
    }

    @Test
    @DisplayName("RBAC Chặt Chẽ: Thu ngân (VT-02) hỏi cảnh báo hàng sắp hết kho bị chặn bảo mật")
    void testProcessMessage_CashierAccessDenied_LowStockWarning() {
        com.sales.modules.auth.entity.Role cashierRole = com.sales.modules.auth.entity.Role.builder().code("VT-02").name("Nhân viên").build();
        User cashierUser = User.builder()
                .id("USR-002")
                .username("cashier_user")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_user")).thenReturn(Optional.of(cashierUser));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Có sản phẩm nào sắp hết kho không?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_user", request);

        assertNotNull(response);
        assertEquals("NONE", response.getActionType());
        assertTrue(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật"));
        assertTrue(response.getReply().contains("Cảnh báo tồn kho tối thiểu, hàng sắp hết"));
        verify(inventoryWarningService, never()).getLowStockWarnings(anyString(), any(), any(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("RBAC Chặt Chẽ: Thu ngân (VT-02) hỏi số lượng tồn kho sản phẩm bị chặn bảo mật")
    void testProcessMessage_CashierAccessDenied_ProductStockQuantity() {
        com.sales.modules.auth.entity.Role cashierRole = com.sales.modules.auth.entity.Role.builder().code("VT-02").name("Nhân viên").build();
        User cashierUser = User.builder()
                .id("USR-002")
                .username("cashier_user")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_user")).thenReturn(Optional.of(cashierUser));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("sản phẩm Coca-Cola còn bao nhiêu trong kho?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_user", request);

        assertNotNull(response);
        assertEquals("NONE", response.getActionType());
        assertTrue(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật"));
        assertTrue(response.getReply().contains("Số lượng tồn kho sản phẩm"));
    }

    @Test
    @DisplayName("RBAC Chặt Chẽ: Thu ngân (VT-02) hỏi doanh thu toàn cửa hàng bị chặn bảo mật")
    void testProcessMessage_CashierAccessDenied_StoreRevenue() {
        com.sales.modules.auth.entity.Role cashierRole = com.sales.modules.auth.entity.Role.builder().code("VT-02").name("Nhân viên").build();
        User cashierUser = User.builder()
                .id("USR-002")
                .username("cashier_user")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_user")).thenReturn(Optional.of(cashierUser));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Doanh thu hôm nay của cửa hàng đạt bao nhiêu?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_user", request);

        assertNotNull(response);
        assertEquals("NONE", response.getActionType());
        assertTrue(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật"));
        assertTrue(response.getReply().contains("Doanh thu toàn bộ cửa hàng"));
        verify(reportService, never()).getDailyRevenue(anyString(), any(LocalDate.class), any(LocalDate.class));
    }

    @Test
    @DisplayName("RBAC Chặt Chẽ: Kế toán (VT-03) có toàn quyền tra cứu cảnh báo tồn kho")
    void testProcessMessage_AccountantAccess_LowStockWarning() {
        com.sales.modules.auth.entity.Role accountantRole = com.sales.modules.auth.entity.Role.builder().code("VT-03").name("Kế toán").build();
        User accountantUser = User.builder()
                .id("USR-003")
                .username("accountant_user")
                .role(accountantRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("accountant_user")).thenReturn(Optional.of(accountantUser));

        LowStockWarningListResponse warningResp = LowStockWarningListResponse.builder()
                .page(PageResponse.<LowStockWarningResponse>builder()
                        .content(List.of(
                                LowStockWarningResponse.builder()
                                        .productName("Mì Hảo Hảo")
                                        .stockQuantity(new BigDecimal("2"))
                                        .minStockQuantity(new BigDecimal("10"))
                                        .build()
                        ))
                        .totalElements(1)
                        .build())
                .isStockAdequate(false)
                .message("Có 1 mặt hàng dưới ngưỡng tồn")
                .build();

        when(inventoryWarningService.getLowStockWarnings(eq("accountant_user"), isNull(), isNull(), eq(0), eq(5)))
                .thenReturn(warningResp);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Có sản phẩm nào sắp hết kho không?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("accountant_user", request);

        assertNotNull(response);
        assertEquals("VIEW_INVENTORY", response.getActionType());
        assertTrue(response.getReply().contains("Cảnh Báo Tồn Kho Cửa Hàng"));
        assertTrue(response.getReply().contains("Mì Hảo Hảo"));
    }

    @Test
    @DisplayName("RBAC Gợi ý: Thu ngân hỏi tồn kho bị từ chối và gợi ý câu hỏi CHỈ gồm nghiệp vụ POS/Ca")
    void testCashier_SuggestedQuestions_AreStrictlyRoleCompliant() {
        Role cashierRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        User cashierUser = User.builder()
                .id("cashier-id")
                .username("cashier_viet")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_viet")).thenReturn(Optional.of(cashierUser));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Có sản phẩm nào sắp hết kho?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_viet", request);

        assertNotNull(response);
        assertEquals("NONE", response.getActionType());
        assertNull(response.getActionUrl());
        assertTrue(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật") || response.getReply().contains("thẩm quyền"));

        // Gợi ý câu hỏi phải tuyệt đối không chứa kho, nợ NCC, lợi nhuận gộp, thuế
        assertNotNull(response.getSuggestedQuestions());
        for (String q : response.getSuggestedQuestions()) {
            assertFalse(q.contains("lợi nhuận"), "Gợi ý của thu ngân không được chứa 'lợi nhuận'");
            assertFalse(q.contains("nhà cung cấp"), "Gợi ý của thu ngân không được chứa 'nhà cung cấp'");
            assertFalse(q.contains("thuế"), "Gợi ý của thu ngân không được chứa 'thuế'");
            assertFalse(q.contains("kho"), "Gợi ý của thu ngân không được chứa 'kho'");
        }
    }

    @Test
    @DisplayName("RBAC Phân mục gợi ý: Thu ngân chỉ nhận các phân mục POS và Ca làm việc")
    void testGetQuickSuggestions_Cashier_HasRoleCategories() {
        Role cashierRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        User cashierUser = User.builder()
                .id("cashier-id")
                .username("cashier_viet")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_viet")).thenReturn(Optional.of(cashierUser));

        List<ChatbotSuggestionResponse> categories = chatbotService.getQuickSuggestions("cashier_viet", "/shifts");

        assertNotNull(categories);
        assertFalse(categories.isEmpty());
        // Tất cả phân mục không được liên quan đến kho, tài chính, thuế
        for (ChatbotSuggestionResponse cat : categories) {
            assertFalse(cat.getCategory().contains("Kho hàng"));
            assertFalse(cat.getCategory().contains("Tài chính"));
            assertFalse(cat.getCategory().contains("Thuế"));
        }
        assertTrue(categories.stream().anyMatch(c -> c.getCategory().contains("POS") || c.getCategory().contains("Bán hàng")));
        assertTrue(categories.stream().anyMatch(c -> c.getCategory().contains("Ca làm việc")));
    }

    @Test
    @DisplayName("RBAC NCL-10 Chuẩn: Thu ngân (VT-02) hỏi danh sách khách hàng thân thiết được trả lời đầy đủ số lượng và thông tin")
    void testProcessMessage_CashierAccess_CustomerLoyalty() {
        Role cashierRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        User cashierUser = User.builder()
                .id("cashier-id")
                .username("cashier_viet")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_viet")).thenReturn(Optional.of(cashierUser));

        Customer vipCust = Customer.builder()
                .id("C-1")
                .name("Nguyễn Văn An")
                .phoneNumber("0912345678")
                .isVip(true)
                .discountRate(new BigDecimal("10"))
                .creditLimit(new BigDecimal("5000000"))
                .currentDebt(new BigDecimal("400000"))
                .totalSpent(new BigDecimal("15000000"))
                .build();

        Customer normalCust = Customer.builder()
                .id("C-2")
                .name("Trần Thị Bình")
                .phoneNumber("0987654321")
                .isVip(false)
                .discountRate(BigDecimal.ZERO)
                .creditLimit(new BigDecimal("2000000"))
                .currentDebt(BigDecimal.ZERO)
                .totalSpent(new BigDecimal("3000000"))
                .build();

        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(anyString()))
                .thenReturn(List.of(vipCust, normalCust));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("có mấy khách hàng thân thiết")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_viet", request);

        assertNotNull(response);
        assertEquals("VIEW_CUSTOMERS", response.getActionType());
        assertEquals("/customers", response.getActionUrl());
        assertTrue(response.getReply().contains("Danh Sách Khách Hàng Thân Thiết"));
        assertTrue(response.getReply().contains("2 khách hàng"));
        assertTrue(response.getReply().contains("Nguyễn Văn An"));
        assertFalse(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật"));
    }

    @Test
    @DisplayName("RBAC NCL-10 Chuẩn: Thu ngân (VT-02) hỏi công nợ khách hàng để bán ghi nợ theo QTN-13 được tra cứu thành công")
    void testProcessMessage_CashierAccess_CustomerDebt() {
        Role cashierRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        User cashierUser = User.builder()
                .id("cashier-id")
                .username("cashier_viet")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_viet")).thenReturn(Optional.of(cashierUser));

        Customer debtCust = Customer.builder()
                .id("C-1")
                .name("Lê Văn Cường")
                .phoneNumber("0909090909")
                .creditLimit(new BigDecimal("5000000"))
                .currentDebt(new BigDecimal("1200000"))
                .build();

        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(anyString()))
                .thenReturn(List.of(debtCust));

        DebtSummaryResponse debtSummary = DebtSummaryResponse.builder()
                .totalActiveDebt(new BigDecimal("1200000"))
                .totalOverdueDebt(BigDecimal.ZERO)
                .totalDebtors(1)
                .build();

        when(customerDebtService.getDebtSummary("cashier_viet")).thenReturn(debtSummary);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("danh sách khách nợ để ghi nợ đơn hàng")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_viet", request);

        assertNotNull(response);
        assertEquals("VIEW_DEBT", response.getActionType());
        assertEquals("/customers", response.getActionUrl());
        assertTrue(response.getReply().contains("Lê Văn Cường"));
        assertTrue(response.getReply().contains("1.200.000 VNĐ"));
        assertFalse(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật"));
    }

    @Test
    @DisplayName("RBAC Ca Trực: Thu ngân (VT-02) chỉ xem được ca của chính mình, không xem được cơ sở khác")
    void testProcessMessage_CashierAccess_MyShiftOnly() {
        Role cashierRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        User cashierUser = User.builder()
                .id("cashier-id")
                .username("cashier_viet")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_viet")).thenReturn(Optional.of(cashierUser));

        Shift myShift = Shift.builder()
                .id("shift-1")
                .user(cashierUser)
                .pointOfSale(com.sales.modules.pos.entity.PointOfSale.builder().name("Quầy 1 - Cơ sở chính").build())
                .openedAt(java.time.LocalDateTime.now())
                .openingCash(new BigDecimal("1000000"))
                .closingCashExpected(new BigDecimal("1374000"))
                .status(ShiftStatus.OPEN)
                .build();

        when(shiftRepository.findByUserIdAndStatus("cashier-id", ShiftStatus.OPEN))
                .thenReturn(Optional.of(myShift));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("ca bán hàng hiện tại của tôi")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_viet", request);

        assertNotNull(response);
        assertEquals("VIEW_POS", response.getActionType());
        assertEquals("/pos", response.getActionUrl());
        assertTrue(response.getReply().contains("Thông Tin Ca Làm Việc Của Bạn"));
        assertTrue(response.getReply().contains("Quầy 1 - Cơ sở chính"));
        assertTrue(response.getReply().contains("1.000.000 VNĐ"));
        assertTrue(response.getReply().contains("1.374.000 VNĐ"));
        assertFalse(response.getReply().contains("Chi nhánh 2"));
    }

    @Test
    @DisplayName("RBAC Ca Trực: Thu ngân hỏi về ca của các cơ sở khác bị từ chối bảo mật")
    void testProcessMessage_CashierAccess_DeniedOtherBranches() {
        Role cashierRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        User cashierUser = User.builder()
                .id("cashier-id")
                .username("cashier_viet")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_viet")).thenReturn(Optional.of(cashierUser));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("ai đang trực ở chi nhánh khác và các cơ sở khác?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_viet", request);

        assertNotNull(response);
        assertEquals("NONE", response.getActionType());
        assertTrue(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật"));
        assertTrue(response.getReply().contains("bạn chỉ được phép tra cứu thông tin"));
        assertTrue(response.getReply().contains("Chủ hộ kinh doanh"));
    }

    @Test
    @DisplayName("RBAC Ca Trực: Thu ngân hỏi sao tra cứu được tất cả cơ sở thì được giải đáp chính sách bảo mật")
    void testProcessMessage_CashierAccess_ExplainScope() {
        Role cashierRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        User cashierUser = User.builder()
                .id("cashier-id")
                .username("cashier_viet")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_viet")).thenReturn(Optional.of(cashierUser));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("sao là thu ngân mà lại tra cứu dc thông tin của tất cả các cơ sở")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_viet", request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("Quy Định Phân Quyền Bảo Mật Dành Cho Thu Ngân"));
        assertTrue(response.getReply().contains("cô lập phạm vi dữ liệu ca trực"));
    }

    @Test
    @DisplayName("RBAC Ca Trực: Chủ hộ (VT-01) tra cứu được tất cả các ca đang mở trên toàn bộ hệ thống")
    void testProcessMessage_OwnerAccess_AllShifts() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        User cashier1 = User.builder().fullName("Nhân viên Chi nhánh 1").build();
        User cashier2 = User.builder().fullName("Nhân viên Chi nhánh 2").build();

        Shift shift1 = Shift.builder()
                .id("s1")
                .user(cashier1)
                .pointOfSale(com.sales.modules.pos.entity.PointOfSale.builder().name("Cơ sở 1").build())
                .openedAt(java.time.LocalDateTime.now())
                .openingCash(new BigDecimal("1000000"))
                .closingCashExpected(new BigDecimal("2000000"))
                .status(ShiftStatus.OPEN)
                .build();

        Shift shift2 = Shift.builder()
                .id("s2")
                .user(cashier2)
                .pointOfSale(com.sales.modules.pos.entity.PointOfSale.builder().name("Cơ sở 2").build())
                .openedAt(java.time.LocalDateTime.now().minusDays(1))
                .openingCash(new BigDecimal("500000"))
                .closingCashExpected(new BigDecimal("800000"))
                .status(ShiftStatus.OPEN)
                .build();

        when(shiftRepository.findByHouseholdIdOrderByOpenedAtDesc("HH-001"))
                .thenReturn(List.of(shift1, shift2));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("tình trạng các ca bán hàng hiện tại")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_SHIFTS", response.getActionType());
        assertEquals("/shifts", response.getActionUrl());
        assertTrue(response.getReply().contains("2 ca bán hàng đang mở"));
        assertTrue(response.getReply().contains("Cơ sở 1"));
        assertTrue(response.getReply().contains("Cơ sở 2"));
    }

    @Test
    @DisplayName("Phương thức thanh toán: Chủ hộ hỏi tiền mặt, tiền khoản, ghi nợ trả về đúng số liệu và link /reports/payment-methods")
    void testProcessMessage_OwnerPaymentMethodsIntent() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        PaymentMethodReportResponse mockReport = PaymentMethodReportResponse.builder()
                .totalRevenue(new BigDecimal("429700"))
                .methods(List.of(
                        PaymentMethodReportResponse.PaymentMethodStatDto.builder()
                                .method("CASH")
                                .methodName("Tiền mặt")
                                .totalAmount(new BigDecimal("199250"))
                                .percentage(new BigDecimal("46.37"))
                                .transactionCount(2L)
                                .build(),
                        PaymentMethodReportResponse.PaymentMethodStatDto.builder()
                                .method("BANK_TRANSFER")
                                .methodName("Chuyển khoản")
                                .totalAmount(new BigDecimal("165000"))
                                .percentage(new BigDecimal("38.40"))
                                .transactionCount(1L)
                                .build(),
                        PaymentMethodReportResponse.PaymentMethodStatDto.builder()
                                .method("DEBT")
                                .methodName("Ghi nợ")
                                .totalAmount(new BigDecimal("65450"))
                                .percentage(new BigDecimal("15.23"))
                                .transactionCount(1L)
                                .build()
                ))
                .build();

        when(reportService.getPaymentMethodReport(eq("owner_anbinh"), any(LocalDate.class), any(LocalDate.class), isNull(), isNull()))
                .thenReturn(mockReport);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("tiền mặt bao nhiêu, tiền khoản bao nhiêu, ghi nợ bao nhiêu")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        assertEquals("VIEW_PAYMENT_METHODS", response.getActionType());
        assertEquals("/reports/payment-methods", response.getActionUrl());
        assertTrue(response.getReply().contains("199.250 VNĐ"));
        assertTrue(response.getReply().contains("165.000 VNĐ"));
        assertTrue(response.getReply().contains("65.450 VNĐ"));
        assertTrue(response.getReply().contains("429.700 VNĐ"));
    }

    @Test
    @DisplayName("Phương thức thanh toán: Thu ngân hỏi doanh thu phương thức toàn cửa hàng bị từ chối theo QTN-10")
    void testProcessMessage_CashierPaymentMethodsIntent_Denied() {
        Role cashierRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        User cashierUser = User.builder()
                .id("u-cashier")
                .username("cashier_viet")
                .fullName("Nguyễn Thu Ngân")
                .role(cashierRole)
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("cashier_viet")).thenReturn(Optional.of(cashierUser));

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("doanh thu theo phương thức thanh toán toàn cửa hàng")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("cashier_viet", request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("Thông Báo Phân Quyền Bảo Mật"));
        assertEquals("VIEW_SHIFTS", response.getActionType());
        assertEquals("/shifts", response.getActionUrl());
    }

    @Test
    @DisplayName("Fast-fail: Ngắt chuỗi Gemini models khi gặp lỗi mạng/timeout 2 lần liên tiếp và chuyển ngay sang Local Fallback")
    void testProcessMessage_FastFailOnConsecutiveNetworkErrors() {
        when(userRepository.findByUsername("owner_anbinh")).thenReturn(Optional.of(mockUser));

        DailyRevenueProjection projection = mock(DailyRevenueProjection.class);
        when(projection.getNetRevenue()).thenReturn(new BigDecimal("15500000"));
        when(projection.getOrderCount()).thenReturn(42L);
        when(reportService.getDailyRevenue(eq("owner_anbinh"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(projection));

        // Cấu hình API key và danh sách gồm 5 candidate models
        ReflectionTestUtils.setField(chatbotService, "geminiApiKey", "dummy-api-key");
        ReflectionTestUtils.setField(chatbotService, "geminiModel", "gemini-model-1");
        ReflectionTestUtils.setField(chatbotService, "geminiFallbackModels", "model-2,model-3,model-4,model-5");

        // Mock restClient ném ResourceAccessException (mô phỏng socket timeout / network error)
        org.springframework.web.client.RestClient mockRestClient = mock(org.springframework.web.client.RestClient.class);
        when(mockRestClient.post()).thenThrow(new org.springframework.web.client.ResourceAccessException("Connect timed out"));
        ReflectionTestUtils.setField(chatbotService, "restClient", mockRestClient);

        ChatbotMessageRequest request = ChatbotMessageRequest.builder()
                .message("Doanh thu hôm nay của quán thế nào?")
                .build();

        ChatbotMessageResponse response = chatbotService.processMessage("owner_anbinh", request);

        assertNotNull(response);
        // Kiểm chứng: Fast-fail dừng ngay sau đúng 2 lần thử, KHÔNG thử hết cả 5 models
        verify(mockRestClient, times(2)).post();
        // Kiểm chứng: Phản hồi tự động chuyển sang Smart Local Fallback
        assertEquals("local-rules-engine", response.getActiveModel());
        assertTrue(response.getReply().contains("15.500.000"));
    }
}
