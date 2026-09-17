import { APP_ROUTES } from "@/constants/routes";

export interface IScreenRouteMapping {
  screenCode: string;
  screenName: string;
  match: (pathname: string) => boolean;
}

export const SCREEN_ROUTE_MAPPINGS: IScreenRouteMapping[] = [
  {
    screenCode: "SCREEN_DASHBOARD",
    screenName: "Tổng quan hoạt động kinh doanh",
    match: (pathname: string) =>
      pathname === APP_ROUTES.DASHBOARD ||
      pathname === "/" ||
      pathname.startsWith(`${APP_ROUTES.DASHBOARD}/`),
  },
  {
    screenCode: "SCREEN_POS_CHECKOUT",
    screenName: "Màn hình thu ngân & Bán hàng POS",
    match: (pathname: string) =>
      pathname === APP_ROUTES.POS || pathname.startsWith(`${APP_ROUTES.POS}/`),
  },
  {
    screenCode: "SCREEN_INVOICE_CONFIG",
    screenName: "Cấu hình mẫu và ký hiệu hóa đơn",
    match: (pathname: string) =>
      pathname === APP_ROUTES.SETTINGS_INVOICE_TEMPLATE ||
      pathname.includes("/settings/invoice-template"),
  },
  {
    screenCode: "SCREEN_E_INVOICE_CREATE",
    screenName: "Phát hành hóa đơn điện tử",
    match: (pathname: string) =>
      pathname === APP_ROUTES.E_INVOICES ||
      pathname.startsWith(`${APP_ROUTES.E_INVOICES}/`),
  },
  {
    screenCode: "SCREEN_GOODS_RECEIPT",
    screenName: "Nhập kho hàng hóa",
    match: (pathname: string) =>
      pathname === APP_ROUTES.PRODUCT_STOCK_ENTRY ||
      pathname.includes("/stock-entry") ||
      pathname.includes("/inventory/receipts"),
  },
  {
    screenCode: "SCREEN_SUPPLIER_MANAGEMENT",
    screenName: "Quản lý Nhà cung cấp",
    match: (pathname: string) =>
      pathname === APP_ROUTES.PRODUCT_SUPPLIERS ||
      pathname === APP_ROUTES.SUPPLIERS ||
      pathname.includes("/suppliers"),
  },
  {
    screenCode: "SCREEN_INVENTORY_AUDIT",
    screenName: "Kiểm kê kho hàng",
    match: (pathname: string) =>
      pathname === APP_ROUTES.PRODUCT_INVENTORY_AUDITS ||
      pathname.includes("/inventory-audits"),
  },
  {
    screenCode: "SCREEN_INVENTORY_WARNING",
    screenName: "Cảnh báo tồn kho & Gợi ý nhập",
    match: (pathname: string) =>
      pathname === APP_ROUTES.PRODUCT_INVENTORY_WARNINGS ||
      pathname.includes("/inventory-warnings"),
  },
  {
    screenCode: "SCREEN_SUPPLIER_RETURN",
    screenName: "Trả hàng Nhà cung cấp",
    match: (pathname: string) =>
      pathname === APP_ROUTES.PRODUCT_SUPPLIER_RETURNS ||
      pathname.includes("/supplier-returns"),
  },
  {
    screenCode: "SCREEN_POS_TRANSFER",
    screenName: "Chuyển hàng điểm bán",
    match: (pathname: string) =>
      pathname === APP_ROUTES.PRODUCT_POS_TRANSFERS ||
      pathname.includes("/pos-transfers"),
  },
  {
    screenCode: "SCREEN_PRODUCT_MANAGEMENT",
    screenName: "Quản lý danh mục hàng hóa",
    match: (pathname: string) =>
      pathname === APP_ROUTES.PRODUCTS ||
      (pathname.startsWith(`${APP_ROUTES.PRODUCTS}/`) &&
        !pathname.includes("/stock-entry") &&
        !pathname.includes("/suppliers") &&
        !pathname.includes("/inventory-audits") &&
        !pathname.includes("/inventory-warnings") &&
        !pathname.includes("/supplier-returns") &&
        !pathname.includes("/pos-transfers")),
  },
  {
    screenCode: "SCREEN_CUSTOMER_LOYALTY",
    screenName: "Tích điểm & Hạng thành viên",
    match: (pathname: string) =>
      pathname.includes("/loyalty") || pathname.includes("tab=loyalty"),
  },
  {
    screenCode: "SCREEN_CUSTOMER_DEBT",
    screenName: "Sổ nợ & Đối chiếu công nợ",
    match: (pathname: string) =>
      pathname === APP_ROUTES.CUSTOMERS ||
      pathname.startsWith(`${APP_ROUTES.CUSTOMERS}/`) ||
      pathname.includes("/debts") ||
      pathname.includes("tab=debt") ||
      pathname.includes("debtstatus="),
  },
  {
    screenCode: "SCREEN_CUSTOMER_MANAGEMENT",
    screenName: "Quản lý danh sách khách hàng",
    match: (pathname: string) =>
      pathname.includes("/customer-list"),
  },
  {
    screenCode: "SCREEN_ANNUAL_REVENUE",
    screenName: "Theo dõi doanh thu lũy kế năm & Ngưỡng thuế",
    match: (pathname: string) =>
      pathname === APP_ROUTES.REPORT_ANNUAL_REVENUE ||
      pathname.includes("/annual-revenue"),
  },
  {
    screenCode: "SCREEN_TAX_PERIOD",
    screenName: "Sổ sách & Kỳ kê khai thuế",
    match: (pathname: string) =>
      pathname === APP_ROUTES.REPORT_TAX_DECLARATION ||
      pathname.includes("/tax-declaration") ||
      pathname.includes("/tax-periods"),
  },
  {
    screenCode: "SCREEN_REPORTS_REVENUE",
    screenName: "Báo cáo doanh thu & Mặt hàng bán chạy",
    match: (pathname: string) =>
      pathname === APP_ROUTES.REPORTS ||
      pathname === APP_ROUTES.REPORT_REVENUE ||
      pathname.startsWith(`${APP_ROUTES.REPORTS}/`) ||
      pathname.includes("/revenue"),
  },
  {
    screenCode: "SCREEN_ORDER_MANAGEMENT",
    screenName: "Quản lý danh sách đơn bán hàng",
    match: (pathname: string) =>
      pathname === APP_ROUTES.ORDERS ||
      pathname.startsWith(`${APP_ROUTES.ORDERS}/`),
  },
  {
    screenCode: "SCREEN_SHIFT_MANAGEMENT",
    screenName: "Quản lý ca bán hàng & Bàn giao tiền mặt",
    match: (pathname: string) =>
      pathname === APP_ROUTES.SHIFTS ||
      pathname.startsWith(`${APP_ROUTES.SHIFTS}/`),
  },
  {
    screenCode: "SCREEN_RETURN_TICKETS",
    screenName: "Quản lý trả hàng & Hoàn tiền",
    match: (pathname: string) =>
      pathname === APP_ROUTES.RETURN_TICKETS ||
      pathname.startsWith(`${APP_ROUTES.RETURN_TICKETS}/`),
  },
  {
    screenCode: "SCREEN_PROMOTIONS",
    screenName: "Chương trình khuyến mại & Giảm giá",
    match: (pathname: string) =>
      pathname === APP_ROUTES.PROMOTIONS ||
      pathname.startsWith(`${APP_ROUTES.PROMOTIONS}/`),
  },
  {
    screenCode: "SCREEN_EMPLOYEE_MANAGEMENT",
    screenName: "Quản lý nhân viên & Phân quyền tài khoản",
    match: (pathname: string) =>
      pathname === APP_ROUTES.EMPLOYEES ||
      pathname.startsWith(`${APP_ROUTES.EMPLOYEES}/`),
  },
  {
    screenCode: "SCREEN_DISPLAY_SETTINGS",
    screenName: "Cài đặt giao diện & Hiển thị",
    match: (pathname: string) =>
      pathname.includes("/settings/display") || pathname.includes("/display"),
  },
  {
    screenCode: "SCREEN_BUSINESS_INFO",
    screenName: "Cấu hình cửa hàng & Thông tin kinh doanh",
    match: (pathname: string) =>
      pathname === APP_ROUTES.SETTINGS ||
      pathname.startsWith(`${APP_ROUTES.SETTINGS}/`),
  },
];

/**
 * Xác định mã màn hình (screenCode) từ URL pathname hiện tại
 */
export const getScreenCodeFromPath = (pathname: string): string | null => {
  const normalized = pathname.toLowerCase();
  const mapping = SCREEN_ROUTE_MAPPINGS.find((m) => m.match(normalized));
  return mapping ? mapping.screenCode : null;
};

/**
 * Lấy tên thân thiện của màn hình từ pathname
 */
export const getScreenNameFromPath = (pathname: string): string | null => {
  const normalized = pathname.toLowerCase();
  const mapping = SCREEN_ROUTE_MAPPINGS.find((m) => m.match(normalized));
  return mapping ? mapping.screenName : null;
};
