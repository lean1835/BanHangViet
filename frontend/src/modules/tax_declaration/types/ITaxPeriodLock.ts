export interface ILockPeriodRequest {
  periodCode: string;
  year: number;
  notes?: string;
  lockedTotalRevenue: number;
  lockedTotalTax: number;
  validInvoicesCount: number;
}

export interface IUnlockPeriodRequest {
  periodCode: string;
  year: number;
  reason: string;
}

export interface IPeriodLockAudit {
  id: string;
  periodCode: string;
  periodLabel: string;
  action: "LOCK" | "UNLOCK";
  performedBy: string;
  performedAt: string;
  reason?: string;
  notes?: string;
  totalRevenueAtAction: number;
  totalTaxAtAction: number;
  validInvoicesCount: number;
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
