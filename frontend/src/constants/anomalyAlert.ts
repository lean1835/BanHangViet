export const ANOMALY_ALERT_TYPES = {
  MASS_INVOICE_CANCEL: "MASS_INVOICE_CANCEL",
  UNUSUAL_HIGH_DISCOUNT: "UNUSUAL_HIGH_DISCOUNT",
  LARGE_INVENTORY_ADJUSTMENT: "LARGE_INVENTORY_ADJUSTMENT",
  RAPID_FAILED_LOGINS: "RAPID_FAILED_LOGINS",
  AUDIT_CHAIN_BREACH: "AUDIT_CHAIN_BREACH",
} as const;

export type TAnomalyAlertType = (typeof ANOMALY_ALERT_TYPES)[keyof typeof ANOMALY_ALERT_TYPES];

export const ANOMALY_ALERT_TYPE_INFO: Record<
  TAnomalyAlertType,
  { label: string; description: string; unit: string }
> = {
  [ANOMALY_ALERT_TYPES.MASS_INVOICE_CANCEL]: {
    label: "Hủy hóa đơn hàng loạt",
    description: "Phát hiện một tài khoản hủy nhiều hóa đơn liên tiếp trong khoảng thời gian ngắn",
    unit: "hóa đơn",
  },
  [ANOMALY_ALERT_TYPES.UNUSUAL_HIGH_DISCOUNT]: {
    label: "Chiết khấu/Giảm giá bất thường",
    description: "Phát hiện đơn hàng có mức giảm giá hoặc tỷ lệ chiết khấu vượt ngưỡng an toàn",
    unit: "%",
  },
  [ANOMALY_ALERT_TYPES.LARGE_INVENTORY_ADJUSTMENT]: {
    label: "Điều chỉnh tồn kho số lượng lớn",
    description: "Phát hiện kiểm kê hoặc điều chỉnh chênh lệch số lượng tồn kho vượt ngưỡng",
    unit: "sản phẩm",
  },
  [ANOMALY_ALERT_TYPES.RAPID_FAILED_LOGINS]: {
    label: "Đăng nhập thất bại liên tiếp",
    description: "Phát hiện nhiều lần thử mật khẩu sai liên tục nghi vấn tấn công dò mật khẩu",
    unit: "lần",
  },
  [ANOMALY_ALERT_TYPES.AUDIT_CHAIN_BREACH]: {
    label: "Đứt gãy chuỗi Hash Chain kiểm toán",
    description: "Phát hiện sai lệch mã băm SHA-256 nghi vấn dữ liệu nhật ký bị sửa xóa trực tiếp",
    unit: "bản ghi",
  },
};

export const ANOMALY_SEVERITIES = {
  CRITICAL: "CRITICAL",
  WARNING: "WARNING",
  INFO: "INFO",
} as const;

export type TAnomalySeverity = (typeof ANOMALY_SEVERITIES)[keyof typeof ANOMALY_SEVERITIES];

export const ANOMALY_SEVERITY_STYLES: Record<
  TAnomalySeverity,
  { bg: string; text: string; border: string; label: string; badgeBg: string }
> = {
  [ANOMALY_SEVERITIES.CRITICAL]: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-700",
    border: "border-rose-200",
    badgeBg: "bg-rose-600 text-white",
    label: "Nghiêm trọng",
  },
  [ANOMALY_SEVERITIES.WARNING]: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
    border: "border-amber-200",
    badgeBg: "bg-amber-500 text-white",
    label: "Cảnh báo",
  },
  [ANOMALY_SEVERITIES.INFO]: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    text: "text-blue-700",
    border: "border-blue-200",
    badgeBg: "bg-blue-500 text-white",
    label: "Thông tin",
  },
};

export const ANOMALY_ALERT_STATUSES = {
  PENDING: "PENDING",
  REVIEWED: "REVIEWED",
  DISMISSED: "DISMISSED",
} as const;

export type TAnomalyAlertStatus = (typeof ANOMALY_ALERT_STATUSES)[keyof typeof ANOMALY_ALERT_STATUSES];

export const ANOMALY_STATUS_STYLES: Record<
  TAnomalyAlertStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  [ANOMALY_ALERT_STATUSES.PENDING]: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Chờ xử lý",
  },
  [ANOMALY_ALERT_STATUSES.REVIEWED]: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Đã xử lý",
  },
  [ANOMALY_ALERT_STATUSES.DISMISSED]: {
    bg: "bg-slate-100 text-slate-600 border-slate-300",
    text: "text-slate-600",
    border: "border-slate-300",
    label: "Đã bỏ qua",
  },
};

export const ANOMALY_UI = {
  PAGE_TITLE: "Cảnh báo thao tác bất thường",
  PAGE_SUBTITLE: "Phát hiện sớm các hành vi sai sót, hủy hóa đơn hàng loạt hoặc gian lận bất thường",
  RBAC_WARNING: {
    TITLE: "Giới hạn quyền giám sát cảnh báo",
    DESCRIPTION:
      "Chức năng giám sát và xử lý cảnh báo thao tác bất thường chỉ dành cho Chủ hộ kinh doanh (VT-01) và Quản trị viên (VT-04).",
    ACTION_BACK: "Quay lại trang chủ",
  },
  OVERVIEW: {
    TOTAL_ALERTS: "Tổng cảnh báo phát hiện",
    PENDING_ALERTS: "Cảnh báo chờ xử lý",
    CRITICAL_ALERTS: "Mức độ nghiêm trọng",
    WARNING_ALERTS: "Mức độ cảnh báo",
    CLEAN_DAY_TITLE: "Ngày làm việc an toàn",
    CLEAN_DAY_DESC:
      "Hệ thống đã rà soát toàn bộ dữ liệu nhật ký và không phát hiện bất kỳ thao tác vượt ngưỡng bất thường nào trong ngày.",
    SCAN_NOW_BTN: "Quét kiểm tra ngay",
    RULES_CONFIG_BTN: "Cấu hình quy tắc",
  },
  FILTERS: {
    SEARCH_PLACEHOLDER: "Tìm theo tiêu đề, tài khoản hoặc nội dung...",
    SEVERITY_ALL: "Tất cả mức độ",
    STATUS_ALL: "Tất cả trạng thái",
    TYPE_ALL: "Tất cả loại vi phạm",
    DATE_LABEL: "Thời điểm phát hiện:",
    RESET_BTN: "Đặt lại bộ lọc",
  },
  TABLE: {
    PAGE_SIZE: 9,
    COLUMNS: {
      SEVERITY: "Mức độ",
      TYPE: "Loại vi phạm",
      TITLE: "Nội dung cảnh báo",
      ACTOR: "Người thao tác",
      TIME: "Thời điểm phát hiện",
      STATUS: "Trạng thái",
      ACTION: "Thao tác",
    },
    REVIEW_BTN: "Xem & Xử lý",
    EMPTY: "Không có cảnh báo bất thường nào phù hợp với bộ lọc.",
  },
  REVIEW_MODAL: {
    TITLE: "Chi tiết & Đánh giá cảnh báo bất thường",
    SUBTITLE: "Xem dữ liệu bằng chứng và xác nhận xử lý hoặc bỏ qua cảnh báo",
    ACTOR_INFO: "Thông tin người thực hiện:",
    DETECTED_TIME: "Thời điểm phát hiện:",
    EVIDENCE_TITLE: "Dữ liệu bằng chứng vi phạm:",
    STATUS_SELECT_LABEL: "Hành động xử lý cảnh báo:",
    REVIEW_NOTES_LABEL: "Ghi chú xử lý / giải trình:",
    REVIEW_NOTES_PLACEHOLDER: "Nhập ghi chú giải thích phương án xử lý hoặc lý do bỏ qua cảnh báo...",
    SAVE_BTN: "Lưu kết quả xử lý",
    SAVING_BTN: "Đang lưu...",
    CLOSE_BTN: "Đóng",
  },
  RULES_MODAL: {
    TITLE: "Cấu hình quy tắc phát hiện bất thường",
    SUBTITLE: "Điều chỉnh ngưỡng kích hoạt và khung thời gian giám sát cho từng loại vi phạm",
    COLUMNS: {
      RULE_NAME: "Tên quy tắc",
      THRESHOLD: "Ngưỡng kích hoạt",
      TIME_WINDOW: "Khung thời gian",
      SEVERITY: "Mức độ",
      STATUS: "Kích hoạt",
      ACTION: "Lưu",
    },
    THRESHOLD_LABEL: "Ngưỡng:",
    TIME_WINDOW_LABEL: "Thời gian (phút):",
    SEVERITY_LABEL: "Mức độ:",
    CLOSE_BTN: "Đóng",
  },
  SCAN_MODAL: {
    TITLE: "Kích hoạt quét phát hiện thao tác bất thường",
    SUBTITLE: "Chạy phân tích nhật ký hoạt động theo ngày để phát hiện các dấu hiệu vi phạm",
    DATE_LABEL: "Chọn ngày cần quét phân tích:",
    SCAN_BTN: "Bắt đầu quét",
    SCANNING_BTN: "Đang quét phân tích dữ liệu...",
    CANCEL_BTN: "Hủy bỏ",
  },
} as const;
