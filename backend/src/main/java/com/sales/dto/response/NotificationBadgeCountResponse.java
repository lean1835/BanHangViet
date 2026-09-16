package com.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationBadgeCountResponse {
    private long unreadCount;     // Số thông báo chưa đọc (isRead = false AND isClosed = false)
    private long unclosedCount;   // Tổng số việc chưa xử lý xong (isClosed = false)
    private long dangerCount;     // Số việc mức độ DANGER chưa xử lý
    private long warningCount;    // Số việc mức độ WARNING chưa xử lý
}
