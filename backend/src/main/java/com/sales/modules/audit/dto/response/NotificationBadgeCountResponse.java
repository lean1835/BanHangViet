package com.sales.modules.audit.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationBadgeCountResponse {
    private long unreadCount;
    private long unclosedCount;
    private long dangerCount;
    private long warningCount;
}
