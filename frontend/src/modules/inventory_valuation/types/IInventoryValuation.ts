export interface IInventoryValuationSummary {
  asOfDate: string;
  isHistorical: boolean;
  totalProducts: number;
  valuedProductsCount: number;
  missingCostProductsCount: number;
  totalStockQuantity: number;
  missingCostStockQuantity: number;
  totalInventoryValue: number;
  totalRetailValue: number;
  potentialGrossProfit: number;
  potentialProfitMargin: number;
  averageDaysInStock: number;
}

export interface IProductGroupValuation {
  groupId: string | null;
  groupName: string;
  productCount: number;
  totalStockQuantity: number;
  totalInventoryValue: number;
  totalRetailValue: number;
  valuePercentage: number;
  averageDaysInStock: number;
}

export interface IInventoryValuationItem {
  productId: string;
  sku: string | null;
  productName: string;
  unit: string | null;
  groupId: string | null;
  groupName: string | null;
  stockQuantity: number;
  costPrice: number;
  inventoryValue: number;
  retailPrice: number;
  retailValue: number;
  lastImportDate: string | null;
  daysInStock: number;
  isNegativeStock?: boolean;
}

export interface IMissingCostProduct {
  productId: string;
  sku: string | null;
  productName: string;
  unit: string | null;
  groupId: string | null;
  groupName: string | null;
  stockQuantity: number;
  retailPrice: number;
  warningMessage: string | null;
}

export interface IInventoryValuationReport {
  summary: IInventoryValuationSummary;
  groupValuations: IProductGroupValuation[];
  items: IInventoryValuationItem[];
  missingCostItems: IMissingCostProduct[];
}

export interface IGetInventoryValuationQueryParams {
  asOfDate?: string;
  groupId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
