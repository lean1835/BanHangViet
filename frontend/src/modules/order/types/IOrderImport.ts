export interface IOrderImportRow {
  id: string;
  rowNumber: number;
  orderNumber: string;
  customerName: string;
  productSku: string;
  productName: string;
  quantity: number | string;
  unitPrice: number | string;
  discountAmount: number | string;
  paymentMethod: string;
  errors: Record<string, string>;
  isValid: boolean;
  isSelected: boolean;
}

export interface IOrderImportFieldError {
  rowNumber: number;
  columnName: string;
  field: string;
  message: string;
}
