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

export interface IGrossProfitSummary {
  totalNetRevenue: number;
  totalCogs: number;
  totalGrossProfit: number;
  grossProfitMarginPercentage: number;
}

export interface IDailyGrossProfit {
  date: string;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  grossProfitMarginPercentage: number;
}

export interface IProductGrossProfit {
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  quantitySold: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  grossProfitMarginPercentage: number;
  isNegativeMargin: boolean;
}

export interface IMissingCostProduct {
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  quantitySold: number;
  netRevenue: number;
  warningMessage?: string;
}

export interface IGrossProfitReportResponse {
  summary: IGrossProfitSummary;
  dailyReports: IDailyGrossProfit[];
  itemReports: IProductGrossProfit[];
  missingCostPriceItems: IMissingCostProduct[];
}

export interface IShiftRevenueReportItem {
  shiftId: string;
  userId: string;
  username: string;
  employeeName: string;
  pointOfSaleId?: string;
  pointOfSaleName?: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCashExpected: number;
  closingCashActual: number;
  cashRevenue: number;
  bankTransferRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  canceledOrders: number;
  cashIncome: number;
  cashExpense: number;
  differenceAmount: number;
  differenceReason?: string;
  differenceExceeded?: boolean;
  isDifferenceExceeded?: boolean;
  handoversCount: number;
  status: string;
}

export interface IEmployeeRevenueSummary {
  userId: string;
  username: string;
  employeeName: string;
  totalShifts: number;
  totalCashRevenue: number;
  totalBankTransferRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  totalCanceledOrders: number;
  averageOrdersPerShift: number;
  averageRevenuePerShift: number;
  totalDifferenceAmount: number;
  exceededShiftsCount: number;
}

export interface IEmployeeShiftReportResponse {
  fromDate: string;
  toDate: string;
  appliedThreshold: number;
  totalShiftsCount: number;
  totalExceededShiftsCount: number;
  totalCashRevenue: number;
  totalBankTransferRevenue: number;
  totalRevenue: number;
  totalOrdersCount: number;
  totalCanceledOrdersCount: number;
  totalDifferenceAmount: number;
  shifts: IShiftRevenueReportItem[];
  employeeSummaries: IEmployeeRevenueSummary[];
}

export interface IPaymentMethodStat {
  method: string;
  methodName: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

export interface IDebtCollectionSummary {
  totalDebtCreated: number;
  totalDebtPaid: number;
  totalDebtRemaining: number;
}

export interface IDailyPaymentTrend {
  date: string;
  cashAmount: number;
  bankTransferAmount: number;
  debtAmount: number;
  totalAmount: number;
}

export interface IPaymentMethodReportResponse {
  totalRevenue: number;
  methods: IPaymentMethodStat[];
  debtDetails: IDebtCollectionSummary;
  dailyTrends: IDailyPaymentTrend[];
}

export interface IProductGroupRevenue {
  groupId: string;
  groupName: string;
  totalQuantitySold: number;
  revenue: number;
  percentage: number;
  previousPeriodRevenue: number;
  growthRatePercentage: number;
}

export interface IProductGroupReportResponse {
  totalRevenue: number;
  groups: IProductGroupRevenue[];
  unassignedSummary?: IProductGroupRevenue;
  hasUnassignedProducts: boolean;
}

export interface IProductRevenueInGroup {
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  quantitySold: number;
  revenue: number;
  percentageInGroup: number;
}

export interface IProductGroupRevenueDetailResponse {
  groupId: string;
  groupName: string;
  totalRevenue: number;
  items: IProductRevenueInGroup[];
}

