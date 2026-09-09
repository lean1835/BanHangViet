export interface IGoodsReceipt {
  id: string;
  receiptNumber: string;
  supplierId?: string;
  supplierName?: string;
  totalAmount?: number;
  receivedAt: string;
  notes?: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGoodsReceiptDetail {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  purchasePrice: number;
  subtotal?: number;
  unitConversionId?: string | null;
  unitName?: string | null;
  conversionFactor?: number | null;
  baseQuantity?: number | null;
  basePurchasePrice?: number | null;
}

export interface IGoodsReceiptDetailInfo {
  id: string;
  receiptNumber: string;
  supplierId?: string;
  supplierName?: string;
  totalAmount?: number;
  receivedAt: string;
  notes?: string;
  createdByUserId: string;
  createdByUserName: string;
  details: IGoodsReceiptDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateGoodsReceiptDetailPayload {
  productId: string;
  quantity: number;
  purchasePrice: number;
  unitConversionId?: string;
}

export interface ICreateGoodsReceiptPayload {
  supplierId?: string;
  receiptNumber?: string;
  receivedAt?: string;
  notes?: string;
  confirmSellingBelowCost?: boolean;
  details: ICreateGoodsReceiptDetailPayload[];
}

