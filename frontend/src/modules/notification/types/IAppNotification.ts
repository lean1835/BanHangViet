export type TNotificationSeverity = "INFO" | "WARNING" | "DANGER";

export interface IAppNotificationResponse {
  id: string;
  notificationType: string;
  notificationCategory?: string;
  severity: TNotificationSeverity | string;
  title: string;
  message: string;
  actionUrl?: string;
  targetType?: string;
  targetId?: string;
  metadata?: string;
  isRead: boolean;
  readAt?: string | null;
  isClosed?: boolean;
  closedAt?: string | null;
  createdAt: string;
}

export interface INotificationBadgeCountResponse {
  unreadCount: number;
  unclosedCount: number;
  dangerCount: number;
  warningCount: number;
}

export interface INotificationSettingItemResponse {
  notificationType: string;
  title: string;
  description: string;
  category: string;
  isEnabled: boolean;
  isMandatory: boolean;
}

export interface INotificationFilterParams {
  severity?: string;
  notificationType?: string;
  isRead?: boolean;
  isClosed?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

export interface IUpdateNotificationSettingRequest {
  notificationType: string;
  isEnabled: boolean;
}

export interface IBatchUpdateNotificationSettingsRequest {
  settings: IUpdateNotificationSettingRequest[];
}
