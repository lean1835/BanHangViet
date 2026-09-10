import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useGetBankTransferReconciliationQuery } from "../services/shiftApi";

interface IBankTransferReconciliationSectionProps {
  shiftId: string;
  isCompact?: boolean;
}

export const BankTransferReconciliationSection: React.FC<
  IBankTransferReconciliationSectionProps
> = ({ shiftId, isCompact = false }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCompact);
  const {
    data: reconResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetBankTransferReconciliationQuery(shiftId, {
    skip: !shiftId,
  });

  const reconData = reconResponse?.result;

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center gap-2 text-xs text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        <span>Đang tải số liệu đối soát chuyển khoản ngân hàng...</span>
      </div>
    );
  }

  if (error || !reconData) {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" />
          <span>Chưa có dữ liệu đối soát chuyển khoản ngân hàng cho ca này.</span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  const {
    totalTransactions = 0,
    totalConfirmedAmount = 0,
    unconfirmedTransactionsCount = 0,
    totalUnconfirmedAmount = 0,
    transactions = [],
  } = reconData;

  const hasOverdue = transactions.some((t) => t.isTransferOverdue);
  const hasUnconfirmed = unconfirmedTransactionsCount > 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
      {/* Section Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                Đối Soát Chuyển Khoản Ngân Hàng
              </h4>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {totalTransactions} GD
              </span>
              {hasOverdue && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Có GD quá hạn
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Tổng tiền đã xác nhận:{" "}
              <strong className="text-blue-600 dark:text-blue-400 font-mono">
                {formatCurrency(totalConfirmedAmount)}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              refetch();
            }}
            disabled={isFetching}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
            title="Làm mới đối soát"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`}
            />
          </button>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 border-t border-slate-200/80 dark:border-slate-800 text-xs">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Tổng GD trong ca
              </span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">
                {totalTransactions}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                Đã nhận & chốt
              </span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {formatCurrency(totalConfirmedAmount)}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                Chưa nhận / Chờ rà
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-amber-700 dark:text-amber-400 font-mono">
                  {unconfirmedTransactionsCount} GD
                </span>
                {unconfirmedTransactionsCount > 0 && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                    ({formatCurrency(totalUnconfirmedAmount)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Warning Alert if any unconfirmed or overdue */}
          {hasUnconfirmed && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Chú ý đối soát:</strong> Có {unconfirmedTransactionsCount} giao
                dịch chuyển khoản chưa được xác nhận tiền về tài khoản.
                {hasOverdue && (
                  <span className="block text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                    ⚠️ Có giao dịch đã quá số phút chờ tối đa do cửa hàng thiết lập. Vui
                    lòng kiểm tra sao kê ngân hàng trước khi đóng ca!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Transactions List */}
          {transactions.length === 0 ? (
            <p className="text-center py-4 text-slate-400 text-xs italic">
              Không có giao dịch chuyển khoản nào phát sinh trong ca này.
            </p>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Mã đơn</th>
                      <th className="py-2 px-3 text-right">Số tiền</th>
                      <th className="py-2 px-3">Mã GD ngân hàng</th>
                      <th className="py-2 px-3 text-center">Trạng thái</th>
                      <th className="py-2 px-3">Người xác nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.map((t) => {
                      const isOverdue = t.isTransferOverdue;
                      const isConfirmed = t.isConfirmed;

                      return (
                        <tr
                          key={t.paymentId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-200">
                            {t.orderCode || `#${t.orderId?.slice(-6)}`}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {t.transactionCode ? (
                              <span className="inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                {t.transactionCode}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic font-sans font-normal text-[11px]">
                                Chưa nhập
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Đã xác nhận
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                                <Clock className="w-2.5 h-2.5" />
                                Quá hạn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-2.5 h-2.5" />
                                Chờ xác nhận
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                            {t.confirmedByFullName || t.confirmedByUsername || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BankTransferReconciliationSection;
