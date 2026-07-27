export interface IGoodsReceipt {
  id: string;
  receiptNumber: string;
  receivedAt: string;
  notes: string;
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
}

export interface IGoodsReceiptDetailInfo {
  id: string;
  receiptNumber: string;
  receivedAt: string;
  notes: string;
  createdByUserId: string;
  createdByUserName: string;
  details: IGoodsReceiptDetail[];
  createdAt?: string;
  updatedAt?: string;
}
