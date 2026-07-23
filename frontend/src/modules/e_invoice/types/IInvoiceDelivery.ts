export type TDeliveryMethod = "QR" | "ZALO" | "EMAIL" | "PRINT";

export interface IDeliveryLog {
  id: string;
  invoiceId: string;
  method: TDeliveryMethod;
  recipient: string;
  sentAt: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  note?: string;
}

export interface ISendZaloRequest {
  invoiceId: string;
  phoneNumber: string;
  customerName?: string;
  note?: string;
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
  householdName?: string;
  householdTaxCode?: string;
  householdAddress?: string;
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

