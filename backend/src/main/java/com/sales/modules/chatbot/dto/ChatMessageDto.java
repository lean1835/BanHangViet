package com.sales.modules.chatbot.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private String role; // "user" or "model" or "assistant"
    private String text;
}
