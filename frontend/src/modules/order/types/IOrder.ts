import { ORDER_PAYMENT_METHOD, ORDER_STATUS } from "@/constants/order";

type TOrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
type TOrderPaymentMethod =
  (typeof ORDER_PAYMENT_METHOD)[keyof typeof ORDER_PAYMENT_METHOD];

export interface IApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface IOrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRatePercentage: number;
  taxAmount: number;
  subtotal: number;
}

export interface IOrderResponse {
  id: string;
  orderNumber: string;
  householdId: string;
  shiftId: string;
  createdByUserId: string;
  createdByUsername: string;
  customerId: string | null;
  customerName: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: TOrderPaymentMethod | null;
  paymentStatus: string;
  status: TOrderStatus;
  syncStatus: string;
  isOffline: boolean;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: IOrderItemResponse[];
  warningMessages: string[];
  qrCodeUrl: string | null;
  changeAmount: number | null;
}
