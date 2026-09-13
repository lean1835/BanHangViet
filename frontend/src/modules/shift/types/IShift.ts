import { SHIFT_STATUS } from "@/constants/shift";

type TShiftStatus = (typeof SHIFT_STATUS)[keyof typeof SHIFT_STATUS];

export type { IApiResponse } from "@/types/api";

export interface IShiftResponse {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  householdId: string;
  pointOfSaleId?: string | null;
  pointOfSaleName?: string | null;
  posCode?: string | null;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCashExpected: number | null;
  closingCashActual: number | null;
  differenceAmount: number | null;
  differenceReason: string | null;
  cashRevenue?: number | null;
  bankRevenue?: number | null;
  totalRevenue?: number | null;
  status: TShiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IOpenShiftRequest {
  openingCash: number;
  userId?: string;
}

export interface ICloseShiftRequest {
  closingCashActual: number;
  differenceReason?: string;
}

// NCL-03-CN-012 & QTN-16: Đối soát giao dịch chuyển khoản ngân hàng trong ca
export interface IBankTransferItemResponse {
  paymentId: string;
  orderId: string;
  orderCode?: string | null;
  amount: number;
  transactionCode?: string | null;
  isConfirmed: boolean;
  confirmedAt?: string | null;
  confirmedByUserId?: string | null;
  confirmedByUsername?: string | null;
  confirmedByFullName?: string | null;
  notes?: string | null;
  isTransferOverdue?: boolean;
  createdAt: string;
  orderStatus?: string | null;
}

export interface IBankTransferReconciliationResponse {
  shiftId: string;
  shiftCode: string;
  totalTransactions: number;
  totalConfirmedAmount: number;
  unconfirmedTransactionsCount: number;
  totalUnconfirmedAmount: number;
  transactions: IBankTransferItemResponse[];
}

// NCL-03-CN-013 & QTN-15: Bàn giao ca giữa hai nhân viên
export interface IEligibleRecipientResponse {
  userId: string;
  username: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  hasOpenShift: boolean;
}

export interface IPendingOrderSummaryResponse {
  orderId: string;
  orderNumber: string;
  orderLabel?: string | null;
  tableName?: string | null;
  finalAmount: number;
  createdAt: string;
}

export interface IShiftHandoverSummaryResponse {
  shiftId: string;
  currentStage: number;
  senderUserId: string;
  senderUsername: string;
  senderFullName: string;
  posName?: string | null;
  posCode?: string | null;
  stageStartedAt: string;
  openingCash: number;
  cashRevenue: number;
  bankRevenue: number;
  totalRevenue: number;
  expectedCash: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  pendingExpenseCount?: number;
  totalPendingExpense?: number;
  pendingOrders: IPendingOrderSummaryResponse[];
  eligibleRecipients: IEligibleRecipientResponse[];
}

export interface IShiftHandoverRequest {
  shiftId?: string;
  recipientUserId: string;
  recipientPassword: string;
  actualCash: number;
  differenceReason?: string;
  notes?: string;
}

export interface IShiftHandoverResponse {
  id: string;
  shiftId: string;
  stageNumber: number;
  senderUserId: string;
  senderUsername: string;
  senderFullName: string;
  receiverUserId: string;
  receiverUsername: string;
  receiverFullName: string;
  handoverTime: string;
  openingCash: number;
  cashRevenue: number;
  expectedCash: number;
  actualCash: number;
  differenceAmount: number;
  differenceReason?: string | null;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  notes?: string | null;
  createdAt: string;
}

export interface IShiftStageDetailResponse {
  stageNumber: number;
  stageType: string;
  cashierUserId: string;
  cashierFullName: string;
  cashierUsername: string;
  startTime: string;
  endTime?: string | null;
  stageOpeningCash: number;
  stageCashRevenue: number;
  stageExpectedCash: number;
  stageActualCash?: number | null;
  stageDifferenceAmount?: number | null;
  stageDifferenceReason?: string | null;
  completedOrdersCount: number;
  receiverFullName?: string | null;
}

export interface IShiftStagesSummaryResponse {
  shiftId: string;
  shiftStatus: string;
  openedAt: string;
  closedAt?: string | null;
  shiftOpeningCash: number;
  totalShiftRevenue: number;
  totalDifferenceAmount: number;
  stages: IShiftStageDetailResponse[];
}
