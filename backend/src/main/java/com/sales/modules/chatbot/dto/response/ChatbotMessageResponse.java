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
    private String actionType;
    private String actionLabel;
    private String actionUrl;
    private boolean geminiPowered;
    private String activeModel;
    private Map<String, Object> dataPayload;
    private List<String> suggestedQuestions;
}
