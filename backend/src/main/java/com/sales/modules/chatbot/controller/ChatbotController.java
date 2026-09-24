package com.sales.modules.chatbot.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.chatbot.dto.request.ChatbotMessageRequest;
import com.sales.modules.chatbot.dto.response.ChatbotMessageResponse;
import com.sales.modules.chatbot.dto.response.ChatbotSuggestionResponse;
import com.sales.modules.chatbot.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/message")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<ChatbotMessageResponse>> sendMessage(
            Principal principal,
            @Valid @RequestBody ChatbotMessageRequest request) {
        ChatbotMessageResponse response = chatbotService.processMessage(principal.getName(), request);
        return ResponseEntity.ok(
                ApiResponse.<ChatbotMessageResponse>builder()
                        .code(1000)
                        .message("Xử lý tin nhắn chatbot thành công")
                        .result(response)
                        .build()
        );
    }

    @GetMapping("/quick-suggestions")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<List<ChatbotSuggestionResponse>>> getQuickSuggestions(
            Principal principal,
            @RequestParam(value = "screen", required = false) String screen) {
        List<ChatbotSuggestionResponse> response = chatbotService.getQuickSuggestions(principal.getName(), screen);
        return ResponseEntity.ok(
                ApiResponse.<List<ChatbotSuggestionResponse>>builder()
                        .code(1000)
                        .message("Lấy danh sách gợi ý thành công")
                        .result(response)
                        .build()
        );
    }
}
