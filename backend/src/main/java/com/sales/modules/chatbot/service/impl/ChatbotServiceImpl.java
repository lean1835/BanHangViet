package com.sales.modules.chatbot.service.impl;
import com.sales.modules.chatbot.dto.response.ChatbotMessageResponse;
import com.sales.modules.chatbot.dto.response.ChatbotSuggestionResponse;
import com.sales.modules.customer.dto.response.DebtSummaryResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationReportResponse;
import com.sales.modules.inventory.dto.response.InventoryValuationSummaryResponse;
import com.sales.modules.inventory.dto.response.LowStockWarningListResponse;
import com.sales.modules.inventory.dto.response.LowStockWarningResponse;
import com.sales.modules.pos.dto.response.ShiftCashSummaryResponse;
import com.sales.modules.product.dto.response.ProductRevenueProjection;
import com.sales.modules.report.dto.response.DailyRevenueProjection;
import com.sales.modules.report.dto.response.GrossProfitReportResponse;
import com.sales.modules.report.dto.response.PaymentMethodReportResponse;
import com.sales.modules.supplier.dto.response.SupplierDebtSummaryResponse;
import com.sales.modules.tax.dto.response.AnnualRevenueTrackingResponse;
import com.sales.modules.tax.dto.response.TaxPeriodReminderResponse;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sales.common.constant.ShiftStatus;
import com.sales.modules.chatbot.dto.ChatMessageDto;
import com.sales.modules.chatbot.dto.request.ChatbotMessageRequest;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.customer.entity.Customer;
import com.sales.modules.invoice.entity.EInvoice;
import com.sales.modules.product.entity.Product;
import com.sales.modules.pos.entity.Shift;
import com.sales.modules.supplier.entity.Supplier;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.customer.repository.CustomerRepository;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.pos.repository.ShiftRepository;
import com.sales.modules.supplier.repository.SupplierRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.common.security.HouseholdContextHolder;
import com.sales.modules.tax.service.AnnualRevenueTrackingService;
import com.sales.modules.pos.service.CashTransactionService;
import com.sales.modules.chatbot.service.ChatbotService;
import com.sales.modules.customer.service.CustomerDebtService;
import com.sales.modules.inventory.service.InventoryValuationReportService;
import com.sales.modules.inventory.service.InventoryWarningService;
import com.sales.modules.report.service.ReportService;
import com.sales.modules.report.dto.response.PeakHoursAndDaysResponse;
import com.sales.modules.report.dto.response.PeakSalesInsight;
import com.sales.modules.report.service.SalesAnalyticsService;
import com.sales.modules.supplier.service.SupplierDebtService;
import com.sales.modules.tax.service.TaxReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotServiceImpl implements ChatbotService {

    private final UserRepository userRepository;
    private final ReportService reportService;
    private final InventoryWarningService inventoryWarningService;
    private final CustomerDebtService customerDebtService;
    private final EInvoiceRepository eInvoiceRepository;
    private final SupplierDebtService supplierDebtService;
    private final InventoryValuationReportService inventoryValuationReportService;
    private final ShiftRepository shiftRepository;
    private final TaxReminderService taxReminderService;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CashTransactionService cashTransactionService;
    private final AnnualRevenueTrackingService annualRevenueTrackingService;
    private final SalesAnalyticsService salesAnalyticsService;

    @Value("${app.chatbot.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.chatbot.gemini.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    @Value("${app.chatbot.gemini.fallback-models:gemini-3.1-flash-lite,gemini-2.5-flash-lite,gemini-3.5-flash,gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3-flash,gemini-2.5-flash}")
    private String geminiFallbackModels;

    @Value("${app.chatbot.gemini.api-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String geminiApiUrl;

    private final Map<String, Long> modelCooldownMap = new java.util.concurrent.ConcurrentHashMap<>();
    private static final long COOLDOWN_DURATION_MS = 60_000L; // 60 giây hạ nhiệt khi model chạm trần 429 Rate Limit

    @Value("${app.chatbot.gemini.connect-timeout-ms:3000}")
    private int geminiConnectTimeoutMs = 3000;

    @Value("${app.chatbot.gemini.read-timeout-ms:15000}")
    private int geminiReadTimeoutMs = 15000;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile RestClient restClient;

    private RestClient getRestClient() {
        if (restClient == null) {
            synchronized (this) {
                if (restClient == null) {
                    org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                            new org.springframework.http.client.SimpleClientHttpRequestFactory();
                    factory.setConnectTimeout(java.time.Duration.ofMillis(geminiConnectTimeoutMs > 0 ? geminiConnectTimeoutMs : 3000));
                    factory.setReadTimeout(java.time.Duration.ofMillis(geminiReadTimeoutMs > 0 ? geminiReadTimeoutMs : 15000));
                    restClient = RestClient.builder().requestFactory(factory).build();
                }
            }
        }
        return restClient;
    }

    /**
     * Lấy danh sách model Gemini theo thứ tự ưu tiên: model chính -> chuỗi fallback models
     */
    private List<String> getCandidateModels() {
        List<String> models = new ArrayList<>();
        if (StringUtils.hasText(geminiModel)) {
            models.add(geminiModel.trim());
        }
        if (StringUtils.hasText(geminiFallbackModels)) {
            String[] parts = geminiFallbackModels.split(",");
            for (String p : parts) {
                String m = p.trim();
                if (StringUtils.hasText(m) && !models.contains(m)) {
                    models.add(m);
                }
            }
        }
        return models;
    }

    /**
     * Kiểm tra model có đang trong thời gian cooldown hạ nhiệt (do bị 429 Too Many Requests) hay không
     */
    private boolean isModelCoolingDown(String model) {
        Long expireTime = modelCooldownMap.get(model);
        if (expireTime == null) return false;
        if (System.currentTimeMillis() > expireTime) {
            modelCooldownMap.remove(model);
            return false;
        }
        return true;
    }

    /**
     * Đưa model vào danh sách hạ nhiệt 60s
     */
    private void markModelCooldown(String model) {
        long expireTime = System.currentTimeMillis() + COOLDOWN_DURATION_MS;
        modelCooldownMap.put(model, expireTime);
        log.warn("Gemini model '{}' chạm trần hạn mức (429/Quota). Tạm thời hạ nhiệt 60s (đến {}) để chuyển sang model dự phòng.",
                model, new Date(expireTime));
    }

    /**
     * Nhận diện lỗi Rate Limit (429 Too Many Requests) hoặc Quota Exceeded / Resource Exhausted
     */
    private boolean isRateLimitOrQuotaException(Throwable t) {
        if (t == null) return false;
        String msg = t.getMessage() != null ? t.getMessage().toLowerCase() : "";
        if (msg.contains("429") || msg.contains("resource_exhausted") || msg.contains("quota")
                || msg.contains("rate limit") || msg.contains("too many requests") || msg.contains("exceeded")) {
            return true;
        }
        if (t instanceof org.springframework.web.client.HttpStatusCodeException) {
            int code = ((org.springframework.web.client.HttpStatusCodeException) t).getStatusCode().value();
            return code == 429;
        }
        if (t.getCause() != null) {
            return isRateLimitOrQuotaException(t.getCause());
        }
        return false;
    }

    /**
     * Nhận diện lỗi mạng kết nối hoặc timeout (SocketTimeoutException, ConnectException, ResourceAccessException, v.v.)
     */
    private boolean isNetworkOrTimeoutException(Throwable t) {
        if (t == null) return false;
        if (t instanceof java.net.SocketTimeoutException
                || t instanceof java.net.ConnectException
                || t instanceof java.net.UnknownHostException
                || t instanceof org.springframework.web.client.ResourceAccessException) {
            return true;
        }
        if (t.getCause() != null) {
            return isNetworkOrTimeoutException(t.getCause());
        }
        return false;
    }

    private final Locale vnLocale = Locale.forLanguageTag("vi-VN");

    private String formatVnCurrency(BigDecimal amount) {
        if (amount == null) return "0 VNĐ";
        NumberFormat currencyFormat = NumberFormat.getInstance(vnLocale);
        return currencyFormat.format(amount) + " VNĐ";
    }

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }


    private boolean isAccountant(User user) {
        if (user == null || user.getRole() == null) return false;
        String code = user.getRole().getCode();
        return "VT-03".equalsIgnoreCase(code) || "ACCOUNTANT".equalsIgnoreCase(code);
    }

    private boolean isCashier(User user) {
        if (user == null || user.getRole() == null) return false;
        String code = user.getRole().getCode();
        return "VT-02".equalsIgnoreCase(code) || "EMPLOYEE".equalsIgnoreCase(code) || "CASHIER".equalsIgnoreCase(code) || "STAFF".equalsIgnoreCase(code);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatbotMessageResponse processMessage(String currentUsername, ChatbotMessageRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            household = HouseholdContextHolder.getHousehold();
        }
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";

        // 1. Nếu có Gemini API Key hợp lệ, thử xử lý qua chuỗi Failover Models (Multi-Model Fallback Chain)
        if (StringUtils.hasText(geminiApiKey)) {
            List<String> candidates = getCandidateModels();

            // Nếu tất cả candidate đều đang trong thời gian cooldown, giải phóng cooldown để thử lại lượt mới
            boolean allCoolingDown = candidates.stream().allMatch(this::isModelCoolingDown);
            if (allCoolingDown && !candidates.isEmpty()) {
                log.info("Tất cả candidate models đều đang bị cooldown, tiến hành reset cooldown map để thử lại lượt mới.");
                modelCooldownMap.clear();
            }

            int consecutiveNetworkErrors = 0;
            for (String targetModel : candidates) {
                if (isModelCoolingDown(targetModel)) {
                    log.info("Bỏ qua model '{}' do đang trong thời gian cooldown hạ nhiệt 60s.", targetModel);
                    continue;
                }

                try {
                    log.debug("Đang gửi câu hỏi tới Gemini Model: {}", targetModel);
                    ChatbotMessageResponse geminiResponse = callGeminiWithTools(user, household, request, targetModel);
                    if (geminiResponse != null && StringUtils.hasText(geminiResponse.getReply())) {
                        return geminiResponse;
                    }
                } catch (Exception e) {
                    if (isRateLimitOrQuotaException(e)) {
                        markModelCooldown(targetModel);
                        log.warn("Gemini model '{}' chạm trần hạn mức Rate Limit (429/Quota), tự động failover sang model tiếp theo trong chuỗi. Chi tiết: {}",
                                targetModel, e.getMessage());
                    } else if (isNetworkOrTimeoutException(e)) {
                        consecutiveNetworkErrors++;
                        log.warn("Gemini model '{}' gặp sự cố mạng hoặc timeout (lần {}): {}. Tự động thử model tiếp theo.",
                                targetModel, consecutiveNetworkErrors, e.getMessage());
                        if (consecutiveNetworkErrors >= 2) {
                            log.warn("Phát hiện lỗi mạng/timeout liên tiếp 2 lần từ Google Gemini API. Kích hoạt Fast-fail chuyển ngay sang Smart Local Fallback để tránh nghẽn thời gian chờ của người dùng.");
                            break;
                        }
                    } else {
                        log.warn("Gemini model '{}' gặp lỗi: {}. Tự động thử model tiếp theo.", targetModel, e.getMessage());
                    }
                }
            }
            log.warn("Toàn bộ chuỗi Gemini Models đã cạn hạn mức hoặc không phản hồi. Tự động chuyển sang Smart Local Fallback.");
        }

        // 2. Chế độ Fallback thông minh: Tự động phân tích ý định và lấy dữ liệu nội bộ
        ChatbotMessageResponse localResponse = processLocalIntent(user, household, userMessage, request.getCurrentScreen());
        if (localResponse != null && !StringUtils.hasText(localResponse.getActiveModel())) {
            localResponse.setActiveModel("local-rules-engine");
        }
        return localResponse;
    }

    @Override
    public List<ChatbotSuggestionResponse> getQuickSuggestions(String currentUsername, String currentScreen) {
        User user = getAuthenticatedUser(currentUsername);
        List<ChatbotSuggestionResponse> categories = new ArrayList<>();

        if (isCashier(user)) {
            // Role VT-02: Phân mục gợi ý chuyên biệt cho Nhân viên bán hàng / Thu ngân
            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Thao tác quầy bán hàng (POS)")
                    .suggestions(List.of(
                            "Phím tắt thanh toán nhanh trên POS",
                            "Quy trình xuất hóa đơn máy tính tiền ngay",
                            "Quy trình đổi trả hàng cho khách lẻ tại quầy",
                            "Hướng dẫn thanh toán quét mã VietQR"
                    ))
                    .build());

            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Ca làm việc & Quản lý tiền két")
                    .suggestions(List.of(
                            "Tình trạng ca bán hàng & tiền két hiện tại?",
                            "Quy trình mở ca và đếm tiền đầu ca",
                            "Quy trình bàn giao ca và chốt két cuối ngày",
                            "Cách ghi nhận khoản chi tiền mặt tại ca"
                    ))
                    .build());

            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Khách hàng thân thiết & Công nợ (NCL-10)")
                    .suggestions(List.of(
                            "Có mấy khách hàng thân thiết?",
                            "Danh sách khách hàng thân thiết & VIP",
                            "Kiểm tra hạn mức nợ của khách hàng",
                            "Chính sách chiết khấu khách quen"
                    ))
                    .build());
        } else if (isAccountant(user)) {
            // Role VT-03: Phân mục gợi ý chuyên biệt cho Kế toán viên
            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Thuế & Sổ sách kế toán (TT88)")
                    .suggestions(List.of(
                            "Hạn nộp tờ khai thuế hộ kinh doanh quý này?",
                            "Quy định 4 sổ sách kế toán bắt buộc theo Thông tư 88",
                            "Doanh thu năm nay và tiến độ ngưỡng thuế 1 tỷ",
                            "Cách xuất dữ liệu phục vụ kê khai thuế"
                    ))
                    .build());

            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Hóa đơn điện tử & Xử lý sai sót (TT78)")
                    .suggestions(List.of(
                            "Kiểm tra hóa đơn lỗi chưa gửi Cơ quan Thuế",
                            "Cách xử lý hóa đơn có sai sót theo Thông tư 78",
                            "Quy định ký hiệu hóa đơn máy tính tiền khởi tạo"
                    ))
                    .build());

            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Tài chính, Chi phí & Công nợ")
                    .suggestions(List.of(
                            "Tổng nợ phải trả cho nhà cung cấp hiện tại?",
                            "Có khoản nợ nhà cung cấp nào quá hạn không?",
                            "Báo cáo lợi nhuận gộp hôm nay",
                            "Tổng công nợ khách hàng cần thu",
                            "Tổng định giá toàn bộ kho hàng theo giá vốn"
                    ))
                    .build());
        } else {
            // Role VT-01 (Chủ hộ kinh doanh) & Quản trị viên
            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Bán hàng & Doanh thu")
                    .suggestions(List.of(
                            "Báo cáo doanh thu hôm nay",
                            "Doanh thu theo tiền mặt & chuyển khoản hôm nay",
                            "Báo cáo lợi nhuận gộp hôm nay",
                            "Mặt hàng nào bán chạy nhất tháng này?",
                            "Doanh thu năm nay và tiến độ ngưỡng thuế 1 tỷ"
                    ))
                    .build());

            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Kho hàng & Giá vốn")
                    .suggestions(List.of(
                            "Có sản phẩm nào sắp hết kho không?",
                            "Tổng định giá toàn bộ kho hàng theo giá vốn",
                            "Kiểm tra danh mục hàng tồn kho"
                    ))
                    .build());

            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Tài chính & Công nợ 2 chiều")
                    .suggestions(List.of(
                            "Tổng nợ phải trả nhà cung cấp hiện tại?",
                            "Tổng công nợ khách hàng cần thu",
                            "Tình trạng ca bán hàng & tiền két tại quầy"
                    ))
                    .build());

            categories.add(ChatbotSuggestionResponse.builder()
                    .category("Thuế & Hóa đơn điện tử")
                    .suggestions(List.of(
                            "Kiểm tra hóa đơn lỗi chưa gửi Cơ quan Thuế",
                            "Hạn nộp tờ khai thuế hộ kinh doanh quý này?"
                    ))
                    .build());
        }

        return categories;
    }

    /**
     * Gọi Gemini API kết hợp Function Calling để xử lý câu hỏi tự nhiên
     */
    private ChatbotMessageResponse callGeminiWithTools(User user, BusinessHousehold household, ChatbotMessageRequest request, String targetModel) throws Exception {
        String endpoint = String.format("%s/%s:generateContent?key=%s", geminiApiUrl, targetModel, geminiApiKey);

        ObjectNode rootNode = objectMapper.createObjectNode();

        // 1. System instruction theo vai trò người dùng (RBAC)
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ArrayNode systemParts = systemInstruction.putArray("parts");

        String roleInstruction;
        boolean cashier = isCashier(user);
        boolean accountant = isAccountant(user);

        if (cashier) {
            roleInstruction = "VAI TRÒ VÀ NGUYÊN TẮC HỖ TRỢ DÀNH CHO NHÂN VIÊN BÁN HÀNG / THU NGÂN (VT-02) THEO ĐẶC TẢ HỆ THỐNG:\n" +
                    "- Người dùng là Nhân viên bán hàng tại quầy POS. Bạn CUNG CẤP ĐẦY ĐỦ các nghiệp vụ và dữ liệu sau:\n" +
                    "  1. NGHIỆP VỤ BÁN HÀNG POS (NCL-03): Hướng dẫn tính năng POS, phím tắt thanh toán nhanh (F9, VietQR), xuất hóa đơn máy tính tiền ngay cho khách (NCL-04, NCL-06), quy trình đổi trả hàng cho khách lẻ tại quầy (NCL-11).\n" +
                    "  2. CA BÁN HÀNG & TIỀN KÉT (NCL-03-CN-006, 007): Tra cứu thông tin ca bán hàng hiện tại của CHÍNH NHÂN VIÊN NÀY, tiền mặt đầu ca, tiền dự kiến trong két, doanh thu ca trực của mình (`query_active_shift`). QUY TẮC BẢO MẬT: Thu ngân CHỈ ĐƯỢC PHÉP xem ca trực và tiền két của CHÍNH BẢN THÂN MÌNH. TUYỆT ĐỐI KHÔNG cung cấp số liệu ca trực, tiền két, hay danh sách ca của các nhân viên khác hoặc các chi nhánh/cơ sở khác trong hệ thống. Nếu thu ngân hỏi về ca của cơ sở khác hoặc tất cả cơ sở, hãy từ chối lịch sự và nêu rõ đây là quyền hạn của Chủ hộ.\n" +
                    "  3. KHÁCH HÀNG THÂN THIẾT & CÔNG NỢ BÁN LẺ (Epic NCL-10, QTN-13): Nhân viên bán hàng ĐƯỢC PHÉP tra cứu danh sách khách hàng thân thiết, số lượng khách quen, danh sách khách hàng VIP, tỷ lệ chiết khấu, hạn mức công nợ và số dư nợ của khách hàng để phục vụ bán hàng ghi nợ trong hạn mức (QTN-13) và thu tiền nợ tại quầy. Khi nhân viên hỏi 'có mấy khách hàng thân thiết', 'danh sách khách hàng', hoặc nợ của khách: Bạn BẮT BUỘC PHẢI GỌI `query_customers` hoặc `query_customer_debt` để trả lời đầy đủ số lượng và thông tin chi tiết.\n" +
                    "- CHÍNH SÁCH BẢO MẬT BẮT BUỘC THEO ĐẶC TẢ EXCEL (QTN-10, QTN-05, User Roles Constraints):\n" +
                    "  1. TÀI CHÍNH TOÀN CỬA HÀNG & CÁC CƠ SỞ KHÁC (QTN-10): TUYỆT ĐỐI KHÔNG tiết lộ Báo cáo doanh thu tổng của toàn cửa hàng (chỉ xem doanh thu ca/đơn của chính mình), Báo cáo Lợi nhuận gộp & Giá vốn hàng bán (COGS), Định giá toàn bộ kho hàng, Doanh thu lũy kế cả năm & Ngưỡng thuế 1 tỷ, và THÔNG TIN CA TRỰC/TIỀN KÉT CỦA CÁC CƠ SỞ/CHI NHÁNH KHÁC.\n" +
                    "  2. CÔNG NỢ NHÀ CUNG CẤP (NCL-13): TUYỆT ĐỐI KHÔNG tiết lộ nợ phải trả nhà cung cấp và thông tin nhập hàng đầu vào.\n" +
                    "  3. KÊ KHAI THUẾ & SỔ SÁCH (NCL-12): TUYỆT ĐỐI KHÔNG hỗ trợ kê khai thuế và 4 sổ sách kế toán Thông tư 88.\n" +
                    "  4. HỦY / ĐIỀU CHỈNH HÓA ĐƠN (QTN-05): Không cho phép nhân viên tự hủy hoặc lập hóa đơn điều chỉnh (chỉ Chủ hộ và Kế toán).\n" +
                    "- NGUYÊN TẮC TỪ CHỐI ĐÚNG PHẠM VI:\n" +
                    "  Khi nhân viên hỏi về: Doanh thu tổng cửa hàng, Lợi nhuận gộp/giá vốn, Định giá toàn kho, Công nợ nhà cung cấp, Kê khai thuế TT88, hoặc Thông tin ca trực của các cơ sở/chi nhánh khác. Nêu rõ: 'Dạ, thông tin doanh thu tổng/lợi nhuận/công nợ nhà cung cấp/thuế/ca của các cơ sở khác thuộc thẩm quyền quản trị của Chủ hộ kinh doanh và Kế toán viên. Chị/Anh chỉ có quyền theo dõi ca trực tại quầy của chính mình ạ.'\n";
        } else if (accountant) {
            roleInstruction = "VAI TRÒ VÀ NGUYÊN TẮC PHỤC VỤ KẾ TOÁN VIÊN (VT-03 / Kế toán nội bộ / Kế toán dịch vụ):\n" +
                    "- Người dùng là KẾ TOÁN VIÊN của hộ kinh doanh. Kế toán có TOÀN QUYỀN tra cứu tất cả dữ liệu kế toán, tài chính, sổ sách Thông tư 88, hóa đơn điện tử Thông tư 78, công nợ 2 chiều (nhà cung cấp & khách hàng), báo cáo lợi nhuận gộp, giá vốn COGS, định giá kho, doanh thu lũy kế 1 tỷ và đối soát dòng tiền ca trực.\n" +
                    "- Xưng hô 'Em' và gọi người dùng là 'Anh/Chị' hoặc 'Anh/Chị Kế toán'. Trả lời thẳng thắn, chính xác số liệu, hỗ trợ đắc lực nghiệp vụ đối soát công nợ, chuẩn bị kỳ kê khai thuế và lập báo cáo tài chính.\n";
        } else {
            roleInstruction = "VAI TRÒ VÀ NGUYÊN TẮC PHỤC VỤ CHỦ HỘ KINH DOANH (VT-01 / Toàn quyền quản trị cấp cao):\n" +
                    "- Người dùng là CHỦ HỘ / Quản lý cấp cao của cửa hàng. Bạn có toàn quyền cao nhất truy cập 100% tất cả các công cụ quản lý kinh doanh, tài chính, công nợ, kho hàng và thuế.\n" +
                    "- Xưng hô 'Em' và gọi người dùng là 'Anh/Chị' hoặc 'Chủ hộ'. Tư vấn toàn diện về doanh thu, lợi nhuận, dòng tiền, nợ và thuế.\n";
        }

        String systemPrompt = String.format(
                "Bạn là 'Trợ lý AI Bán Hàng Việt' - Trợ lý số quản trị toàn diện dành cho Hộ kinh doanh cá thể tại Việt Nam. " +
                "Thông tin cửa hàng hiện tại: Tên hộ '%s', MST '%s', Người dùng '%s' (Vai trò: %s).\n\n" +
                "%s\n" +
                "NGUYÊN TẮC CỐT LÕI VỀ PHONG CÁCH GIAO TIẾP:\n" +
                "- TUYỆT ĐỐI KHÔNG NÓI LÒNG VÒNG, KHÔNG HỎI LẠI NGƯỜI DÙNG NHƯ 'Anh/chị có muốn em kiểm tra thêm không?'.\n" +
                "- PHẢI TRẢ LỜI NGAY, THẲNG THẮN, ĐẦY ĐỦ SỐ LIỆU VÀ TÊN CHI TIẾT TỪNG ĐỐI TÁC/SẢN PHẨM.\n" +
                "- Khi người dùng hỏi 'có mấy khách hàng thân thiết', 'danh sách khách hàng', 'khách quen', 'khách vip': Bạn BẮT BUỘC PHẢI GỌI `query_customers` và thông báo rõ tổng số lượng khách hàng, số khách VIP và liệt kê tên từng khách hàng kèm chiết khấu/hạn mức nợ.\n" +
                "- Khi người dùng hỏi về ca bán hàng, ca làm việc, ca trực, 'có mấy ca', 'ai đang trực', 'tình trạng ca':\n" +
                "  + NẾU NGƯỜI DÙNG LÀ THU NGÂN (VT-02): Bạn BẮT BUỘC CHỈ ĐƯỢC báo thông tin ca trực của CHÍNH THU NGÂN ĐÓ (quầy đang trực, thời gian mở, tiền đầu ca, doanh thu ca, tiền trong két). TUYỆT ĐỐI KHÔNG liệt kê danh sách ca của các nhân viên khác hoặc các chi nhánh/cơ sở khác. Nếu thu ngân hỏi 'sao là thu ngân mà lại tra cứu được thông tin của tất cả các cơ sở' hoặc hỏi về các chi nhánh khác, hãy giải thích rõ: Theo chính sách phân quyền bảo mật, thu ngân chỉ được xem ca trực tại quầy của chính mình; việc giám sát tất cả các cơ sở chỉ dành cho Chủ hộ/Quản lý.\n" +
                "  + NẾU NGƯỜI DÙNG LÀ CHỦ HỘ / KẾ TOÁN: Bạn BẮT BUỘC PHẢI GỌI `query_active_shift`. Tool sẽ trả về `totalOpenShifts` và danh sách chi tiết `openShifts`. Bạn PHẢI BÁO CHÍNH XÁC tổng số ca đang mở và LIỆT KÊ ĐẦY ĐỦ TẤT CẢ CÁC CA trong `openShifts` (Tên nhân viên trực, quầy/chi nhánh, thời gian mở, tiền đầu ca, tiền kì vọng trong két). TUYỆT ĐỐI KHÔNG ĐƯỢC chỉ nói 1 ca hoặc tự ý bịa đặt rằng các ca khác đã đóng khi `totalOpenShifts` > 1. Nếu có ca mở từ các ngày trước chưa đóng, hãy thông báo rõ ràng và nhắc nhở Chủ hộ thực hiện 'Đóng ca hộ' tại trang Quản lý ca để chốt sổ đối soát.\n" +
                "- Khi người dùng hỏi 'gồm những nhà cung cấp nào', 'nợ những ai', 'danh sách nợ': Bạn BẮT BUỘC PHẢI LIỆT KÊ RÕ TÊN TỪNG NHÀ CUNG CẤP CÙNG SỐ TIỀN NỢ CỤ THỂ từ danh sách `debtSuppliers` (dạng bảng hoặc danh sách gạch đầu dòng rõ ràng, kèm SĐT nếu có).\n" +
                "- Khi người dùng hỏi về khách nợ hoặc 'gồm những khách hàng nào', bạn BẮT BUỘC PHẢI LIỆT KÊ RÕ TÊN TỪNG KHÁCH HÀNG CÙNG SỐ TIỀN NỢ từ `debtCustomers`.\n" +
                "- Khi người dùng hỏi về tồn kho sản phẩm cụ thể (ví dụ 'mì tôm còn bao nhiêu', 'tìm sản phẩm X'), hãy gọi `query_product_stock` và trả về ngay số lượng tồn, giá bán lẻ (và giá vốn nếu là Chủ hộ/Kế toán).\n" +
                "- Khi người dùng hỏi về doanh thu năm hoặc ngưỡng thuế 1 tỷ, hãy gọi `query_annual_revenue`.\n" +
                "- Khi người dùng hỏi về hóa đơn, hóa đơn điện tử, hóa đơn nháp (bản nháp/DRAFT), hóa đơn chờ cấp mã hoặc hóa đơn lỗi: Bạn BẮT BUỘC PHẢI GỌI `query_einvoice_status`. Tool sẽ trả về số lượng hóa đơn bản nháp (`draftCount`), đã cấp mã thuế (`issuedCount`), chờ cấp mã (`pendingTransmissionCount`), lỗi truyền thuế (`errorInvoiceCount`), đã hủy (`canceledCount`), tổng số hóa đơn (`totalInvoices`) và danh sách các hóa đơn nháp hoặc lỗi mới nhất (`recentDraftInvoices`, `recentErrorInvoices`). Bạn PHẢI BÁO CHÍNH XÁC số lượng từng loại (đặc biệt là số lượng hóa đơn bản nháp nếu người dùng hỏi về hóa đơn nháp), nêu ví dụ một số hóa đơn nháp nổi bật kèm mã tra cứu và tên khách hàng từ `recentDraftInvoices` để người dùng dễ theo dõi. TUYỆT ĐỐI KHÔNG BÁO LÀ 0 HÓA ĐƠN HOẶC BẢO HỆ THỐNG CHƯA HỖ TRỢ KHI `draftCount` > 0.\n" +
                "- Khi người dùng hỏi về 'giờ cao điểm', 'giờ nào trong ngày cao điểm nhất', 'khung giờ đông khách', 'giờ bán chạy', 'ngày nào bán chạy nhất trong tuần', 'giờ vắng khách', 'phân tích giờ': Bạn BẮT BUỘC PHẢI GỌI `query_peak_hours`. Tool sẽ trả về `peakHourLabel`, `peakHourRevenueVnd`, `peakHourOrderCount`, `lowestHourLabel`, `busiestDayName`, `busiestDayRevenueVnd`, `topPeakSlots` và `recommendations`. Bạn PHẢI BÁO CHÍNH XÁC khung giờ cao điểm nhất trong ngày (kèm doanh thu và số đơn), ngày bán chạy nhất trong tuần, và các khuyến nghị vận hành. TUYỆT ĐỐI KHÔNG ĐƯỢC NÓI LÀ HỆ THỐNG CHƯA HỖ TRỢ PHÂN TÍCH KHUNG GIỜ CAO ĐIỂM!\n" +
                "- Khi người dùng hỏi về doanh thu theo hình thức hoặc phương thức thanh toán, hoặc hỏi 'tiền mặt bao nhiêu', 'tiền khoản bao nhiêu', 'chuyển khoản bao nhiêu', 'ghi nợ bao nhiêu', 'thanh toán bằng gì', 'tỷ lệ tiền mặt/chuyển khoản':\n" +
                "  + NẾU LÀ THU NGÂN (VT-02): Báo cáo doanh thu tiền mặt, chuyển khoản trong ca trực của chính mình từ `query_active_shift` hoặc hướng dẫn xem ca trực.\n" +
                "  + NẾU LÀ CHỦ HỘ / KẾ TOÁN: Bạn BẮT BUỘC PHẢI GỌI `query_payment_methods`. Tool sẽ trả về `totalRevenueVnd`, `cashAmountVnd`, `bankTransferAmountVnd`, `debtAmountVnd`, số giao dịch và tỷ lệ phần trăm của từng phương thức (`methods`). Bạn PHẢI BÁO CHÍNH XÁC VÀ ĐẦY ĐỦ con số cụ thể của Tiền mặt, Chuyển khoản (VietQR/Ngân hàng) và Ghi nợ (kèm tỷ lệ %% và số đơn/giao dịch). TUYỆT ĐỐI KHÔNG ĐƯỢC BẢO LÀ HỆ THỐNG CHƯA BÓC TÁCH HOẶC CHƯA HỖ TRỢ CHI TIẾT TỪNG PHƯƠNG THỨC THANH TOÁN!\n\n" +
                "Quy tắc giao tiếp: Thân thiện, tôn trọng. " +
                "Khi người dùng hỏi về bất kỳ số liệu thực tế nào của cửa hàng, bạn BẮT BUỘC PHẢI GỌI TOOL tương ứng trong phạm vi phân quyền để lấy dữ liệu thực tế trước khi trả lời. " +
                "Câu trả lời trình bày mạch lạc bằng Markdown, định dạng tiền tệ VNĐ rõ ràng, giải thích số liệu dễ hiểu.",
                household.getName(),
                household.getTaxCode() != null ? household.getTaxCode() : "Chưa cập nhật",
                user.getFullName(),
                user.getRole() != null ? user.getRole().getName() : "Người dùng",
                roleInstruction
        );
        systemParts.addObject().put("text", systemPrompt);
        rootNode.set("systemInstruction", systemInstruction);

        // 2. Function Declarations (Tools) theo phân quyền vai trò
        ArrayNode toolsArray = rootNode.putArray("tools");
        ObjectNode functionDeclarations = toolsArray.addObject();
        ArrayNode declList = functionDeclarations.putArray("functionDeclarations");

        // Tool: query_customers (Cho phép CẢ 3 VAI TRÒ: Chủ hộ, Kế toán và Thu ngân - Epic NCL-10)
        ObjectNode toolCustomers = declList.addObject();
        toolCustomers.put("name", "query_customers");
        toolCustomers.put("description", "Tra cứu danh sách khách hàng thân thiết của cửa hàng, tổng số lượng khách quen, danh sách khách hàng VIP, tỷ lệ chiết khấu, hạn mức công nợ và dư nợ hiện tại để phục vụ bán hàng và chăm sóc khách hàng");
        ObjectNode custParams = toolCustomers.putObject("parameters");
        custParams.put("type", "OBJECT");
        ObjectNode custProps = custParams.putObject("properties");
        custProps.putObject("keyword").put("type", "STRING").put("description", "Tên hoặc số điện thoại khách hàng cần tra cứu");
        custProps.putObject("vipOnly").put("type", "BOOLEAN").put("description", "Nếu true, chỉ lọc danh sách khách hàng thân thiết / VIP có chiết khấu");

        // Tool: query_customer_debt (Cho phép CẢ 3 VAI TRÒ: Chủ hộ, Kế toán và Thu ngân - Epic NCL-10 & QTN-13)
        ObjectNode toolCustomerDebt = declList.addObject();
        toolCustomerDebt.put("name", "query_customer_debt");
        toolCustomerDebt.put("description", "Tra cứu tổng công nợ khách hàng hiện tại cần thu hồi, nợ quá hạn và danh sách chi tiết tên từng khách hàng đang nợ cùng số tiền nợ cụ thể để phục vụ quản lý nợ và bán hàng ghi nợ theo hạn mức");

        // Tool: query_daily_revenue (Chỉ Chủ hộ và Kế toán - QTN-10)
        if (!cashier) {
            ObjectNode toolRevenue = declList.addObject();
            toolRevenue.put("name", "query_daily_revenue");
            toolRevenue.put("description", "Tra cứu doanh thu và số lượng đơn hàng của cửa hàng linh hoạt: hôm nay, hôm qua, 7 ngày qua hoặc tháng này");
            ObjectNode revParams = toolRevenue.putObject("parameters");
            revParams.put("type", "OBJECT");
            ObjectNode revProps = revParams.putObject("properties");
            revProps.putObject("period").put("type", "STRING").put("description", "Khoảng thời gian: 'today' (hôm nay), 'yesterday' (hôm qua), 'week' (7 ngày qua), 'month' (tháng này)");
            revProps.putObject("days").put("type", "INTEGER").put("description", "Số ngày cần xem, mặc định 1 là hôm nay");
        }

        // Tool: query_payment_methods (Chỉ Chủ hộ và Kế toán - NCL-07-CN-011)
        if (!cashier) {
            ObjectNode toolPayment = declList.addObject();
            toolPayment.put("name", "query_payment_methods");
            toolPayment.put("description", "Tra cứu báo cáo chi tiết doanh thu theo từng hình thức/phương thức thanh toán (Tiền mặt, Chuyển khoản ngân hàng/VietQR, Bán ghi nợ), số giao dịch và tỷ lệ phần trăm theo khoảng thời gian: hôm nay, hôm qua, tuần này hoặc tháng này");
            ObjectNode paymentParams = toolPayment.putObject("parameters");
            paymentParams.put("type", "OBJECT");
            ObjectNode paymentProps = paymentParams.putObject("properties");
            paymentProps.putObject("period").put("type", "STRING").put("description", "Khoảng thời gian: 'today' (hôm nay), 'yesterday' (hôm qua), 'week' (7 ngày qua), 'month' (tháng này), mặc định 'today'");
        }

        // Tool: query_gross_profit (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolProfit = declList.addObject();
            toolProfit.put("name", "query_gross_profit");
            toolProfit.put("description", "Tra cứu báo cáo lợi nhuận gộp, doanh thu thuần, giá vốn hàng bán (COGS) và tỷ suất lợi nhuận của cửa hàng hôm nay hoặc tháng này");
            ObjectNode profitParams = toolProfit.putObject("parameters");
            profitParams.put("type", "OBJECT");
            ObjectNode profitProps = profitParams.putObject("properties");
            profitProps.putObject("period").put("type", "STRING").put("description", "Khoảng thời gian: 'today' (hôm nay) hoặc 'month' (tháng này), mặc định 'today'");
        }

        // Tool: query_supplier_debt (Chỉ Chủ hộ và Kế toán - NCL-13)
        if (!cashier) {
            ObjectNode toolSupplierDebt = declList.addObject();
            toolSupplierDebt.put("name", "query_supplier_debt");
            toolSupplierDebt.put("description", "Tra cứu tổng công nợ nhà cung cấp phải trả hiện tại, nợ quá hạn và danh sách chi tiết tên từng nhà cung cấp đang có công nợ cùng số tiền nợ cụ thể");
        }

        // Tool: query_low_stock_products (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolStock = declList.addObject();
            toolStock.put("name", "query_low_stock_products");
            toolStock.put("description", "Tra cứu danh sách các mặt hàng đang tồn dưới mức tối thiểu an toàn cần nhập thêm");
        }

        // Tool: query_product_stock (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolProdStock = declList.addObject();
            toolProdStock.put("name", "query_product_stock");
            toolProdStock.put("description", "Tra cứu số lượng tồn kho thực tế, giá bán lẻ và giá vốn của một mặt hàng cụ thể theo tên hoặc mã sản phẩm");
            ObjectNode prodStockParams = toolProdStock.putObject("parameters");
            prodStockParams.put("type", "OBJECT");
            ObjectNode prodStockProps = prodStockParams.putObject("properties");
            prodStockProps.putObject("keyword").put("type", "STRING").put("description", "Tên hoặc mã vạch barcode sản phẩm cần tra cứu");
        }

        // Tool: query_inventory_valuation (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolValuation = declList.addObject();
            toolValuation.put("name", "query_inventory_valuation");
            toolValuation.put("description", "Tra cứu tổng định giá toàn bộ kho hàng theo giá vốn, tổng giá trị theo giá bán lẻ, lãi gộp tiềm năng và tổng số mặt hàng trong kho");
        }

        // Tool: query_active_shift (Cho phép Nhân viên Thu ngân, Kế toán và Chủ hộ)
        ObjectNode toolShift = declList.addObject();
        toolShift.put("name", "query_active_shift");
        if (cashier) {
            toolShift.put("description", "Tra cứu ca bán hàng hiện tại của chính nhân viên thu ngân này tại quầy POS, thời gian mở ca, tiền quỹ đầu ca, tiền dự kiến trong két và doanh thu trong ca trực của chính mình.");
        } else {
            toolShift.put("description", "Tra cứu tất cả các ca bán hàng hiện tại đang mở của toàn bộ các quầy/chi nhánh của cửa hàng, tổng số ca đang mở (totalOpenShifts), danh sách chi tiết từng nhân viên trực ca (openShifts), quầy bán/chi nhánh, thời gian mở ca, tiền mặt đầu ca, tiền mặt dự kiến trong két và doanh thu từng ca");
        }

        // Tool: query_annual_revenue (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolAnnual = declList.addObject();
            toolAnnual.put("name", "query_annual_revenue");
            toolAnnual.put("description", "Tra cứu doanh thu lũy kế cả năm của hộ kinh doanh, tiến độ so với ngưỡng giám sát thuế 1 tỷ/năm và số lượng hóa đơn hợp lệ");
            ObjectNode annualParams = toolAnnual.putObject("parameters");
            annualParams.put("type", "OBJECT");
            ObjectNode annualProps = annualParams.putObject("properties");
            annualProps.putObject("year").put("type", "INTEGER").put("description", "Năm cần tra cứu, ví dụ 2026");
        }

        // Tool: query_einvoice_status (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolInvoices = declList.addObject();
            toolInvoices.put("name", "query_einvoice_status");
            toolInvoices.put("description", "Tra cứu toàn diện tình trạng hóa đơn điện tử của cửa hàng: số lượng hóa đơn bản nháp (DRAFT), số hóa đơn đã cấp mã thuế (ISSUED), số hóa đơn chờ cấp mã (WAITING_TAX_CODE), số hóa đơn lỗi truyền nhận thuế (SEND_ERROR), số hóa đơn đã hủy (CANCELED), tổng số hóa đơn và danh sách chi tiết các hóa đơn nháp hoặc lỗi mới nhất");
        }

        // Tool: query_tax_reminders (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolTax = declList.addObject();
            toolTax.put("name", "query_tax_reminders");
            toolTax.put("description", "Tra cứu các thông báo nhắc nộp thuế, kỳ tính thuế (tháng/quý) sắp đến hạn hoặc quá hạn nộp tờ khai theo Thông tư 88");
        }

        // Tool: query_top_selling_products (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolTop = declList.addObject();
            toolTop.put("name", "query_top_selling_products");
            toolTop.put("description", "Tra cứu danh sách các mặt hàng bán chạy nhất (Top selling) của cửa hàng theo doanh thu và số lượng bán");
        }

        // Tool: query_peak_hours (Chỉ Chủ hộ và Kế toán)
        if (!cashier) {
            ObjectNode toolPeak = declList.addObject();
            toolPeak.put("name", "query_peak_hours");
            toolPeak.put("description", "Tra cứu phân tích khung giờ cao điểm và ngày bán chạy nhất trong tuần của cửa hàng: khung giờ có doanh thu/số đơn cao nhất trong ngày (peak hour), khung giờ vắng khách nhất (lowest hour), ngày bán chạy nhất trong tuần (busiest day), các khung giờ vàng và khuyến nghị bố trí nhân sự/chuẩn bị tiền lẻ phục vụ thanh toán");
            ObjectNode peakParams = toolPeak.putObject("parameters");
            peakParams.put("type", "OBJECT");
            ObjectNode peakProps = peakParams.putObject("properties");
            peakProps.putObject("period").put("type", "STRING").put("description", "Khoảng thời gian phân tích: 'today' (hôm nay), 'week' (7 ngày qua), 'month' (tháng này/30 ngày qua), mặc định 'month'");
        }

        // 3. Contents (History + User prompt)
        ArrayNode contentsArray = rootNode.putArray("contents");

        if (request.getHistory() != null) {
            for (ChatMessageDto historyMsg : request.getHistory()) {
                if (StringUtils.hasText(historyMsg.getText())) {
                    ObjectNode histObj = contentsArray.addObject();
                    histObj.put("role", "model".equalsIgnoreCase(historyMsg.getRole()) || "assistant".equalsIgnoreCase(historyMsg.getRole()) ? "model" : "user");
                    histObj.putArray("parts").addObject().put("text", historyMsg.getText());
                }
            }
        }

        ObjectNode userMsgNode = contentsArray.addObject();
        userMsgNode.put("role", "user");
        userMsgNode.putArray("parts").addObject().put("text", request.getMessage());

        // Gửi request lần 1 tới Gemini
        String responseBody = getRestClient().post()
                .uri(endpoint)
                .contentType(MediaType.APPLICATION_JSON)
                .body(rootNode.toString())
                .retrieve()
                .body(String.class);

        JsonNode responseJson = objectMapper.readTree(responseBody);
        JsonNode candidates = responseJson.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            return null;
        }

        JsonNode firstCandidate = candidates.get(0);
        JsonNode contentParts = firstCandidate.path("content").path("parts");

        String functionName = null;
        JsonNode functionArgs = null;

        for (JsonNode part : contentParts) {
            if (part.has("functionCall")) {
                functionName = part.path("functionCall").path("name").asText();
                functionArgs = part.path("functionCall").path("args");
                break;
            }
        }

        // Nếu LLM yêu cầu Function Call: thực thi tool và gửi kết quả lại cho Gemini
        if (functionName != null) {
            Map<String, Object> toolResult = executeTool(user, household, functionName, functionArgs);

            // Gửi Turn 2: giữ nguyên toàn bộ parts của model từ Turn 1 (bao gồm thoughtSignature, id)
            ObjectNode modelFunctionCallMsg = contentsArray.addObject();
            modelFunctionCallMsg.put("role", "model");
            ArrayNode modelParts = modelFunctionCallMsg.putArray("parts");
            for (JsonNode part : contentParts) {
                modelParts.add(part);
            }

            // Tạo phản hồi kết quả Tool (functionResponse) theo chuẩn Google Gemini API
            ObjectNode userFunctionResponseMsg = contentsArray.addObject();
            userFunctionResponseMsg.put("role", "user");
            ObjectNode funcResponsePart = userFunctionResponseMsg.putArray("parts").addObject().putObject("functionResponse");
            funcResponsePart.put("name", functionName);
            ObjectNode responseContainer = funcResponsePart.putObject("response");
            responseContainer.put("name", functionName);
            responseContainer.set("content", objectMapper.valueToTree(toolResult));

            // Gọi lượt 2 tới Gemini để tổng hợp câu trả lời
            String turn2ResponseBody = getRestClient().post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(rootNode.toString())
                    .retrieve()
                    .body(String.class);

            JsonNode turn2Json = objectMapper.readTree(turn2ResponseBody);
            String finalReply = "";
            JsonNode turn2Candidates = turn2Json.path("candidates");
            if (turn2Candidates.isArray() && !turn2Candidates.isEmpty()) {
                for (JsonNode part : turn2Candidates.get(0).path("content").path("parts")) {
                    if (part.has("text") && StringUtils.hasText(part.path("text").asText())) {
                        finalReply = part.path("text").asText();
                        break;
                    }
                }
            }

            if (!StringUtils.hasText(finalReply)) {
                finalReply = "Dạ, em đã tra cứu số liệu theo yêu cầu của Anh/Chị thành công.";
            }

            ActionMetadata actionMeta = determineActionMetadata(user, functionName, toolResult);

            return ChatbotMessageResponse.builder()
                    .reply(finalReply)
                    .actionType(actionMeta.actionType)
                    .actionLabel(actionMeta.actionLabel)
                    .actionUrl(actionMeta.actionUrl)
                    .geminiPowered(true)
                    .activeModel(targetModel)
                    .dataPayload(toolResult)
                    .suggestedQuestions(getSuggestedFollowUps(user, functionName))
                    .build();
        }

        // Nếu trả lời văn bản trực tiếp
        String textReply = "";
        for (JsonNode part : contentParts) {
            if (part.has("text") && StringUtils.hasText(part.path("text").asText())) {
                textReply = part.path("text").asText();
                break;
            }
        }
        if (!StringUtils.hasText(textReply)) {
            textReply = "Em có thể giúp gì thêm cho Anh/Chị ạ?";
        }
        ActionMetadata directAction = deduceActionFromText(user, request.getMessage());

        return ChatbotMessageResponse.builder()
                .reply(textReply)
                .actionType(directAction.actionType)
                .actionLabel(directAction.actionLabel)
                .actionUrl(directAction.actionUrl)
                .geminiPowered(true)
                .activeModel(targetModel)
                .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                .build();
    }

    /**
     * Thực thi các tool cụ thể để truy vấn cơ sở dữ liệu nội bộ của hộ kinh doanh
     */
    private Map<String, Object> executeTool(User user, BusinessHousehold household, String toolName, JsonNode args) {
        String username = user.getUsername();
        Map<String, Object> result = new HashMap<>();

        // Chốt chặn bảo mật RBAC: Nhân viên bán hàng (VT-02) được phép tra cứu ca trực, khách hàng thân thiết và công nợ bán lẻ theo Epic NCL-10 & QTN-13
        if (isCashier(user)) {
            boolean allowedForCashier = "query_active_shift".equals(toolName)
                    || "query_customers".equals(toolName)
                    || "query_customer_debt".equals(toolName);
            if (!allowedForCashier) {
                result.put("accessDenied", true);
                result.put("message", "Từ chối truy cập: Theo đặc tả hệ thống (QTN-10), Nhân viên bán hàng không có quyền truy cập dữ liệu báo cáo doanh thu tổng, lợi nhuận gộp/giá vốn, định giá toàn kho, công nợ nhà cung cấp hoặc kê khai thuế. Vui lòng liên hệ Chủ hộ hoặc Kế toán viên.");
                return result;
            }
        }

        switch (toolName) {
            case "query_daily_revenue": {
                LocalDate today = LocalDate.now();
                LocalDate fromDate = today;
                LocalDate toDate = today;
                String periodLabel = "Hôm nay";

                String periodArg = args != null && args.has("period") ? args.path("period").asText().trim().toLowerCase() : "";
                int daysArg = args != null && args.has("days") ? args.path("days").asInt() : 0;

                if ("yesterday".equals(periodArg) || daysArg == -1) {
                    fromDate = today.minusDays(1);
                    toDate = fromDate;
                    periodLabel = "Hôm qua";
                } else if ("week".equals(periodArg) || daysArg == 7) {
                    fromDate = today.minusDays(6);
                    periodLabel = "7 ngày gần nhất";
                } else if ("month".equals(periodArg) || daysArg == 30) {
                    fromDate = today.withDayOfMonth(1);
                    periodLabel = "Tháng này";
                }

                List<DailyRevenueProjection> dailyList = reportService.getDailyRevenue(username, fromDate, toDate);
                BigDecimal totalRevenue = BigDecimal.ZERO;
                long totalOrders = 0;
                if (dailyList != null) {
                    for (DailyRevenueProjection item : dailyList) {
                        if (item.getNetRevenue() != null) totalRevenue = totalRevenue.add(item.getNetRevenue());
                        if (item.getOrderCount() != null) totalOrders += item.getOrderCount();
                    }
                }
                result.put("period", periodLabel);
                result.put("fromDate", fromDate.toString());
                result.put("toDate", toDate.toString());
                result.put("totalRevenueVnd", formatVnCurrency(totalRevenue));
                result.put("orderCount", totalOrders);
                result.put("householdName", household.getName());
                break;
            }
            case "query_payment_methods": {
                LocalDate today = LocalDate.now();
                LocalDate fromDate = today;
                LocalDate toDate = today;
                String periodLabel = "Hôm nay";

                if (args != null && args.has("period")) {
                    String p = args.path("period").asText().trim().toLowerCase();
                    if ("yesterday".equals(p)) {
                        fromDate = today.minusDays(1);
                        toDate = fromDate;
                        periodLabel = "Hôm qua";
                    } else if ("week".equals(p)) {
                        fromDate = today.minusDays(6);
                        periodLabel = "7 ngày gần nhất";
                    } else if ("month".equals(p)) {
                        fromDate = today.withDayOfMonth(1);
                        periodLabel = "Tháng này";
                    }
                }

                PaymentMethodReportResponse report = reportService.getPaymentMethodReport(username, fromDate, toDate, null, null);
                BigDecimal totalRev = report != null && report.getTotalRevenue() != null ? report.getTotalRevenue() : BigDecimal.ZERO;
                result.put("period", periodLabel);
                result.put("fromDate", fromDate.toString());
                result.put("toDate", toDate.toString());
                result.put("totalRevenueVnd", formatVnCurrency(totalRev));
                result.put("householdName", household.getName());

                BigDecimal cashAmt = BigDecimal.ZERO;
                BigDecimal bankAmt = BigDecimal.ZERO;
                BigDecimal debtAmt = BigDecimal.ZERO;
                BigDecimal cashPct = BigDecimal.ZERO;
                BigDecimal bankPct = BigDecimal.ZERO;
                BigDecimal debtPct = BigDecimal.ZERO;
                long cashCount = 0L;
                long bankCount = 0L;
                long debtCount = 0L;

                List<Map<String, Object>> methodList = new ArrayList<>();
                if (report != null && report.getMethods() != null) {
                    for (PaymentMethodReportResponse.PaymentMethodStatDto m : report.getMethods()) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("method", m.getMethod());
                        map.put("methodName", m.getMethodName());
                        map.put("totalAmountVnd", formatVnCurrency(m.getTotalAmount()));
                        map.put("percentage", (m.getPercentage() != null ? m.getPercentage() : BigDecimal.ZERO) + "%");
                        map.put("transactionCount", m.getTransactionCount() != null ? m.getTransactionCount() : 0L);
                        methodList.add(map);

                        if ("CASH".equalsIgnoreCase(m.getMethod())) {
                            cashAmt = m.getTotalAmount();
                            cashPct = m.getPercentage();
                            cashCount = m.getTransactionCount();
                        } else if ("BANK_TRANSFER".equalsIgnoreCase(m.getMethod())) {
                            bankAmt = m.getTotalAmount();
                            bankPct = m.getPercentage();
                            bankCount = m.getTransactionCount();
                        } else if ("DEBT".equalsIgnoreCase(m.getMethod())) {
                            debtAmt = m.getTotalAmount();
                            debtPct = m.getPercentage();
                            debtCount = m.getTransactionCount();
                        }
                    }
                }

                result.put("cashAmountVnd", formatVnCurrency(cashAmt));
                result.put("cashPercentage", (cashPct != null ? cashPct : BigDecimal.ZERO) + "%");
                result.put("cashTransactionCount", cashCount);

                result.put("bankTransferAmountVnd", formatVnCurrency(bankAmt));
                result.put("bankTransferPercentage", (bankPct != null ? bankPct : BigDecimal.ZERO) + "%");
                result.put("bankTransferTransactionCount", bankCount);

                result.put("debtAmountVnd", formatVnCurrency(debtAmt));
                result.put("debtPercentage", (debtPct != null ? debtPct : BigDecimal.ZERO) + "%");
                result.put("debtTransactionCount", debtCount);

                result.put("methods", methodList);
                break;
            }
            case "query_gross_profit": {
                LocalDate today = LocalDate.now();
                LocalDate fromDate = today;
                if (args != null && args.has("period") && "month".equalsIgnoreCase(args.path("period").asText())) {
                    fromDate = today.withDayOfMonth(1);
                }
                GrossProfitReportResponse profitReport = reportService.getGrossProfitReport(username, fromDate, today, null);
                GrossProfitReportResponse.GrossProfitSummaryDto summary = profitReport != null ? profitReport.getSummary() : new GrossProfitReportResponse.GrossProfitSummaryDto();
                result.put("fromDate", fromDate.toString());
                result.put("toDate", today.toString());
                result.put("totalNetRevenueVnd", formatVnCurrency(summary.getTotalNetRevenue()));
                result.put("totalCogsVnd", formatVnCurrency(summary.getTotalCogs()));
                result.put("totalGrossProfitVnd", formatVnCurrency(summary.getTotalGrossProfit()));
                result.put("grossProfitMarginPercentage", (summary.getGrossProfitMarginPercentage() != null ? summary.getGrossProfitMarginPercentage() : BigDecimal.ZERO) + "%");
                result.put("householdName", household.getName());
                break;
            }
            case "query_supplier_debt": {
                SupplierDebtSummaryResponse debtSummary = supplierDebtService.getSupplierDebtSummary(username);
                result.put("totalOutstandingDebtVnd", formatVnCurrency(debtSummary.getTotalOutstandingDebt()));
                result.put("totalOverdueDebtVnd", formatVnCurrency(debtSummary.getTotalOverdueDebt()));
                result.put("totalSuppliersWithDebt", debtSummary.getTotalSuppliersWithDebt());
                result.put("householdName", household.getName());

                List<Supplier> suppliers = supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
                List<Map<String, Object>> debtSuppliers = suppliers.stream()
                        .filter(s -> s.getCurrentDebt() != null && s.getCurrentDebt().compareTo(BigDecimal.ZERO) > 0)
                        .sorted((a, b) -> b.getCurrentDebt().compareTo(a.getCurrentDebt()))
                        .map(s -> {
                            Map<String, Object> map = new HashMap<>();
                            map.put("supplierName", s.getName());
                            map.put("phoneNumber", s.getPhoneNumber() != null ? s.getPhoneNumber() : "");
                            map.put("debtAmountVnd", formatVnCurrency(s.getCurrentDebt()));
                            return map;
                        })
                        .collect(Collectors.toList());
                result.put("debtSuppliers", debtSuppliers);
                break;
            }
            case "query_customers": {
                String keyword = args != null && args.has("keyword") ? args.path("keyword").asText().trim() : "";
                boolean vipOnly = args != null && args.has("vipOnly") && args.path("vipOnly").asBoolean();

                List<Customer> allCustomers = customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
                long totalCount = allCustomers.size();
                long vipCount = allCustomers.stream()
                        .filter(c -> Boolean.TRUE.equals(c.getIsVip()) || (c.getDiscountRate() != null && c.getDiscountRate().compareTo(BigDecimal.ZERO) > 0))
                        .count();

                List<Map<String, Object>> customerList = allCustomers.stream()
                        .filter(c -> {
                            if (vipOnly && !Boolean.TRUE.equals(c.getIsVip()) && (c.getDiscountRate() == null || c.getDiscountRate().compareTo(BigDecimal.ZERO) <= 0)) {
                                return false;
                            }
                            if (!keyword.isEmpty()) {
                                String kwLower = keyword.toLowerCase();
                                boolean matchName = c.getName() != null && c.getName().toLowerCase().contains(kwLower);
                                boolean matchPhone = c.getPhoneNumber() != null && c.getPhoneNumber().contains(kwLower);
                                return matchName || matchPhone;
                            }
                            return true;
                        })
                        .sorted((a, b) -> {
                            int vipComp = Boolean.compare(Boolean.TRUE.equals(b.getIsVip()), Boolean.TRUE.equals(a.getIsVip()));
                            if (vipComp != 0) return vipComp;
                            BigDecimal spentA = a.getTotalSpent() != null ? a.getTotalSpent() : BigDecimal.ZERO;
                            BigDecimal spentB = b.getTotalSpent() != null ? b.getTotalSpent() : BigDecimal.ZERO;
                            return spentB.compareTo(spentA);
                        })
                        .limit(10)
                        .map(c -> {
                            Map<String, Object> map = new HashMap<>();
                            map.put("name", c.getName());
                            map.put("phoneNumber", c.getPhoneNumber() != null ? c.getPhoneNumber() : "");
                            map.put("address", c.getAddress() != null ? c.getAddress() : "");
                            map.put("isVip", Boolean.TRUE.equals(c.getIsVip()));
                            map.put("discountRate", (c.getDiscountRate() != null ? c.getDiscountRate() : BigDecimal.ZERO) + "%");
                            map.put("creditLimitVnd", formatVnCurrency(c.getCreditLimit()));
                            map.put("currentDebtVnd", formatVnCurrency(c.getCurrentDebt()));
                            map.put("totalSpentVnd", formatVnCurrency(c.getTotalSpent()));
                            map.put("loyaltyPoints", c.getLoyaltyPoints() != null ? c.getLoyaltyPoints() : 0);
                            return map;
                        })
                        .collect(Collectors.toList());

                result.put("totalCustomers", totalCount);
                result.put("totalVipCustomers", vipCount);
                result.put("matchedCustomersCount", customerList.size());
                result.put("customers", customerList);
                result.put("householdName", household.getName());
                break;
            }
            case "query_customer_debt": {
                DebtSummaryResponse debtSummary = customerDebtService.getDebtSummary(username);
                result.put("totalActiveDebtVnd", formatVnCurrency(debtSummary.getTotalActiveDebt()));
                result.put("totalOverdueDebtVnd", formatVnCurrency(debtSummary.getTotalOverdueDebt()));
                result.put("totalDebtors", debtSummary.getTotalDebtors());
                result.put("householdName", household.getName());

                List<Customer> customers = customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
                List<Map<String, Object>> debtCustomers = customers.stream()
                        .filter(c -> c.getCurrentDebt() != null && c.getCurrentDebt().compareTo(BigDecimal.ZERO) > 0)
                        .sorted((a, b) -> b.getCurrentDebt().compareTo(a.getCurrentDebt()))
                        .map(c -> {
                            Map<String, Object> map = new HashMap<>();
                            map.put("customerName", c.getName());
                            map.put("phoneNumber", c.getPhoneNumber() != null ? c.getPhoneNumber() : "");
                            map.put("debtAmountVnd", formatVnCurrency(c.getCurrentDebt()));
                            return map;
                        })
                        .collect(Collectors.toList());
                result.put("debtCustomers", debtCustomers);
                break;
            }
            case "query_low_stock_products": {
                LowStockWarningListResponse warningResp = inventoryWarningService.getLowStockWarnings(username, null, null, 0, 5);
                List<Map<String, Object>> items = new ArrayList<>();
                int alertCount = 0;
                if (warningResp != null && warningResp.getPage() != null && warningResp.getPage().getContent() != null) {
                    alertCount = (int) warningResp.getPage().getTotalElements();
                    for (LowStockWarningResponse item : warningResp.getPage().getContent()) {
                        Map<String, Object> prod = new HashMap<>();
                        prod.put("name", item.getProductName());
                        prod.put("currentStock", item.getStockQuantity());
                        prod.put("minStock", item.getMinStockQuantity());
                        items.add(prod);
                    }
                }
                result.put("totalAlertCount", alertCount);
                result.put("urgentItems", items);
                break;
            }
            case "query_product_stock": {
                String keyword = args != null && args.has("keyword") ? args.path("keyword").asText().trim() : "";
                List<Product> allProducts = productRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
                List<Map<String, Object>> matchedProducts = allProducts.stream()
                        .filter(p -> (keyword.isEmpty()
                                || (p.getName() != null && p.getName().toLowerCase().contains(keyword.toLowerCase()))
                                || (p.getBarcode() != null && p.getBarcode().toLowerCase().contains(keyword.toLowerCase()))
                                || (p.getSku() != null && p.getSku().toLowerCase().contains(keyword.toLowerCase()))))
                        .limit(8)
                        .map(p -> {
                            Map<String, Object> m = new HashMap<>();
                            m.put("productName", p.getName());
                            m.put("barcode", p.getBarcode() != null ? p.getBarcode() : "");
                            m.put("sku", p.getSku() != null ? p.getSku() : "");
                            m.put("stockQuantity", p.getStockQuantity() != null ? p.getStockQuantity() : BigDecimal.ZERO);
                            m.put("retailPriceVnd", formatVnCurrency(p.getPrice()));
                            if (!isCashier(user)) {
                                m.put("costPriceVnd", formatVnCurrency(p.getCostPrice()));
                            }
                            return m;
                        })
                        .collect(Collectors.toList());
                result.put("keyword", keyword);
                result.put("matchedCount", matchedProducts.size());
                result.put("products", matchedProducts);
                result.put("householdName", household.getName());
                break;
            }
            case "query_inventory_valuation": {
                InventoryValuationReportResponse valuationReport = inventoryValuationReportService.getInventoryValuationReport(username, null, null, null, null, null);
                InventoryValuationSummaryResponse summary = valuationReport != null ? valuationReport.getSummary() : null;
                if (summary != null) {
                    result.put("totalInventoryValueVnd", formatVnCurrency(summary.getTotalInventoryValue()));
                    result.put("totalRetailValueVnd", formatVnCurrency(summary.getTotalRetailValue()));
                    result.put("potentialGrossProfitVnd", formatVnCurrency(summary.getPotentialGrossProfit()));
                    result.put("potentialProfitMargin", (summary.getPotentialProfitMargin() != null ? summary.getPotentialProfitMargin() : BigDecimal.ZERO) + "%");
                    result.put("totalProducts", summary.getTotalProducts() != null ? summary.getTotalProducts() : 0);
                    result.put("valuedProductsCount", summary.getValuedProductsCount() != null ? summary.getValuedProductsCount() : 0);
                    result.put("averageDaysInStock", summary.getAverageDaysInStock() != null ? summary.getAverageDaysInStock() : 0);
                } else {
                    result.put("totalInventoryValueVnd", "0 VNĐ");
                    result.put("totalRetailValueVnd", "0 VNĐ");
                }
                result.put("householdName", household.getName());
                break;
            }
            case "query_active_shift": {
                boolean cashier = isCashier(user);
                List<Shift> openShifts;
                if (cashier) {
                    // Thu ngân (VT-02) chỉ có quyền tra cứu ca trực của chính mình tại quầy được phân công
                    openShifts = shiftRepository.findByUserIdAndStatus(user.getId(), ShiftStatus.OPEN)
                            .map(List::of)
                            .orElseGet(Collections::emptyList);
                    result.put("isCashierScope", true);
                    result.put("scopeNote", "Người dùng là Thu ngân. Theo chính sách phân quyền bảo mật, CHỈ hiển thị ca làm việc của chính nhân viên này tại quầy được phân công. TUYỆT ĐỐI KHÔNG hiển thị ca của nhân viên khác hoặc các chi nhánh/cơ sở khác.");
                } else {
                    List<Shift> allShifts = shiftRepository.findByHouseholdIdOrderByOpenedAtDesc(household.getId());
                    openShifts = allShifts.stream()
                            .filter(s -> s.getStatus() == ShiftStatus.OPEN)
                            .collect(Collectors.toList());
                    result.put("isCashierScope", false);
                }

                result.put("hasActiveShift", !openShifts.isEmpty());
                result.put("totalOpenShifts", openShifts.size());

                if (!openShifts.isEmpty()) {
                    List<Map<String, Object>> shiftList = new ArrayList<>();
                    for (int i = 0; i < openShifts.size(); i++) {
                        Shift s = openShifts.get(i);
                        Map<String, Object> item = new HashMap<>();
                        item.put("orderIndex", i + 1);
                        item.put("shiftId", s.getId());
                        item.put("cashierName", s.getUser() != null ? s.getUser().getFullName() : "Nhân viên");
                        item.put("posName", s.getPointOfSale() != null ? s.getPointOfSale().getName() : "Quầy chính");
                        item.put("openedAt", s.getOpenedAt() != null ? s.getOpenedAt().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy")) : "");
                        item.put("openingCashVnd", formatVnCurrency(s.getOpeningCash()));
                        item.put("closingCashExpectedVnd", formatVnCurrency(s.getClosingCashExpected() != null ? s.getClosingCashExpected() : s.getOpeningCash()));

                        if (s.getOpenedAt() != null && s.getOpenedAt().toLocalDate().isBefore(LocalDate.now())) {
                            item.put("isOpenedPreviousDays", true);
                            item.put("note", "Ca mở từ ngày trước (" + s.getOpenedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ") chưa thực hiện kết ca.");
                        } else {
                            item.put("isOpenedPreviousDays", false);
                        }

                        try {
                            ShiftCashSummaryResponse cashSummary = cashTransactionService.getShiftCashSummary(username, s.getId());
                            if (cashSummary != null) {
                                item.put("cashSalesVnd", formatVnCurrency(cashSummary.getCashSales()));
                                item.put("bankSalesVnd", formatVnCurrency(cashSummary.getBankSales()));
                                item.put("totalSalesVnd", formatVnCurrency(cashSummary.getTotalSales()));
                                item.put("totalApprovedExpenseVnd", formatVnCurrency(cashSummary.getTotalApprovedExpense()));
                                item.put("pendingExpenseCount", cashSummary.getPendingExpenseCount());
                                item.put("expectedCashInDrawerVnd", formatVnCurrency(cashSummary.getCurrentExpectedCash()));
                            }
                        } catch (Exception e) {
                            log.debug("Lấy shift cash summary: {}", e.getMessage());
                        }

                        shiftList.add(item);
                    }
                    result.put("openShifts", shiftList);

                    // Tương thích ngược với các trường đơn lẻ của ca mới nhất
                    Shift latestShift = openShifts.get(0);
                    result.put("cashierName", latestShift.getUser() != null ? latestShift.getUser().getFullName() : "Nhân viên");
                    result.put("posName", latestShift.getPointOfSale() != null ? latestShift.getPointOfSale().getName() : "Quầy chính");
                    result.put("openedAt", latestShift.getOpenedAt() != null ? latestShift.getOpenedAt().toString() : "");
                    result.put("openingCashVnd", formatVnCurrency(latestShift.getOpeningCash()));
                    result.put("closingCashExpectedVnd", formatVnCurrency(latestShift.getClosingCashExpected() != null ? latestShift.getClosingCashExpected() : latestShift.getOpeningCash()));
                } else {
                    result.put("hasActiveShift", false);
                    if (cashier) {
                        result.put("message", "Bạn hiện chưa mở ca làm việc nào. Vui lòng thực hiện thao tác Mở ca trên màn hình POS trước khi bắt đầu bán hàng.");
                    } else {
                        result.put("message", "Hiện tại cửa hàng không có ca bán hàng nào đang mở.");
                    }
                }
                break;
            }
            case "query_annual_revenue": {
                int currentYear = LocalDate.now().getYear();
                if (args != null && args.has("year") && args.path("year").asInt() > 2000) {
                    currentYear = args.path("year").asInt();
                }
                try {
                    AnnualRevenueTrackingResponse tracking = annualRevenueTrackingService.getAnnualRevenueTracking(username, currentYear);
                    if (tracking != null) {
                        result.put("year", currentYear);
                        result.put("cumulativeRevenueVnd", formatVnCurrency(tracking.getCumulativeRevenue()));
                        result.put("mandatoryThresholdVnd", formatVnCurrency(tracking.getMandatoryThreshold()));
                        result.put("thresholdPercentage", (tracking.getThresholdPercentage() != null ? tracking.getThresholdPercentage() : BigDecimal.ZERO) + "%");
                        result.put("validInvoiceCount", tracking.getValidInvoiceCount() != null ? tracking.getValidInvoiceCount() : 0);
                        result.put("warningRevenueAmountVnd", formatVnCurrency(tracking.getWarningRevenueAmount()));
                        result.put("warningThresholdPercentage", (tracking.getWarningThresholdPercentage() != null ? tracking.getWarningThresholdPercentage() : BigDecimal.ZERO) + "%");
                        result.put("status", tracking.getWarningStatus() != null ? tracking.getWarningStatus().name() : "NORMAL");
                    }
                } catch (Exception e) {
                    result.put("year", currentYear);
                    result.put("message", "Chưa có dữ liệu theo dõi doanh thu năm " + currentYear);
                }
                result.put("householdName", household.getName());
                break;
            }
            case "query_einvoice_status":
            case "query_failed_invoices": {
                List<EInvoice> draftList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "DRAFT");
                List<EInvoice> pendingList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "WAITING_TAX_CODE");
                List<EInvoice> errorList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "SEND_ERROR");
                List<EInvoice> issuedList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "ISSUED");
                List<EInvoice> canceledList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "CANCELED");
                List<EInvoice> adjustedList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "ADJUSTED");

                if (draftList != null) {
                    draftList.sort((a, b) -> {
                        if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    });
                }
                if (errorList != null) {
                    errorList.sort((a, b) -> {
                        if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    });
                }

                int draftCount = draftList != null ? draftList.size() : 0;
                int pendingCount = pendingList != null ? pendingList.size() : 0;
                int errorCount = errorList != null ? errorList.size() : 0;
                int issuedCount = issuedList != null ? issuedList.size() : 0;
                int canceledCount = canceledList != null ? canceledList.size() : 0;
                int adjustedCount = adjustedList != null ? adjustedList.size() : 0;
                int totalCount = draftCount + pendingCount + errorCount + issuedCount + canceledCount + adjustedCount;

                result.put("draftCount", draftCount);
                result.put("pendingTransmissionCount", pendingCount);
                result.put("errorInvoiceCount", errorCount);
                result.put("issuedCount", issuedCount);
                result.put("canceledCount", canceledCount);
                result.put("adjustedCount", adjustedCount);
                result.put("totalInvoices", totalCount);

                List<Map<String, Object>> draftDetails = new ArrayList<>();
                if (draftList != null) {
                    for (int i = 0; i < Math.min(draftList.size(), 5); i++) {
                        EInvoice inv = draftList.get(i);
                        Map<String, Object> item = new HashMap<>();
                        item.put("lookupCode", inv.getLookupCode());
                        item.put("buyerName", StringUtils.hasText(inv.getBuyerName()) ? inv.getBuyerName() : "Khách mua lẻ");
                        item.put("finalAmountVnd", formatVnCurrency(inv.getFinalAmount()));
                        item.put("createdAt", inv.getCreatedAt() != null ? inv.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "");
                        draftDetails.add(item);
                    }
                }
                result.put("recentDraftInvoices", draftDetails);

                List<Map<String, Object>> errorDetails = new ArrayList<>();
                if (errorList != null) {
                    for (int i = 0; i < Math.min(errorList.size(), 5); i++) {
                        EInvoice inv = errorList.get(i);
                        Map<String, Object> item = new HashMap<>();
                        item.put("lookupCode", inv.getLookupCode());
                        item.put("buyerName", StringUtils.hasText(inv.getBuyerName()) ? inv.getBuyerName() : "Khách mua lẻ");
                        item.put("finalAmountVnd", formatVnCurrency(inv.getFinalAmount()));
                        item.put("errorResponse", StringUtils.hasText(inv.getTaxAuthorityResponse()) ? inv.getTaxAuthorityResponse() : "Chưa nhận phản hồi từ CQT");
                        errorDetails.add(item);
                    }
                }
                result.put("recentErrorInvoices", errorDetails);
                break;
            }
            case "query_tax_reminders": {
                List<TaxPeriodReminderResponse> reminders = taxReminderService.getActiveReminders(username);
                List<Map<String, Object>> reminderList = new ArrayList<>();
                if (reminders != null) {
                    for (TaxPeriodReminderResponse r : reminders) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("periodName", r.getPeriodName());
                        item.put("filingDeadline", r.getFilingDeadline() != null ? r.getFilingDeadline().toString() : "");
                        item.put("daysRemaining", r.getDaysRemaining());
                        item.put("isOverdue", r.isOverdue());
                        item.put("severity", r.getSeverity());
                        item.put("status", r.getStatus());
                        reminderList.add(item);
                    }
                }
                result.put("activeRemindersCount", reminderList.size());
                result.put("reminders", reminderList);
                break;
            }
            case "query_top_selling_products": {
                LocalDate toDate = LocalDate.now();
                LocalDate fromDate = toDate.minusDays(30);
                List<ProductRevenueProjection> topProds = reportService.getProductRevenue(username, fromDate, toDate, 5);
                List<Map<String, Object>> topList = new ArrayList<>();
                if (topProds != null) {
                    for (ProductRevenueProjection p : topProds) {
                        Map<String, Object> m = new HashMap<>();
                        m.put("productName", p.getProductName());
                        m.put("quantitySold", p.getQuantitySold());
                        m.put("revenueVnd", formatVnCurrency(p.getRevenue()));
                        topList.add(m);
                    }
                }
                result.put("topSellingProducts", topList);
                break;
            }
            case "query_peak_hours": {
                LocalDate toDate = LocalDate.now();
                LocalDate fromDate = toDate.minusDays(30);
                if (args != null && args.has("period")) {
                    String p = args.path("period").asText().trim().toLowerCase();
                    if ("today".equals(p)) {
                        fromDate = toDate;
                    } else if ("week".equals(p)) {
                        fromDate = toDate.minusDays(7);
                    } else if ("month".equals(p)) {
                        fromDate = toDate.withDayOfMonth(1);
                    }
                }
                PeakHoursAndDaysResponse analysis = salesAnalyticsService.getPeakHoursAndDaysAnalysis(username, fromDate, toDate, null);
                PeakSalesInsight insights = analysis != null ? analysis.getInsights() : null;
                if (insights != null) {
                    result.put("peakHourLabel", insights.getPeakHourLabel());
                    result.put("peakHourRevenueVnd", formatVnCurrency(insights.getPeakHourRevenue()));
                    result.put("peakHourOrderCount", insights.getPeakHourOrderCount());
                    result.put("lowestHourLabel", insights.getLowestHourLabel());
                    result.put("lowestHourRevenueVnd", formatVnCurrency(insights.getLowestHourRevenue()));
                    result.put("lowestHourOrderCount", insights.getLowestHourOrderCount());
                    result.put("busiestDayName", insights.getBusiestDayName());
                    result.put("busiestDayRevenueVnd", formatVnCurrency(insights.getBusiestDayRevenue()));
                    result.put("busiestDayOrderCount", insights.getBusiestDayOrderCount());
                    result.put("recommendations", insights.getRecommendations());

                    List<Map<String, Object>> topSlots = new ArrayList<>();
                    if (insights.getTopPeakSlots() != null) {
                        for (PeakSalesInsight.PeakTimeSlot slot : insights.getTopPeakSlots()) {
                            Map<String, Object> sm = new HashMap<>();
                            sm.put("dayName", slot.getDayName());
                            sm.put("hourLabel", slot.getHourLabel());
                            sm.put("orderCount", slot.getOrderCount());
                            sm.put("revenueVnd", formatVnCurrency(slot.getTotalRevenue()));
                            topSlots.add(sm);
                        }
                    }
                    result.put("topPeakSlots", topSlots);
                } else {
                    result.put("message", "Chưa có đủ dữ liệu đơn hàng để phân tích giờ cao điểm trong kỳ này.");
                }
                result.put("fromDate", fromDate.toString());
                result.put("toDate", toDate.toString());
                result.put("householdName", household.getName());
                break;
            }
            default:
                result.put("status", "SUCCESS");
                break;
        }

        return result;
    }

    /**
     * Chế độ dự phòng thông minh (Smart Local Fallback) khi chưa có API Key
     */
    private ChatbotMessageResponse processLocalIntent(User user, BusinessHousehold household, String userMessage, String currentScreen) {
        String lower = userMessage.toLowerCase();

        // 1. Ý định Công nợ Nhà cung cấp (Ưu tiên xử lý khi nhắc tới ncc/nhà cung cấp/phải trả/nợ nhập/gồm những ai)
        boolean isSupplierDebtQuery = lower.contains("nhà cung cấp") || lower.contains("ncc") || lower.contains("nợ nhập")
                || lower.contains("phải trả") || lower.contains("trả nợ ncc") || lower.contains("nợ nhà cc")
                || ((lower.contains("gồm") || lower.contains("những ai") || lower.contains("danh sách") || lower.contains("nợ ai")) && !lower.contains("khách"));

        if (isSupplierDebtQuery) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Theo chính sách bảo mật của cửa hàng, thông tin về **Công nợ Nhà cung cấp** chỉ dành cho **Chủ hộ** và **Kế toán viên**.\n\n" +
                                "Vui lòng liên hệ Chủ hộ hoặc Kế toán nếu bạn cần hỗ trợ thông tin này.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            SupplierDebtSummaryResponse debtSummary = supplierDebtService.getSupplierDebtSummary(user.getUsername());
            List<Supplier> suppliers = supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
            List<Supplier> debtSuppliers = suppliers.stream()
                    .filter(s -> s.getCurrentDebt() != null && s.getCurrentDebt().compareTo(BigDecimal.ZERO) > 0)
                    .sorted((a, b) -> b.getCurrentDebt().compareTo(a.getCurrentDebt()))
                    .collect(Collectors.toList());

            StringBuilder sb = new StringBuilder();
            sb.append("🏢 **Chi Tiết Công Nợ Nhà Cung Cấp Phải Trả**\n\n");
            sb.append(String.format("- **Cửa hàng**: %s\n", household.getName()));
            sb.append(String.format("- **Tổng nợ hiện tại phải trả**: **%s**\n", formatVnCurrency(debtSummary.getTotalOutstandingDebt())));
            sb.append(String.format("- **Số lượng nhà cung cấp đang nợ**: **%d nhà cung cấp**\n\n", debtSuppliers.size()));

            if (!debtSuppliers.isEmpty()) {
                sb.append("**Danh sách chi tiết từng nhà cung cấp:**\n");
                int idx = 1;
                for (Supplier s : debtSuppliers) {
                    String phoneInfo = StringUtils.hasText(s.getPhoneNumber()) ? " - SĐT: " + s.getPhoneNumber() : "";
                    sb.append(String.format("%d. **%s**: **%s**%s\n", idx++, s.getName(), formatVnCurrency(s.getCurrentDebt()), phoneInfo));
                }
                sb.append("\nChủ hộ có thể xem chi tiết từng nhà cung cấp và lập phiếu thanh toán nợ tại danh mục Nhà cung cấp.");
            } else {
                sb.append("✅ Hiện tại cửa hàng không có khoản nợ nào phải trả cho nhà cung cấp.");
            }

            return ChatbotMessageResponse.builder()
                    .reply(sb.toString())
                    .actionType("VIEW_SUPPLIER_DEBT")
                    .actionLabel("Quản Lý Công Nợ Nhà Cung Cấp")
                    .actionUrl("/products/suppliers")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Có khoản nợ nhà cung cấp nào quá hạn không?",
                            "Tổng công nợ khách hàng cần thu",
                            "Báo cáo lợi nhuận gộp hôm nay"
                    ))
                    .build();
        }

        // 2. Ý định Lợi nhuận gộp & Giá vốn
        if (lower.contains("lợi nhuận") || lower.contains("lãi gộp") || lower.contains("giá vốn") || lower.contains("tiền lãi") || lower.contains("tỷ suất lợi nhuận") || lower.contains("lãi bao nhiêu")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Theo chính sách bảo mật nội bộ, báo cáo **Lợi nhuận gộp & Giá vốn hàng bán (COGS)** chỉ dành cho **Chủ hộ** và **Kế toán viên**.\n\n" +
                                "Vui lòng liên hệ Chủ hộ để được hỗ trợ.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            LocalDate today = LocalDate.now();
            GrossProfitReportResponse profitReport = reportService.getGrossProfitReport(user.getUsername(), today, today, null);
            GrossProfitReportResponse.GrossProfitSummaryDto summary = profitReport != null ? profitReport.getSummary() : new GrossProfitReportResponse.GrossProfitSummaryDto();

            String reply = String.format(
                    "📈 **Báo Cáo Lợi Nhuận Gộp Hôm Nay (%s)**\n\n" +
                    "- **Cửa hàng**: %s\n" +
                    "- **Doanh thu thuần**: **%s**\n" +
                    "- **Giá vốn hàng bán (COGS)**: **%s**\n" +
                    "- **Lợi nhuận gộp**: **%s**\n" +
                    "- **Tỷ suất lợi nhuận gộp**: **%s%%**\n\n" +
                    "Chủ hộ có thể xem chi tiết tỷ suất lợi nhuận theo từng sản phẩm tại trang Báo cáo lợi nhuận.",
                    today.toString(),
                    household.getName(),
                    formatVnCurrency(summary.getTotalNetRevenue()),
                    formatVnCurrency(summary.getTotalCogs()),
                    formatVnCurrency(summary.getTotalGrossProfit()),
                    summary.getGrossProfitMarginPercentage() != null ? summary.getGrossProfitMarginPercentage().toString() : "0"
            );

            return ChatbotMessageResponse.builder()
                    .reply(reply)
                    .actionType("VIEW_GROSS_PROFIT")
                    .actionLabel("Xem Báo Cáo Lợi Nhuận Gộp")
                    .actionUrl("/reports/gross-profit")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Báo cáo doanh thu hôm nay",
                            "Tổng định giá toàn bộ kho hàng",
                            "Mặt hàng nào bán chạy nhất?"
                    ))
                    .build();
        }

        // 3. Ý định Báo cáo Định giá kho toàn bộ
        if (lower.contains("giá trị kho") || lower.contains("định giá kho") || lower.contains("tiền hàng trong kho") || lower.contains("kho còn bao nhiêu tiền") || lower.contains("giá trị tồn kho")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Thông tin **Tổng định giá toàn bộ kho hàng theo giá vốn** chỉ dành cho **Chủ hộ** và **Kế toán viên**.\n\n" +
                                "Bạn có thể tra cứu số lượng tồn kho của từng sản phẩm cụ thể.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }
            InventoryValuationReportResponse valuationReport = inventoryValuationReportService.getInventoryValuationReport(user.getUsername(), null, null, null, null, null);
            InventoryValuationSummaryResponse summary = valuationReport != null ? valuationReport.getSummary() : null;

            BigDecimal totalInvValue = summary != null ? summary.getTotalInventoryValue() : BigDecimal.ZERO;
            BigDecimal totalRetailValue = summary != null ? summary.getTotalRetailValue() : BigDecimal.ZERO;
            BigDecimal potProfit = summary != null ? summary.getPotentialGrossProfit() : BigDecimal.ZERO;
            BigDecimal margin = summary != null && summary.getPotentialProfitMargin() != null ? summary.getPotentialProfitMargin() : BigDecimal.ZERO;
            long totalProds = summary != null && summary.getTotalProducts() != null ? summary.getTotalProducts() : 0;

            String reply = String.format(
                    "📦 **Báo Cáo Định Giá Toàn Bộ Kho Hàng**\n\n" +
                    "- **Cửa hàng**: %s\n" +
                    "- **Tổng giá trị kho (theo giá vốn)**: **%s**\n" +
                    "- **Tổng giá trị kho (theo giá bán lẻ)**: **%s**\n" +
                    "- **Lãi gộp tiềm năng**: **%s** (Tỷ suất: **%s%%**)\n" +
                    "- **Tổng số mặt hàng trong kho**: **%d sản phẩm**\n\n" +
                    "Chủ hộ có thể xem phân tích định giá chi tiết theo từng nhóm ngành hàng hoặc xuất tệp Excel tại trang Định giá kho.",
                    household.getName(),
                    formatVnCurrency(totalInvValue),
                    formatVnCurrency(totalRetailValue),
                    formatVnCurrency(potProfit),
                    margin.toString(),
                    totalProds
            );

            return ChatbotMessageResponse.builder()
                    .reply(reply)
                    .actionType("VIEW_INVENTORY_VALUATION")
                    .actionLabel("Xem Báo Cáo Định Giá Kho")
                    .actionUrl("/reports/inventory-valuation")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Có sản phẩm nào sắp hết kho không?",
                            "Báo cáo lợi nhuận gộp hôm nay",
                            "Tổng nợ phải trả nhà cung cấp?"
                    ))
                    .build();
        }

        // 3.9. Ý định thắc mắc phân quyền xem cơ sở / ca trực của Thu ngân
        if (lower.contains("sao là thu ngân") || lower.contains("sao thu ngân") || (lower.contains("thu ngân") && (lower.contains("tất cả các cơ sở") || lower.contains("tất cả cơ sở") || lower.contains("cơ sở khác") || lower.contains("các cơ sở"))) || lower.contains("thu ngân xem được gì")) {
            return ChatbotMessageResponse.builder()
                    .reply("🔒 **Quy Định Phân Quyền Bảo Mật Dành Cho Thu Ngân (VT-02)**\n\n" +
                            "Dạ, theo đúng ma trận phân quyền bảo mật (RBAC) của hệ thống Bán Hàng Việt:\n\n" +
                            "1. **Phạm vi quyền hạn của Nhân viên Thu ngân (VT-02)**:\n" +
                            "   - Chỉ được tra cứu và theo dõi **ca làm việc, doanh thu và tiền két tại quầy của chính mình**.\n" +
                            "   - Được tra cứu tồn kho sản phẩm (giá bán lẻ), danh sách khách hàng thân thiết và công nợ bán lẻ của khách để phục vụ bán hàng tại quầy.\n" +
                            "   - **TUYỆT ĐỐI KHÔNG ĐƯỢC XEM**: Ca trực, két tiền và doanh thu của các nhân viên khác hoặc của các cơ sở/chi nhánh khác trong hộ kinh doanh.\n\n" +
                            "2. **Phạm vi giám sát toàn chuỗi cơ sở**:\n" +
                            "   - Chỉ **Chủ hộ kinh doanh (VT-01)** và **Kế toán (VT-03)** mới có thẩm quyền giám sát tập trung tất cả các ca đang mở và doanh thu của toàn bộ các cơ sở/chi nhánh.\n\n" +
                            "🛡️ Hệ thống đã thiết lập cơ chế **cô lập phạm vi dữ liệu ca trực (Data Scope Isolation)** cho tài khoản Thu ngân của bạn. Từ bây giờ khi bạn hỏi về ca làm việc hoặc tiền két, Trợ lý AI sẽ chỉ hiển thị duy nhất thông tin ca trực tại quầy của bạn.")
                    .actionType(isCashier(user) ? "VIEW_POS" : "NONE")
                    .actionLabel(isCashier(user) ? "Đến Màn Hình POS" : null)
                    .actionUrl(isCashier(user) ? "/pos" : null)
                    .geminiPowered(false)
                    .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                    .build();
        }

        // 4. Ý định Ca làm việc & Tiền trong két / Dòng tiền ca
        if (lower.contains("ca làm việc") || lower.contains("tiền két") || lower.contains("tiền trong két") || lower.contains("ai đang trực") || lower.contains("ca bán hàng") || lower.contains("két tiền") || lower.contains("ca trực") || lower.contains("ca hiện tại") || lower.contains("mấy ca") || lower.contains("3 ca") || lower.contains("bao nhiêu ca") || lower.contains("còn mấy ca")) {
            if (isCashier(user)) {
                // Nếu thu ngân cố tình hỏi về cơ sở khác hoặc tất cả cơ sở
                boolean askingOtherBranches = lower.contains("cơ sở khác") || lower.contains("chi nhánh khác") || lower.contains("tất cả cơ sở") || lower.contains("các cơ sở") || lower.contains("mấy ca") || lower.contains("3 ca") || lower.contains("bao nhiêu ca") || lower.contains("ai đang trực");
                if (askingOtherBranches) {
                    return ChatbotMessageResponse.builder()
                            .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                    "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                    "Theo chính sách bảo mật của cửa hàng, bạn chỉ được phép tra cứu thông tin **ca trực và tiền két tại quầy của chính mình**.\n" +
                                    "Thông tin ca làm việc, doanh thu và nhân sự của **các cơ sở / chi nhánh khác** chỉ dành cho **Chủ hộ kinh doanh** và **Kế toán viên**.\n\n" +
                                    "Vui lòng liên hệ Chủ hộ nếu bạn cần hỗ trợ thông tin liên cơ sở.")
                            .actionType("NONE")
                            .geminiPowered(false)
                            .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                            .build();
                }

                // Thu ngân hỏi về ca của chính mình
                Optional<Shift> myShiftOpt = shiftRepository.findByUserIdAndStatus(user.getId(), ShiftStatus.OPEN);
                if (myShiftOpt.isPresent()) {
                    Shift s = myShiftOpt.get();
                    String posName = s.getPointOfSale() != null ? s.getPointOfSale().getName() : "Quầy thu ngân của bạn";
                    String openedTime = s.getOpenedAt() != null ? s.getOpenedAt().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy")) : "N/A";
                    BigDecimal openingCash = s.getOpeningCash() != null ? s.getOpeningCash() : BigDecimal.ZERO;
                    BigDecimal expectedCash = s.getClosingCashExpected() != null ? s.getClosingCashExpected() : openingCash;

                    StringBuilder shiftSb = new StringBuilder();
                    shiftSb.append("🏪 **Thông Tin Ca Làm Việc Của Bạn**\n\n");
                    shiftSb.append(String.format("- **Nhân viên trực**: **%s**\n", user.getFullName()));
                    shiftSb.append(String.format("- **Cơ sở / Quầy**: **%s**\n", posName));
                    shiftSb.append(String.format("- **Thời gian mở ca**: %s\n", openedTime));
                    shiftSb.append(String.format("- **Tiền quỹ đầu ca**: **%s**\n", formatVnCurrency(openingCash)));
                    shiftSb.append(String.format("- **Tiền dự kiến trong két**: **%s**\n", formatVnCurrency(expectedCash)));

                    try {
                        ShiftCashSummaryResponse cashSummary = cashTransactionService.getShiftCashSummary(user.getUsername(), s.getId());
                        if (cashSummary != null) {
                            shiftSb.append(String.format("- **Doanh thu trong ca**: **%s** (Tiền mặt: %s | Chuyển khoản: %s)\n",
                                    formatVnCurrency(cashSummary.getTotalSales()),
                                    formatVnCurrency(cashSummary.getCashSales()),
                                    formatVnCurrency(cashSummary.getBankSales())));
                            if (cashSummary.getPendingExpenseCount() > 0) {
                                shiftSb.append(String.format("- ⚠️ **Phiếu chi chờ duyệt**: %d phiếu (%s)\n", cashSummary.getPendingExpenseCount(), formatVnCurrency(cashSummary.getTotalPendingExpense())));
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Lấy shift cash summary cashier: {}", e.getMessage());
                    }

                    return ChatbotMessageResponse.builder()
                            .reply(shiftSb.toString())
                            .actionType("VIEW_POS")
                            .actionLabel("Đến Màn Hình Thu Ngân POS")
                            .actionUrl("/pos")
                            .geminiPowered(false)
                            .suggestedQuestions(List.of(
                                    "Phím tắt thanh toán nhanh trên POS",
                                    "Khách hàng thân thiết có những ai?",
                                    "Hướng dẫn đổi trả hàng tại quầy"
                            ))
                            .build();
                } else {
                    return ChatbotMessageResponse.builder()
                            .reply("🏪 **Thông Tin Ca Làm Việc**\n\n" +
                                    "Bạn hiện chưa mở ca làm việc nào trên hệ thống.\n" +
                                    "Vui lòng thực hiện thao tác **Mở ca** trên màn hình POS trước khi bắt đầu thanh toán đơn hàng cho khách.")
                            .actionType("OPEN_SHIFT")
                            .actionLabel("Mở Ca Bán Hàng Ngay")
                            .actionUrl("/pos")
                            .geminiPowered(false)
                            .suggestedQuestions(List.of(
                                    "Phím tắt thanh toán nhanh trên POS",
                                    "Hướng dẫn mở ca thu ngân",
                                    "Danh sách khách hàng thân thiết"
                            ))
                            .build();
                }
            }

            // Đoạn dưới dành cho Chủ hộ / Kế toán (giữ nguyên logic xem tất cả các ca đang mở)
            List<Shift> allShifts = shiftRepository.findByHouseholdIdOrderByOpenedAtDesc(household.getId());
            List<Shift> openShifts = allShifts.stream()
                    .filter(s -> s.getStatus() == ShiftStatus.OPEN)
                    .collect(Collectors.toList());

            String reply;
            if (!openShifts.isEmpty()) {
                StringBuilder shiftSb = new StringBuilder();
                shiftSb.append("🏪 **Tình Trạng Ca Bán Hàng & Tiền Két Quầy**\n\n");
                shiftSb.append(String.format("Dạ, hệ thống ghi nhận cửa hàng hiện tại đang có **%d ca bán hàng đang mở** (chưa kết ca):\n\n", openShifts.size()));

                for (int i = 0; i < openShifts.size(); i++) {
                    Shift s = openShifts.get(i);
                    String cashierName = s.getUser() != null ? s.getUser().getFullName() : "Nhân viên";
                    String posName = s.getPointOfSale() != null ? s.getPointOfSale().getName() : "Quầy chính";
                    String openedTime = s.getOpenedAt() != null ? s.getOpenedAt().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy")) : "N/A";
                    BigDecimal openingCash = s.getOpeningCash() != null ? s.getOpeningCash() : BigDecimal.ZERO;
                    BigDecimal expectedCash = s.getClosingCashExpected() != null ? s.getClosingCashExpected() : openingCash;

                    shiftSb.append(String.format("**%d. Nhân viên: %s**\n", i + 1, cashierName));
                    shiftSb.append(String.format("   - Quầy / Chi nhánh: **%s**\n", posName));
                    shiftSb.append(String.format("   - Thời gian mở ca: **%s**\n", openedTime));
                    shiftSb.append(String.format("   - Tiền mặt đầu ca: **%s**\n", formatVnCurrency(openingCash)));
                    shiftSb.append(String.format("   - Tiền dự kiến trong két: **%s**\n", formatVnCurrency(expectedCash)));

                    try {
                        ShiftCashSummaryResponse cashSummary = cashTransactionService.getShiftCashSummary(user.getUsername(), s.getId());
                        if (cashSummary != null) {
                            shiftSb.append(String.format("   - Doanh thu ca: **%s** (Tiền mặt: %s | Chuyển khoản: %s)\n",
                                    formatVnCurrency(cashSummary.getTotalSales()),
                                    formatVnCurrency(cashSummary.getCashSales()),
                                    formatVnCurrency(cashSummary.getBankSales())));
                            if (cashSummary.getPendingExpenseCount() > 0) {
                                shiftSb.append(String.format("   - ⚠️ Phiếu chi chờ duyệt: **%d phiếu** (%s)\n", cashSummary.getPendingExpenseCount(), formatVnCurrency(cashSummary.getTotalPendingExpense())));
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Lấy shift cash summary local: {}", e.getMessage());
                    }

                    if (s.getOpenedAt() != null && s.getOpenedAt().toLocalDate().isBefore(LocalDate.now())) {
                        shiftSb.append("   - ⚠️ *Ca này mở từ ngày trước chưa được đóng ca.*\n");
                    }
                    shiftSb.append("\n");
                }

                shiftSb.append("Chủ hộ có thể xem chi tiết hoặc thực hiện thao tác **Đóng ca hộ** tại trang Quản lý ca bán hàng.");
                reply = shiftSb.toString();
            } else {
                reply = "🏪 **Tình Trạng Ca Bán Hàng**\n\n" +
                        "Hiện tại cửa hàng không có ca bán hàng nào đang mở. Nhân viên thu ngân cần thực hiện thao tác **Mở ca** trên màn hình POS trước khi bắt đầu thanh toán đơn hàng.";
            }

            return ChatbotMessageResponse.builder()
                    .reply(reply)
                    .actionType("VIEW_SHIFTS")
                    .actionLabel("Xem Quản Lý Ca Bán Hàng")
                    .actionUrl("/shifts")
                    .geminiPowered(false)
                    .suggestedQuestions(isCashier(user)
                            ? getRoleBasedDefaultSuggestions(user)
                            : List.of(
                            "Doanh thu hôm nay bao nhiêu?",
                            "Tổng nợ phải trả nhà cung cấp?",
                            "Kiểm tra hàng sắp hết trong kho"
                    ))
                    .build();
        }

        // 4.1. Ý định Doanh thu cả năm & Giám sát ngưỡng thuế 1 tỷ
        if (lower.contains("doanh thu năm") || lower.contains("ngưỡng 1 tỷ") || lower.contains("ngưỡng thuế") || lower.contains("lũy kế năm") || lower.contains("năm nay bán được")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Thông tin **Doanh thu lũy kế cả năm & Giám sát ngưỡng thuế 1 tỷ** chỉ dành cho **Chủ hộ** và **Kế toán viên**.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            int currentYear = LocalDate.now().getYear();
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📊 **Theo Dõi Doanh Thu Lũy Kế & Ngưỡng Thuế Năm %d**\n\n", currentYear));
            sb.append(String.format("- **Cửa hàng**: %s\n", household.getName()));

            try {
                AnnualRevenueTrackingResponse tracking = annualRevenueTrackingService.getAnnualRevenueTracking(user.getUsername(), currentYear);
                if (tracking != null) {
                    sb.append(String.format("- **Doanh thu lũy kế từ đầu năm**: **%s**\n", formatVnCurrency(tracking.getCumulativeRevenue())));
                    sb.append(String.format("- **Ngưỡng giám sát bắt buộc**: **%s**\n", formatVnCurrency(tracking.getMandatoryThreshold())));
                    sb.append(String.format("- **Tỷ lệ tiến độ**: **%s%%**\n", tracking.getThresholdPercentage() != null ? tracking.getThresholdPercentage().toString() : "0"));
                    sb.append(String.format("- **Số hóa đơn hợp lệ đã cấp mã**: **%d hóa đơn**\n", tracking.getValidInvoiceCount() != null ? tracking.getValidInvoiceCount() : 0));
                    sb.append(String.format("- **Trạng thái cảnh báo**: **%s**\n\n", tracking.getWarningStatus() != null ? tracking.getWarningStatus().name() : "Bình thường"));

                    if (tracking.getThresholdPercentage() != null && tracking.getThresholdPercentage().compareTo(new BigDecimal("80")) >= 0) {
                        sb.append("⚠️ **Khuyến nghị**: Cửa hàng đang tiến sát hoặc vượt ngưỡng doanh thu bắt buộc. Chủ hộ hãy theo dõi sát sao để thực hiện chuẩn hóa sổ sách và kê khai thuế kịp thời.");
                    } else {
                        sb.append("✅ Doanh thu cửa hàng đang trong ngưỡng an toàn, hệ thống tiếp tục tự động theo dõi từng hóa đơn.");
                    }
                }
            } catch (Exception e) {
                sb.append("Dữ liệu theo dõi doanh thu cả năm đang được hệ thống đồng bộ tự động.");
            }

            return ChatbotMessageResponse.builder()
                    .reply(sb.toString())
                    .actionType("VIEW_ANNUAL_TRACKING")
                    .actionLabel("Xem Báo Cáo Doanh Thu Năm")
                    .actionUrl("/reports/annual-revenue")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Hạn nộp tờ khai thuế hộ kinh doanh",
                            "Báo cáo lợi nhuận gộp hôm nay",
                            "Báo cáo doanh thu hôm nay"
                    ))
                    .build();
        }

        // 5. Ý định Hạn nộp thuế & Tờ khai theo Thông tư 88
        if (lower.contains("hạn nộp thuế") || lower.contains("tờ khai thuế") || lower.contains("nhắc thuế") || lower.contains("thuế quý") || lower.contains("thuế tháng") || lower.contains("thông tư 88") || lower.contains("sổ sách kế toán")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Thông tin **Kê khai thuế & Sổ sách kế toán Thông tư 88** chỉ dành cho **Chủ hộ** và **Kế toán viên**.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            List<TaxPeriodReminderResponse> reminders = taxReminderService.getActiveReminders(user.getUsername());

            StringBuilder sb = new StringBuilder();
            sb.append("📑 **Lịch Nhắc Nộp Thuế & Tờ Khai Hộ Kinh Doanh (TT88)**\n\n");
            if (reminders != null && !reminders.isEmpty()) {
                sb.append(String.format("Hiện có **%d kỳ tính thuế** đang có nhắc việc:\n\n", reminders.size()));
                for (TaxPeriodReminderResponse r : reminders) {
                    String statusText = r.isOverdue() ? "⚠️ ĐÃ QUÁ HẠN" : (r.getDaysRemaining() >= 0 ? "Còn " + r.getDaysRemaining() + " ngày" : "Gần hạn");
                    sb.append(String.format("- **%s**: Hạn nộp **%s** (%s) - Trạng thái: %s\n",
                            r.getPeriodName(),
                            r.getFilingDeadline() != null ? r.getFilingDeadline().toString() : "N/A",
                            statusText,
                            r.getStatus()));
                }
                sb.append("\nTheo Thông tư 88/2021/TT-BTC, hộ kinh doanh cần nộp tờ khai định kỳ và lưu trữ đủ 4 sổ sách kế toán bắt buộc.");
            } else {
                sb.append("✅ Hiện tại không có kỳ tính thuế nào bị quá hạn hoặc sắp đến hạn nộp tờ khai.");
            }

            return ChatbotMessageResponse.builder()
                    .reply(sb.toString())
                    .actionType("VIEW_TAX_DECLARATION")
                    .actionLabel("Xem Tờ Khai Thuế TT88")
                    .actionUrl("/reports/tax-declaration")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Quy định 4 sổ sách kế toán theo TT88",
                            "Kiểm tra hóa đơn lỗi gửi Thuế",
                            "Báo cáo doanh thu hôm nay"
                    ))
                    .build();
        }

        // 5.9. Ý định Doanh thu theo Hình thức / Phương thức thanh toán (Tiền mặt, Chuyển khoản, Ghi nợ)
        boolean isPaymentMethodQuery = lower.contains("phương thức") || lower.contains("hình thức thanh toán")
                || lower.contains("tiền khoản")
                || (lower.contains("tiền mặt") && (lower.contains("chuyển khoản") || lower.contains("khoản") || lower.contains("ghi nợ") || lower.contains("nợ") || lower.contains("bao nhiêu")))
                || (lower.contains("chuyển khoản") && (lower.contains("tiền mặt") || lower.contains("bao nhiêu") || lower.contains("doanh thu")))
                || (lower.contains("ghi nợ") && lower.contains("bao nhiêu") && !lower.contains("nhà cung cấp") && !lower.contains("ncc"));

        if (isPaymentMethodQuery) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Báo cáo tổng hợp **Doanh thu theo phương thức thanh toán toàn cửa hàng** chỉ dành cho **Chủ hộ** và **Kế toán viên**.\n\n" +
                                "Bạn có thể tra cứu doanh thu tiền mặt và chuyển khoản trong **ca trực của chính mình** bằng cách hỏi: *'Tình trạng ca bán hàng & tiền két'*.")
                        .actionType("VIEW_SHIFTS")
                        .actionLabel("Xem Ca Bán Hàng Của Tôi")
                        .actionUrl("/shifts")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            LocalDate today = LocalDate.now();
            LocalDate fromDate = today;
            LocalDate toDate = today;
            String periodLabel = "Hôm nay";

            if (lower.contains("hôm qua") || lower.contains("qua")) {
                fromDate = today.minusDays(1);
                toDate = fromDate;
                periodLabel = "Hôm qua";
            } else if (lower.contains("tuần") || lower.contains("7 ngày")) {
                fromDate = today.minusDays(6);
                periodLabel = "7 ngày gần nhất";
            } else if (lower.contains("tháng")) {
                fromDate = today.withDayOfMonth(1);
                periodLabel = "Tháng này";
            }

            PaymentMethodReportResponse report = reportService.getPaymentMethodReport(user.getUsername(), fromDate, toDate, null, null);
            BigDecimal totalRev = report != null && report.getTotalRevenue() != null ? report.getTotalRevenue() : BigDecimal.ZERO;

            BigDecimal cashAmt = BigDecimal.ZERO;
            BigDecimal bankAmt = BigDecimal.ZERO;
            BigDecimal debtAmt = BigDecimal.ZERO;
            BigDecimal cashPct = BigDecimal.ZERO;
            BigDecimal bankPct = BigDecimal.ZERO;
            BigDecimal debtPct = BigDecimal.ZERO;
            long cashCount = 0L;
            long bankCount = 0L;
            long debtCount = 0L;

            if (report != null && report.getMethods() != null) {
                for (PaymentMethodReportResponse.PaymentMethodStatDto m : report.getMethods()) {
                    if ("CASH".equalsIgnoreCase(m.getMethod())) {
                        cashAmt = m.getTotalAmount();
                        cashPct = m.getPercentage();
                        cashCount = m.getTransactionCount();
                    } else if ("BANK_TRANSFER".equalsIgnoreCase(m.getMethod())) {
                        bankAmt = m.getTotalAmount();
                        bankPct = m.getPercentage();
                        bankCount = m.getTransactionCount();
                    } else if ("DEBT".equalsIgnoreCase(m.getMethod())) {
                        debtAmt = m.getTotalAmount();
                        debtPct = m.getPercentage();
                        debtCount = m.getTransactionCount();
                    }
                }
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("💳 **Báo Cáo Doanh Thu Theo Phương Thức Thanh Toán %s**\n\n", periodLabel));
            sb.append(String.format("- **Cửa hàng**: %s\n", household.getName()));
            sb.append(String.format("- **Thời gian**: %s\n", fromDate.equals(toDate) ? fromDate.toString() : fromDate + " đến " + toDate));
            sb.append(String.format("- **Tổng doanh thu**: **%s**\n\n", formatVnCurrency(totalRev)));
            sb.append("**Chi tiết từng phương thức thanh toán:**\n");
            sb.append(String.format("1. 💵 **Tiền mặt**: **%s** (%s - %d giao dịch)\n",
                    formatVnCurrency(cashAmt), (cashPct != null ? cashPct : BigDecimal.ZERO) + "%", cashCount));
            sb.append(String.format("2. 📲 **Chuyển khoản (VietQR / Ngân hàng)**: **%s** (%s - %d giao dịch)\n",
                    formatVnCurrency(bankAmt), (bankPct != null ? bankPct : BigDecimal.ZERO) + "%", bankCount));
            sb.append(String.format("3. 📝 **Bán hàng Ghi nợ**: **%s** (%s - %d giao dịch)\n\n",
                    formatVnCurrency(debtAmt), (debtPct != null ? debtPct : BigDecimal.ZERO) + "%", debtCount));
            sb.append("Chủ hộ có thể xem biểu đồ trực quan và xu hướng doanh thu theo ngày tại mục Báo cáo hình thức thanh toán.");

            return ChatbotMessageResponse.builder()
                    .reply(sb.toString())
                    .actionType("VIEW_PAYMENT_METHODS")
                    .actionLabel("Xem Báo Cáo Phương Thức Thanh Toán")
                    .actionUrl("/reports/payment-methods")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Báo cáo doanh thu hôm nay",
                            "Báo cáo lợi nhuận gộp hôm nay",
                            "Tình trạng ca bán hàng & tiền két"
                    ))
                    .build();
        }

        // 6. Ý định Doanh thu linh hoạt (Hôm nay / Hôm qua / Tuần này / Tháng này)
        if (lower.contains("doanh thu") || lower.contains("bán được") || lower.contains("tiền bán") || lower.contains("doanh số")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Báo cáo tổng hợp **Doanh thu toàn bộ cửa hàng** chỉ dành cho **Chủ hộ** và **Kế toán viên**.\n\n" +
                                "Bạn có thể tra cứu doanh thu và tiền két trong **ca trực của chính mình** bằng cách hỏi: *'Tình trạng ca bán hàng & tiền két'*.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            LocalDate today = LocalDate.now();
            LocalDate fromDate = today;
            LocalDate toDate = today;
            String periodLabel = "Hôm nay";

            if (lower.contains("hôm qua") || lower.contains("qua")) {
                fromDate = today.minusDays(1);
                toDate = fromDate;
                periodLabel = "Hôm qua";
            } else if (lower.contains("tuần") || lower.contains("7 ngày")) {
                fromDate = today.minusDays(6);
                periodLabel = "7 ngày gần nhất";
            } else if (lower.contains("tháng")) {
                fromDate = today.withDayOfMonth(1);
                periodLabel = "Tháng này";
            }

            List<DailyRevenueProjection> dailyList = reportService.getDailyRevenue(user.getUsername(), fromDate, toDate);
            BigDecimal totalRevenue = BigDecimal.ZERO;
            long totalOrders = 0;
            if (dailyList != null) {
                for (DailyRevenueProjection item : dailyList) {
                    if (item.getNetRevenue() != null) totalRevenue = totalRevenue.add(item.getNetRevenue());
                    if (item.getOrderCount() != null) totalOrders += item.getOrderCount();
                }
            }

            String reply = String.format(
                    "📊 **Báo Cáo Doanh Thu %s (%s)**\n\n" +
                    "- **Cửa hàng**: %s\n" +
                    "- **Tổng doanh thu**: **%s**\n" +
                    "- **Số đơn hàng đã bán**: **%d đơn**\n\n" +
                    "Bạn có thể bấm vào liên kết bên dưới để xem biểu đồ chi tiết và phân tích theo mặt hàng.",
                    periodLabel,
                    fromDate.equals(toDate) ? fromDate.toString() : fromDate + " đến " + toDate,
                    household.getName(),
                    formatVnCurrency(totalRevenue),
                    totalOrders
            );

            return ChatbotMessageResponse.builder()
                    .reply(reply)
                    .actionType("VIEW_REPORT")
                    .actionLabel("Xem Chi Tiết Báo Cáo Doanh Thu")
                    .actionUrl("/reports/revenue")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Báo cáo lợi nhuận gộp hôm nay",
                            "Có sản phẩm nào sắp hết kho không?",
                            "Tổng nợ phải trả nhà cung cấp?"
                    ))
                    .build();
        }

        // 6.1. Ý định Tra cứu tồn kho sản phẩm cụ thể
        if (lower.contains("còn bao nhiêu") || lower.contains("tìm hàng") || lower.contains("tìm sản phẩm") || lower.contains("tra cứu hàng") || lower.contains("tồn kho của") || lower.contains("kiểm tra hàng")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Theo phân quyền của cửa hàng, thông tin về **Số lượng tồn kho sản phẩm** thuộc thẩm quyền quản trị của **Chủ hộ** và **Kế toán viên**.\n\n" +
                                "Tại quầy POS, bạn có thể quét mã vạch barcode hoặc tìm kiếm tên sản phẩm trên màn hình POS để kiểm tra giá bán lẻ và thanh toán đơn hàng cho khách.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            String cleanKw = lower.replace("còn bao nhiêu", "")
                    .replace("tìm hàng", "")
                    .replace("tìm sản phẩm", "")
                    .replace("tra cứu hàng", "")
                    .replace("tồn kho của", "")
                    .replace("kiểm tra hàng", "")
                    .replace("sản phẩm", "")
                    .replace("mặt hàng", "")
                    .replace("trong kho", "")
                    .replace("cửa hàng", "")
                    .replace("hàng", "")
                    .replace("còn", "")
                    .replace("không", "")
                    .replace("?", "")
                    .trim();

            List<Product> allProducts = productRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
            List<Product> matched = allProducts.stream()
                    .filter(p -> (!cleanKw.isEmpty()
                            && ((p.getName() != null && p.getName().toLowerCase().contains(cleanKw))
                            || (p.getBarcode() != null && p.getBarcode().toLowerCase().contains(cleanKw))
                            || (p.getSku() != null && p.getSku().toLowerCase().contains(cleanKw)))))
                    .limit(5)
                    .collect(Collectors.toList());

            StringBuilder prodSb = new StringBuilder();
            prodSb.append("🔍 **Kết Quả Tra Cứu Tồn Kho Sản Phẩm**\n\n");
            if (!matched.isEmpty()) {
                prodSb.append(String.format("Tìm thấy **%d mặt hàng** phù hợp với từ khóa '*%s*':\n\n", matched.size(), cleanKw));
                int idx = 1;
                for (Product p : matched) {
                    BigDecimal stock = p.getStockQuantity() != null ? p.getStockQuantity() : BigDecimal.ZERO;
                    String stockStatus = stock.compareTo(BigDecimal.ZERO) <= 0 ? "❌ HẾT HÀNG" : String.format("còn **%s**", stock);
                    prodSb.append(String.format("%d. **%s**\n", idx++, p.getName()));
                    prodSb.append(String.format("   - Tồn kho: %s\n", stockStatus));
                    if (isCashier(user)) {
                        prodSb.append(String.format("   - Giá bán lẻ: **%s**\n", formatVnCurrency(p.getPrice())));
                    } else {
                        prodSb.append(String.format("   - Giá bán: **%s** | Giá vốn: **%s**\n", formatVnCurrency(p.getPrice()), formatVnCurrency(p.getCostPrice())));
                    }
                    if (StringUtils.hasText(p.getBarcode())) {
                        prodSb.append(String.format("   - Mã vạch: `%s`\n", p.getBarcode()));
                    }
                }
            } else {
                prodSb.append(String.format("Không tìm thấy sản phẩm nào khớp với từ khóa '*%s*' trong kho của %s.\n\nChủ hộ có thể tra cứu đầy đủ tại danh mục Sản phẩm.", cleanKw, household.getName()));
            }

            return ChatbotMessageResponse.builder()
                    .reply(prodSb.toString())
                    .actionType("VIEW_PRODUCTS")
                    .actionLabel("Xem Danh Mục Sản Phẩm")
                    .actionUrl("/products")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Tổng định giá toàn bộ kho hàng",
                            "Có sản phẩm nào sắp hết kho không?",
                            "Báo cáo lợi nhuận gộp hôm nay"
                    ))
                    .build();
        }

        // 7. Ý định Cảnh báo Tồn kho & Mặt hàng cần nhập
        if (lower.contains("tồn kho") || lower.contains("hết hàng") || lower.contains("sắp hết") || lower.contains("cảnh báo kho") || lower.contains("nhập hàng") || lower.contains("cần nhập") || lower.contains("bán chạy")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Thông tin về **Cảnh báo tồn kho tối thiểu, hàng sắp hết & Kế hoạch nhập hàng** chỉ dành cho **Chủ hộ** và **Kế toán viên**.\n\n" +
                                "Vui lòng liên hệ Chủ hộ hoặc Kế toán nếu bạn cần hỗ trợ kiểm tra nguồn hàng.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            LowStockWarningListResponse warningResp = inventoryWarningService.getLowStockWarnings(user.getUsername(), null, null, 0, 5);
            int totalAlerts = 0;
            if (warningResp != null && warningResp.getPage() != null) {
                totalAlerts = (int) warningResp.getPage().getTotalElements();
            }

            StringBuilder sb = new StringBuilder();
            sb.append("⚠️ **Cảnh Báo Tồn Kho Cửa Hàng**\n\n");
            if (totalAlerts > 0) {
                sb.append(String.format("Hiện có **%d mặt hàng** đang chạm hoặc dưới mức tồn kho tối thiểu an toàn:\n\n", totalAlerts));
                if (warningResp.getPage() != null && warningResp.getPage().getContent() != null) {
                    for (LowStockWarningResponse item : warningResp.getPage().getContent()) {
                        sb.append(String.format("- **%s**: Tồn hiện tại **%s**, định mức an toàn **%s**\n",
                                item.getProductName(), item.getStockQuantity(), item.getMinStockQuantity()));
                    }
                }
                sb.append("\nBạn nên tạo phiếu nhập hàng sớm để tránh bị đứt gãy nguồn hàng tại quầy bán.");
            } else {
                sb.append("✅ Tất cả các mặt hàng trong kho hiện đều ở mức tồn an toàn, chưa có cảnh báo thiếu hàng.");
            }

            return ChatbotMessageResponse.builder()
                    .reply(sb.toString())
                    .actionType("VIEW_INVENTORY")
                    .actionLabel("Mở Bảng Cảnh Báo Tồn Kho")
                    .actionUrl("/products/inventory-warnings")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Tổng định giá toàn bộ kho hàng",
                            "Tổng nợ phải trả nhà cung cấp?",
                            "Tạo phiếu nhập hàng mới"
                    ))
                    .build();
        }

        // 8. Ý định Hóa đơn điện tử & Lỗi thuế
        if (lower.contains("hóa đơn") || lower.contains("thuế") || lower.contains("lỗi") || lower.contains("tt78") || lower.contains("thay thế") || lower.contains("hủy")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Tài khoản của bạn đang có vai trò **Nhân viên bán hàng / Thu ngân**.\n" +
                                "Báo cáo tổng hợp **Hóa đơn điện tử toàn hộ & Lỗi gửi Cơ quan Thuế** chỉ dành cho **Chủ hộ** và **Kế toán viên**.\n\n" +
                                "Bạn có thể kiểm tra các hóa đơn do chính mình lập tại màn hình Bán hàng hoặc Quản lý hóa đơn.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            List<EInvoice> draftList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "DRAFT");
            List<EInvoice> pendingList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "WAITING_TAX_CODE");
            List<EInvoice> errorList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "SEND_ERROR");
            List<EInvoice> issuedList = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull(household.getId(), "ISSUED");

            int draftCount = draftList != null ? draftList.size() : 0;
            int pendingCount = pendingList != null ? pendingList.size() : 0;
            int errorCount = errorList != null ? errorList.size() : 0;
            int issuedCount = issuedList != null ? issuedList.size() : 0;

            String reply;
            if (lower.contains("nháp")) {
                StringBuilder sb = new StringBuilder();
                sb.append(String.format("🧾 **Tình Trạng Hóa Đơn Bản Nháp (DRAFT)**\n\n" +
                        "Hệ thống ghi nhận hiện tại cửa hàng **%s** đang có **%d hóa đơn bản nháp** chưa phát hành/chưa gửi CQT.\n\n" +
                        "- **Hóa đơn bản nháp (DRAFT)**: **%d hóa đơn**\n" +
                        "- **Đã cấp mã thuế thành công**: **%d hóa đơn**\n" +
                        "- **Chờ truyền Cơ quan Thuế**: **%d hóa đơn**\n" +
                        "- **Hóa đơn bị lỗi / từ chối**: **%d hóa đơn**\n\n",
                        household.getName(), draftCount, draftCount, issuedCount, pendingCount, errorCount));

                if (draftList != null && !draftList.isEmpty()) {
                    draftList.sort((a, b) -> {
                        if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    });
                    sb.append("**Các hóa đơn nháp gần nhất:**\n");
                    for (int i = 0; i < Math.min(draftList.size(), 3); i++) {
                        EInvoice d = draftList.get(i);
                        sb.append(String.format("- Mã tra cứu: **%s** | Khách: %s | Số tiền: **%s**\n",
                                d.getLookupCode(),
                                StringUtils.hasText(d.getBuyerName()) ? d.getBuyerName() : "Khách mua lẻ",
                                formatVnCurrency(d.getFinalAmount())));
                    }
                    sb.append("\nAnh/Chị có thể bấm nút bên dưới để chuyển đến màn hình Quản lý Hóa đơn để kiểm tra và ký số phát hành.");
                }
                reply = sb.toString();
            } else {
                reply = String.format(
                        "🧾 **Trạng Thái Hóa Đơn Điện Tử (Thông tư 78)**\n\n" +
                        "- **Hóa đơn bản nháp (DRAFT)**: **%d hóa đơn**\n" +
                        "- **Đã cấp mã thuế thành công**: **%d hóa đơn**\n" +
                        "- **Chờ truyền Cơ quan Thuế**: **%d hóa đơn**\n" +
                        "- **Hóa đơn bị lỗi / từ chối**: **%d hóa đơn**\n\n" +
                        "**Quy định xử lý sai sót theo TT78/NĐ123:**\n" +
                        "1. *Hóa đơn chưa gửi cho khách*: Thực hiện hủy hóa đơn và lập hóa đơn mới.\n" +
                        "2. *Hóa đơn đã gửi cho khách có sai sót*: Lập biên bản sai sót và chọn **Xuất hóa đơn điều chỉnh** hoặc **Hóa đơn thay thế**.",
                        draftCount, issuedCount, pendingCount, errorCount
                );
            }

            return ChatbotMessageResponse.builder()
                    .reply(reply)
                    .actionType("VIEW_INVOICES")
                    .actionLabel("Quản Lý Danh Sách Hóa Đơn")
                    .actionUrl("/e-invoices")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Hạn nộp tờ khai thuế hộ kinh doanh",
                            "Quy định 4 sổ sách kế toán theo TT88",
                            "Doanh thu hôm nay bao nhiêu?"
                    ))
                    .build();
        }

        // 8.6. Ý định Giờ cao điểm / Phân tích thời gian bán chạy
        if (lower.contains("giờ cao điểm") || lower.contains("khung giờ") || lower.contains("giờ nào") || lower.contains("đông khách") || lower.contains("vắng khách") || lower.contains("ngày bán chạy")) {
            if (isCashier(user)) {
                return ChatbotMessageResponse.builder()
                        .reply("🔒 **Thông Báo Phân Quyền Bảo Mật**\n\n" +
                                "Báo cáo phân tích **Giờ cao điểm & Xu hướng bán hàng** thuộc thẩm quyền của **Chủ hộ** và **Kế toán viên**.\n" +
                                "Bạn có thể kiểm tra doanh thu ca trực của mình tại màn hình Ca bán hàng.")
                        .actionType("NONE")
                        .geminiPowered(false)
                        .suggestedQuestions(getRoleBasedDefaultSuggestions(user))
                        .build();
            }

            LocalDate toDate = LocalDate.now();
            LocalDate fromDate = toDate.minusDays(30);
            PeakHoursAndDaysResponse analysis = salesAnalyticsService.getPeakHoursAndDaysAnalysis(user.getUsername(), fromDate, toDate, null);
            PeakSalesInsight insights = analysis != null ? analysis.getInsights() : null;

            StringBuilder sb = new StringBuilder();
            sb.append("⏰ **Phân Tích Khung Giờ Cao Điểm & Ngày Bán Chạy**\n\n");
            if (insights != null && insights.getPeakHourLabel() != null) {
                sb.append(String.format("- **Khung giờ cao điểm nhất trong ngày**: **%s** (Doanh thu: **%s**, Số đơn: **%d đơn**)\n",
                        insights.getPeakHourLabel(), formatVnCurrency(insights.getPeakHourRevenue()), insights.getPeakHourOrderCount()));
                sb.append(String.format("- **Ngày bán chạy nhất trong tuần**: **%s** (Doanh thu: **%s**, Số đơn: **%d đơn**)\n",
                        insights.getBusiestDayName(), formatVnCurrency(insights.getBusiestDayRevenue()), insights.getBusiestDayOrderCount()));
                sb.append(String.format("- **Khung giờ vắng khách nhất**: **%s**\n\n", insights.getLowestHourLabel()));

                if (insights.getRecommendations() != null && !insights.getRecommendations().isEmpty()) {
                    sb.append("**💡 Khuyến nghị tối ưu vận hành:**\n");
                    for (String r : insights.getRecommendations()) {
                        sb.append(String.format("- %s\n", r));
                    }
                }
            } else {
                sb.append("Chưa có đủ dữ liệu đơn hàng trong kỳ để phân tích khung giờ cao điểm.");
            }

            return ChatbotMessageResponse.builder()
                    .reply(sb.toString())
                    .actionType("VIEW_PEAK_HOURS")
                    .actionLabel("Xem Phân Tích Giờ Cao Điểm")
                    .actionUrl("/reports/peak-hours")
                    .geminiPowered(false)
                    .suggestedQuestions(List.of(
                            "Báo cáo doanh thu hôm nay",
                            "Mặt hàng nào bán chạy nhất?",
                            "Tình trạng ca bán hàng & tiền két"
                    ))
                    .build();
        }

        // 8.5. Ý định Khách hàng thân thiết / Tra cứu khách quen (Epic NCL-10 - Cho phép CẢ 3 VAI TRÒ)
        boolean isCustomerLoyaltyQuery = (lower.contains("thân thiết") || lower.contains("khách quen") || lower.contains("khách vip")
                || lower.contains("mấy khách") || lower.contains("bao nhiêu khách") || lower.contains("danh sách khách")
                || lower.contains("tìm khách") || lower.contains("hồ sơ khách") || lower.contains("thông tin khách")
                || lower.contains("khách hàng"))
                && !lower.contains("công nợ") && !lower.contains("nợ") && !lower.contains("quá hạn");

        if (isCustomerLoyaltyQuery) {
            List<Customer> customers = customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
            long totalCount = customers.size();
            long vipCount = customers.stream()
                    .filter(c -> Boolean.TRUE.equals(c.getIsVip()) || (c.getDiscountRate() != null && c.getDiscountRate().compareTo(BigDecimal.ZERO) > 0))
                    .count();

            StringBuilder sb = new StringBuilder();
            sb.append("👥 **Danh Sách Khách Hàng Thân Thiết & Ưu Đãi (NCL-10)**\n\n");
            sb.append(String.format("- **Cửa hàng**: %s\n", household.getName()));
            sb.append(String.format("- **Tổng số khách hàng thân thiết**: **%d khách hàng**\n", totalCount));
            sb.append(String.format("- **Khách hàng VIP / có chiết khấu**: **%d khách hàng**\n\n", vipCount));

            if (!customers.isEmpty()) {
                sb.append("**Danh sách khách hàng tiêu biểu:**\n");
                List<Customer> sorted = customers.stream()
                        .sorted((a, b) -> {
                            int vipComp = Boolean.compare(Boolean.TRUE.equals(b.getIsVip()), Boolean.TRUE.equals(a.getIsVip()));
                            if (vipComp != 0) return vipComp;
                            BigDecimal spentA = a.getTotalSpent() != null ? a.getTotalSpent() : BigDecimal.ZERO;
                            BigDecimal spentB = b.getTotalSpent() != null ? b.getTotalSpent() : BigDecimal.ZERO;
                            return spentB.compareTo(spentA);
                        })
                        .limit(8)
                        .collect(Collectors.toList());

                int idx = 1;
                for (Customer c : sorted) {
                    String vipTag = Boolean.TRUE.equals(c.getIsVip()) ? " (⭐ VIP" : "";
                    String discTag = c.getDiscountRate() != null && c.getDiscountRate().compareTo(BigDecimal.ZERO) > 0
                            ? (vipTag.isEmpty() ? String.format(" (Ưu đãi -%s%%)", c.getDiscountRate()) : String.format(" -%s%%)", c.getDiscountRate()))
                            : (vipTag.isEmpty() ? "" : ")");
                    String badge = vipTag + (vipTag.endsWith(")") ? "" : discTag);
                    String phoneInfo = StringUtils.hasText(c.getPhoneNumber()) ? " - SĐT: `" + c.getPhoneNumber() + "`" : "";
                    BigDecimal debt = c.getCurrentDebt() != null ? c.getCurrentDebt() : BigDecimal.ZERO;
                    String debtInfo = debt.compareTo(BigDecimal.ZERO) > 0 ? " | Dư nợ: " + formatVnCurrency(debt) : "";
                    sb.append(String.format("%d. **%s**%s%s (Hạn mức nợ: %s%s)\n",
                            idx++, c.getName(), badge, phoneInfo, formatVnCurrency(c.getCreditLimit()), debtInfo));
                }
                sb.append("\nBạn có thể xem đầy đủ danh sách, thiết lập hạn mức nợ hoặc thêm khách hàng mới tại màn hình Khách hàng.");
            } else {
                sb.append("Chưa có hồ sơ khách hàng nào trong hệ thống. Bạn có thể thêm khách hàng mới tại trang Khách hàng.");
            }

            return ChatbotMessageResponse.builder()
                    .reply(sb.toString())
                    .actionType("VIEW_CUSTOMERS")
                    .actionLabel("Xem Danh Sách Khách Hàng")
                    .actionUrl("/customers")
                    .geminiPowered(false)
                    .suggestedQuestions(isCashier(user)
                            ? List.of(
                            "Kiểm tra hạn mức nợ của khách hàng",
                            "Tình trạng ca bán hàng & tiền két hiện tại?",
                            "Phím tắt thanh toán nhanh trên POS"
                    )
                            : List.of(
                            "Tổng công nợ khách hàng cần thu",
                            "Doanh thu hôm nay",
                            "Báo cáo lợi nhuận gộp hôm nay"
                    ))
                    .build();
        }

        // 9. Ý định Công nợ Khách hàng (Epic NCL-10 & QTN-13)
        if (lower.contains("công nợ") || lower.contains("nợ") || lower.contains("khách nợ") || lower.contains("quá hạn")) {
            DebtSummaryResponse debtSummary = customerDebtService.getDebtSummary(user.getUsername());
            List<Customer> customers = customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
            List<Customer> debtCustomers = customers.stream()
                    .filter(c -> c.getCurrentDebt() != null && c.getCurrentDebt().compareTo(BigDecimal.ZERO) > 0)
                    .sorted((a, b) -> b.getCurrentDebt().compareTo(a.getCurrentDebt()))
                    .collect(Collectors.toList());

            StringBuilder sb = new StringBuilder();
            if (isCashier(user)) {
                sb.append("💰 **Danh Sách Khách Hàng Ghi Nợ Tại Quầy (QTN-13)**\n\n");
                sb.append(String.format("- **Cửa hàng**: %s\n", household.getName()));
                sb.append(String.format("- **Số lượng khách đang có nợ**: **%d khách hàng**\n", debtCustomers.size()));
                sb.append("- **Quy tắc QTN-13**: Chỉ được bán ghi nợ cho khách đã có hồ sơ và tổng nợ trong hạn mức cho phép.\n\n");
            } else {
                sb.append("💰 **Chi Tiết Công Nợ Khách Hàng Cần Thu**\n\n");
                sb.append(String.format("- **Tổng nợ hiện tại**: **%s**\n", formatVnCurrency(debtSummary.getTotalActiveDebt())));
                sb.append(String.format("- **Nợ đã quá hạn thanh toán**: **%s**\n", formatVnCurrency(debtSummary.getTotalOverdueDebt())));
                sb.append(String.format("- **Số lượng khách nợ**: **%d khách hàng**\n\n", debtSummary.getTotalDebtors()));
            }

            if (!debtCustomers.isEmpty()) {
                sb.append("**Danh sách khách hàng đang có công nợ:**\n");
                int idx = 1;
                for (Customer c : debtCustomers) {
                    String phoneInfo = StringUtils.hasText(c.getPhoneNumber()) ? " - SĐT: `" + c.getPhoneNumber() + "`" : "";
                    String limitInfo = c.getCreditLimit() != null ? " (Hạn mức: " + formatVnCurrency(c.getCreditLimit()) + ")" : "";
                    sb.append(String.format("%d. **%s**: **%s**%s%s\n", idx++, c.getName(), formatVnCurrency(c.getCurrentDebt()), limitInfo, phoneInfo));
                }
                sb.append("\nBạn có thể thu nợ hoặc kiểm tra chi tiết tại màn hình Khách hàng & Công nợ.");
            } else {
                sb.append("✅ Hiện tại không có khách hàng nào đang nợ cửa hàng.");
            }

            return ChatbotMessageResponse.builder()
                    .reply(sb.toString())
                    .actionType("VIEW_DEBT")
                    .actionLabel("Quản Lý Sổ Nợ Khách Hàng")
                    .actionUrl("/customers")
                    .geminiPowered(false)
                    .suggestedQuestions(isCashier(user)
                            ? List.of(
                            "Có mấy khách hàng thân thiết?",
                            "Tình trạng ca bán hàng & tiền két hiện tại?",
                            "Phím tắt thanh toán nhanh trên POS"
                    )
                            : List.of(
                            "Tổng nợ phải trả nhà cung cấp?",
                            "Doanh thu hôm nay",
                            "Báo cáo lợi nhuận gộp hôm nay"
                    ))
                    .build();
        }

        // 10. Mặc định: Chào hỏi & Giới thiệu theo vai trò
        String tipText = StringUtils.hasText(geminiApiKey)
                ? "*(💡 Bạn có thể hỏi em tự nhiên bằng ngôn ngữ thông thường hoặc bấm Micro để nói)*"
                : "*(💡 Mẹo: Bạn có thể cấu hình Gemini API Key trong cài đặt để em trả lời thông minh và đàm thoại tự nhiên hơn nữa!)*";

        String welcomeReply;
        List<String> welcomeSuggestions;

        if (isAccountant(user)) {
            welcomeReply = String.format(
                    "Xin chào Anh/Chị **%s**! Em là **Trợ lý AI Bán Hàng Việt** đồng hành cùng nghiệp vụ Kế toán & Thuế của **%s**.\n\n" +
                    "Em được cấu hình đầy đủ phân quyền để hỗ trợ Anh/Chị quản lý sổ sách và tài chính:\n" +
                    "1. 📑 **Thuế & Sổ sách Thông tư 88**: Kiểm tra lịch nhắc nộp tờ khai và quy định 4 sổ sách kế toán bắt buộc.\n" +
                    "2. 🧾 **Hóa đơn điện tử Thông tư 78**: Theo dõi hóa đơn chờ cấp mã, hóa đơn lỗi truyền thuế và xử lý sai sót.\n" +
                    "3. 🏢 **Công nợ Nhà cung cấp & Khách hàng**: Tra cứu nợ phải trả, nợ phải thu và danh sách đối tác nợ chi tiết.\n" +
                    "4. 📈 **Lợi nhuận gộp & Giá vốn**: Báo cáo doanh thu thuần, giá vốn hàng bán (COGS) và tỷ suất lợi nhuận gộp.\n" +
                    "5. 📊 **Doanh thu lũy kế & Ngưỡng 1 tỷ**: Giám sát tiến độ doanh thu năm so với ngưỡng quản lý thuế bắt buộc.\n" +
                    "6. 📦 **Định giá tổng kho**: Báo cáo tổng giá trị hàng tồn kho theo giá vốn và giá bán lẻ.\n\n" +
                    "%s",
                    user.getFullName(),
                    household.getName(),
                    tipText
            );
            welcomeSuggestions = List.of(
                    "Hạn nộp tờ khai thuế hộ kinh doanh?",
                    "Tổng nợ phải trả cho nhà cung cấp hiện tại?",
                    "Báo cáo lợi nhuận gộp hôm nay",
                    "Doanh thu năm nay và tiến độ ngưỡng thuế 1 tỷ",
                    "Tổng công nợ khách hàng cần thu"
            );
        } else if (isCashier(user)) {
            welcomeReply = String.format(
                    "Xin chào **%s**! Em là **Trợ lý AI Bán Hàng Việt** hỗ trợ Bán hàng tại quầy POS cho **%s**.\n\n" +
                    "Em có thể hỗ trợ bạn nhanh các nghiệp vụ quầy và ca trực:\n" +
                    "1. 🏪 **Ca trực & Tiền két**: Kiểm tra tiền mặt đầu ca, tiền dự kiến trong két và doanh thu ca hiện tại.\n" +
                    "2. ⚡ **Phím tắt POS nhanh**: Phím tắt F9 thanh toán nhanh, tìm kiếm sản phẩm và thanh toán VietQR.\n" +
                    "3. 🧾 **Hóa đơn máy tính tiền**: Quy trình xuất hóa đơn khởi tạo từ máy tính tiền ngay cho khách.\n" +
                    "4. 🔄 **Đổi trả hàng tại quầy**: Quy trình tiếp nhận đổi trả sản phẩm cho khách lẻ.\n\n" +
                    "%s",
                    user.getFullName(),
                    household.getName(),
                    tipText
            );
            welcomeSuggestions = getRoleBasedDefaultSuggestions(user);
        } else {
            welcomeReply = String.format(
                    "Xin chào **%s**! Em là **Trợ lý AI Bán Hàng Việt** - Quản trị số toàn năng cho Chủ hộ kinh doanh.\n\n" +
                    "Em được cấu hình đầy đủ quyền truy cập để hỗ trợ Anh/Chị quản lý toàn diện cửa hàng **%s**:\n" +
                    "1. 📊 **Doanh thu & Lợi nhuận gộp**: Tra cứu doanh thu, giá vốn COGS, lãi gộp và tỷ suất sinh lời hôm nay/tháng này.\n" +
                    "2. 🏢 **Công nợ 2 chiều**: Quản lý **Nợ nhà cung cấp phải trả** & **Nợ khách hàng phải thu**.\n" +
                    "3. 📦 **Kho vận & Định giá**: Cảnh báo hàng sắp hết, tổng định giá kho hàng theo giá vốn và giá bán lẻ.\n" +
                    "4. 🏪 **Ca bán hàng & Tiền két**: Kiểm tra nhân viên trực ca và tiền mặt thực tế trong két quầy POS.\n" +
                    "5. 🧾 **Hóa đơn & Thuế**: Tra cứu hóa đơn lỗi TT78, lịch nhắc nộp tờ khai thuế Thông tư 88.\n" +
                    "6. 🎙️ **Hỗ trợ giọng nói**: Bấm nút Micro để hỏi nhanh mọi lúc mọi nơi.\n\n" +
                    "%s",
                    user.getFullName(),
                    household.getName(),
                    tipText
            );
            welcomeSuggestions = List.of(
                    "Tổng nợ phải trả nhà cung cấp?",
                    "Báo cáo lợi nhuận gộp hôm nay",
                    "Báo cáo doanh thu hôm nay",
                    "Tổng định giá toàn bộ kho hàng",
                    "Kiểm tra ca trực & tiền trong két"
            );
        }

        return ChatbotMessageResponse.builder()
                .reply(welcomeReply)
                .actionType("NONE")
                .geminiPowered(false)
                .suggestedQuestions(welcomeSuggestions)
                .build();
    }

    private static class ActionMetadata {
        String actionType;
        String actionLabel;
        String actionUrl;

        ActionMetadata(String actionType, String actionLabel, String actionUrl) {
            this.actionType = actionType;
            this.actionLabel = actionLabel;
            this.actionUrl = actionUrl;
        }
    }

    private List<String> getRoleBasedDefaultSuggestions(User user) {
        if (isCashier(user)) {
            return List.of(
                    "Có mấy khách hàng thân thiết?",
                    "Tình trạng ca bán hàng & tiền két hiện tại?",
                    "Phím tắt thanh toán nhanh trên POS",
                    "Quy trình xuất hóa đơn máy tính tiền ngay"
            );
        } else if (isAccountant(user)) {
            return List.of(
                    "Báo cáo lợi nhuận gộp hôm nay",
                    "Tổng nợ phải trả cho nhà cung cấp hiện tại?",
                    "Doanh thu năm nay và tiến độ ngưỡng thuế 1 tỷ",
                    "Hạn nộp tờ khai thuế hộ kinh doanh quý này?"
            );
        } else {
            return List.of(
                    "Báo cáo doanh thu hôm nay",
                    "Báo cáo lợi nhuận gộp hôm nay",
                    "Tổng nợ phải trả nhà cung cấp hiện tại?",
                    "Tổng giá trị hàng tồn trong kho?"
            );
        }
    }

    private ActionMetadata determineActionMetadata(User user, String functionName, Map<String, Object> toolResult) {
        if (toolResult != null && Boolean.TRUE.equals(toolResult.get("accessDenied"))) {
            return new ActionMetadata("NONE", null, null);
        }
        if (isCashier(user)) {
            if ("query_active_shift".equals(functionName)) {
                return new ActionMetadata("VIEW_SHIFTS", "Xem Ca Bán Hàng Của Tôi", "/shifts");
            }
            if ("query_customers".equals(functionName)) {
                return new ActionMetadata("VIEW_CUSTOMERS", "Xem Danh Sách Khách Hàng", "/customers");
            }
            if ("query_customer_debt".equals(functionName)) {
                return new ActionMetadata("VIEW_DEBT", "Xem Quản Lý Công Nợ Khách Hàng", "/customers");
            }
            return new ActionMetadata("NONE", null, null);
        }

        switch (functionName) {
            case "query_customers":
                return new ActionMetadata("VIEW_CUSTOMERS", "Xem Danh Sách Khách Hàng", "/customers");
            case "query_payment_methods":
                return new ActionMetadata("VIEW_PAYMENT_METHODS", "Xem Báo Cáo Phương Thức Thanh Toán", "/reports/payment-methods");
            case "query_daily_revenue":
                return new ActionMetadata("VIEW_REPORT", "Xem Báo Cáo Doanh Thu", "/reports/revenue");
            case "query_gross_profit":
                return new ActionMetadata("VIEW_GROSS_PROFIT", "Xem Báo Cáo Lợi Nhuận Gộp", "/reports/gross-profit");
            case "query_supplier_debt":
                return new ActionMetadata("VIEW_SUPPLIER_DEBT", "Xem Công Nợ Nhà Cung Cấp", "/products/suppliers");
            case "query_customer_debt":
                return new ActionMetadata("VIEW_DEBT", "Xem Quản Lý Công Nợ Khách Hàng", "/customers");
            case "query_low_stock_products":
                return new ActionMetadata("VIEW_INVENTORY", "Xem Cảnh Báo Tồn Kho", "/products/inventory-warnings");
            case "query_inventory_valuation":
                return new ActionMetadata("VIEW_INVENTORY_VALUATION", "Xem Báo Cáo Định Giá Kho", "/reports/inventory-valuation");
            case "query_active_shift":
                return new ActionMetadata("VIEW_SHIFTS", "Xem Quản Lý Ca Bán Hàng", "/shifts");
            case "query_product_stock":
                return new ActionMetadata("VIEW_PRODUCTS", "Xem Danh Mục Sản Phẩm", "/products");
            case "query_annual_revenue":
                return new ActionMetadata("VIEW_ANNUAL_TRACKING", "Xem Báo Cáo Doanh Thu Năm", "/reports/annual-revenue");
            case "query_einvoice_status":
            case "query_failed_invoices":
                return new ActionMetadata("VIEW_INVOICES", "Xem Danh Sách Hóa Đơn", "/e-invoices");
            case "query_peak_hours":
                return new ActionMetadata("VIEW_PEAK_HOURS", "Xem Phân Tích Giờ Cao Điểm", "/reports/peak-hours");
            case "query_tax_reminders":
                return new ActionMetadata("VIEW_TAX_DECLARATION", "Xem Tờ Khai Thuế TT88", "/reports/tax-declaration");
            case "query_top_selling_products":
                return new ActionMetadata("VIEW_REPORT", "Xem Báo Cáo Mặt Hàng", "/reports/products");
            default:
                return new ActionMetadata("NONE", null, null);
        }
    }

    private ActionMetadata deduceActionFromText(User user, String userMessage) {
        String lower = userMessage.toLowerCase();
        if (isCashier(user)) {
            if (lower.contains("ca") || lower.contains("tiền két") || lower.contains("két")) {
                return new ActionMetadata("VIEW_SHIFTS", "Xem Ca Bán Hàng Của Tôi", "/shifts");
            }
            if (lower.contains("thân thiết") || lower.contains("khách quen") || lower.contains("khách vip") || (lower.contains("khách hàng") && !lower.contains("nợ"))) {
                return new ActionMetadata("VIEW_CUSTOMERS", "Xem Danh Sách Khách Hàng", "/customers");
            }
            if (lower.contains("nợ") || lower.contains("công nợ")) {
                return new ActionMetadata("VIEW_DEBT", "Xem Quản Lý Công Nợ Khách Hàng", "/customers");
            }
            if (lower.contains("bán hàng") || lower.contains("pos") || lower.contains("thanh toán")) {
                return new ActionMetadata("VIEW_POS", "Đến Màn Hình Bán Hàng (POS)", "/pos");
            }
            return new ActionMetadata("NONE", null, null);
        }

        if (lower.contains("thân thiết") || lower.contains("khách quen") || lower.contains("khách vip") || (lower.contains("khách hàng") && !lower.contains("nợ"))) {
            return new ActionMetadata("VIEW_CUSTOMERS", "Xem Danh Sách Khách Hàng", "/customers");
        }
        if (lower.contains("nhà cung cấp") || lower.contains("ncc") || lower.contains("phải trả")) {
            return new ActionMetadata("VIEW_SUPPLIER_DEBT", "Xem Công Nợ Nhà Cung Cấp", "/products/suppliers");
        }
        if (lower.contains("lợi nhuận") || lower.contains("lãi gộp") || lower.contains("giá vốn")) {
            return new ActionMetadata("VIEW_GROSS_PROFIT", "Xem Báo Cáo Lợi Nhuận Gộp", "/reports/gross-profit");
        }
        if (lower.contains("định giá kho") || lower.contains("giá trị kho")) {
            return new ActionMetadata("VIEW_INVENTORY_VALUATION", "Xem Báo Cáo Định Giá Kho", "/reports/inventory-valuation");
        }
        if (lower.contains("doanh thu năm") || lower.contains("ngưỡng 1 tỷ") || lower.contains("ngưỡng thuế") || lower.contains("lũy kế năm")) {
            return new ActionMetadata("VIEW_ANNUAL_TRACKING", "Xem Doanh Thu Năm & Ngưỡng Thuế", "/reports/annual-revenue");
        }
        if (lower.contains("ca") || lower.contains("tiền két") || lower.contains("két")) {
            return new ActionMetadata("VIEW_SHIFTS", "Xem Quản Lý Ca Bán Hàng", "/shifts");
        }
        if (lower.contains("bán chạy") || lower.contains("mặt hàng")) {
            return new ActionMetadata("VIEW_REPORT", "Xem Báo Cáo Mặt Hàng", "/reports/products");
        }
        if (lower.contains("phương thức") || lower.contains("hình thức thanh toán") || lower.contains("tiền khoản")
                || (lower.contains("tiền mặt") && (lower.contains("chuyển khoản") || lower.contains("khoản") || lower.contains("nợ")))
                || (lower.contains("chuyển khoản") && lower.contains("bao nhiêu"))) {
            return new ActionMetadata("VIEW_PAYMENT_METHODS", "Xem Báo Cáo Phương Thức Thanh Toán", "/reports/payment-methods");
        }
        if (lower.contains("doanh thu") || lower.contains("bán")) {
            return new ActionMetadata("VIEW_REPORT", "Xem Báo Cáo Doanh Thu", "/reports/revenue");
        }
        if (lower.contains("còn bao nhiêu") || lower.contains("tìm hàng") || lower.contains("tìm sản phẩm")) {
            return new ActionMetadata("VIEW_PRODUCTS", "Xem Danh Mục Sản Phẩm", "/products");
        }
        if (lower.contains("kho") || lower.contains("tồn")) {
            return new ActionMetadata("VIEW_INVENTORY", "Xem Cảnh Báo Tồn Kho", "/products/inventory-warnings");
        }
        if (lower.contains("giờ cao điểm") || lower.contains("khung giờ") || lower.contains("giờ nào") || lower.contains("ngày bán chạy")) {
            return new ActionMetadata("VIEW_PEAK_HOURS", "Xem Phân Tích Giờ Cao Điểm", "/reports/peak-hours");
        }
        if (lower.contains("hạn nộp thuế") || lower.contains("tờ khai") || lower.contains("tt88")) {
            return new ActionMetadata("VIEW_TAX_DECLARATION", "Xem Tờ Khai Thuế TT88", "/reports/tax-declaration");
        }
        if (lower.contains("hóa đơn") || lower.contains("thuế")) {
            return new ActionMetadata("VIEW_INVOICES", "Quản Lý Hóa Đơn Điện Tử", "/e-invoices");
        }
        if (lower.contains("nợ")) {
            return new ActionMetadata("VIEW_DEBT", "Quản Lý Công Nợ", "/customers");
        }
        return new ActionMetadata("NONE", null, null);
    }

    private List<String> getSuggestedFollowUps(User user, String functionName) {
        if (isCashier(user)) {
            return getRoleBasedDefaultSuggestions(user);
        }
        if (isAccountant(user)) {
            switch (functionName) {
                case "query_supplier_debt":
                    return List.of("Có khoản nợ nhà cung cấp nào quá hạn?", "Tổng công nợ khách hàng cần thu", "Báo cáo lợi nhuận gộp hôm nay");
                case "query_gross_profit":
                    return List.of("Báo cáo doanh thu hôm nay", "Tổng định giá toàn bộ kho hàng", "Doanh thu năm nay và tiến độ ngưỡng thuế 1 tỷ");
                case "query_inventory_valuation":
                    return List.of("Có sản phẩm nào sắp hết kho không?", "Tổng nợ phải trả nhà cung cấp?", "Báo cáo lợi nhuận gộp hôm nay");
                case "query_active_shift":
                    return List.of("Báo cáo doanh thu hôm nay", "Tổng nợ phải trả nhà cung cấp?", "Báo cáo lợi nhuận gộp hôm nay");
                case "query_tax_reminders":
                    return List.of("Kiểm tra hóa đơn lỗi chưa gửi Thuế", "Quy định 4 sổ sách kế toán theo TT88", "Báo cáo doanh thu hôm nay");
                case "query_daily_revenue":
                    return List.of("Báo cáo lợi nhuận gộp hôm nay", "Mặt hàng nào bán chạy nhất?", "Có sản phẩm nào sắp hết kho?");
                case "query_low_stock_products":
                    return List.of("Tổng định giá toàn bộ kho hàng", "Tổng nợ phải trả nhà cung cấp?", "Tạo phiếu nhập hàng mới");
                case "query_product_stock":
                    return List.of("Tổng định giá toàn bộ kho hàng", "Có mặt hàng nào sắp hết kho không?", "Mặt hàng nào bán chạy nhất?");
                case "query_annual_revenue":
                    return List.of("Hạn nộp tờ khai thuế quý này?", "Báo cáo lợi nhuận gộp hôm nay", "Báo cáo doanh thu hôm nay");
                case "query_einvoice_status":
                case "query_failed_invoices":
                    return List.of("Cách hủy hóa đơn có sai sót TT78", "Hạn nộp tờ khai thuế hộ kinh doanh", "Báo cáo doanh thu hôm nay");
                case "query_peak_hours":
                    return List.of("Báo cáo doanh thu hôm nay", "Mặt hàng nào bán chạy nhất?", "Kiểm tra ca trực & tiền két");
                case "query_customer_debt":
                    return List.of("Tổng nợ phải trả nhà cung cấp?", "Gửi tin nhắn nhắc nợ khách hàng", "Báo cáo doanh thu hôm nay");
                default:
                    return List.of("Tổng nợ phải trả nhà cung cấp?", "Báo cáo lợi nhuận gộp hôm nay", "Doanh thu năm nay và tiến độ ngưỡng thuế 1 tỷ");
            }
        }
        // Chủ hộ (VT-01)
        switch (functionName) {
            case "query_peak_hours":
                return List.of("Báo cáo doanh thu hôm nay", "Mặt hàng nào bán chạy nhất?", "Kiểm tra ca trực & tiền két");
            case "query_einvoice_status":
            case "query_failed_invoices":
                return List.of("Có bao nhiêu hóa đơn nháp?", "Kiểm tra hóa đơn lỗi chưa gửi Thuế", "Báo cáo doanh thu hôm nay");
            case "query_supplier_debt":
                return List.of("Có khoản nợ nhà cung cấp nào quá hạn?", "Tổng công nợ khách hàng cần thu", "Báo cáo lợi nhuận gộp hôm nay");
            case "query_gross_profit":
                return List.of("Báo cáo doanh thu hôm nay", "Tổng định giá toàn bộ kho hàng", "Mặt hàng nào bán chạy nhất?");
            case "query_inventory_valuation":
                return List.of("Có sản phẩm nào sắp hết kho không?", "Tổng nợ phải trả nhà cung cấp?", "Báo cáo lợi nhuận gộp hôm nay");
            case "query_active_shift":
                return List.of("Doanh thu hôm nay bao nhiêu?", "Kiểm tra hàng sắp hết trong kho", "Tổng nợ phải trả nhà cung cấp?");
            case "query_tax_reminders":
                return List.of("Kiểm tra hóa đơn lỗi chưa gửi Thuế", "Quy định 4 sổ sách kế toán theo TT88", "Báo cáo doanh thu hôm nay");
            case "query_payment_methods":
                return List.of("Báo cáo doanh thu hôm nay", "Báo cáo lợi nhuận gộp hôm nay", "Tình trạng ca bán hàng & tiền két");
            case "query_daily_revenue":
                return List.of("Báo cáo lợi nhuận gộp hôm nay", "Mặt hàng nào bán chạy nhất?", "Có sản phẩm nào sắp hết kho?");
            default:
                return List.of("Tổng nợ phải trả nhà cung cấp?", "Báo cáo lợi nhuận gộp hôm nay", "Báo cáo doanh thu hôm nay");
        }
    }
}

