export type ImportCatalogType = "CUSTOMER" | "SUPPLIER";

export type ImportRowStatus = "VALID" | "DUPLICATE" | "ERROR";

export type DuplicateHandlingStrategy = "SKIP" | "UPDATE";

export interface ICustomerImportData {
  name: string;
  phone: string;
  taxCode?: string;
  address?: string;
  email?: string;
  creditLimit?: number;
  initialDebt?: number;
  note?: string;
}

export interface ISupplierImportData {
  name: string;
  phone: string;
  taxCode?: string;
  address?: string;
  email?: string;
  initialDebt?: number;
  note?: string;
}

export interface IImportPreviewRow {
  id: string;
  rowNumber: number;
  data: ICustomerImportData | ISupplierImportData;
  status: ImportRowStatus;
  errorMessage?: string;
  duplicateField?: string;
  isSelected?: boolean;
}

export interface IImportSummary {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  errorRows: number;
  importedCount?: number;
  updatedCount?: number;
  skippedCount?: number;
}

export interface IBackendImportPreviewResponse {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  duplicates?: Array<{
    rowNumber: number;
    identifier: string;
    name: string;
    existingName?: string;
    message?: string;
  }>;
  errors?: Array<{
    rowNumber: number;
    identifier: string;
    name: string;
    reason: string;
  }>;
}

export interface IBackendImportResultResponse {
  totalRows: number;
  successCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: Array<{
    rowNumber: number;
    customerName?: string;
    supplierName?: string;
    phoneNumber?: string;
    reason: string;
  }>;
  errorFileBase64?: string;
}

