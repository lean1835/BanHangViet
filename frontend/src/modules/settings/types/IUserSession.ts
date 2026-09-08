export interface IUserSession {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN" | string;
  deviceName: string;
  ipAddress: string;
  loginAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt?: string | null;
  revokeReason?: string | null;
  isCurrentSession: boolean;
}

export interface IRevokeSessionRequest {
  reason?: string;
}

export interface IRevokeAllSessionsRequest {
  reason?: string;
}

export interface ISessionSettings {
  householdId: string;
  sessionTimeoutMinutes: number;
}

export interface IUpdateSessionSettingsRequest {
  sessionTimeoutMinutes: number;
}
