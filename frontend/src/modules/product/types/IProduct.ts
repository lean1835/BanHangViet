import type { TProductStatus } from "@/modules/product/types/TProductStatus";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";

export interface IProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  stockQuantity: number;
  status: TProductStatus;
  groupId: string | null;
  groupName: string | null;
  taxRateId: string;
  taxRateName: string;
  taxRatePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface IGetProductsParams {
  search?: string;
  groupId?: string;
  status?: TProductStatus;
  stockFilter?: TStockFilter;
  page?: number;
  size?: number;
}

export type TProductPayload = Partial<IProduct> & { taxRateId: string };
