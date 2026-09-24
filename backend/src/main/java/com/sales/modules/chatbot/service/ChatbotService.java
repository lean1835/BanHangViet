package com.sales.modules.chatbot.service;
import com.sales.modules.chatbot.dto.request.ChatbotMessageRequest;
import com.sales.modules.chatbot.dto.response.ChatbotMessageResponse;
import com.sales.modules.chatbot.dto.response.ChatbotSuggestionResponse;

import java.util.List;

public interface ChatbotService {
    ChatbotMessageResponse processMessage(String currentUsername, ChatbotMessageRequest request);
    List<ChatbotSuggestionResponse> getQuickSuggestions(String currentUsername, String currentScreen);
}
