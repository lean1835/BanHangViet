import type { IPageResponse } from "@/types/api";

export type TStockMovementChangeType = "IN" | "OUT" | "ADJUST" | "INITIAL";

export interface IStockMovement {
  id: string;
  documentId: string;
  documentType: string;
  documentTypeName: string;
  documentNumber: string;
  documentUrl: string;
  timestamp: string;
  changeType: TStockMovementChangeType | string;
  quantityIn: number;
  quantityOut: number;
  quantityChange: number;
  balanceAfter: number;
  performedBy: string;
  notes?: string | null;
}

export interface IStockCardResponse {
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  fromDate: string;
  toDate: string;
  openingStock: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
  closingStock: number;
  currentStock: number;
  isDiscrepancy: boolean;
  warning: string | null;
  movements: IPageResponse<IStockMovement>;
}

export interface IGetStockCardParams {
  productId: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}
