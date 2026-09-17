export interface ISubTabGuide {
  screenCode: string;
  tabName: string;
  actionUrl: string;
}

export interface IModuleGroup {
  moduleId: string;
  moduleName: string;
  tabs: ISubTabGuide[];
}

export const MODULE_GROUPS: IModuleGroup[] = [
  {
    moduleId: "MODULE_PRODUCTS",
    moduleName: "Hàng hóa & Kho",
    tabs: [
      {
        screenCode: "SCREEN_PRODUCT_MANAGEMENT",
        tabName: "Danh mục hàng hóa",
        actionUrl: "/products",
      },
      {
        screenCode: "SCREEN_SUPPLIER_MANAGEMENT",
        tabName: "Nhà cung cấp",
        actionUrl: "/products/suppliers",
      },
      {
        screenCode: "SCREEN_GOODS_RECEIPT",
        tabName: "Nhập kho",
        actionUrl: "/products/stock-entry",
      },
      {
        screenCode: "SCREEN_INVENTORY_AUDIT",
        tabName: "Kiểm kê kho",
        actionUrl: "/products/inventory-audits",
      },
      {
        screenCode: "SCREEN_INVENTORY_WARNING",
        tabName: "Cảnh báo tồn",
        actionUrl: "/products/inventory-warnings",
      },
      {
        screenCode: "SCREEN_SUPPLIER_RETURN",
        tabName: "Trả hàng NCC",
        actionUrl: "/products/supplier-returns",
      },
      {
        screenCode: "SCREEN_POS_TRANSFER",
        tabName: "Chuyển điểm bán",
        actionUrl: "/products/pos-transfers",
      },
    ],
  },
  {
    moduleId: "MODULE_CUSTOMERS",
    moduleName: "Khách hàng & Sổ nợ",
    tabs: [
      {
        screenCode: "SCREEN_CUSTOMER_MANAGEMENT",
        tabName: "Khách hàng",
        actionUrl: "/customers",
      },
      {
        screenCode: "SCREEN_CUSTOMER_DEBT",
        tabName: "Sổ nợ & Đối chiếu",
        actionUrl: "/customers",
      },
      {
        screenCode: "SCREEN_CUSTOMER_LOYALTY",
        tabName: "Tích điểm & VIP",
        actionUrl: "/customers",
      },
    ],
  },
  {
    moduleId: "MODULE_REPORTS",
    moduleName: "Báo cáo & Thuế",
    tabs: [
      {
        screenCode: "SCREEN_REPORTS_REVENUE",
        tabName: "Doanh thu & Bán chạy",
        actionUrl: "/reports",
      },
      {
        screenCode: "SCREEN_ANNUAL_REVENUE",
        tabName: "Lũy kế năm (1 tỷ)",
        actionUrl: "/reports/annual-revenue",
      },
      {
        screenCode: "SCREEN_TAX_PERIOD",
        tabName: "Kỳ kê khai thuế",
        actionUrl: "/reports/tax-declaration",
      },
    ],
  },
  {
    moduleId: "MODULE_INVOICES",
    moduleName: "Hóa đơn điện tử",
    tabs: [
      {
        screenCode: "SCREEN_E_INVOICE_CREATE",
        tabName: "Phát hành HĐĐT",
        actionUrl: "/invoices/create",
      },
      {
        screenCode: "SCREEN_INVOICE_CONFIG",
        tabName: "Mẫu & Ký hiệu",
        actionUrl: "/settings/invoice-template",
      },
    ],
  },
  {
    moduleId: "MODULE_SETTINGS",
    moduleName: "Cài đặt hệ thống",
    tabs: [
      {
        screenCode: "SCREEN_BUSINESS_INFO",
        tabName: "Thông tin cửa hàng",
        actionUrl: "/settings",
      },
      {
        screenCode: "SCREEN_INVOICE_CONFIG",
        tabName: "Mẫu ký hiệu hóa đơn",
        actionUrl: "/settings/invoice-template",
      },
      {
        screenCode: "SCREEN_DISPLAY_SETTINGS",
        tabName: "Cài đặt hiển thị",
        actionUrl: "/settings/display",
      },
    ],
  },
];

/**
 * Tìm nhóm phân hệ (Module Group) chứa screenCode hiện tại
 */
export const getModuleGroupForScreen = (
  screenCode?: string | null
): IModuleGroup | null => {
  if (!screenCode) return null;
  return (
    MODULE_GROUPS.find((group) =>
      group.tabs.some((tab) => tab.screenCode === screenCode)
    ) || null
  );
};
