import type {
  TDiscountType,
  TPromotionApplyScope,
  TPromotionStatus,
} from "@/constants/promotion";

export interface ICreatePromotionPayload {
  name: string;
  description?: string;
  discountType: TDiscountType;
  discountValue: number;
  applyScope: TPromotionApplyScope;
  startDate: string;
  endDate: string;
  productIds?: string[];
  productGroupIds?: string[];
}

export interface IUpdatePromotionPayload {
  name: string;
  description?: string;
  discountType: TDiscountType;
  discountValue: number;
  applyScope: TPromotionApplyScope;
  startDate: string;
  endDate: string;
  status?: TPromotionStatus;
  productIds?: string[];
  productGroupIds?: string[];
}

export interface IPromotionQueryParams {
  keyword?: string;
  status?: TPromotionStatus;
  applyScope?: TPromotionApplyScope;
  startDate?: string;
  endDate?: string;
  activeNowOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

export interface IPromotionPageResponse {
  content: import("./IPromotion").IPromotion[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface IOrderItemPromotionCheckRequest {
  productId: string;
  quantity: number;
  unitPrice?: number;
  bypassPromotion?: boolean;
}

export interface IAutoApplyPromotionRequest {
  items: IOrderItemPromotionCheckRequest[];
}

export interface IPromotionItemResultResponse {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  originalSubtotal: number;
  discountAmount: number;
  finalSubtotal: number;
  promotionId?: string | null;
  promotionName?: string | null;
  hasPromotion: boolean;
  bypassPromotion: boolean;
}

export interface IAutoApplyPromotionResponse {
  items: IPromotionItemResultResponse[];
  totalOriginalAmount: number;
  totalDiscountAmount: number;
  totalFinalAmount: number;
}
