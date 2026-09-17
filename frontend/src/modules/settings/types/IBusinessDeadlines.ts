export interface IBusinessDeadlinesConfig {
  id?: string;
  householdId?: string;

  // 1. Nhóm Hóa đơn điện tử & Thuế (QTN-06)
  autoRetryEnabled: boolean;
  maxRetryAttempts: number; // 1 - 10 lần
  retryIntervalMinutes: number; // 5 - 1440 phút
  maxRetryHoursDeadline: number; // 1 - 168 giờ (7 ngày)

  // 2. Nhóm Bán hàng, Ca & Ngoại tuyến (QTN-15, QTN-11)
  maxOrderHoldingHours: number; // 1 - 72 giờ
  bankTransferTimeoutMinutes: number; // 1 - 1440 phút (24h)
  offlineSyncHoursDeadline: number; // 1 - 72 giờ

  // 3. Nhóm Đổi trả hàng & Quản lý Công nợ (QTN-18, QTN-14)
  returnPolicyDays: number; // 1 - 90 ngày
  debtReminderDaysBefore: number; // 1 - 30 ngày

  // 4. Nhóm Ngưỡng kiểm soát tài chính & ca làm việc
  expenseApprovalThreshold: number; // VNĐ (ví dụ: 5.000.000)
  shiftDifferenceThreshold: number; // VNĐ (ví dụ: 100.000)

  updatedAt?: string;
}

export interface IBusinessDeadlinesAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  settingKey: string;
  settingLabel: string;
  oldValue: string;
  newValue: string;
  reason?: string;
}

export const DEFAULT_BUSINESS_DEADLINES: IBusinessDeadlinesConfig = {
  autoRetryEnabled: true,
  maxRetryAttempts: 3,
  retryIntervalMinutes: 15,
  maxRetryHoursDeadline: 24,
  maxOrderHoldingHours: 12,
  bankTransferTimeoutMinutes: 15,
  offlineSyncHoursDeadline: 24,
  returnPolicyDays: 7,
  debtReminderDaysBefore: 3,
  expenseApprovalThreshold: 5000000,
  shiftDifferenceThreshold: 100000,
};

export const DEADLINES_VALIDATION_BOUNDS = {
  maxRetryAttempts: { min: 1, max: 10, unit: "lần" },
  retryIntervalMinutes: { min: 5, max: 1440, unit: "phút" },
  maxRetryHoursDeadline: { min: 1, max: 168, unit: "giờ" },
  maxOrderHoldingHours: { min: 1, max: 72, unit: "giờ" },
  bankTransferTimeoutMinutes: { min: 1, max: 1440, unit: "phút" },
  offlineSyncHoursDeadline: { min: 1, max: 72, unit: "giờ" },
  returnPolicyDays: { min: 1, max: 90, unit: "ngày" },
  debtReminderDaysBefore: { min: 1, max: 30, unit: "ngày" },
  expenseApprovalThreshold: { min: 0, max: 1000000000, unit: "VNĐ" },
  shiftDifferenceThreshold: { min: 0, max: 100000000, unit: "VNĐ" },
} as const;

export interface IBackendAutoRetrySettings {
  id?: string;
  householdId?: string;
  autoRetryEnabled?: boolean;
  maxRetryAttempts?: number;
  retryIntervalMinutes?: number;
  maxRetryHoursDeadline?: number;
  maxOrderHoldingHours?: number;
  bankTransferTimeoutMinutes?: number;
  expenseApprovalThreshold?: number;
  shiftDifferenceThreshold?: number;
  returnDaysLimit?: number;
  maxOfflineSyncHours?: number;
  debtReminderDaysBefore?: number;
  updatedAt?: string;
}

export const mapBackendToUiDeadlines = (be: Partial<IBackendAutoRetrySettings>): IBusinessDeadlinesConfig => {
  return {
    ...DEFAULT_BUSINESS_DEADLINES,
    ...(be as any),
    returnPolicyDays: be.returnDaysLimit ?? (be as any).returnPolicyDays ?? DEFAULT_BUSINESS_DEADLINES.returnPolicyDays,
    offlineSyncHoursDeadline: be.maxOfflineSyncHours ?? (be as any).offlineSyncHoursDeadline ?? DEFAULT_BUSINESS_DEADLINES.offlineSyncHoursDeadline,
  };
};

export const mapUiToBackendDeadlines = (ui: Partial<IBusinessDeadlinesConfig>): IBackendAutoRetrySettings => {
  return {
    ...ui,
    returnDaysLimit: ui.returnPolicyDays,
    maxOfflineSyncHours: ui.offlineSyncHoursDeadline,
  };
};

