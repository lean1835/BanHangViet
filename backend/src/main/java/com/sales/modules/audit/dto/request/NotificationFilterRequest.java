package com.sales.modules.audit.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationFilterRequest {
    private String severity;
    private String notificationType;
    private Boolean isRead;
    private Boolean isClosed;
    private String search;
}
