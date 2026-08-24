export type TTaxPeriodType = "QUARTERLY" | "MONTHLY";

export type TTaxPeriodStatus = "DRAFT" | "GENERATED" | "SUBMITTED" | "LOCKED";

export interface ITaxDeclarationPeriodResponse {
  id: string;
  householdId: string;
  periodName: string;
  periodType: TTaxPeriodType;
  year: number;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: TTaxPeriodStatus;
  totalValidInvoices: number;
  totalRevenue: number;
  totalTaxAmount: number;
  createdByName?: string;
  lockedAt?: string;
  lockedByName?: string;
  createdAt: string;
}

export interface ITaxRateRevenueSummaryItem {
  taxRatePercentage: number;
  taxRateName: string;
  revenueAmount: number;
  taxAmount: number;
  invoiceCount: number;
}

export interface ITaxRevenueSummaryResponse {
  periodId: string;
  periodName: string;
  periodType: string;
  year: number;
  periodNumber: number;
  totalRevenue: number;
  totalTaxAmount: number;
  taxRateSummaries: ITaxRateRevenueSummaryItem[];
}

export interface ITaxSalesRegisterItemResponse {
  id: string;
  periodId: string;
  invoiceId: string;
  invoicePattern: string;
  invoiceSymbol: string;
  invoiceNumber: string;
  issueDate: string;
  buyerName?: string;
  buyerTaxCode?: string;
  taxRatePercentage: number;
  revenueAmount: number;
  taxAmount: number;
  invoiceType: "ORIGINAL" | "ADJUSTMENT_DECREASE" | "ADJUSTMENT_INCREASE";
  notes?: string;
  createdAt: string;
}

export interface IGenerateTaxRegisterRequest {
  periodType: TTaxPeriodType;
  year: number;
  periodNumber: number;
}

export type TTaxExportFormat = "PDF" | "EXCEL" | "XML";

export interface ITaxPeriodOption {
  value: string;
  label: string;
  type: TTaxPeriodType;
  periodNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  periodId?: string;
  status?: TTaxPeriodStatus;
}
