import type {
  TReturnTicketStatus,
  TRefundPaymentMethod,
} from "@/constants/returnTicket";

export interface IReturnTicketItem {
  id?: string;
  invoiceItemId?: string;
  productId?: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRatePercentage: number;
  taxAmount: number;
  subtotal: number;
}

export interface IReturnTicket {
  id: string;
  ticketNumber: string;
  householdId?: string;
  originalInvoiceId: string;
  originalInvoiceNumber?: string;
  originalInvoiceLookupCode?: string;
  originalOrderId?: string;
  customerId?: string;
  customerName?: string;
  createdByUserId?: string;
  createdByUserName?: string;
  approvedByUserId?: string;
  approvedByUserName?: string;
  totalReturnAmount: number;
  refundPaymentMethod: TRefundPaymentMethod | string;
  status: TReturnTicketStatus | string;
  reason?: string;
  rejectReason?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: IReturnTicketItem[];
}

export interface IReturnableItemDto {
  invoiceItemId: string;
  productId?: string;
  productName: string;
  unit: string;
  boughtQuantity: number;
  alreadyReturnedQuantity: number;
  returnableQuantity: number;
  unitPrice: number;
  taxRatePercentage: number;
}

export interface IInvoiceReturnableCheckResponse {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  buyerName?: string;
  isEligibleForReturn: boolean;
  isExpired: boolean;
  daysSinceIssued: number;
  maxReturnDays: number;
  ineligibilityReason?: string | null;
  items: IReturnableItemDto[];
}

export interface ICreateReturnTicketItemRequest {
  invoiceItemId?: string;
  productId?: string;
  productName?: string;
  quantity: number;
}

export interface ICreateReturnTicketRequest {
  originalInvoiceId: string;
  reason?: string;
  refundPaymentMethod?: TRefundPaymentMethod | string;
  allowOverdueOverride?: boolean;
  items: ICreateReturnTicketItemRequest[];
}

export interface IRejectReturnTicketRequest {
  rejectReason: string;
}

export interface IGetReturnTicketsParams {
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface IGetReturnTicketStatisticsParams {
  fromDate?: string;
  toDate?: string;
  topLimit?: number;
}

export interface IReturnItemRankingResponse {
  productId?: string;
  productName: string;
  sku?: string;
  unit: string;
  totalReturnedQuantity?: number;
  totalReturnAmount?: number;
  returnTicketCount?: number;
  percentageOfTotalAmount?: number;
  // Legacy aliases
  returnCount?: number;
  returnedQuantity?: number;
  returnedAmount?: number;
  percentageOfTotalRefund?: number;
}

export interface IRefundPaymentMethodSummary {
  paymentMethod: string;
  paymentMethodName: string;
  ticketCount: number;
  totalAmount: number;
}

export interface IDailyReturnStatistic {
  date: string;
  ticketCount: number;
  totalReturnAmount: number;
  totalReturnedQuantity: number;
}

export interface IReturnTicketStatisticsResponse {
  fromDate: string;
  toDate: string;
  totalTickets: number;
  approvedTicketsCount: number;
  pendingTicketsCount: number;
  rejectedTicketsCount: number;
  totalRefundAmount: number;
  totalReturnedQuantity: number;
  topReturnedProducts: IReturnItemRankingResponse[];
  paymentMethodSummaries: IRefundPaymentMethodSummary[];
  dailyTimeline: IDailyReturnStatistic[];
  returnTickets: IReturnTicket[];
}
