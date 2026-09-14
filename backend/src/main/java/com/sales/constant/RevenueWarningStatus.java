package com.sales.constant;

public enum RevenueWarningStatus {
    BELOW_WARNING,       // Dưới mức cảnh báo (< 80%)
    WARNING_TRIGGERED,   // Chạm hoặc vượt mức cảnh báo do chủ hộ đặt (>= 80% và < 100%)
    EXCEEDED,            // Đã vượt ngưỡng bắt buộc 1 tỷ đồng (>= 100%)
    ALREADY_MANDATORY    // Hộ đã thuộc diện bắt buộc từ đầu năm (TC-03: không hiện cảnh báo)
}
