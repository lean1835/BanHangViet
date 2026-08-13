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
  isInvoiceIssuedOffline?: boolean;
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

export type TSyncSessionStatus = "MATCHED" | "DISCREPANCY";
export type TSyncDetailStatus = "SUCCESS" | "DUPLICATE" | "CONFLICT" | "MISSING" | "FAILED";

export interface ISyncSessionDetail {
  id: string;
  orderNumber: string;
  status: TSyncDetailStatus;
  note?: string;
}

export interface ISyncSession {
  id: string;
  sessionCode: string;
  userId?: string;
  username?: string;
  userFullName?: string;
  deviceId?: string;
  totalSent: number;
  totalReceived: number;
  totalDuplicated: number;
  totalConflicted: number;
  totalFailed: number;
  status: TSyncSessionStatus;
  syncedAt: string;
  createdAt: string;
  details?: ISyncSessionDetail[];
}

export interface ISyncReconciliationSummary {
  totalSessions: number;
  matchedSessions: number;
  discrepancySessions: number;
  totalSyncedOrders: number;
}

export interface ISyncSessionFilterParams {
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
  status?: TSyncSessionStatus;
}
