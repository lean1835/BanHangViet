import type {
  TBackupType,
  TBackupTriggerType,
  TBackupStatus,
  TRestoreStatus,
} from "@/constants/backupRestore";

export interface IBackupConfig {
  id: string;
  householdId: string;
  isAutoBackupEnabled: boolean;
  scheduledTime: string;
  retentionCount: number;
  backupType: TBackupType;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateBackupConfigRequest {
  isAutoBackupEnabled: boolean;
  scheduledTime: string;
  retentionCount: number;
  backupType: TBackupType;
}

export interface IBackupHistory {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  backupType: TBackupType;
  triggerType: TBackupTriggerType;
  status: TBackupStatus;
  notes?: string | null;
  createdByUserId?: string | null;
  createdByUserName?: string | null;
  backupTime: string;
  createdAt: string;
}

export interface IBackupStatusOverview {
  isAutoBackupEnabled: boolean;
  scheduledTime: string;
  retentionCount: number;
  lastBackupTime?: string | null;
  lastBackupStatus?: TBackupStatus | null;
  lastBackupFileName?: string | null;
  activeBackupCount: number;
  totalStorageSizeBytes: number;
}

export interface IRestorePreview {
  backupHistoryId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  backupType: TBackupType;
  triggerType: TBackupTriggerType;
  status: string;
  backupTime: string;
  createdByUserName?: string | null;
  isEligibleForRestore: boolean;
  summaryDescription: string;
  warningMessage?: string | null;
}

export interface IRestoreDataRequest {
  backupHistoryId: string;
  confirm: boolean;
  notes?: string;
}

export interface IRestoreResult {
  restoreHistoryId: string;
  backupHistoryId: string;
  backupFileName: string;
  backupType: TBackupType;
  status: TRestoreStatus;
  message: string;
  restoredAt: string;
  restoredByUserName: string;
}

export interface IRestoreHistory {
  id: string;
  backupHistoryId: string;
  backupFileName: string;
  backupType: TBackupType;
  status: TRestoreStatus;
  notes?: string | null;
  restoredByUserId?: string | null;
  restoredByUserName?: string | null;
  restoredAt: string;
  createdAt: string;
}
