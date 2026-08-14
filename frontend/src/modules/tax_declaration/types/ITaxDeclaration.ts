export type TTaxPeriodType = "QUARTER" | "MONTH";

export interface ITaxPeriodOption {
  value: string;
  label: string;
  type: TTaxPeriodType;
  quarter?: number;
  month?: number;
  year: number;
  startDate: string;
  endDate: string;
}

export interface ITaxRateGroupSummary {
  taxRatePercentage: number;
  categoryLabel: string;
  revenueBeforeTax: number;
  vatRatePercent: number;
  vatAmount: number;
  pitRatePercent: number;
  pitAmount: number;
  totalTaxAmount: number;
}

export interface ITaxDeclarationSummary {
  periodCode: string;
  periodLabel: string;
  year: number;
  startDate: string;
  endDate: string;
  status: "OPEN" | "LOCKED";
  householdName: string;
  taxCode: string;
  representativeName?: string;
  address: string;
  phoneNumber: string;
  taxAuthorityName: string;
  totalRevenue: number;
  totalVatAmount: number;
  totalPitAmount: number;
  totalPayableTaxAmount: number;
  taxGroups: ITaxRateGroupSummary[];
  validInvoicesCount: number;
  adjustedInvoicesCount: number;
  cancelledInvoicesCount: number;
  lockedAt?: string;
  lockedBy?: string;
}

export interface ITaxAnnexInvoice {
  id: string;
  invoiceNumber: string;
  invoiceSeries: string;
  issuedDate: string;
  buyerName: string;
  buyerTaxCode?: string;
  preTaxAmount: number;
  taxRatePercentage: number;
  taxAmount: number;
  finalAmount: number;
  taxAuthorityCode?: string;
  isAdjustment: boolean;
  originalInvoiceNumber?: string;
}

export type TTaxExportFormat = "PDF" | "EXCEL" | "XML";

export interface ITaxExportPayload {
  periodCode: string;
  exportFormat: TTaxExportFormat;
  exportedAt: string;
  totalTaxAmount: number;
  householdTaxCode: string;
  representativeName?: string;
}
