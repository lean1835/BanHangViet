export interface ICustomerDebtResponse {
  id: string;
  householdId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  remainingAmount: number;
  type: "DEBT_CREATED" | "DEBT_PAID" | string;
  status: "PENDING" | "PAID" | "OVERDUE" | string;
  dueDate?: string;
  notes?: string;
  createdByUserId?: string;
  createdByUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICollectDebtRequest {
  customerId: string;
  amount: number;
  notes?: string;
}

export interface IDebtSummaryResponse {
  totalActiveDebt: number;
  totalOverdueDebt: number;
  totalDebtors: number;
}
