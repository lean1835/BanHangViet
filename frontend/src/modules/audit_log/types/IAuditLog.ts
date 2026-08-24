export interface IActivityLog {
  id: string;
  sequenceNumber: number;
  householdId?: string;
  userId?: string;
  username?: string;
  fullName?: string;
  action: string;
  targetTable: string;
  targetId?: string;
  oldValue?: string;
  newValue?: string;
  clientIp?: string;
  userAgent?: string;
  previousHash?: string;
  hash: string;
  createdAt: string;
}

export interface IAuditIntegrityResponse {
  valid: boolean;
  totalRecordsChecked: number;
  corruptedSequenceNumber?: number | null;
  corruptedLogId?: string | null;
  failureReason?: string | null;
  verifiedAt: string;
}

export interface IActivityLogFilterParams {
  username?: string;
  action?: string;
  targetTable?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}
