import React from "react";
import { Banknote, QrCode, BookOpen, CircleDollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IPaymentMethodReportResponse } from "../types/IReport";

interface PaymentMethodKpisProps {
  reportData?: IPaymentMethodReportResponse;
  isLoading?: boolean;
}

export const PaymentMethodKpis: React.FC<PaymentMethodKpisProps> = ({
  reportData,
  isLoading = false,
}) => {
  const totalRevenue = reportData?.totalRevenue ?? 0;
  const methods = reportData?.methods || [];

  const cashStat = methods.find((m) => m.method === "CASH");
  const bankStat = methods.find((m) => m.method === "BANK_TRANSFER");
  const debtStat = methods.find((m) => m.method === "DEBT");

  const debtDetails = reportData?.debtDetails;

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
      {/* 1. Tổng tiền thanh toán */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Tổng thanh toán ghi nhận
          </span>
          <div className="w-8 h-8 rounded-lg bg-kv-blue-light text-kv-blue-primary flex items-center justify-center shrink-0">
            <CircleDollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tổng tiền từ tất cả phương thức
          </p>
        </div>
      </div>

      {/* 2. Tiền mặt */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Tiền mặt (CASH)
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(cashStat?.totalAmount ?? 0)}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span className="font-bold text-emerald-600">
              {(cashStat?.percentage ?? 0).toFixed(1)}%
            </span>
            <span>•</span>
            <span>{cashStat?.transactionCount ?? 0} giao dịch</span>
          </div>
        </div>
      </div>

      {/* 3. Chuyển khoản QR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Chuyển khoản / QR
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(bankStat?.totalAmount ?? 0)}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span className="font-bold text-indigo-600">
              {(bankStat?.percentage ?? 0).toFixed(1)}%
            </span>
            <span>•</span>
            <span>{bankStat?.transactionCount ?? 0} giao dịch</span>
          </div>
        </div>
      </div>

      {/* 4. Ghi nợ / Sổ nợ */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Ghi nợ khách hàng
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(debtStat?.totalAmount ?? (debtDetails?.totalDebtCreated ?? 0))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>Đã thu hồi: {formatCurrency(debtDetails?.totalDebtPaid ?? 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
