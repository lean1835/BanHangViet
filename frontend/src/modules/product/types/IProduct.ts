import type { TProductStatus } from "@/modules/product/types/TProductStatus";

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
