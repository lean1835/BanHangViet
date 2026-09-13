import { ORDER_PAYMENT_METHOD, ORDER_STATUS } from "@/constants/order";

type TOrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
type TOrderPaymentMethod =
  (typeof ORDER_PAYMENT_METHOD)[keyof typeof ORDER_PAYMENT_METHOD];

export type { IApiResponse } from "@/types/api";

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
  roundingDifference?: number;
  priceTierId?: string | null;
  priceTierName?: string | null;
  unitConversionId?: string | null;
  unitName?: string;
  conversionFactor?: number;
  baseQuantity?: number;
  isSoldByWeight?: boolean;
  decimalPlaces?: number;
  minWeightStep?: number;
}

export interface ICalculateWeightRequest {
  productId: string;
  buyAmount: number;
  unitConversionId?: string;
}

export interface ICalculateWeightResponse {
  productId: string;
  productName: string;
  buyAmount: number;
  unitPrice: number;
  calculatedQuantity: number;
  exactSubtotal: number;
  roundedSubtotal: number;
  roundingDifference: number;
  unitName: string;
  conversionFactor: number;
  minWeightStep: number;
  decimalPlaces: number;
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
  paidAmount?: number;
  debtAmount?: number;
  cancelReason?: string | null;
  cancelReasonDescription?: string | null;
  cancelReasonNote?: string | null;
  canceledByUserId?: string | null;
  canceledByUsername?: string | null;
  canceledByFullName?: string | null;
  canceledAt?: string | null;
  // NCL-03-CN-010: Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
  orderLabel?: string | null;
  diningTableId?: string | null;
  diningTableName?: string | null;
  diningTableArea?: string | null;
  isOverdue?: boolean | null;
  holdingDurationMinutes?: number | null;
  // NCL-03-CN-011 & NCL-03-CN-012: Thanh toán kết hợp & Xác nhận chuyển khoản
  payments?: IOrderPaymentResponse[];
  isBankTransferConfirmed?: boolean | null;
}

export interface ICancelOrderRequest {
  cancelReason: string;
  cancelReasonNote?: string;
}

export interface IOrderCancelReasonDto {
  code: string;
  description: string;
  requiresNote: boolean;
}

export interface ICancelReasonStatDto {
  reasonCode: string;
  reasonDescription: string;
  count: number;
  percentage: number;
}

export interface IEmployeeCancelStatDto {
  employeeId: string;
  employeeUsername: string;
  employeeFullName: string;
  count: number;
  totalAmount: number;
}

export interface ICanceledOrderSummaryDto {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  cancelReason: string;
  cancelReasonDescription: string;
  cancelReasonNote?: string | null;
  canceledByFullName?: string | null;
  canceledAt: string;
}

export interface ICanceledOrderStatisticsResponse {
  totalCanceledOrders: number;
  totalCanceledAmount: number;
  shiftId?: string | null;
  shiftName?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  byReason: ICancelReasonStatDto[];
  byEmployee: IEmployeeCancelStatDto[];
  recentCanceledOrders: ICanceledOrderSummaryDto[];
}

export interface ICanceledOrderStatisticsParams {
  shiftId?: string;
  fromDate?: string;
  toDate?: string;
}

// NCL-03-CN-010: Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
export interface IHeldOrderSummaryResponse {
  id: string;
  orderId?: string;
  orderNumber: string;
  orderLabel?: string | null;
  diningTableId?: string | null;
  diningTableName?: string | null;
  diningTableArea?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
  holdingDurationMinutes: number;
  isOverdue: boolean;
  createdByUserId?: string | null;
  createdByUsername?: string | null;
  createdByFullName?: string | null;
}

export interface IHoldOrderRequest {
  orderLabel?: string;
  diningTableId?: string;
}

export interface IUpdateOrderLabelRequest {
  orderLabel: string;
}

export interface ISwitchDiningTableRequest {
  newDiningTableId: string;
}

// NCL-03-CN-011 & NCL-03-CN-012: Thanh toán kết hợp & Xác nhận chuyển khoản ngân hàng
export interface IOrderPaymentRequest {
  paymentMethod: "CASH" | "BANK_TRANSFER" | "DEBT";
  amount: number;
  amountGiven?: number;
  transactionCode?: string;
  isConfirmed?: boolean;
  notes?: string;
  dueDate?: string;
}

export interface IOrderPaymentResponse {
  id: string;
  orderId: string;
  orderCode?: string | null;
  householdId?: string | null;
  paymentMethod: string;
  amount: number;
  amountGiven?: number | null;
  changeAmount?: number | null;
  transactionCode?: string | null;
  isConfirmed: boolean;
  confirmedAt?: string | null;
  confirmedByUserId?: string | null;
  confirmedByUsername?: string | null;
  confirmedByFullName?: string | null;
  notes?: string | null;
  isTransferOverdue?: boolean;
  createdAt: string;
}

export interface IConfirmBankTransferRequest {
  transactionCode: string;
  notes?: string;
}

export interface ISwitchPaymentMethodRequest {
  newPaymentMethod: "CASH" | "BANK_TRANSFER" | "DEBT";
  amountGiven?: number;
  customerId?: string;
  notes?: string;
}

export interface ICompleteOrderRequest {
  amountGiven?: number;
  dueDate?: string;
  payments?: IOrderPaymentRequest[];
}
