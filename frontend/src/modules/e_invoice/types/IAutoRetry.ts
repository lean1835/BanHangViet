export interface IInvoiceAutoRetrySummaryResponse {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  movedToManualCount: number;
  issuedInvoiceIds: string[];
  manualProcessingInvoiceIds: string[];
}
