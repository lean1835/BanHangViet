import { APP_ROUTES } from "./routes";
import { MOCK_CLOCK } from "./mockData/clock";
import { E_INVOICE_STATUS } from "./eInvoice";

export const REPORT_NAVIGATION_ITEMS = [
  {
    path: APP_ROUTES.REPORT_REVENUE,
    label: "Doanh thu & Bán chạy",
  },
  {
    path: APP_ROUTES.REPORT_COMPARISON,
    label: "So sánh doanh thu kỳ",
  },
  {
    path: APP_ROUTES.REPORT_ACTIVITY_LOGS,
    label: "Nhật ký hoạt động",
  },
] as const;

export const REPORT_UI = {
  SIDEBAR: {
    TITLE: "Báo cáo",
    SECTION_LABEL: "Chức năng báo cáo",
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
  DATE_PREFIX: MOCK_CLOCK.CURRENT_DATE,
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
