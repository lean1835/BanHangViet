import type { IPageResponse } from "@/types/api";

// =========================================================================
// NCL-18-CN-001: Phân tích giờ cao điểm & ngày bán chạy
// =========================================================================

export interface IPeakHourlySalesData {
  hour: number; // 0..23
  label: string; // "00:00 - 01:00"
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  revenuePercentage: number;
}

export interface IPeakDayOfWeekSalesData {
  dayOfWeek: number; // 1=Thứ Hai .. 7=Chủ Nhật
  dayName: string; // "Thứ Hai" .. "Chủ Nhật"
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  revenuePercentage: number;
}

export interface ISalesHeatmapCell {
  dayOfWeek: number; // 1..7
  dayName: string;
  hourOfDay: number; // 0..23
  hourLabel: string;
  orderCount: number;
  totalRevenue: number;
  intensity: number; // 0.00 .. 1.00
}

export interface IPeakTimeSlot {
  dayName: string;
  hourLabel: string;
  orderCount: number;
  totalRevenue: number;
}

export interface IPeakSalesInsight {
  peakHour: number;
  peakHourLabel: string;
  peakHourRevenue: number;
  peakHourOrderCount: number;

  lowestHour: number;
  lowestHourLabel: string;
  lowestHourRevenue: number;
  lowestHourOrderCount: number;

  busiestDayOfWeek: number;
  busiestDayName: string;
  busiestDayRevenue: number;
  busiestDayOrderCount: number;

  quietestDayOfWeek: number;
  quietestDayName: string;
  quietestDayRevenue: number;
  quietestDayOrderCount: number;

  topPeakSlots: IPeakTimeSlot[];
  recommendations: string[];
}

export interface IPeakFilterInfo {
  fromDate: string;
  toDate: string;
  posId: string | null;
  posName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface IPeakHoursAndDaysResponse {
  filterInfo: IPeakFilterInfo;
  hourlyStats: IPeakHourlySalesData[];
  dayOfWeekStats: IPeakDayOfWeekSalesData[];
  heatmap: ISalesHeatmapCell[];
  insights: IPeakSalesInsight;
}

export interface IPeakHoursAndDaysParams {
  fromDate?: string;
  toDate?: string;
  posId?: string;
}

// =========================================================================
// NCL-18-CN-002: Dự báo lượng hàng cần nhập cho kỳ tới
// =========================================================================

export interface IPurchaseSuggestion {
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  costPrice?: number;
  stockQuantity: number;
  minStockQuantity: number;
  averageWeeklySales: number;
  totalSoldInPeriod: number;
  suggestedQuantity: number;
  calculationRationale: string;
  hasPromotion: boolean;
  promotionWarning?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  lastSupplierId?: string | null;
  lastSupplierName?: string | null;
  lastSupplierPhone?: string | null;
}

export interface IPurchaseForecastParams {
  periodDays?: number;
  groupId?: string;
  page?: number;
  size?: number;
}

// =========================================================================
// NCL-18-CN-003: Cảnh báo mặt hàng bán chậm và tồn lâu
// =========================================================================

export interface ISlowMovingSummary {
  thresholdDays: number;
  totalStagnantProducts: number;
  totalStagnantStockQuantity: number;
  totalStagnantCapital: number;
  totalRetailValue: number;
}

export interface ISlowMovingProduct {
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  groupId?: string | null;
  groupName?: string | null;
  stockQuantity: number;
  costPrice?: number;
  price: number;
  stagnantCapital: number;
  retailInventoryValue: number;
  lastSaleDate?: string | null;
  daysWithoutSale: number;
}

export interface ISlowMovingProductListResponse {
  summary: ISlowMovingSummary;
  pageData: IPageResponse<ISlowMovingProduct>;
}

export interface ISlowMovingParams {
  thresholdDays?: number;
  groupId?: string;
  search?: string;
  page?: number;
  size?: number;
}
