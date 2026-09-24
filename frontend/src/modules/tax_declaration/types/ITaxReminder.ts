/**
 * Nhắc lịch nộp tờ khai theo kỳ
 * Data models and TypeScript types for tax filing reminders and checklist progress
 */

export interface ITaxReminderSettingsResponse {
  householdId: string;
  householdName: string;
  taxPeriodType: "MONTHLY" | "QUARTERLY" | string;
  taxReminderDaysBefore: number;
  taxReminderEnabled: boolean;
  updatedAt?: string;
}

export interface IUpdateTaxReminderSettingsRequest {
  taxPeriodType: "MONTHLY" | "QUARTERLY" | string;
  taxReminderDaysBefore: number;
  taxReminderEnabled: boolean;
}

export interface ITaxPeriodChecklistResponse {
  salesRegisterGenerated: boolean;
  salesRegisterUrl: string;

  purchaseRegisterGenerated: boolean;
  purchaseRegisterUrl: string;

  declarationExported: boolean;
  declarationExportUrl: string;

  periodLocked: boolean;
  periodLockUrl: string;
}

export interface ITaxPeriodReminderResponse {
  periodId: string;
  periodName: string;
  periodType: "MONTHLY" | "QUARTERLY" | string;
  year: number;
  periodNumber: number;
  startDate: string;
  endDate: string;
  filingDeadline: string; // ISO date string yyyy-MM-dd
  daysRemaining: number; // positive: days left, negative: overdue days
  isOverdue: boolean;
  severity: "INFO" | "WARNING" | "DANGER" | string;
  status: "DRAFT" | "GENERATED" | "SUBMITTED" | "LOCKED" | string;
  isClosed: boolean;
  notificationId?: string;
  checklist: ITaxPeriodChecklistResponse;
  title: string;
  message: string;
  actionUrl: string;
  createdAt?: string;
}

export interface ITaxReminderScanResultResponse {
  householdsScanned: number;
  notificationsCreated: number;
  notificationsUpdated: number;
  notificationsClosed: number;
  activeReminders: ITaxPeriodReminderResponse[];
}
