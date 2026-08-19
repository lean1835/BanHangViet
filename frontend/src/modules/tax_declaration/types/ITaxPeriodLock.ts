export interface IUnlockTaxPeriodRequest {
  reason: string;
}

export interface IPeriodLockAudit {
  id: string;
  periodId?: string;
  periodName?: string;
  action: "LOCK_TAX_PERIOD" | "UNLOCK_TAX_PERIOD" | "GENERATE_TAX_SALES_REGISTER" | "EXPORT_TAX_DECLARATION";
  performedBy: string;
  performedAt: string;
  reason?: string;
  notes?: string;
  totalRevenue?: number;
  totalTaxAmount?: number;
}

export interface IRolloverAdjustment {
  id: string;
  originalInvoiceNumber: string;
  originalInvoiceSeries: string;
  returnTicketNumber: string;
  originalPeriod: string;
  rolloverPeriod: string;
  adjustmentAmount: number;
  adjustmentTaxAmount: number;
  approvedDate: string;
  reason: string;
}
