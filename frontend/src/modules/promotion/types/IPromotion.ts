import type {
  TDiscountType,
  TPromotionApplyScope,
  TPromotionCalculatedState,
  TPromotionStatus,
} from "@/constants/promotion";

export interface IPromotion {
  id: string;
  name: string;
  description?: string | null;
  discountType: TDiscountType;
  discountValue: number;
  applyScope: TPromotionApplyScope;
  startDate: string;
  endDate: string;
  status: TPromotionStatus;
  calculatedState: TPromotionCalculatedState;
  createdByUserName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  totalProductsCount?: number;
  totalProductGroupsCount?: number;
}

export interface IProductSummary {
  id: string;
  sku: string;
  name: string;
  price: number;
}

export interface IProductGroupSummary {
  id: string;
  name: string;
}

export interface IPromotionDetail {
  id: string;
  name: string;
  description?: string | null;
  discountType: TDiscountType;
  discountValue: number;
  applyScope: TPromotionApplyScope;
  startDate: string;
  endDate: string;
  status: TPromotionStatus;
  calculatedState: TPromotionCalculatedState;
  createdByUserId?: string | null;
  createdByUserName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  products: IProductSummary[];
  productGroups: IProductGroupSummary[];
}

export interface IPromotionProductStat {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  discountAmount: number;
}

export interface IPromotionReport {
  promotionId: string;
  promotionName: string;
  description?: string | null;
  discountType: TDiscountType;
  discountValue: number;
  applyScope: TPromotionApplyScope;
  startDate: string;
  endDate: string;
  status: TPromotionStatus;
  calculatedState?: TPromotionCalculatedState;
  hasData: boolean;
  message?: string;
  totalOrdersCount?: number;
  totalQuantitySold?: number;
  promotionRevenue?: number;
  totalDiscountAmount?: number;
  baselineStartDate?: string;
  baselineEndDate?: string;
  baselineRevenue?: number;
  incrementalRevenue?: number;
  netResult?: number;
  productStats?: IPromotionProductStat[];
}

