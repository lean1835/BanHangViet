export type TSupplierDebtType = "DEBT_CREATED" | "DEBT_PAID";
export type TSupplierDebtStatus = "PENDING" | "PAID" | "OVERDUE";

export interface ISupplierDebt {
  id: string;
  householdId: string;
  supplierId: string;
  supplierName?: string | null;
  goodsReceiptId?: string | null;
  receiptNumber?: string | null;
  amount: number;
  remainingAmount: number;
  type: TSupplierDebtType;
  status: TSupplierDebtStatus;
  dueDate?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  createdByUserId?: string | null;
  createdByUserName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ISupplierDebtSummary {
  totalOutstandingDebt: number;
  totalSuppliersWithDebt: number;
  totalOverdueDebt: number;
}

export interface IPaySupplierDebtRequest {
  supplierId: string;
  amount: number;
  paymentMethod?: string;
  dueDate?: string | null;
  notes?: string | null;
}

export interface ISupplierDebtQueryParams {
  status?: string;
}
