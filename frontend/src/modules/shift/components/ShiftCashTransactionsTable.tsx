import React, { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  X,
} from "lucide-react";
import {
  useGetShiftCashTransactionsQuery,
  useApproveCashExpenseMutation,
} from "../services/cashTransactionApi";
import {
  CASH_TRANSACTION_STATUS_BADGES,
  CASH_TRANSACTION_STATUS_LABELS,
  type ICashTransactionResponse,
} from "../types/ICashTransaction";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { RejectExpenseModal } from "./RejectExpenseModal";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface ShiftCashTransactionsTableProps {
  shiftId: string;
  isOwner?: boolean;
}

export const ShiftCashTransactionsTable: React.FC<ShiftCashTransactionsTableProps> = ({
  shiftId,
  isOwner = false,
}) => {
  const { showSuccess, showError } = useNotification();
  const { data: txData, isLoading } = useGetShiftCashTransactionsQuery(shiftId, {
    skip: !shiftId,
  });
  const transactions: ICashTransactionResponse[] = txData?.result || [];

  const [approveExpense, { isLoading: isApproving }] = useApproveCashExpenseMutation();

  // Reject Modal State
  const [rejectingTx, setRejectingTx] = useState<ICashTransactionResponse | null>(null);

  const handleApprove = async (tx: ICashTransactionResponse) => {
    if (isApproving) return;
    try {
      await approveExpense(tx.id).unwrap();
      showSuccess(`Đã phê duyệt phiếu chi ${tx.code} (${formatCurrency(tx.amount)})`);
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể phê duyệt phiếu chi"));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center text-slate-400 text-xs font-semibold animate-pulse">
        Đang tải danh sách phiếu thu chi trong ca...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
            Danh sách phiếu thu chi trong ca
          </h4>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {transactions.length} phiếu
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pos-tabs-scrollbar pb-1">
        <table className="w-full text-left border-collapse text-[11px] min-w-[820px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th className="p-3 whitespace-nowrap min-w-[125px]">Mã phiếu</th>
              <th className="p-3 whitespace-nowrap min-w-[130px]">Thời gian</th>
              <th className="p-3 whitespace-nowrap min-w-[85px]">Loại</th>
              <th className="p-3 min-w-[180px]">Khoản thu chi / Lý do</th>
              <th className="p-3 whitespace-nowrap min-w-[110px]">Người nộp/nhận</th>
              <th className="p-3 text-right whitespace-nowrap min-w-[110px]">Số tiền</th>
              <th className="p-3 whitespace-nowrap min-w-[110px]">Người tạo</th>
              <th className="p-3 text-center whitespace-nowrap min-w-[95px]">Trạng thái</th>
              {isOwner && <th className="p-3 text-center whitespace-nowrap min-w-[110px]">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={isOwner ? 9 : 8}
                  className="p-8 text-center text-slate-400 font-semibold"
                >
                  Chưa có phiếu thu hoặc phiếu chi nào phát sinh trong ca này.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isIncome = tx.type === "INCOME";
                const badge = CASH_TRANSACTION_STATUS_BADGES[tx.status];
                const statusLabel = CASH_TRANSACTION_STATUS_LABELS[tx.status];

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-bold font-mono text-slate-900 whitespace-nowrap min-w-[125px]">
                      {tx.code}
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md ${
                          isIncome
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        <span>{isIncome ? "Thu (+)" : "Chi (-)"}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 leading-tight">{tx.categoryName}</div>
                      {tx.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[220px] mt-0.5" title={tx.notes}>
                          {tx.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {tx.personName || "-"}
                    </td>
                    <td className="p-3 text-right font-black tabular-nums whitespace-nowrap text-xs">
                      <span className={isIncome ? "text-emerald-600" : "text-rose-600"}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {tx.createdByFullName || tx.createdByUsername}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="p-3 text-center whitespace-nowrap">
                        {tx.status === "PENDING_APPROVAL" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprove(tx)}
                              disabled={isApproving}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors"
                              title="Phê duyệt khoản chi"
                            >
                              <Check className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingTx(tx)}
                              disabled={isApproving}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1 border border-rose-200 transition-colors"
                              title="Từ chối khoản chi"
                            >
                              <X className="w-3 h-3" />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        ) : tx.status === "REJECTED" && tx.rejectionReason ? (
                          <span
                            className="text-[10px] text-rose-500 font-medium truncate max-w-[120px] inline-block"
                            title={`Lý do: ${tx.rejectionReason}`}
                          >
                            Lý do: {tx.rejectionReason}
                          </span>
                        ) : tx.status === "APPROVED" && tx.approvedByFullName ? (
                          <span className="text-[10px] text-slate-400">
                            Duyệt bởi: {tx.approvedByFullName}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      <RejectExpenseModal
        isOpen={Boolean(rejectingTx)}
        onClose={() => setRejectingTx(null)}
        transactionId={rejectingTx?.id || null}
        transactionCode={rejectingTx?.code}
        amount={rejectingTx?.amount}
      />
    </div>
  );
};

export default ShiftCashTransactionsTable;
