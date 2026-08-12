export type TSupplierStatus = "ACTIVE" | "INACTIVE";

export interface ISupplier {
  id: string;
  code: string; // Mã nhà cung cấp (VD: NCC00001)
  name: string; // Tên nhà cung cấp
  phone: string; // Số điện thoại
  email?: string;
  address?: string;
  taxCode?: string; // Mã số thuế
  identityCard?: string; // Số CCCD/CMND
  groupName?: string; // Nhóm nhà cung cấp
  companyName?: string; // Tên công ty
  notes?: string;
  currentDebt: number; // Nợ cần trả hiện tại (VND)
  totalPurchase: number; // Tổng mua (VND)
  totalPurchaseNet: number; // Tổng mua trừ trả hàng (VND)
  status: TSupplierStatus;
  createdAt: string;
  createdByUserName?: string;
  updatedAt?: string;
}

export interface ISupplierFilter {
  searchQuery?: string;
  groupName?: string;
  debtStatus?: "ALL" | "HAS_DEBT" | "NO_DEBT";
  minDebt?: number | "";
  maxDebt?: number | "";
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  page?: number;
  size?: number;
}

export interface ICreateSupplierRequest {
  code?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxCode?: string;
  identityCard?: string;
  groupName?: string;
  companyName?: string;
  notes?: string;
  initialDebt?: number;
}

export interface IUpdateSupplierRequest extends Partial<ICreateSupplierRequest> {
  id: string;
  status?: TSupplierStatus;
}

export interface ISupplierDebtPayment {
  id: string;
  supplierId: string;
  paymentCode: string; // Mã phiếu chi (VD: PC0001)
  amount: number; // Số tiền trả
  paymentMethod: "CASH" | "BANK_TRANSFER";
  paymentDate: string;
  notes?: string;
  createdByName?: string;
}
