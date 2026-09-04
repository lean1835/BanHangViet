export interface IHouseholdInfo {
  id?: string;
  name: string;
  taxCode: string;
  address: string;
  phoneNumber: string;
  representativeName?: string;
  revenueThresholdEnabled?: boolean;
  offlineMaxOrders?: number;
  offlineMaxHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUpdateHouseholdRequest {
  name: string;
  taxCode: string;
  address: string;
  phoneNumber: string;
  representativeName?: string;
  offlineMaxOrders?: number;
  offlineMaxHours?: number;
}

export interface IInvoiceTemplate {
  id?: string;
  invoicePattern: string;
  invoiceSymbol: string;
  title: string;
  footerNote?: string;
  updatedAt?: string;
}

export interface IUpdateInvoiceTemplateRequest {
  invoicePattern: string;
  invoiceSymbol: string;
  title: string;
  footerNote?: string;
}

export interface ITaxRate {
  id: string;
  name: string;
  ratePercentage: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateTaxRateRequest {
  name: string;
  ratePercentage: number;
  isActive: boolean;
}

export interface IUpdateTaxRateRequest {
  name: string;
  ratePercentage: number;
  isActive: boolean;
}

export interface ITaxRateStatusRequest {
  isActive: boolean;
}

export type TBackupType = "PRODUCTS" | "ORDERS" | "INVOICES" | "FULL";

export interface IBackupExportParams {
  type: TBackupType;
  fromDate?: string;
  toDate?: string;
}
