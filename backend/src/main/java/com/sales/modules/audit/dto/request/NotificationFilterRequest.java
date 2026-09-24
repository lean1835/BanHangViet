package com.sales.modules.audit.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationFilterRequest {
    private String severity;         // INFO, WARNING, DANGER (null = tất cả)
    private String notificationType; // Mã loại thông báo (null = tất cả)
    private Boolean isRead;          // true: đã đọc, false: chưa đọc, null: tất cả
    private Boolean isClosed;        // true: đã đóng, false: đang mở, null: mặc định false (chỉ lấy việc chưa đóng)
    private String search;           // Tìm kiếm từ khóa theo title hoặc message
}
