export const INVITATION_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;

export type TInvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

export const ACCESS_SCOPES = {
  E_INVOICES: "E_INVOICES",
  FINANCIAL_REPORTS: "FINANCIAL_REPORTS",
  TAX_DECLARATION: "TAX_DECLARATION",
} as const;

export type TAccessScope =
  (typeof ACCESS_SCOPES)[keyof typeof ACCESS_SCOPES];

export const ACCESS_SCOPE_LABELS: Record<TAccessScope, string> = {
  [ACCESS_SCOPES.E_INVOICES]: "Hóa đơn điện tử",
  [ACCESS_SCOPES.FINANCIAL_REPORTS]: "Báo cáo doanh thu",
  [ACCESS_SCOPES.TAX_DECLARATION]: "Sổ sách kê khai thuế",
};

export const INVITATION_STATUS_LABELS: Record<TInvitationStatus, string> = {
  [INVITATION_STATUS.PENDING]: "Chờ chấp nhận",
  [INVITATION_STATUS.ACTIVE]: "Đang hoạt động",
  [INVITATION_STATUS.EXPIRED]: "Đã hết hạn",
  [INVITATION_STATUS.REVOKED]: "Đã thu hồi",
};

export interface IAccountantInvitation {
  id: string;
  householdId: string;
  householdName?: string;
  taxCode?: string;
  accountantName: string;
  phoneNumber: string;
  email: string;
  scopes: TAccessScope[];
  status: TInvitationStatus;
  inviteDate: string;
  expiryDate: string;
  revokedAt?: string;
  revokeReason?: string;
  createdBy: string;
}

export interface ICreateAccountantInviteRequest {
  accountantName: string;
  phoneNumber: string;
  email: string;
  scopes: TAccessScope[];
  expiryDate: string;
  createAccountMode?: "AUTO_GENERATE" | "MANUAL_PASSWORD";
  initialPassword?: string;
}

export interface IAccountantInviteResult {
  id: string;
  householdId: string;
  householdName?: string;
  accountantPhone: string;
  accountantEmail?: string;
  accountantName?: string;
  accessDurationDays: number;
  scopePermissions: string[];
  status: string;
  isNewAccountCreated?: boolean;
  accountantUsername?: string;
  temporaryPassword?: string;
  invitationExpiresAt?: string;
}

export interface IExtendAccountantAccessRequest {
  id: string;
  newExpiryDate: string;
}

export interface IRevokeAccountantAccessRequest {
  id: string;
  reason: string;
}

export interface IAuthorizedHousehold {
  id: string;
  name: string;
  taxCode: string;
  address: string;
  representativeName: string;
  scopes: TAccessScope[];
  expiryDate: string;
  isCurrent: boolean;
}
