import { APP_ROUTES } from "./routes";
import { USER_ROLES } from "./roles";
import type { TDemoRole } from "./roles";

export const DASHBOARD_TIME_FILTER = {
  CURRENT_MONTH: "Tháng này",
  PREVIOUS_MONTH: "Tháng trước",
  LAST_SEVEN_DAYS: "7 ngày qua",
} as const;

export const DASHBOARD_TIME_FILTERS = Object.values(DASHBOARD_TIME_FILTER);
export const DEFAULT_DASHBOARD_TIME_FILTER =
  DASHBOARD_TIME_FILTER.CURRENT_MONTH;

export const DASHBOARD_FORM_FIELDS = {
  TIME_FILTER: "dashTime",
} as const;

export const DASHBOARD_SECTIONS = {
  TITLE: "Tổng quan",
  RECONCILIATION_TIME: "Thời gian đối chiếu",
  BUSINESS_LOCATION: "Điểm kinh doanh",
  TODAY_RESULT: "Kết quả bán hàng hôm nay",
  REVENUE: "Doanh thu",
  RETURNS: "Trả hàng",
  NET_REVENUE: "Doanh thu thuần:",
  QUICK_ACCESS: "Truy cập nhanh",
  RECENT_ACTIVITY: "Hoạt động gần đây",
} as const;

export const DASHBOARD_KPI = {
  RETURN_VALUE: 0,
  RETURN_COUNT: 0,
  RETURN_COUNT_LABEL: "0 phiếu trả hàng",
  ISSUED_INVOICE_SUFFIX: "hóa đơn đã ký cấp mã",
} as const;

export const REVENUE_CHART_TAB_IDS = {
  DAY: "day",
  HOUR: "hour",
  WEEK: "week",
} as const;

export const REVENUE_CHART_TABS = [
  { id: REVENUE_CHART_TAB_IDS.DAY, label: "Theo ngày" },
  { id: REVENUE_CHART_TAB_IDS.HOUR, label: "Theo giờ" },
  { id: REVENUE_CHART_TAB_IDS.WEEK, label: "Theo thứ" },
] as const;

export const DEFAULT_REVENUE_CHART_TAB = REVENUE_CHART_TAB_IDS.DAY;

export const REVENUE_CHART_CONFIG = {
  VIEW_BOX: "0 0 600 200",
  GRID_LINES: [
    { x1: 40, y1: 20, x2: 580, y2: 20, color: "#f1f5f9" },
    { x1: 40, y1: 60, x2: 580, y2: 60, color: "#f1f5f9" },
    { x1: 40, y1: 100, x2: 580, y2: 100, color: "#f1f5f9" },
    { x1: 40, y1: 140, x2: 580, y2: 140, color: "#f1f5f9" },
    { x1: 40, y1: 180, x2: 580, y2: 180, color: "#cbd5e1" },
  ],
  Y_AXIS_LABELS: [
    { x: 15, y: 24, label: "1,0" },
    { x: 15, y: 64, label: "0,8" },
    { x: 15, y: 104, label: "0,6" },
    { x: 15, y: 144, label: "0,4" },
    { x: 15, y: 184, label: "0,0" },
  ],
  X_AXIS: { x: 310, y: 196 },
  BAR: { x: 280, y: 40, width: 60, height: 140, radius: 4 },
  BAR_LABEL: { x: 310, y: 32 },
  EMPTY_LABEL: { x: 310, y: 100 },
  GRADIENT_ID: "chartGrad",
  GRADIENT_START: "#0068FF",
  GRADIENT_END: "#0068FF",
  LABEL_COLOR: "#94a3b8",
  AXIS_LABEL_COLOR: "#64748b",
  BAR_LABEL_COLOR: "#0068FF",
  EMPTY_MESSAGE: "Chưa có giao dịch doanh thu trong ca hoạt động",
  MIN_REVENUE: 0,
  PRESERVE_ASPECT_RATIO: "none",
  GRID_STROKE_WIDTH: 1,
  FONT: {
    Y_AXIS_SIZE: 9,
    X_AXIS_SIZE: 10,
    BAR_LABEL_SIZE: 9,
    EMPTY_LABEL_SIZE: 11,
    WEIGHT: "bold",
    EMPTY_WEIGHT: "semibold",
    TEXT_ANCHOR: "middle",
  },
  GRADIENT: {
    X1: 0,
    Y1: 0,
    X2: 0,
    Y2: 1,
    START_OFFSET: "0%",
    END_OFFSET: "100%",
    START_OPACITY: 0.85,
    END_OPACITY: 0.2,
  },
} as const;

interface IQuickAccessItem {
  path: string;
  label: string;
  icon: string;
}

export const QUICK_ACCESS_ITEMS: Record<"cashier" | "management", IQuickAccessItem[]> = {
  cashier: [
    { path: APP_ROUTES.POS, label: "Màn hình bán hàng (POS)", icon: "🛒" },
    { path: APP_ROUTES.ORDERS, label: "Lịch sử đơn hàng", icon: "📄" },
    { path: APP_ROUTES.CUSTOMERS, label: "Khách hàng thân thiết", icon: "👥" },
  ],
  management: [
    { path: APP_ROUTES.POS, label: "Màn hình bán hàng (POS)", icon: "🛒" },
    { path: APP_ROUTES.ORDERS, label: "Tra cứu hóa đơn", icon: "📄" },
    { path: APP_ROUTES.SHIFTS, label: "Quản lý ca bán hàng", icon: "🕒" },
  ],
};

export const getQuickAccessItems = (role: TDemoRole): IQuickAccessItem[] =>
  role === USER_ROLES.CASHIER ? QUICK_ACCESS_ITEMS.cashier : QUICK_ACCESS_ITEMS.management;

export const RECENT_ACTIVITY_EMPTY_MESSAGE = "Chưa có hoạt động mới";
