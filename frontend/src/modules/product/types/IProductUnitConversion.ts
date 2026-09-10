export interface IProductUnitConversion {
  id: string;
  productId: string;
  productName?: string;
  baseUnit?: string;
  unitName: string;
  conversionFactor: number;
  price?: number | null;
  barcode?: string | null;
  isDefaultImport: boolean;
  isDefaultSale: boolean;
  hasStockMovement: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateUnitConversionRequest {
  unitName: string;
  conversionFactor: number;
  price?: number | null;
  barcode?: string | null;
  isDefaultImport?: boolean;
  isDefaultSale?: boolean;
}

export interface IUpdateUnitConversionRequest {
  unitName: string;
  conversionFactor: number;
  price?: number | null;
  barcode?: string | null;
  isDefaultImport?: boolean;
  isDefaultSale?: boolean;
}
