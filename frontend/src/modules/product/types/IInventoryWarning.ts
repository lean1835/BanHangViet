import type { IPageResponse } from "@/types/api";

export interface ILowStockWarning {
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  minStockQuantity: number;
  shortageQuantity: number;
  groupId?: string | null;
  groupName?: string | null;
  lastSupplierId?: string | null;
  lastSupplierName?: string | null;
  lastSupplierPhone?: string | null;
}

export interface ILowStockWarningListResponse {
  page: IPageResponse<ILowStockWarning>;
  isStockAdequate: boolean;
  message: string;
}

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

export interface IUpdateMinStockPayload {
  minStockQuantity: number;
}

export interface ILowStockWarningParams {
  search?: string;
  groupId?: string;
  page?: number;
  size?: number;
}

export interface IPurchaseSuggestionParams {
  periodDays?: number;
  groupId?: string;
  page?: number;
  size?: number;
}

export interface IInventoryWarningFilterState {
  search: string;
  groupId: string;
  periodDays: number;
  activeTab: "warnings" | "suggestions";
}
