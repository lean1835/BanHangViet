import React from "react";
import { AlertTriangle, Wallet, Clock, Scale } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IEmployeeShiftReportResponse } from "../types/IReport";

interface EmployeeShiftKpisProps {
  reportData?: IEmployeeShiftReportResponse;
  isLoading?: boolean;
}

export const EmployeeShiftKpis: React.FC<EmployeeShiftKpisProps> = ({
  reportData,
  isLoading = false,
}) => {
  const totalShifts = reportData?.totalShiftsCount ?? 0;
  const exceededCount = reportData?.totalExceededShiftsCount ?? 0;
  const cashRev = reportData?.totalCashRevenue ?? 0;
  const bankRev = reportData?.totalBankTransferRevenue ?? 0;
  const totalRev = reportData?.totalRevenue ?? 0;
  const totalDiff = reportData?.totalDifferenceAmount ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs animate-pulse space-y-3"
          >
            <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-6 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng doanh thu ca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Tổng doanh thu các ca
          </span>
          <div className="w-8 h-8 rounded-lg bg-kv-blue-light text-kv-blue-primary flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalRev)}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>{totalShifts} ca làm việc</span>
            <span>•</span>
            <span>{reportData?.totalOrdersCount ?? 0} đơn thành công</span>
          </div>
        </div>
      </div>

      {/* 2. Doanh thu Tiền mặt vs Chuyển khoản */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Cơ cấu tiền thu
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tiền mặt:
            </span>
            <span className="font-bold text-slate-900">{formatCurrency(cashRev)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-kv-blue-primary" /> Chuyển khoản:
            </span>
            <span className="font-bold text-slate-900">{formatCurrency(bankRev)}</span>
          </div>
        </div>
      </div>

      {/* 3. Ca lệch tiền vượt ngưỡng */}
      <div
        className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between transition-colors ${
          exceededCount > 0
            ? "bg-rose-50/50 border-rose-200"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Ca lệch tiền vượt ngưỡng
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              exceededCount > 0
                ? "bg-rose-100 text-rose-600"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-black tracking-tight ${
                exceededCount > 0 ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {exceededCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {totalShifts} ca</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {exceededCount > 0 ? "Cần đối soát tiền két thực tế" : "Mọi ca đều nằm trong ngưỡng an toàn"}
          </p>
        </div>
      </div>

      {/* 4. Tổng chênh lệch két */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Tổng chênh lệch két
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div
            className={`text-xl font-black tracking-tight ${
              totalDiff === 0
                ? "text-slate-800"
                : totalDiff > 0
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {totalDiff > 0 ? "+" : ""}
            {formatCurrency(totalDiff)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Thực tế trong két so với lý thuyết
          </p>
        </div>
      </div>
    </div>
  );
};
