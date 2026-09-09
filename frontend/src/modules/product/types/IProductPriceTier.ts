export interface IProductPriceTier {
  id: string;
  productId: string;
  productName: string;
  unitConversionId?: string | null;
  unitName: string;
  tierName: string;
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
  isActive: boolean;
  costPrice?: number;
  isBelowCost?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreatePriceTierRequest {
  tierName: string;
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
  unitConversionId?: string | null;
  isActive?: boolean;
  confirmBelowCost?: boolean;
}

export interface IUpdatePriceTierRequest {
  tierName: string;
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
  unitConversionId?: string | null;
  isActive?: boolean;
  confirmBelowCost?: boolean;
}

export interface IBatchSavePriceTiersRequest {
  tiers: ICreatePriceTierRequest[];
  confirmBelowCost?: boolean;
}

export interface IResolveTierPriceRequest {
  quantity: number;
  unitConversionId?: string | null;
}

export interface IResolveTierPriceResponse {
  productId: string;
  productName: string;
  quantity: number;
  baseRetailPrice: number;
  matchedTierId?: string | null;
  matchedTierName?: string | null;
  appliedUnitPrice: number;
  costPrice: number;
  isBelowCost: boolean;
  savingAmountPerUnit: number;
  totalSavingAmount: number;
}
