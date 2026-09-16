import type { TSupplierReturnReason } from "@/constants/supplierReturn";

export interface IReceiptReturnableItem {
  receiptDetailId: string;
  productId: string | null;
  productCode: string | null;
  productName: string | null;
  unitName: string | null;
  importedQuantity: number;
  previouslyReturnedQuantity: number;
  remainingReturnableQuantity: number;
  currentStockQuantity: number;
  maxAllowedReturnQuantity: number;
  purchasePrice: number;
  conversionFactor: number;
  basePurchasePrice: number;
}

export type TGoodsReceiptReturnStatus = "NOT_RETURNED" | "PARTIALLY_RETURNED" | "FULLY_RETURNED";

export interface IReceiptReturnableCheck {
  receiptId: string;
  receiptNumber: string;
  receivedAt: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierPhone: string | null;
  supplierCurrentDebt: number;
  receiptTotalAmount: number;
  items: IReceiptReturnableItem[];
  returnStatus?: TGoodsReceiptReturnStatus;
  isFullyReturned?: boolean;
  isReturnable?: boolean;
  totalReturnedAmount?: number;
}

export interface ICreateSupplierReturnItemPayload {
  receiptDetailId: string;
  quantity: number;
  itemReason?: string;
}

export interface ICreateSupplierReturnPayload {
  receiptId: string;
  returnNumber?: string;
  returnDate?: string;
  reason: TSupplierReturnReason | string;
  notes?: string;
  items: ICreateSupplierReturnItemPayload[];
}

export interface ISupplierReturn {
  id: string;
  returnNumber: string;
  receiptId: string | null;
  receiptNumber: string | null;
  supplierId: string | null;
  supplierName: string | null;
  totalReturnAmount: number;
  reason: string;
  notes?: string | null;
  returnDate: string;
  createdByUserId?: string | null;
  createdByUserName?: string | null;
  createdAt: string;
  totalItems?: number;
}

export interface ISupplierReturnItem {
  id: string;
  receiptDetailId?: string | null;
  productId?: string | null;
  productCode?: string | null;
  productName?: string | null;
  unitName?: string | null;
  quantity: number;
  purchasePrice: number;
  conversionFactor: number;
  baseQuantity: number;
  basePurchasePrice: number;
  subtotal: number;
  itemReason?: string | null;
  newCostPrice?: number | null;
  newStockQuantity?: number | null;
}

export interface ISupplierReturnDetail extends ISupplierReturn {
  receiptReceivedAt?: string | null;
  supplierPhone?: string | null;
  supplierDebtReduced?: number;
  items: ISupplierReturnItem[];
  updatedAt?: string | null;
}

export interface IGetSupplierReturnsQueryParams {
  supplierId?: string;
  fromDate?: string;
  toDate?: string;
  keyword?: string;
  page?: number;
  size?: number;
}
