package com.sales.common.constant;

import java.util.Set;

/**
 * Danh mục chuẩn hóa các loại thông báo và phân nhóm phân quyền theo vai trò (NCL-19-CN-002 & QTN-10).
 */
public final class NotificationTypeConstant {

    private NotificationTypeConstant() {}

    // 1. Tác nghiệp bán hàng & HĐĐT (Nhân viên bán hàng VT-02 ĐƯỢC XEM)
    public static final String INVOICE_ERROR = "INVOICE_ERROR";
    public static final String LOW_STOCK_WARNING = "LOW_STOCK_WARNING";

    // 2. Tài chính & Kê khai thuế & Quản trị (QTN-10: Nhân viên bán hàng VT-02 BỊ ẨN TUYỆT ĐỐI)
    public static final String DEBT_DUE = "DEBT_DUE";
    public static final String DEBT_OVERDUE = "DEBT_OVERDUE";
    public static final String REVENUE_THRESHOLD_WARNING = "REVENUE_THRESHOLD_WARNING";
    public static final String REVENUE_THRESHOLD_EXCEEDED = "REVENUE_THRESHOLD_EXCEEDED";
    public static final String TAX_DECLARATION_REMINDER = "TAX_DECLARATION_REMINDER";
    public static final String TAX_DECLARATION_OVERDUE = "TAX_DECLARATION_OVERDUE";
    public static final String BACKUP_VERIFICATION_FAILED = "BACKUP_VERIFICATION_FAILED";
    public static final String ABNORMAL_ACTIVITY = "ABNORMAL_ACTIVITY";
    public static final String INVOICE_RANGE_LOW = "INVOICE_RANGE_LOW";

    // Tập hợp các loại thông báo tài chính & quản trị nhạy cảm theo QTN-10
    public static final Set<String> FINANCIAL_AND_ADMIN_TYPES = Set.of(
            DEBT_DUE,
            DEBT_OVERDUE,
            REVENUE_THRESHOLD_WARNING,
            REVENUE_THRESHOLD_EXCEEDED,
            TAX_DECLARATION_REMINDER,
            TAX_DECLARATION_OVERDUE,
            BACKUP_VERIFICATION_FAILED,
            ABNORMAL_ACTIVITY,
            INVOICE_RANGE_LOW
    );

    // Tập hợp các loại thông báo nhân viên bán hàng (VT-02) được phép xem
    public static final Set<String> CASHIER_ALLOWED_TYPES = Set.of(
            INVOICE_ERROR,
            LOW_STOCK_WARNING
    );

    // Tập hợp các loại thông báo nghiêm trọng bắt buộc không được phép tắt
    public static final Set<String> MANDATORY_NOTIFICATION_TYPES = Set.of(
            INVOICE_ERROR
    );
}
