export type TRevenueWarningStatus =
  | "BELOW_WARNING"
  | "WARNING_TRIGGERED"
  | "EXCEEDED"
  | "ALREADY_MANDATORY";

export interface IMonthlyRevenueBreakdown {
  month: number;
  revenue: number;
  taxAmount: number;
  validInvoiceCount: number;
  cumulativeRevenue: number;
  percentageOfThreshold: number;
}

export interface IAnnualRevenueTrackingResponse {
  year: number;
  householdId: string;
  householdName: string;
  taxCode: string;
  mandatoryThreshold: number;
  warningThresholdPercentage: number;
  warningRevenueAmount: number;
  cumulativeRevenue: number;
  cumulativeTaxAmount: number;
  validInvoiceCount: number;
  thresholdPercentage: number;
  averageMonthlyRevenue: number;
  elapsedMonths: number;
  projectedReachDate: string | null;
  projectedInCurrentYear: boolean | null;
  remainingRevenueToThreshold: number;
  warningStatus: TRevenueWarningStatus;
  isMandatory: boolean;
  isMandatoryFromBeginning: boolean;
  shouldShowWarning: boolean;
  warningMessage: string | null;
  legalObligationNotice: string | null;
  monthlyBreakdown: IMonthlyRevenueBreakdown[];
}

export interface IUpdateWarningThresholdRequest {
  warningThresholdPercentage: number;
}

export interface IUpdateWarningThresholdResponse {
  householdId: string;
  warningThresholdPercentage: number;
  warningRevenueAmount: number;
  updatedAt?: string;
}
