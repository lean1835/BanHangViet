export type CashTransactionType = "INCOME" | "EXPENSE";

export type CashTransactionStatus = "APPROVED" | "PENDING_APPROVAL" | "REJECTED" | "CANCELLED";

export const CASH_TRANSACTION_TYPE_LABELS: Record<CashTransactionType, string> = {
  INCOME: "Thu tiền",
  EXPENSE: "Chi tiền",
};

export const CASH_TRANSACTION_STATUS_LABELS: Record<CashTransactionStatus, string> = {
  APPROVED: "Đã duyệt",
  PENDING_APPROVAL: "Chờ duyệt",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
};

export const CASH_TRANSACTION_STATUS_BADGES: Record<CashTransactionStatus, { bg: string; text: string; border: string }> = {
  APPROVED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  PENDING_APPROVAL: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  REJECTED: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  CANCELLED: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

export interface ICashTransactionResponse {
  id: string;
  code: string;
  shiftId: string;
  categoryId: string | null;
  categoryName: string;
  type: CashTransactionType;
  amount: number;
  personName: string | null;
  notes: string | null;
  status: CashTransactionStatus;
  createdByUserId: string;
  createdByUsername: string;
  createdByFullName: string;
  approvedByUserId: string | null;
  approvedByFullName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCashTransactionRequest {
  type: CashTransactionType;
  shiftId?: string;
  categoryId?: string;
  categoryName: string;
  amount: number;
  personName?: string;
  notes?: string;
}

export interface IShiftCashSummaryResponse {
  shiftId: string;
  openingCash: number;
  cashSales: number;
  bankSales: number;
  totalSales: number;
  totalApprovedIncome: number;
  totalApprovedExpense: number;
  netCashChange: number;
  totalPendingExpense: number;
  pendingExpenseCount: number;
  handoverDifference: number;
  currentExpectedCash: number;
}

export interface ICashTransactionCategoryResponse {
  id: string;
  name: string;
  type: CashTransactionType;
  description: string | null;
  isActive: boolean;
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCashCategoryRequest {
  name: string;
  type: CashTransactionType;
  description?: string;
}

export interface IUpdateCashCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface IRejectCashExpenseRequest {
  reason: string;
}

export interface IUpdateExpenseThresholdRequest {
  expenseApprovalThreshold: number;
}
