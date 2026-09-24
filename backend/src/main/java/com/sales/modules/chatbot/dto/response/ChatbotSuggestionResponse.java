package com.sales.modules.chatbot.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotSuggestionResponse {
    private String category;
    private List<String> suggestions;
}
