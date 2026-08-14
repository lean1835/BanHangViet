export type SupplierStatus = "ACTIVE" | "INACTIVE";

export interface ISupplier {
  id: string;
  householdId: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  note?: string | null;
  status: SupplierStatus;
  currentDebt: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateSupplierRequest {
  name: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  note?: string | null;
  status?: SupplierStatus;
  initialDebt?: number | null;
  currentDebt?: number | null;
}

export interface IUpdateSupplierRequest {
  name: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  note?: string | null;
  status?: SupplierStatus;
  currentDebt?: number | null;
  initialDebt?: number | null;
}

export interface ISupplierQueryParams {
  query?: string;
}
