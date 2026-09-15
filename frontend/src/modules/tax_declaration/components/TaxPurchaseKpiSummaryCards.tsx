import React from "react";
import {
  ShoppingBag,
  ShieldCheck,
  Boxes,
  AlertTriangle,
  Building2,
} from "lucide-react";
import type { ITaxPurchaseRegisterSummaryResponse } from "../types/ITaxPurchaseRegister";
import { formatCurrency } from "@/utils/formatCurrency";

interface ITaxPurchaseKpiSummaryCardsProps {
  summary?: ITaxPurchaseRegisterSummaryResponse;
  isLoading?: boolean;
}

export const TaxPurchaseKpiSummaryCards: React.FC<
  ITaxPurchaseKpiSummaryCardsProps
> = ({ summary, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse h-32"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-8 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-6 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const grandTotalAmount = summary?.grandTotalAmount ?? 0;
  const eligibleAmount = summary?.eligibleForTaxDeductionAmount ?? 0;
  const grandTotalQuantity = summary?.grandTotalQuantity ?? 0;
  const totalReceipts = summary?.totalReceiptCount ?? 0;
  const validSuppliersCount = summary?.validSuppliers?.length ?? 0;
  const hasMissing = Boolean(summary?.hasMissingSupplierReceipts);
  const missingCount = summary?.missingSupplierReceiptCount ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Tổng giá trị hàng hóa mua vào */}
      <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">
            Tổng giá trị mua vào
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
            <ShoppingBag className="w-4 h-4 shrink-0 stroke-[2.2]" />
          </div>
        </div>
        <div className="text-xl font-black text-slate-900 tracking-tight">
          {formatCurrency(grandTotalAmount)}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 font-medium">
          {totalReceipts} phiếu nhập kho phát sinh
        </div>
      </div>

      {/* KPI 2: Chi phí đủ điều kiện kê khai */}
      <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">
            Đủ điều kiện kê khai
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 stroke-[2.2]" />
          </div>
        </div>
        <div className="text-xl font-black text-slate-900 tracking-tight">
          {formatCurrency(eligibleAmount)}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 font-medium">
          Chứng từ có thông tin Nhà cung cấp
        </div>
      </div>

      {/* KPI 3: Tổng số lượng hàng hóa nhập */}
      <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">
            Tổng số lượng nhập
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
            <Boxes className="w-4 h-4 shrink-0 stroke-[2.2]" />
          </div>
        </div>
        <div className="text-xl font-black text-slate-900 tracking-tight">
          {new Intl.NumberFormat("vi-VN").format(grandTotalQuantity)}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 font-medium">
          Quy đổi theo đơn vị tính cơ sở
        </div>
      </div>

      {/* KPI 4: Nhà cung cấp hoặc Chứng từ thiếu NCC */}
      {hasMissing ? (
        <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Chứng từ thiếu NCC
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 tracking-tight">
            {missingCount} phiếu
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Bị loại khỏi hồ sơ thuế
          </div>
        </div>
      ) : (
        <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              Nhà cung cấp đối tác
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-xs">
              <Building2 className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {validSuppliersCount} NCC
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            100% chứng từ hợp lệ
          </div>
        </div>
      )}
    </div>
  );
};
