import React from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useGetShiftCashSummaryQuery } from "../services/cashTransactionApi";
import type { IShiftCashSummaryResponse } from "../types/ICashTransaction";

interface ShiftCashSummaryCardProps {
  shiftId: string;
  onOpenCreateModal?: (type: "INCOME" | "EXPENSE") => void;
  canCreate?: boolean;
}

export const ShiftCashSummaryCard: React.FC<ShiftCashSummaryCardProps> = ({
  shiftId,
  onOpenCreateModal,
  canCreate = true,
}) => {
  const { data: summaryData, isLoading } = useGetShiftCashSummaryQuery(shiftId, {
    skip: !shiftId,
    pollingInterval: 15000,
  });

  const summary: IShiftCashSummaryResponse | undefined = summaryData?.result;

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-pulse text-slate-400 text-xs">
        Đang tải thông tin dòng tiền mặt...
      </div>
    );
  }

  if (!summary) return null;

  const hasPending = summary.pendingExpenseCount > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Pending Approval Urgent Alert */}
      {hasPending && (
        <div className="bg-amber-500 text-white p-3 px-4 flex items-center justify-between gap-3 text-xs animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Có <b>{summary.pendingExpenseCount} khoản chi</b> ({formatCurrency(summary.totalPendingExpense)}) đang chờ Chủ hộ duyệt!
            </span>
          </div>
          <span className="text-[11px] font-semibold bg-amber-600 px-2 py-0.5 rounded text-amber-100 shrink-0">
            Chặn đóng ca & bàn giao
          </span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
              Dòng tiền mặt ngoài bán hàng trong ca
            </h4>
          </div>

          {canCreate && onOpenCreateModal && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenCreateModal("INCOME")}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors flex items-center gap-1 border border-emerald-200"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Lập phiếu thu</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenCreateModal("EXPENSE")}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors flex items-center gap-1 border border-rose-200"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Lập phiếu chi</span>
              </button>
            </div>
          )}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Income */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Thu ngoài ca (+)
              </div>
              <div className="text-base font-extrabold text-emerald-700 tabular-nums truncate">
                {summary.totalApprovedIncome > 0 ? `+${formatCurrency(summary.totalApprovedIncome)}` : formatCurrency(0)}
              </div>
            </div>
          </div>

          {/* Expense */}
          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Chi ngoài ca (-)
              </div>
              <div className="text-base font-extrabold text-rose-700 tabular-nums truncate">
                {summary.totalApprovedExpense > 0 ? `-${formatCurrency(summary.totalApprovedExpense)}` : formatCurrency(0)}
              </div>
            </div>
          </div>

          {/* Net Change */}
          <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Biến động quỹ ròng
              </div>
              <div
                className={`text-base font-extrabold tabular-nums truncate ${
                  summary.netCashChange > 0
                    ? "text-emerald-700"
                    : summary.netCashChange < 0
                    ? "text-rose-700"
                    : "text-slate-700"
                }`}
              >
                {summary.netCashChange > 0 ? "+" : ""}
                {formatCurrency(summary.netCashChange)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftCashSummaryCard;
