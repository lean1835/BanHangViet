export type TTaxConnectionStatus = "ONLINE" | "SLOW" | "OFFLINE";

export interface ITaxConnectionStatusResponse {
  status: TTaxConnectionStatus;
  responseTimeMs: number;
  lastSuccessfulResponseAt: string | null;
  pendingQueueCount: number;
  userGuideMessage?: string;
  checkedAt: string;
}

export interface ITaxConnectionLogItem {
  id: string;
  status: TTaxConnectionStatus;
  responseTimeMs: number;
  lastSuccessfulResponseAt: string | null;
  pendingQueueCount: number;
  errorMessage?: string;
  createdAt: string;
}

export interface ITaxConnectionHistoryResponse {
  householdId: string;
  totalLogs: number;
  historyLogs: ITaxConnectionLogItem[];
}
