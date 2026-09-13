export interface IUninvoicedOrderSummary {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  createdByUsername: string;
  createdByFullName: string;
  finalAmount: number;
  pendingDurationHours: number;
  pendingDurationDays: number;
}

export interface IPendingTaxInvoiceSummary {
  invoiceId: string;
  invoiceNumber?: string;
  orderNumber?: string;
  createdAt: string;
  createdByUsername: string;
  createdByFullName: string;
  finalAmount: number;
  status: string;
  pendingDurationHours: number;
  pendingDurationDays: number;
}

export interface IFailedInvoiceSummary {
  invoiceId: string;
  invoiceNumber?: string;
  orderNumber?: string;
  createdAt: string;
  createdByUsername: string;
  createdByFullName: string;
  finalAmount: number;
  status: string; // SEND_ERROR, MANUAL_PROCESSING
  taxAuthorityResponse?: string;
  errorCategory?: string;
  retryCount?: number;
  pendingDurationHours: number;
  pendingDurationDays: number;
}

export interface IDailyInvoiceControlResponse {
  controlDate: string;
  isCleanDay: boolean;
  totalUninvoicedOrders: number;
  totalPendingInvoices: number;
  totalFailedInvoices: number;
  totalTaxableRevenue?: number;
  totalTaxAmount?: number;
  validInvoicesCount?: number;
  uninvoicedOrders: IUninvoicedOrderSummary[];
  pendingInvoices: IPendingTaxInvoiceSummary[];
  failedInvoices: IFailedInvoiceSummary[];
}
