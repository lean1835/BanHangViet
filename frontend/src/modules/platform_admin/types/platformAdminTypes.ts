export const PLATFORM_HOUSEHOLD_STATUS = {
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
} as const;

export type TPlatformHouseholdStatus =
  (typeof PLATFORM_HOUSEHOLD_STATUS)[keyof typeof PLATFORM_HOUSEHOLD_STATUS];

export const SUBSCRIPTION_PLAN_CODE = {
  NONE: "NONE",
  STARTER: "STARTER",
  STANDARD: "STANDARD",
  PREMIUM: "PREMIUM",
  ENTERPRISE: "ENTERPRISE",
} as const;

export type TSubscriptionPlanCode =
  (typeof SUBSCRIPTION_PLAN_CODE)[keyof typeof SUBSCRIPTION_PLAN_CODE];

export interface ISubscriptionPlan {
  id: string;
  code: TSubscriptionPlanCode;
  name: string;
  maxUsers: number;
  maxPos: number;
  maxMonthlyInvoices: number;
  dataRetentionMonths: number;
  pricePerMonth: number;
  description: string;
  isPopular?: boolean;
}

export interface IHouseholdAdminItem {
  id: string;
  name: string;
  taxCode: string;
  representative: string;
  phoneNumber: string;
  address: string;
  status: TPlatformHouseholdStatus;
  lockReason?: string;
  lockedAt?: string;
  planCode: TSubscriptionPlanCode;
  planName: string;
  planExpiry: string;
  isExpired: boolean;
  userCount: number;
  maxUsers: number;
  invoiceCountMonth: number;
  maxInvoicesMonth: number;
  lastActiveAt: string;
}

export const SYSTEM_LOG_SEVERITY = {
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
  CRITICAL: "CRITICAL",
} as const;

export type TSystemLogSeverity =
  (typeof SYSTEM_LOG_SEVERITY)[keyof typeof SYSTEM_LOG_SEVERITY];

export const SYSTEM_LOG_CATEGORY = {
  TAX_GATEWAY: "TAX_GATEWAY",
  INVOICE_QUEUE: "INVOICE_QUEUE",
  SYSTEM_ERROR: "SYSTEM_ERROR",
  BACKUP: "BACKUP",
  SUBSCRIPTION: "SUBSCRIPTION",
  SECURITY: "SECURITY",
} as const;

export type TSystemLogCategory =
  (typeof SYSTEM_LOG_CATEGORY)[keyof typeof SYSTEM_LOG_CATEGORY];

export const SYSTEM_LOG_CATEGORY_LABELS: Record<TSystemLogCategory, string> = {
  [SYSTEM_LOG_CATEGORY.TAX_GATEWAY]: "Cơ quan Thuế (CQT)",
  [SYSTEM_LOG_CATEGORY.INVOICE_QUEUE]: "Hàng đợi Hóa đơn",
  [SYSTEM_LOG_CATEGORY.SYSTEM_ERROR]: "Lỗi Kỹ thuật / Gateway",
  [SYSTEM_LOG_CATEGORY.BACKUP]: "Sao lưu & Khôi phục",
  [SYSTEM_LOG_CATEGORY.SUBSCRIPTION]: "Gói dịch vụ & Hạn mức",
  [SYSTEM_LOG_CATEGORY.SECURITY]: "Bảo mật & Phiên làm việc",
};

export interface ISystemAuditLog {
  id: string;
  timestamp: string;
  severity: TSystemLogSeverity;
  category: TSystemLogCategory;
  householdId?: string;
  householdName?: string;
  taxCode?: string;
  action: string;
  errorCode?: string;
  latencyMs?: number;
  ipAddress: string;
  userAgent?: string;
  technicalDetails: string;
}

export interface ISystemIncidentAlert {
  id: string;
  title: string;
  description: string;
  detectedAt: string;
  severity: TSystemLogSeverity;
  impactedHouseholdsCount: number;
  active: boolean;
  suggestion: string;
}

export interface ILockHouseholdRequest {
  id: string;
  reason: string;
}

export interface IChangeSubscriptionRequest {
  householdId: string;
  packageId?: string;
  planCode: TSubscriptionPlanCode;
  startDate?: string;
  expiryDate: string;
  note?: string;
}

export interface ISystemLogFilter {
  severity?: string;
  category?: string;
  householdId?: string;
  searchQuery?: string;
  timeRange?: string;
}
