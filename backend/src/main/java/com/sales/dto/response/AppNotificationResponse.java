package com.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppNotificationResponse {
    private String id;
    private String notificationType;
    private String severity;
    private String title;
    private String message;
    private String actionUrl;
    private String targetType;
    private String targetId;
    private String metadata;
    private Boolean isRead;
    private LocalDateTime readAt;
    private Boolean isClosed;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
}
