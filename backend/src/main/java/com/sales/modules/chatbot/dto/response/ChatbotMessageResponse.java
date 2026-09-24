package com.sales.modules.chatbot.dto.response;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotMessageResponse {
    private String reply;
    private String actionType; // NONE, NAVIGATE, VIEW_REPORT, VIEW_INVENTORY, VIEW_INVOICES, VIEW_DEBT
    private String actionLabel; // Nhãn hiển thị trên thẻ hành động (e.g. "Xem báo cáo doanh thu")
    private String actionUrl;   // Đường dẫn chuyển tiếp trong ứng dụng
    private boolean geminiPowered; // Đánh dấu phản hồi từ Gemini LLM hay Fallback nội bộ
    private String activeModel;    // Tên model AI thực tế đã phản hồi (e.g. "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "local-rules-engine")
    private Map<String, Object> dataPayload; // Dữ liệu tóm tắt đính kèm nếu có
    private List<String> suggestedQuestions; // Câu hỏi gợi ý tiếp theo
}
