export interface IDiningTable {
  id: string;
  name: string;
  area?: string | null;
  seatCapacity: number;
  sortOrder: number;
  isActive: boolean;
  // Trạng thái phục vụ theo thời gian thực (POS)
  isOccupied?: boolean;
  currentOrderId?: string | null;
  currentOrderLabel?: string | null;
  currentHoldingMinutes?: number | null;
  isOverdue?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateDiningTableRequest {
  name: string;
  area?: string;
  seatCapacity?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface IUpdateDiningTableRequest {
  name: string;
  area?: string;
  seatCapacity?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface IDiningTableFilterParams {
  area?: string;
  isActive?: boolean;
}
