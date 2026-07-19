import { APP_ROUTES } from "./routes";
import { ROLE_GROUPS, USER_ROLES } from "./roles";
import type { TDemoRole } from "./roles";

export interface IPrimaryNavigationItem {
  id: string;
  label: string;
  path: string;
  allowedRoles: readonly TDemoRole[];
}

export const NAVIGATION_ITEM_IDS = {
  DASHBOARD: "dashboard",
  PRODUCTS: "products",
  SHIFTS: "shifts",
  ORDERS: "orders",
  CUSTOMERS: "customers",
  EMPLOYEES: "employees",
  REPORTS: "reports",
  SETTINGS: "settings",
} as const;

export const PRIMARY_NAVIGATION_ACTION = {
  LABEL: "Bán hàng",
  PATH: APP_ROUTES.POS,
} as const;

export const HIDDEN_NAVIGATION_BY_ROLE: Partial<Record<TDemoRole, readonly string[]>> = {
  [USER_ROLES.CASHIER]: [
    NAVIGATION_ITEM_IDS.PRODUCTS,
    NAVIGATION_ITEM_IDS.REPORTS,
    NAVIGATION_ITEM_IDS.SETTINGS,
    NAVIGATION_ITEM_IDS.EMPLOYEES,
    NAVIGATION_ITEM_IDS.SHIFTS,
  ],
  [USER_ROLES.ACCOUNTANT]: [NAVIGATION_ITEM_IDS.SHIFTS],
};

export const PRIMARY_NAVIGATION_ITEMS: IPrimaryNavigationItem[] = [
  {
    id: NAVIGATION_ITEM_IDS.DASHBOARD,
    label: "Tổng quan",
    path: APP_ROUTES.DASHBOARD,
    allowedRoles: ROLE_GROUPS.NORMAL_MANAGEMENT,
  },
  {
    id: NAVIGATION_ITEM_IDS.PRODUCTS,
    label: "Hàng hóa",
    path: APP_ROUTES.PRODUCTS,
    allowedRoles: ROLE_GROUPS.PRODUCT_MANAGEMENT,
  },
  {
    id: NAVIGATION_ITEM_IDS.SHIFTS,
    label: "Ca bán hàng",
    path: APP_ROUTES.SHIFTS,
    allowedRoles: ROLE_GROUPS.SHIFT_MANAGEMENT,
  },
  {
    id: NAVIGATION_ITEM_IDS.ORDERS,
    label: "Đơn hàng",
    path: APP_ROUTES.ORDERS,
    allowedRoles: ROLE_GROUPS.NORMAL_MANAGEMENT,
  },
  {
    id: NAVIGATION_ITEM_IDS.CUSTOMERS,
    label: "Khách hàng",
    path: APP_ROUTES.CUSTOMERS,
    allowedRoles: ROLE_GROUPS.NORMAL_MANAGEMENT,
  },
  {
    id: NAVIGATION_ITEM_IDS.EMPLOYEES,
    label: "Nhân viên",
    path: APP_ROUTES.EMPLOYEES,
    allowedRoles: ROLE_GROUPS.PRODUCT_MANAGEMENT,
  },
  {
    id: NAVIGATION_ITEM_IDS.REPORTS,
    label: "Báo cáo",
    path: APP_ROUTES.REPORTS,
    allowedRoles: ROLE_GROUPS.PRODUCT_MANAGEMENT,
  },
  {
    id: NAVIGATION_ITEM_IDS.SETTINGS,
    label: "Cấu hình",
    path: APP_ROUTES.SETTINGS,
    allowedRoles: ROLE_GROUPS.PRODUCT_MANAGEMENT,
  },
];

export const getRoleHomeRoute = (role: TDemoRole): string => {
  if (role === USER_ROLES.PLATFORM_ADMIN) return APP_ROUTES.ADMIN_OVERVIEW;
  if (role === USER_ROLES.TAX_AUTHORITY) return APP_ROUTES.TAX_AUTHORITY_INVOICES;
  return APP_ROUTES.DASHBOARD;
};
