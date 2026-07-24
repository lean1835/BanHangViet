import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";

export interface IDailyRevenueProjection {
  salesDate: string;
  orderCount: number;
  grossSales: number;
  totalDiscounts: number;
  netRevenue: number;
  cashRevenue: number;
  bankRevenue: number;
  debtRevenue: number;
}

export interface IProductRevenueProjection {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantitySold: number;
  revenue: number;
}

export interface IDashboardOverviewResponse {
  totalRevenue: number;
  orderCount: number;
  issuedInvoiceCount: number;
  dailyRevenues: IDailyRevenueProjection[];
}

export interface IReconciliationResponse {
  date: string;
  totalCash: number;
  totalTransfer: number;
  totalDebt: number;
  closingCashExpected: number;
  closingCashActual: number;
  errorInvoicesCount: number;
  errorInvoices: IInvoice[];
}

export interface ICompareRevenueResponse {
  period1Revenue: number;
  period2Revenue: number;
  differenceAmount: number;
  differencePercentage: number;
}

export interface IActivityLogResponse {
  id: string;
  username: string;
  fullName: string;
  action: string;
  targetTable: string;
  targetId: string;
  oldValue: string;
  newValue: string;
  clientIp: string;
  userAgent: string;
  createdAt: string;
}
