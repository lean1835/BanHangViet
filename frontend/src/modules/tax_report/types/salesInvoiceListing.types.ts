export type EPeriodType = "MONTHLY" | "QUARTERLY";

export type EInvoiceType = "ORIGINAL" | "ADJUSTMENT_DECREASE" | "ADJUSTMENT_INCREASE";

export type ETaxPeriodStatus = "GENERATED" | "LOCKED";

export interface IGenerateTaxRegisterRequest {
  periodType: EPeriodType;
  year: number;
  periodNumber: number;
}

export interface ITaxPeriodResponse {
  id: string;
  householdId: string;
  periodName: string;
  periodType: EPeriodType;
  year: number;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: ETaxPeriodStatus;
  totalValidInvoices: number;
  totalRevenue: number;
  totalTaxAmount: number;
  createdByName?: string | null;
  lockedAt?: string | null;
  lockedByName?: string | null;
  createdAt?: string;
}

export interface ITaxSalesRegisterItem {
  id: string;
  periodId: string;
  invoiceId: string;
  invoicePattern: string;
  invoiceSymbol: string;
  invoiceNumber: string;
  issueDate: string;
  buyerName: string | null;
  buyerTaxCode: string | null;
  taxRatePercentage: number;
  revenueAmount: number;
  taxAmount: number;
  invoiceType: EInvoiceType;
  notes?: string | null;
  createdAt?: string;
}

export interface ITaxPeriodQueryParams {
  periodType: EPeriodType;
  periodNumber: number; // Month 1-12 or Quarter 1-4
  year: number;
  page?: number;
  size?: number;
  search?: string;
}
