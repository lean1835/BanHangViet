import React from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import {
  SUPPLIER_DEBT_UI,
  SUPPLIER_DEBT_TYPE_MAP,
  SUPPLIER_DEBT_STATUS_MAP,
  SUPPLIER_DEBT_PAYMENT_METHODS,
} from "@/constants/supplierDebt";
import { useGetSupplierDebtHistoryQuery } from "../services/supplierDebtApi";
import { CreditCard, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";

interface SupplierDebtHistoryTabProps {
  supplierId: string;
  currentDebt: number;
  canPay: boolean;
  onOpenPayModal: () => void;
}

export const SupplierDebtHistoryTab: React.FC<SupplierDebtHistoryTabProps> = ({
  supplierId,
  currentDebt,
  canPay,
  onOpenPayModal,
}) => {
  const { data: history = [], isLoading, isFetching } =
    useGetSupplierDebtHistoryQuery(supplierId, {
      skip: !supplierId,
    });

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDueDateInfo = (
    dueDateStr?: string | null,
    isPaid: boolean = false
  ) => {
    if (!dueDateStr) {
      return {
        formattedDate: "Thỏa thuận",
        badgeText: "Không hạn",
        badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      };
    }

    const target = new Date(dueDateStr);
    if (isNaN(target.getTime())) {
      return {
        formattedDate: dueDateStr,
        badgeText: "—",
        badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(target);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = formatDateOnly(dueDateStr);

    if (isPaid) {
      return {
        formattedDate,
        badgeText: "Đã trả xong",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }

    if (diffDays < 0) {
      return {
        formattedDate,
        badgeText: `Quá hạn ${Math.abs(diffDays)} ngày`,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
      };
    } else if (diffDays === 0) {
      return {
        formattedDate,
        badgeText: "Đến hạn hôm nay",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
      };
    } else {
      return {
        formattedDate,
        badgeText: `Còn ${diffDays} ngày`,
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      };
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-12 w-full bg-slate-100 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar within history tab */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">
            {SUPPLIER_DEBT_UI.HISTORY_TAB.TITLE} ({history.length} giao dịch)
          </span>
        </div>

        {canPay && currentDebt > 0 && (
          <button
            type="button"
            onClick={onOpenPayModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-xs font-bold text-white shadow-sm transition-all"
          >
            Thanh toán nợ
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2">
          <div className="p-3 rounded-full bg-slate-100 text-slate-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-600">
            {SUPPLIER_DEBT_UI.HISTORY_TAB.EMPTY_TITLE}
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm">
            {SUPPLIER_DEBT_UI.HISTORY_TAB.EMPTY_DESC}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">
                  {SUPPLIER_DEBT_UI.HISTORY_TAB.COL_DATE}
                </th>
                <th className="py-2.5 px-3">
                  {SUPPLIER_DEBT_UI.HISTORY_TAB.COL_TYPE}
                </th>
                <th className="py-2.5 px-3">
                  {SUPPLIER_DEBT_UI.HISTORY_TAB.COL_RECEIPT}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {SUPPLIER_DEBT_UI.HISTORY_TAB.COL_AMOUNT}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {SUPPLIER_DEBT_UI.HISTORY_TAB.COL_REMAINING}
                </th>
                <th className="py-2.5 px-3">
                  Hạn thanh toán
                </th>
                <th className="py-2.5 px-3 text-center">
                  {SUPPLIER_DEBT_UI.HISTORY_TAB.COL_STATUS}
                </th>
                <th className="py-2.5 px-3">
                  {SUPPLIER_DEBT_UI.HISTORY_TAB.COL_ACTOR}
                </th>
                <th className="py-2.5 px-3">
                  {SUPPLIER_DEBT_UI.HISTORY_TAB.COL_NOTES}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {history.map((record) => {
                const isDebtCreated = record.type === "DEBT_CREATED";
                const isPaid = record.status === "PAID";
                const typeConfig = isDebtCreated
                  ? SUPPLIER_DEBT_TYPE_MAP.DEBT_CREATED
                  : SUPPLIER_DEBT_TYPE_MAP.DEBT_PAID;
                const statusConfig =
                  SUPPLIER_DEBT_STATUS_MAP[record.status] ||
                  SUPPLIER_DEBT_STATUS_MAP.PENDING;

                const dueInfo = getDueDateInfo(record.dueDate, isPaid);

                const paymentMethodLabel =
                  record.paymentMethod === "BANK_TRANSFER"
                    ? SUPPLIER_DEBT_PAYMENT_METHODS.BANK_TRANSFER
                    : record.paymentMethod === "CASH"
                      ? SUPPLIER_DEBT_PAYMENT_METHODS.CASH
                      : record.paymentMethod;

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                      {formatDateTime(record.createdAt)}
                    </td>

                    {/* Type Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeConfig.badgeClass}`}
                      >
                        {isDebtCreated ? (
                          <ArrowUpRight className="w-3 h-3 text-orange-600" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        )}
                        {typeConfig.label}
                      </span>
                    </td>

                    {/* Goods Receipt Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 font-semibold">
                      {record.receiptNumber ? (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
                          {record.receiptNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold">
                      <span className={typeConfig.amountClass}>
                        {typeConfig.sign}
                        {formatCurrency(record.amount)}
                      </span>
                    </td>

                    {/* Remaining */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-slate-700">
                      {isDebtCreated
                        ? formatCurrency(record.remainingAmount)
                        : "—"}
                    </td>

                    {/* Due Date & Specific Days Remaining/Overdue */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-700 font-semibold">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{dueInfo.formattedDate}</span>
                        </div>
                        <span
                          className={`inline-block w-fit px-1.5 py-0.5 rounded text-[10px] border ${dueInfo.badgeClass}`}
                        >
                          {dueInfo.badgeText}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Actor & Method */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-medium">
                          {record.createdByUserName || "Chủ hộ"}
                        </span>
                        {paymentMethodLabel && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {paymentMethodLabel}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-2.5 px-3 max-w-xs truncate text-slate-500 text-[11px]">
                      {record.notes || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
