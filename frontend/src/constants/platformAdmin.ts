import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";

export const PLATFORM_ADMIN_HOUSEHOLD_COUNT = 12;

export const PLATFORM_ADMIN_COPY = {
  HEADER_TITLE: "Cổng Quản Trị Hệ Thống (Platform Admin)",
  HEADER_DESCRIPTION:
    "Quản lý các tài khoản Hộ kinh doanh và theo dõi hoạt động toàn hệ thống.",
  ROLE_BADGE: `Vai trò quản trị tối cao (${USER_ROLES.PLATFORM_ADMIN})`,
  SIDEBAR_TITLE: "Quản trị nền tảng",
} as const;

export const PLATFORM_ADMIN_UI = {
  HOUSEHOLDS: {
    TITLE: "Danh sách Hộ kinh doanh trên nền tảng",
    COLUMNS: {
      HOUSEHOLD: "Hộ kinh doanh",
      TAX_CODE: "Mã số thuế",
      REPRESENTATIVE: "Người đại diện",
      PLAN: "Gói dịch vụ",
      EXPIRY: "Hạn sử dụng",
      STATUS: "Trạng thái",
      ACTIONS: "Thao tác",
    },
  },
  LOGS: {
    TITLE: "Nhật ký Hệ thống mức Quản trị",
    COLUMNS: {
      TIME: "Thời gian",
      ACTOR: "Đối tượng",
      ACTION: "Hành động",
      IP_ADDRESS: "Địa chỉ IP",
    },
  },
} as const;

export const PLATFORM_ADMIN_NAV_ITEMS = [
  { to: APP_ROUTES.ADMIN_OVERVIEW, label: "Tổng quan hệ thống" },
  {
    to: APP_ROUTES.ADMIN_HOUSEHOLDS,
    label: `Hộ kinh doanh (${PLATFORM_ADMIN_HOUSEHOLD_COUNT})`,
  },
  { to: APP_ROUTES.ADMIN_LOGS, label: "Nhật ký hệ thống" },
] as const;

export const PLATFORM_ADMIN_OVERVIEW = {
  HOUSEHOLDS: {
    label: "Hộ kinh doanh",
    value: `${PLATFORM_ADMIN_HOUSEHOLD_COUNT} hộ`,
    detail: "🟢 11 đang hoạt động / 🔴 1 bị khóa",
  },
  ACTIVE_USERS: {
    label: "Tài khoản hoạt động",
    value: "45 users",
    detail: "Đồng bộ tức thời",
  },
  TRANSMITTED_INVOICES: {
    label: "Tổng hóa đơn truyền nhận",
    value: "12.540 HĐ",
    detail: "Đã ký & cấp mã số thuế",
  },
  API_GATEWAY: {
    label: "Trạng thái API Gateway",
    value: "99.98%",
    detail: "Hoạt động bình thường",
  },
  CHART_TITLE: "Biểu đồ tải truyền nhận hóa đơn điện tử",
  CHART_PLACEHOLDER:
    "📊 Biểu đồ trực quan phụ tải Cloud Gateway (Thiết kế giả lập)",
} as const;

export const PLATFORM_ADMIN_PLAN = {
  PREMIUM: "PREMIUM",
  STANDARD: "STANDARD",
  TRIAL: "TRIAL",
} as const;

export const PLATFORM_ADMIN_HOUSEHOLD_STATUS = {
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
} as const;

export const PLATFORM_ADMIN_HOUSEHOLD_ACTION = {
  LOCK: "LOCK",
  RENEW: "RENEW",
} as const;

export const PLATFORM_ADMIN_MESSAGES = {
  householdActionUnavailable: (actionLabel: string) =>
    `Chức năng "${actionLabel}" hộ kinh doanh chưa được hỗ trợ trong phiên bản hiện tại.`,
} as const;

export const PLATFORM_ADMIN_HOUSEHOLDS = [
  {
    id: "tap-hoa-viet",
    name: "Tạp Hóa Việt",
    taxCode: "0123456789",
    representative: "Nguyễn Văn A",
    plan: PLATFORM_ADMIN_PLAN.PREMIUM,
    planLabel: "Premium",
    expiry: "15/12/2026",
    isExpired: false,
    status: PLATFORM_ADMIN_HOUSEHOLD_STATUS.ACTIVE,
    statusLabel: "Hoạt động",
    action: PLATFORM_ADMIN_HOUSEHOLD_ACTION.LOCK,
    actionLabel: "Khóa",
  },
  {
    id: "nha-thuoc-an-tam",
    name: "Nhà Thuốc An Tâm",
    taxCode: "0312456789",
    representative: "Phạm Thị B",
    plan: PLATFORM_ADMIN_PLAN.STANDARD,
    planLabel: "Standard",
    expiry: "01/10/2026",
    isExpired: false,
    status: PLATFORM_ADMIN_HOUSEHOLD_STATUS.ACTIVE,
    statusLabel: "Hoạt động",
    action: PLATFORM_ADMIN_HOUSEHOLD_ACTION.LOCK,
    actionLabel: "Khóa",
  },
  {
    id: "quan-an-huong-que",
    name: "Quán ăn Hương Quê",
    taxCode: "0412356789",
    representative: "Lê Văn C",
    plan: PLATFORM_ADMIN_PLAN.TRIAL,
    planLabel: "Trial",
    expiry: "Hết hạn (01/07/2026)",
    isExpired: true,
    status: PLATFORM_ADMIN_HOUSEHOLD_STATUS.LOCKED,
    statusLabel: "Bị khóa",
    action: PLATFORM_ADMIN_HOUSEHOLD_ACTION.RENEW,
    actionLabel: "Gia hạn (+1 năm)",
  },
] as const;

export type TPlatformAdminPlan =
  (typeof PLATFORM_ADMIN_PLAN)[keyof typeof PLATFORM_ADMIN_PLAN];
export type TPlatformAdminHouseholdStatus =
  (typeof PLATFORM_ADMIN_HOUSEHOLD_STATUS)[keyof typeof PLATFORM_ADMIN_HOUSEHOLD_STATUS];
export type TPlatformAdminHouseholdAction =
  (typeof PLATFORM_ADMIN_HOUSEHOLD_ACTION)[keyof typeof PLATFORM_ADMIN_HOUSEHOLD_ACTION];

export const PLATFORM_ADMIN_LOG_ACTOR = {
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  TAX_AUTHORITY: "TAX_AUTHORITY",
} as const;

export type TPlatformAdminLogActor =
  (typeof PLATFORM_ADMIN_LOG_ACTOR)[keyof typeof PLATFORM_ADMIN_LOG_ACTOR];

export const PLATFORM_ADMIN_LOGS = [
  {
    id: "admin-login",
    time: "2026-07-15 10:52:14",
    actor: `quantri_viet (${USER_ROLES.PLATFORM_ADMIN})`,
    actorType: PLATFORM_ADMIN_LOG_ACTOR.ADMIN,
    action: "Đăng nhập cổng quản trị nền tảng",
    ipAddress: "192.168.1.100",
  },
  {
    id: "owner-send-invoice",
    time: "2026-07-15 10:45:00",
    actor: `chuho_viet (${USER_ROLES.OWNER})`,
    actorType: PLATFORM_ADMIN_LOG_ACTOR.OWNER,
    action: "Gửi ký hóa đơn điện tử HD-VT004",
    ipAddress: "14.232.84.102",
  },
  {
    id: "tax-return-code",
    time: "2026-07-15 10:45:02",
    actor: `thue_viet (${USER_ROLES.TAX_AUTHORITY})`,
    actorType: PLATFORM_ADMIN_LOG_ACTOR.TAX_AUTHORITY,
    action: "Trả kết quả cấp mã CQT-20260715-00127D",
    ipAddress: "10.20.1.5",
  },
] as const;
