export interface IInvoiceNumberRange {
  id: string;
  householdId: string;
  invoicePattern: string;
  invoiceSymbol: string;
  startNumber: number;
  endNumber: number;
  currentNumber: number;
  remainingCount: number;
  warningThreshold: number;
  dailyConsumptionRate?: number | null;
  status: "ACTIVE" | "WARNING_LOW" | "EXHAUSTED" | "INACTIVE";
  warningMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateInvoiceNumberRangeRequest {
  invoicePattern: string;
  invoiceSymbol: string;
  startNumber: number;
  endNumber: number;
  warningThreshold: number;
}
