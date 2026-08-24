import type {
  TAnomalyAlertType,
  TAnomalySeverity,
  TAnomalyAlertStatus,
} from "@/constants/anomalyAlert";

export interface IAnomalyAlert {
  id: string;
  householdId?: string | null;
  alertType: TAnomalyAlertType;
  severity: TAnomalySeverity;
  title: string;
  description: string;
  actorUserId?: string | null;
  actorUsername?: string | null;
  actorFullName?: string | null;
  status: TAnomalyAlertStatus;
  evidenceData?: string | null;
  detectedAt: string;
  reviewedByUserId?: string | null;
  reviewedByUsername?: string | null;
  reviewedByFullName?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

export interface IAnomalyAlertFilterParams {
  alertType?: TAnomalyAlertType | "";
  severity?: TAnomalySeverity | "";
  status?: TAnomalyAlertStatus | "";
  actorUsername?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface IAnomalyAlertSummary {
  totalAlerts: number;
  pendingAlerts: number;
  reviewedAlerts: number;
  dismissedAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  isCleanDay: boolean;
  evaluatedDate?: string | null;
  alertsByType?: Record<string, number>;
  lastScannedAt?: string | null;
}

export interface IReviewAnomalyAlertRequest {
  status: TAnomalyAlertStatus;
  reviewNotes?: string;
}

export interface IAnomalyRuleConfig {
  id: string;
  householdId: string;
  ruleType: TAnomalyAlertType;
  ruleName: string;
  thresholdValue: number;
  timeWindowMinutes: number;
  severity: TAnomalySeverity;
  isEnabled: boolean;
  updatedAt: string;
}

export interface IUpdateAnomalyRuleRequest {
  thresholdValue: number;
  timeWindowMinutes: number;
  severity: TAnomalySeverity;
  isEnabled: boolean;
}

export interface IScanAnomalyRequest {
  scanDate?: string;
}

export interface IScanAnomalyResult {
  scannedDate: string;
  newAlertsDetected: number;
  isCleanDay: boolean;
  summaryMessage: string;
  newAlerts: IAnomalyAlert[];
  completedAt: string;
}
