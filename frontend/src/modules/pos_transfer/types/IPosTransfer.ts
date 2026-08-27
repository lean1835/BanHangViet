export type TPosTransferStatus = "IN_TRANSIT" | "COMPLETED" | "CANCELED" | "PENDING";

export interface IPosTransferItem {
  id?: string;
  productId: string;
  productSku?: string;
  productName?: string;
  unit?: string;
  quantity: number;
}

export interface IPosTransfer {
  id: string;
  transferNumber?: string;
  transferCode?: string;
  fromPointOfSaleId?: string | null;
  fromPointOfSaleName?: string;
  fromPosCode?: string;
  toPointOfSaleId?: string | null;
  toPointOfSaleName?: string;
  toPosCode?: string;
  status: TPosTransferStatus;
  totalItems?: number;
  totalQuantity?: number;
  notes?: string | null;
  transferredAt?: string;
  receivedAt?: string | null;
  canceledAt?: string | null;
  cancelReason?: string | null;
  createdByUserId?: string;
  createdByFullName?: string;
  receivedByUserId?: string | null;
  receivedByFullName?: string | null;
  canceledByUserId?: string | null;
  canceledByFullName?: string | null;
  items?: IPosTransferItem[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPosTransferItemRequest {
  productId: string;
  quantity: number;
}

export interface ICreatePosTransferRequest {
  fromPointOfSaleId?: string | null;
  toPointOfSaleId?: string | null;
  notes?: string;
  items: IPosTransferItemRequest[];
}

export interface ICancelPosTransferRequest {
  cancelReason?: string;
  reason?: string;
}
