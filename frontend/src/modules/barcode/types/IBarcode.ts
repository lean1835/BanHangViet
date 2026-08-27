import type { IOrderResponse } from "@/modules/order/types/IOrder";

export interface IBarcodeScanRequest {
  barcode: string;
  orderId?: string;
  quantity?: number;
}

export interface IBarcodeScanResponse {
  found: boolean;
  barcode: string;
  suggestedBarcode?: string;
  message: string;

  productId?: string;
  productSku?: string;
  productName?: string;
  unit?: string;
  unitPrice?: number;
  stockQuantity?: number;

  scannedQuantity?: number;
  discountAmount?: number;
  subtotal?: number;

  promotionId?: string;
  promotionName?: string;

  order?: IOrderResponse;
}

export interface IAssignBarcodeRequest {
  barcode: string;
}

export interface IBarcodeResponse {
  productId: string;
  sku: string;
  productName: string;
  barcode: string;
  price: number;
  unit: string;
  householdName: string;
  paperSize: string;
  quantity: number;
  barcodeBase64Image?: string;
}

export interface IBarcodePrintParams {
  paperSize?: string;
  quantity?: number;
}
