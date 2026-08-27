export interface IPointOfSale {
  id: string;
  householdId?: string;
  posCode: string;
  name: string;
  address: string;
  phoneNumber?: string | null;
  invoiceSymbol?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPointOfSaleRequest {
  posCode?: string;
  name: string;
  address: string;
  phoneNumber?: string;
  invoiceSymbol?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface IPosEmployee {
  id: string;
  username: string;
  fullName: string;
  phoneNumber?: string;
  roleCode?: string;
  roleName?: string;
  pointOfSaleId?: string | null;
  pointOfSaleName?: string | null;
  posCode?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAssignPosEmployeeRequest {
  userIds: string[];
}

export interface IPosInventory {
  id: string;
  pointOfSaleId: string;
  pointOfSaleName?: string;
  posCode?: string;
  productId: string;
  productSku?: string;
  productName?: string;
  unit?: string;
  price?: number;
  stockQuantity: number;
  minStockQuantity?: number;
  isLowStock?: boolean;
  totalProductStock?: number;
  warehouseStock?: number;
  maxAvailableQuantity?: number;
  productStatus?: string;
  groupName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUpdatePosInventoryRequest {
  stockQuantity: number;
  minStockQuantity?: number;
}

export interface IInitPosInventoryItemRequest {
  productId: string;
  stockQuantity: number;
  minStockQuantity?: number;
}

export interface IInitPosInventoryRequest {
  items: IInitPosInventoryItemRequest[];
}
