import type {
  TAdjustmentType,
  TPriceRoundingMethod,
  TBatchStatus,
} from "@/constants/priceAdjustment";

export interface IPriceAdjustmentItemPreview {
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  groupName?: string | null;
  oldPrice: number;
  newPrice: number;
  priceDifference: number;
  percentChange: number;
  costPrice: number;
  isBelowCost: boolean;
}

export interface IPriceAdjustmentPreviewRequest {
  targetGroupId?: string;
  productIds?: string[];
  adjustmentType: TAdjustmentType;
  adjustmentValue: number;
  roundingMethod?: TPriceRoundingMethod;
}

export interface IPriceAdjustmentPreviewResponse {
  adjustmentType: TAdjustmentType;
  adjustmentValue: number;
  roundingMethod: TPriceRoundingMethod;
  totalItems: number;
  increasedItems: number;
  decreasedItems: number;
  unchangedItems: number;
  belowCostItems: number;
  items: IPriceAdjustmentItemPreview[];
}

export interface IApplyPriceAdjustmentRequest {
  name: string;
  targetGroupId?: string;
  productIds?: string[];
  adjustmentType: TAdjustmentType;
  adjustmentValue: number;
  roundingMethod?: TPriceRoundingMethod;
}

export interface IRevertPriceAdjustmentRequest {
  revertReason: string;
}

export interface IPriceAdjustmentBatch {
  id: string;
  batchCode: string;
  name: string;
  adjustmentType: TAdjustmentType;
  adjustmentValue: number;
  targetGroupId?: string | null;
  targetGroupName?: string | null;
  roundingMethod: TPriceRoundingMethod;
  status: TBatchStatus;
  totalItems: number;
  belowCostItems: number;
  appliedBy: string;
  appliedByName?: string | null;
  appliedAt: string;
  revertedBy?: string | null;
  revertedByName?: string | null;
  revertedAt?: string | null;
  revertReason?: string | null;
  canRevert: boolean;
  items?: IPriceAdjustmentItemPreview[];
}

export interface IPriceAdjustmentBatchQueryParams {
  status?: TBatchStatus;
  page?: number;
  size?: number;
}
