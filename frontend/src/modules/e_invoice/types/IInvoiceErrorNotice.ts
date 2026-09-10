export type TNoticeStatus =
  | "DRAFT"
  | "WAITING_TAX_RESPONSE"
  | "ACCEPTED"
  | "REJECTED";

export type TNoticeHandlingType = "CANCEL" | "ADJUST" | "REPLACE" | "EXPLAIN";

export interface IInvoiceErrorNoticeItem {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  invoicePattern?: string;
  invoiceSymbol?: string;
  taxAuthorityCode?: string;
  handlingType: TNoticeHandlingType | string;
  reason: string;
  createdAt?: string;
}

export interface IInvoiceErrorNotice {
  id: string;
  householdId?: string;
  noticeCode: string;
  noticeType: string;
  noticePlace?: string;
  taxAuthorityName?: string;
  status: TNoticeStatus | string;
  taxAuthorityCode?: string;
  taxAuthorityResponse?: string;
  sentToTaxAt?: string;
  taxResponseAt?: string;
  createdByUserName?: string;
  createdAt: string;
  items: IInvoiceErrorNoticeItem[];
}

export interface ICreateInvoiceErrorNoticeItemRequest {
  invoiceId: string;
  handlingType: TNoticeHandlingType | string;
  reason: string;
}

export interface ICreateInvoiceErrorNoticeRequest {
  noticePlace?: string;
  taxAuthorityName?: string;
  items: ICreateInvoiceErrorNoticeItemRequest[];
}

export interface IGetErrorNoticesParams {
  status?: string;
  page?: number;
  size?: number;
}
