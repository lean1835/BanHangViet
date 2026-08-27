import { APP_ROUTES } from "./routes";
import { E_INVOICE_STATUS } from "./eInvoice";

export const REPORT_NAVIGATION_ITEMS = [
  {
    path: APP_ROUTES.REPORT_REVENUE,
    label: "Doanh thu & Bán chạy",
  },
  {
    path: APP_ROUTES.REPORT_POS_REVENUE,
    label: "Doanh thu theo điểm bán",
  },
  {
    path: APP_ROUTES.REPORT_COMPARISON,
    label: "So sánh doanh thu kỳ",
  },
  {
    path: APP_ROUTES.REPORT_TAX_DECLARATION,
    label: "Tờ khai thuế & Bảng kê",
  },
  {
    path: APP_ROUTES.REPORT_ACTIVITY_LOGS,
    label: "Nhật ký hoạt động",
  },
  {
    path: APP_ROUTES.REPORT_AUDIT_LOGS,
    label: "Nhật ký kiểm toán",
  },
  {
    path: APP_ROUTES.REPORT_ANOMALY_ALERTS,
    label: "Cảnh báo bất thường",
  },
] as const;

export const REPORT_UI = {
  SIDEBAR: {
    TITLE: "Báo cáo",
    SECTION_LABEL: "Chức năng báo cáo",
  },
  TAX_DECLARATION: {
    TITLE: "Tờ khai thuế & Phụ lục bảng kê bán ra",
    DESCRIPTION:
      "Tổng hợp doanh thu thực tế từ hóa đơn điện tử đã phát hành, lập phụ lục bảng kê và xuất tờ khai thuế mô phỏng Mẫu 01/CNKD theo quy định 2026.",
    PERIOD_LABEL: "Kỳ kê khai thuế:",
    YEAR_LABEL: "Năm tính thuế:",
    BTN_PREVIEW: "Xem trước tờ khai",
    BTN_EXPORT: "Xuất tờ khai thuế",
    BTN_EXPORT_PDF: "Xuất tệp PDF (Mẫu chuẩn A4)",
    BTN_EXPORT_EXCEL: "Xuất tệp Excel (Tờ khai + Bảng kê)",
    BTN_EXPORT_XML: "Xuất tệp XML (eTax mô phỏng)",
    STATUS_OPEN: "Đang mở (Dự thảo)",
    STATUS_LOCKED: "Đã chốt sổ (Khóa số liệu)",
    TAB_SIMULATED_FORM: "Mẫu tờ khai 01/CNKD",
    TAB_ANNEX_INVOICES: "Phụ lục bảng kê HĐ bán ra (01-2/BK-HĐKD)",
    TAB_TAX_GROUPS: "Tổng hợp theo thuế suất",
    KPI: {
      TOTAL_REVENUE: "Doanh thu chịu thuế",
      VAT_AMOUNT: "Thuế GTGT mô phỏng",
      PIT_AMOUNT: "Thuế TNCN mô phỏng",
      TOTAL_PAYABLE: "Tổng thuế phải nộp",
    },
    WARNING_MISSING_INFO_TITLE: "Chưa đủ điều kiện xuất tờ khai thuế",
    WARNING_MISSING_INFO_DESC:
      "Hồ sơ hộ kinh doanh chưa khai báo đầy đủ các thông tin bắt buộc theo quy định quản lý thuế. Vui lòng cập nhật trước khi xuất tờ khai.",
    BTN_UPDATE_SETTINGS: "Cập nhật thông tin hộ ngay",
    ROLE_RESTRICTION_TOOLTIP:
      "Chỉ Kế toán (VT-03) và Chủ hộ (VT-01) mới có quyền xuất tờ khai thuế.",
  },
  COMPARISON: {
    TITLE: "Đối chiếu & So sánh doanh thu hai kỳ liên tiếp",
    DESCRIPTION:
      "Chọn hai khoảng thời gian không chồng lấn để kiểm tra biểu đồ tăng trưởng và đối soát mức độ chênh lệch phần trăm.",
    BASE_PERIOD_LABEL: "Kỳ đối chiếu 1 (Kỳ gốc):",
    COMPARISON_PERIOD_LABEL: "Kỳ đối chiếu 2 (Kỳ so sánh):",
    START_DATE_LABEL: "Từ ngày:",
    END_DATE_LABEL: "Đến ngày:",
    RESET_ACTION: "Làm sạch thiết lập",
    ANALYZE_ACTION: "Bắt đầu phân tích đối soát",
  },
  REVENUE: {
    TITLE: "Doanh thu bán hàng theo ca làm việc",
    BEST_SELLERS_TITLE: "Hàng hóa bán chạy nhất",
    BEST_SELLER_COLUMNS: {
      NAME: "Tên hàng",
      QUANTITY: "Số lượng",
      REVENUE: "Doanh thu",
    },
    EMPTY_BEST_SELLERS: "Chưa có dữ liệu thống kê bán chạy hôm nay",
  },
  ACTIVITY_LOG: {
    TITLE: "Nhật ký hoạt động hệ thống",
    COLUMNS: {
      TIME: "Thời gian ghi nhận",
      USER: "Tài khoản thực hiện",
      ACTION: "Mã hành động",
      TARGET: "Mục tiêu tác động",
    },
  },
} as const;

export const REVENUE_COMPARISON_DEFAULT_PERIODS = {
  BASE: {
    START_DATE: "2026-07-01",
    END_DATE: "2026-07-07",
  },
  COMPARISON: {
    START_DATE: "2026-07-08",
    END_DATE: "2026-07-14",
  },
} as const;

export const REVENUE_REPORT_FILTER = {
  INVOICE_STATUS: E_INVOICE_STATUS.ISSUED,
  DATE_PREFIX: "2026-07-26",
} as const;

export const REVENUE_CHART_CONFIG = {
  VIEW_BOX: "0 0 500 200",
  MAX_REVENUE: 15_000_000,
  THOUSAND_DIVISOR: 1_000,
  MIN_REVENUE: 0,
  DECIMAL_PLACES: 0,
  VALUE_SUFFIX: "k",
  EMPTY_VALUE_LABEL: "0đ",
  GRID_LINES: [
    { y: 20, color: "#f1f5f9" },
    { y: 70, color: "#f1f5f9" },
    { y: 120, color: "#f1f5f9" },
    { y: 170, color: "#cbd5e1" },
  ],
  GRID_X: { START: 30, END: 480 },
  Y_AXIS_LABELS: [
    { y: 24, label: "5.0M" },
    { y: 74, label: "2.5M" },
    { y: 124, label: "1.0M" },
    { y: 174, label: "0.0 đ" },
  ],
  Y_AXIS_LABEL_X: 5,
  FONT: {
    SIZE: 8,
    WEIGHT: "bold",
    TEXT_ANCHOR: "middle",
  },
  COLORS: {
    AXIS_LABEL: "#94a3b8",
    SHIFT: "#cbd5e1",
    SHIFT_LABEL: "#64748b",
    TODAY: "#0068FF",
  },
  SHIFT_BARS: [
    {
      id: "shift-1",
      x: 80,
      y: 80,
      width: 40,
      height: 90,
      radius: 3,
      labelX: 100,
      valueY: 72,
      axisY: 186,
      valueLabel: "3.500k",
      axisLabel: "Ca s1",
    },
    {
      id: "shift-2",
      x: 180,
      y: 118,
      width: 40,
      height: 52,
      radius: 3,
      labelX: 200,
      valueY: 110,
      axisY: 186,
      valueLabel: "2.430k",
      axisLabel: "Ca s2",
    },
  ],
  TODAY_BAR: {
    x: 280,
    width: 40,
    radius: 3,
    baselineY: 170,
    maxHeight: 150,
    labelX: 300,
    valueBaselineY: 162,
    axisY: 186,
    axisLabel: "Hôm nay",
  },
  BEST_SELLER_COLUMN_COUNT: 3,
} as const;

export const getTodayRevenueBarHeight = (totalRevenue: number): number =>
  (totalRevenue / REVENUE_CHART_CONFIG.MAX_REVENUE) *
  REVENUE_CHART_CONFIG.TODAY_BAR.maxHeight;
