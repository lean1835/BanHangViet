export type TReconciliationStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface IDebtReconciliationItemResponse {
  id: string;
  transactionDate: string;
  type: "DEBT_CREATED" | "DEBT_PAID";
  typeDescription: string;
  referenceCode: string;
  debtId?: string;
  reconciliationId?: string;
  amount: number;
  runningBalance: number;
  notes?: string | null;
}

export interface IDebtReconciliationResponse {
  id: string;
  code: string;
  householdId?: string;
  householdName?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  creditLimit?: number;
  startDate: string;
  endDate: string;
  openingDebtBalance: number;
  totalDebtIncurred: number;
  totalDebtPaid: number;
  closingDebtBalance: number;
  closingDebtInWords: string;
  status: TReconciliationStatus;
  hasTransactions: boolean;
  notes?: string | null;
  reconciledToDate?: string | null;
  confirmedAt?: string | null;
  confirmedByUsername?: string | null;
  createdByUsername?: string | null;
  createdAt?: string;
  items: IDebtReconciliationItemResponse[];
}

export interface IDebtStatementPrintResponse {
  documentTitle: string;
  reconciliationCode: string;
  printedDate: string;

  // Household Info (Seller)
  householdName: string;
  householdTaxCode?: string;
  householdAddress?: string;
  householdPhone?: string;
  householdRepresentative?: string;

  // Customer Info (Buyer)
  customerName: string;
  customerPhone?: string;
  customerTaxCode?: string;
  customerAddress?: string;

  // Period
  startDate: string;
  endDate: string;

  // Balances
  openingDebtBalance: number;
  totalDebtIncurred: number;
  totalDebtPaid: number;
  closingDebtBalance: number;
  closingDebtInWords: string;

  hasTransactions: boolean;
  notes?: string | null;
  transactions: IDebtReconciliationItemResponse[];

  // Signatures
  sellerSignTitle: string;
  buyerSignTitle: string;
}

export interface IDebtReconciliationPreviewRequest {
  customerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface ICreateDebtReconciliationRequest {
  customerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  notes?: string;
  confirmNow?: boolean;
}

export interface IConfirmDebtReconciliationRequest {
  notes?: string;
}

export interface ICreateDebtAdjustmentRequest {
  customerId: string;
  adjustmentType: "DEBT_INCREASE" | "DEBT_DECREASE";
  amount: number;
  reason: string;
}

export interface IDebtReconciliationQueryParams {
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface IPageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
