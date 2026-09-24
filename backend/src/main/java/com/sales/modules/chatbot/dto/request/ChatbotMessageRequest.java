package com.sales.modules.chatbot.dto.request;
import com.sales.modules.chatbot.dto.ChatMessageDto;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotMessageRequest {
    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String message;

    private String currentScreen; // Đường dẫn màn hình hiện tại (e.g. "/pos", "/invoices", "/reports")

    private List<ChatMessageDto> history; // Lịch sử hội thoại gần nhất
}
