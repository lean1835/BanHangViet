import type { SUPPLIER_STATUS } from "@/constants/supplier";

export type TSupplierStatus =
  | typeof SUPPLIER_STATUS.ACTIVE
  | typeof SUPPLIER_STATUS.INACTIVE;

export type TSupplierStatusFilter =
  | TSupplierStatus
  | typeof SUPPLIER_STATUS.ALL;

export interface ISupplierGroup {
  id: string;
  householdId: string;
  name: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISupplier {
  id: string;
  householdId: string;
  supplierCode: string;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  taxCode: string;
  note: string;
  groupId: string | null;
  groupName: string;
  status: TSupplierStatus;
  initialDebt: number;
  currentDebt: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISupplierCreatePayload {
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  taxCode: string;
  note: string;
  groupId: string | null;
  initialDebt: number;
}

export interface ISupplierUpdatePayload {
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  taxCode: string;
  note: string;
  groupId: string | null;
  status: TSupplierStatus;
}

export interface ISupplierGroupPayload {
  name: string;
  note: string;
}

export interface ISupplierQueryParams {
  query?: string;
  groupId?: string;
  minDebt?: number;
  maxDebt?: number;
  status?: TSupplierStatus;
}

export interface ISupplierFilters {
  groupId: string;
  debtFrom: string;
  debtTo: string;
  status: TSupplierStatusFilter;
}
