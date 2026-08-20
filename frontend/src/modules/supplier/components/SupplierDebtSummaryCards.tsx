import React from "react";
import { Wallet, Users, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { SUPPLIER_DEBT_UI } from "@/constants/supplierDebt";
import type { ISupplierDebtSummary } from "../types/ISupplierDebt";

interface SupplierDebtSummaryCardsProps {
  summary?: ISupplierDebtSummary;
  isLoading: boolean;
}

export const SupplierDebtSummaryCards: React.FC<SupplierDebtSummaryCardsProps> = ({
  summary,
  isLoading,
}) => {
  const totalOutstanding = summary?.totalOutstandingDebt ?? 0;
  const suppliersWithDebt = summary?.totalSuppliersWithDebt ?? 0;
  const totalOverdue = summary?.totalOverdueDebt ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Tổng nợ phải trả */}
      <div className="bg-white rounded-xl border border-rose-100 p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-rose-300 transition-all">
        <div className="flex flex-col gap-1 z-10">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {SUPPLIER_DEBT_UI.SUMMARY.TOTAL_OUTSTANDING}
          </span>
          <span className="text-xl font-extrabold text-rose-600 font-mono tracking-tight">
            {formatCurrency(totalOutstanding)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Nợ tích lũy từ các phiếu nhập kho
          </span>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-100 group-hover:scale-105 transition-all">
          <Wallet className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Số nhà cung cấp còn nợ */}
      <div className="bg-white rounded-xl border border-sky-100 p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-sky-300 transition-all">
        <div className="flex flex-col gap-1 z-10">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {SUPPLIER_DEBT_UI.SUMMARY.SUPPLIERS_WITH_DEBT}
          </span>
          <span className="text-xl font-extrabold text-sky-700 font-mono tracking-tight">
            {suppliersWithDebt}{" "}
            <span className="text-xs font-semibold text-slate-500">đối tác</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Có dư nợ cần thanh toán
          </span>
        </div>
        <div className="p-3 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-100 group-hover:scale-105 transition-all">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* 3. Nợ quá hạn */}
      <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-amber-300 transition-all">
        <div className="flex flex-col gap-1 z-10">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {SUPPLIER_DEBT_UI.SUMMARY.TOTAL_OVERDUE}
          </span>
          <span
            className={`text-xl font-extrabold font-mono tracking-tight ${
              totalOverdue > 0 ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {formatCurrency(totalOverdue)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {totalOverdue > 0
              ? "Cần ưu tiên sắp xếp thanh toán"
              : "Không có nợ quá hạn"}
          </span>
        </div>
        <div
          className={`p-3 rounded-xl transition-all group-hover:scale-105 ${
            totalOverdue > 0
              ? "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
