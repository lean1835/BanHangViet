package com.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingItemResponse {
    private String notificationType;
    private String title;                // Tên hiển thị dễ hiểu (ví dụ: "Cảnh báo hóa đơn gửi lỗi")
    private String description;          // Mô tả ngắn gọn nghĩa vụ phát sinh
    private String category;             // Phân nhóm: "HÓA ĐƠN", "CÔNG NỢ", "KHO HÀNG", "THUẾ & DOANH THU", "HỆ THỐNG"
    private Boolean isEnabled;           // Đang bật hay tắt
    private Boolean isMandatory;         // Bắt buộc bật không thể tắt (ví dụ HĐĐT lỗi)
}
