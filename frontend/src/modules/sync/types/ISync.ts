export type TConflictResolutionStrategy = "KEEP_SERVER" | "OVERWRITE_SERVER";

export type TSyncStatus = "SYNCED" | "PENDING" | "CONFLICT" | "FAILED";

export interface ISyncCheckRequest {
  offlineOrderNumbers: string[];
}

export interface ISyncCheckResponse {
  duplicates: string[];
  conflicts: string[];
}

export interface IOfflineOrderItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRatePercentage?: number;
  taxAmount?: number;
  subtotal?: number;
}

export interface IOfflineOrderRequest {
  orderNumber: string;
  shiftId?: string | null;
  customerId?: string | null;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  createdAt?: string;
  discountType?: string | null;
  discountRateOrValue?: number | null;
  items: IOfflineOrderItemRequest[];
}

export interface ISyncResolveRequest {
  orderNumber: string;
  resolutionStrategy: TConflictResolutionStrategy;
  clientOrderData?: IOfflineOrderRequest | null;
}

export interface ILocalOfflineOrder extends IOfflineOrderRequest {
  localId: string;
  syncStatus: TSyncStatus;
  errorMessage?: string;
}
