export interface IInventoryAudit {
  id: string;
  auditNumber: string;
  auditDate: string;
  status: string;
  totalItems: number;
  totalDifferenceQty: number;
  createdByUserId: string | null;
  createdByUserName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface IInventoryAuditDetail {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  systemQuantity: number;
  actualQuantity: number;
  differenceQuantity: number;
  reason: string | null;
}

export interface IInventoryAuditDetailInfo {
  id: string;
  auditNumber: string;
  auditDate: string;
  status: string;
  totalItems: number;
  totalDifferenceQty: number;
  createdByUserId: string | null;
  createdByUserName: string | null;
  notes: string | null;
  createdAt: string;
  details: IInventoryAuditDetail[];
}

export interface ICreateInventoryAuditDetailPayload {
  productId: string;
  actualQuantity: number;
  reason?: string;
}

export interface ICreateInventoryAuditPayload {
  notes?: string;
  details: ICreateInventoryAuditDetailPayload[];
}

export interface IPendingOrderCheck {
  hasPendingOrders: boolean;
  pendingOrderCount: number;
  pendingOrderNumbers: string[];
  warningMessage: string;
}

export interface IInventoryAuditFilterState {
  search: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
}
