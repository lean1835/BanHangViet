import React from "react";
import {
  CreditCard,
  Banknote,
  QrCode,
  BookOpen,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IPaymentMethodStat, IDebtCollectionSummary } from "../types/IReport";

interface PaymentMethodTableProps {
  methods: IPaymentMethodStat[];
  debtDetails?: IDebtCollectionSummary;
  isLoading?: boolean;
}

export const PaymentMethodTable: React.FC<PaymentMethodTableProps> = ({
  methods,
  debtDetails,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/3" />
        <div className="h-32 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  const debtCreated = debtDetails?.totalDebtCreated ?? 0;
  const debtPaid = debtDetails?.totalDebtPaid ?? 0;
  const debtRemaining = debtDetails?.totalDebtRemaining ?? 0;
  const recoveryRate = debtCreated > 0 ? (debtPaid / debtCreated) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Table phương thức thanh toán */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-kv-blue-primary shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Chi tiết các hình thức thanh toán
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng hợp doanh thu và số lần phát sinh giao dịch
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Phương thức</th>
                <th className="px-4 py-3.5 text-center">Số giao dịch</th>
                <th className="px-4 py-3.5 text-right">Tổng tiền</th>
                <th className="px-4 py-3.5 text-right">Tỷ trọng %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {methods.map((m) => (
                <tr key={m.method} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    {m.method === "CASH" ? (
                      <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : m.method === "BANK_TRANSFER" ? (
                      <QrCode className="w-4 h-4 text-kv-blue-primary shrink-0" />
                    ) : m.method === "DEBT" ? (
                      <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{m.methodName}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      ({m.method})
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                    {m.transactionCount}
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-slate-900">
                    {formatCurrency(m.totalAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-kv-blue-primary">
                    {m.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sổ đối soát công nợ khách hàng */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                Đối soát công nợ trong kỳ
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
              Sổ nợ
            </span>
          </div>

          <div className="mt-4 space-y-3.5">
            {/* Nợ mới phát sinh */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-amber-500" />
                Nợ mới phát sinh:
              </span>
              <span className="font-bold text-slate-900">
                {formatCurrency(debtCreated)}
              </span>
            </div>

            {/* Đã thu hồi được */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                Đã thu hồi nợ:
              </span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(debtPaid)}
              </span>
            </div>

            {/* Dư nợ còn lại */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-500" />
                Dư nợ còn lại:
              </span>
              <span className="font-black text-rose-600 text-sm">
                {formatCurrency(debtRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Tỷ lệ thu hồi nợ */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Tỷ lệ thu hồi nợ</span>
            <span className="font-black text-slate-900">{recoveryRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(Math.max(recoveryRate, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
