package com.sales.constant;

import java.math.BigDecimal;

public final class RevenueThresholdConstants {
    private RevenueThresholdConstants() {}

    /** Ngưỡng doanh thu năm bắt buộc áp dụng HĐĐT theo QTN-01: 1.000.000.000 VNĐ */
    public static final BigDecimal MANDATORY_REVENUE_THRESHOLD = new BigDecimal("1000000000.00");

    /** Tỷ lệ phần trăm cảnh báo mặc định: 80.00% (tương đương 800.000.000 VNĐ) */
    public static final BigDecimal DEFAULT_WARNING_PERCENTAGE = new BigDecimal("80.00");

    /** Tỷ lệ cảnh báo tối thiểu cho phép cấu hình: 50.00% */
    public static final BigDecimal MIN_WARNING_PERCENTAGE = new BigDecimal("50.00");

    /** Tỷ lệ cảnh báo tối đa cho phép cấu hình: 99.00% */
    public static final BigDecimal MAX_WARNING_PERCENTAGE = new BigDecimal("99.00");

    /** Loại thông báo cảnh báo sắp chạm ngưỡng */
    public static final String NOTIF_TYPE_REVENUE_WARNING = "REVENUE_THRESHOLD_WARNING";

    /** Loại thông báo cảnh báo đã vượt ngưỡng bắt buộc */
    public static final String NOTIF_TYPE_REVENUE_EXCEEDED = "REVENUE_THRESHOLD_EXCEEDED";

    /** Hoạt động kiểm toán khi vượt ngưỡng */
    public static final String ACTION_REVENUE_THRESHOLD_EXCEEDED = "REVENUE_THRESHOLD_EXCEEDED";

    /** Hoạt động kiểm toán khi cập nhật cấu hình mức cảnh báo */
    public static final String ACTION_UPDATE_WARNING_THRESHOLD = "UPDATE_REVENUE_WARNING_THRESHOLD";
}
