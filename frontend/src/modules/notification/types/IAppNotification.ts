export type TNotificationSeverity = "INFO" | "WARNING" | "DANGER";

export interface IAppNotificationResponse {
  id: string;
  notificationType: string;
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
