import type { TEInvoiceStatus } from "@/constants/eInvoice";

export type TInvoiceStatus = TEInvoiceStatus;

export interface IInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRatePercentage: number;
  taxAmount: number;
  discountAmount: number;
  subtotal: number;
}

export interface IInvoice {
  id: string;
  householdId?: string;
  householdName?: string;
  orderId?: string;
  orderNumber?: string;
  originalInvoiceId?: string;
  createdByUserId?: string;
  createdByUsername?: string;
  canceledByUserId?: string;
  canceledByUsername?: string;
  invoiceNumber?: string;
  invoicePattern?: string;
  invoiceSymbol?: string;
  buyerName?: string;
  buyerTaxCode?: string;
  buyerAddress?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  totalAmountBeforeTax?: number;
  taxAmount: number;
  discountAmount?: number;
  finalAmount: number;
  status: TInvoiceStatus;
  taxAuthorityCode: string;
  taxAuthorityResponse?: string;
  cancelReason?: string;
  lookupCode: string;
  symbol: string;
  customer: string;
  amount: number;
  time: string;
  sentToTaxAt?: string;
  taxResponseAt?: string;
  canceledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: IInvoiceItem[];
  deliveryLogs?: import("./IInvoiceDelivery").IDeliveryLog[];
}

export interface IGetInvoicesParams {
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface ICancelInvoiceRequest {
  invoiceId: string;
  cancelReason: string;
}

export interface IUpdateInvoiceRequest {
  invoiceId: string;
  buyerName?: string;
  buyerTaxCode?: string;
  buyerAddress?: string;
  buyerPhone?: string;
  buyerEmail?: string;
}

export interface ICreateAdjustmentInvoiceItemRequest {
  productId?: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRatePercentage: number;
  discountAmount: number;
}

export interface ICreateAdjustmentInvoiceRequest {
  adjustmentReason: string;
  buyerName?: string;
  buyerTaxCode?: string;
  buyerAddress?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  items: ICreateAdjustmentInvoiceItemRequest[];
}

export interface IAdjustInvoiceParams {
  invoiceId: string;
  body: ICreateAdjustmentInvoiceRequest;
}
