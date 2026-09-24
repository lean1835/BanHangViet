import type { TTaxPeriodType } from "./ITaxDeclaration";

export interface ITaxPurchaseRegisterItemResponse {
  id: string;
  receiptId: string;
  receiptNumber: string;
  receiptDate: string;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierTaxCode?: string | null;
  supplierInvoiceNumber?: string | null;
  productId: string;
  productCode: string;
  productName: string;
  unitName: string;
  baseQuantity: number;
  basePurchasePrice: number;
  totalAmount: number;
  isSupplierMissing: boolean;
  notes?: string | null;
}

export interface ISupplierPurchaseGroupResponse {
  supplierId?: string | null;
  supplierName: string;
  supplierTaxCode?: string | null;
  items: ITaxPurchaseRegisterItemResponse[];
  subtotalQuantity: number;
  subtotalAmount: number;
  receiptCount: number;
}

export interface ITaxPurchaseRegisterSummaryResponse {
  periodId: string;
  periodName: string;
  periodType: TTaxPeriodType | string;
  year: number;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: string;
  isLocked: boolean;
  validSuppliers: ISupplierPurchaseGroupResponse[];
  unidentifiedSuppliers?: ISupplierPurchaseGroupResponse | null;
  hasMissingSupplierReceipts: boolean;
  missingSupplierReceiptCount: number;
  warningMessage?: string | null;
  grandTotalQuantity: number;
  grandTotalAmount: number;
  eligibleForTaxDeductionAmount: number;
  totalReceiptCount: number;
}

export interface IGenerateTaxPurchaseRegisterRequest {
  periodType: TTaxPeriodType;
  year: number;
  periodNumber: number;
}
