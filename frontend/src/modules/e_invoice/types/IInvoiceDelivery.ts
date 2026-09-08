export type TDeliveryMethod = "QR" | "EMAIL" | "ZALO" | "PRINT";

export type TCustomerDeliveryStatus = "NOT_DELIVERED" | "DELIVERED" | "DELIVERY_FAILED";

export interface IDeliveryLog {
  id: string;
  invoiceId: string;
  method: TDeliveryMethod;
  recipient: string;
  sentAt: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  note?: string;
  errorMessage?: string;
}

export interface IFailedDeliveryHistory {
  attempt: number;
  channel: TDeliveryMethod;
  recipientAddress: string;
  errorMessage: string;
  sentAt: string;
}

export interface IFailedDeliveryItem {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  lookupCode: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  channel: "EMAIL" | "ZALO";
  recipientAddress: string;
  failureReason: string;
  failureCode?: string;
  lastAttemptAt: string;
  attemptCount: number;
  history: IFailedDeliveryHistory[];
}

export interface IRetryDeliveryRequest {
  invoiceId: string;
  channel: "EMAIL" | "ZALO";
  recipientAddress: string;
  saveAsCustomerDefault?: boolean;
  customerId?: string;
}

export interface ISendZaloRequest {
  invoiceId: string;
  phoneNumber: string;
  message?: string;
}

export interface ISendEmailRequest {
  invoiceId: string;
  email: string;
  subject?: string;
  content?: string;
}

export interface IInvoiceLookupParams {
  lookupCode?: string;
  invoiceNumber?: string;
  buyerPhone?: string;
}

export interface IInvoicePrintConfig {
  paperSize: "K80" | "A4" | "A5";
  docType: "TEMP_RECEIPT" | "VAT_INVOICE";
  showQr: boolean;
  copyCount: number;
}

export interface IPublicInvoiceItem {
  id?: string;
  productId?: string;
  productName: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  taxRatePercentage?: number;
  taxAmount?: number;
  discountAmount?: number;
  subtotal: number;
  createdAt?: string;
}

export interface IPublicInvoiceResponse {
  invoiceNumber?: string;
  invoicePattern?: string;
  invoiceSymbol?: string;
  title?: string;
  footerNote?: string;
  householdName?: string;
  householdTaxCode?: string;
  householdAddress?: string;
  householdPhone?: string;
  buyerName?: string;
  buyerTaxCode?: string;
  buyerAddress?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  status?: string;
  totalAmountBeforeTax?: number;
  taxAmount?: number;
  discountAmount?: number;
  finalAmount: number;
  createdAt?: string;
  taxAuthorityCode?: string;
  items?: IPublicInvoiceItem[];
  lookupCode?: string;
}

