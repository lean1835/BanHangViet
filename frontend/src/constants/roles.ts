export const USER_ROLES = {
  OWNER: "VT-01",
  CASHIER: "VT-02",
  ACCOUNTANT: "VT-03",
  PLATFORM_ADMIN: "VT-04",
  TAX_AUTHORITY: "VT-05",
} as const;

export type TDemoRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<TDemoRole, string> = {
  [USER_ROLES.OWNER]: "Chủ hộ kinh doanh",
  [USER_ROLES.CASHIER]: "Nhân viên bán hàng",
  [USER_ROLES.ACCOUNTANT]: "Kế toán",
  [USER_ROLES.PLATFORM_ADMIN]: "Quản trị nền tảng",
  [USER_ROLES.TAX_AUTHORITY]: "Cơ quan thuế mô phỏng",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as TDemoRole,
  label,
}));

export const ROLE_GROUPS = {
  NORMAL_MANAGEMENT: [USER_ROLES.OWNER, USER_ROLES.CASHIER, USER_ROLES.ACCOUNTANT],
  PRODUCT_MANAGEMENT: [USER_ROLES.OWNER, USER_ROLES.ACCOUNTANT],
  SHIFT_MANAGEMENT: [USER_ROLES.OWNER],
  POINT_OF_SALE: [USER_ROLES.OWNER, USER_ROLES.CASHIER],
  PLATFORM_ADMIN: [USER_ROLES.PLATFORM_ADMIN],
  TAX_AUTHORITY: [USER_ROLES.TAX_AUTHORITY],
} as const satisfies Record<string, readonly TDemoRole[]>;

export const isDemoRole = (role: string | undefined): role is TDemoRole =>
  role !== undefined && ROLE_OPTIONS.some((option) => option.value === role);
