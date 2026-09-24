import type {
  TExchangeType,
  TExchangeStatus,
  TExtraPaymentMethod,
} from "@/constants/productExchange";

export interface IProductExchangeItem {
  id: string;
  itemType: "RETURN_ITEM" | "EXCHANGE_ITEM";
  productId: string;
  invoiceItemId?: string | null;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRatePercentage: number;
  taxAmount: number;
  subtotal: number;
}

export interface IProductExchangeTicket {
  id: string;
  ticketNumber: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  originalOrderId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  exchangeType: TExchangeType;
  totalReturnAmount: number;
  totalExchangeAmount: number;
  differenceAmount: number;
  extraPaymentMethod?: TExtraPaymentMethod | string | null;
  additionalInvoiceId?: string | null;
  additionalInvoiceNumber?: string | null;
  status: TExchangeStatus | string;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  items: IProductExchangeItem[];
}

export interface IExchangeReturnItemPayload {
  invoiceItemId?: string;
  productId: string;
  quantity: number;
}

export interface IExchangeNewItemPayload {
  productId: string;
  quantity: number;
}

export interface ICheckExchangeEligibilityRequest {
  originalInvoiceId: string;
  returnItems: IExchangeReturnItemPayload[];
  exchangeItems: IExchangeNewItemPayload[];
}

export interface IExchangeEligibilityResponse {
  isEligible: boolean;
  exchangeType: TExchangeType;
  totalReturnAmount: number;
  totalExchangeAmount: number;
  differenceAmount: number;
  requireNewInvoice: boolean;
  redirectToReturnFlow: boolean;
  suggestedRefundAmount?: number | null;
  message: string;
}

export interface ICreateProductExchangeRequest {
  originalInvoiceId: string;
  returnItems: IExchangeReturnItemPayload[];
  exchangeItems: IExchangeNewItemPayload[];
  extraPaymentMethod?: TExtraPaymentMethod | string | null;
  reason?: string;
  notes?: string;
}

export interface IGetExchangeTicketsParams {
  invoiceId?: string;
  exchangeType?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}
