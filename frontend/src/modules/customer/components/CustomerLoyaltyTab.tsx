import React, { useState } from "react";
import {
  Award,
  Clock,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Coins,
  History,
} from "lucide-react";
import {
  useGetCustomerLoyaltySummaryQuery,
  useGetCustomerPointTransactionsQuery,
} from "../services/loyaltyApi";
import { PointAdjustmentModal } from "./PointAdjustmentModal";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import {
  POINT_TRANSACTION_TYPES,
  POINT_TRANSACTION_FILTER_OPTIONS,
  LOYALTY_PAGINATION,
  LOYALTY_UI,
} from "@/constants/loyalty";

interface ICustomerLoyaltyTabProps {
  customerId: string;
  customerName: string;
  isOwner: boolean;
}

export const CustomerLoyaltyTab: React.FC<ICustomerLoyaltyTabProps> = ({
  customerId,
  customerName,
  isOwner,
}) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const pageSize = LOYALTY_PAGINATION.DEFAULT_PAGE_SIZE;
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);

  // 1. Fetch Loyalty Summary
  const {
    data: summary,
    isLoading: isLoadingSummary,
    isFetching: isFetchingSummary,
    refetch: refetchSummary,
  } = useGetCustomerLoyaltySummaryQuery(customerId, {
    refetchOnMountOrArgChange: true,
  });

  // 2. Fetch Point Transactions
  const {
    data: transactionData,
    isLoading: isLoadingTransactions,
    isFetching: isFetchingTransactions,
    refetch: refetchTransactions,
  } = useGetCustomerPointTransactionsQuery(
    {
      customerId,
      params: {
        page,
        size: pageSize,
        type: selectedType ? selectedType : undefined,
      },
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const handleRefresh = () => {
    refetchSummary();
    refetchTransactions();
  };

  const transactions = transactionData?.content || [];
  const totalPages = transactionData?.totalPages || 0;
  const totalElements = transactionData?.totalElements || 0;

  const formatDateTime = React.useCallback((dateStr?: string | null) => {
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
  }, []);

  const renderTypeBadge = React.useCallback((type: string) => {
    switch (type) {
      case POINT_TRANSACTION_TYPES.EARN:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            Tích điểm
          </span>
        );
      case POINT_TRANSACTION_TYPES.REDEEM:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            Đổi điểm đơn hàng
          </span>
        );
      case POINT_TRANSACTION_TYPES.RETURN_DEDUCTION:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            Thu hồi trả hàng
          </span>
        );
      case POINT_TRANSACTION_TYPES.ADJUST:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            Điều chỉnh thủ công
          </span>
        );
      case POINT_TRANSACTION_TYPES.EXPIRED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Hết hạn
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Points */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {LOYALTY_UI.CARDS.AVAILABLE_POINTS}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">
              {isLoadingSummary
                ? "..."
                : (summary?.availablePoints ?? 0).toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold text-blue-600">{LOYALTY_UI.CARDS.UNIT}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>{LOYALTY_UI.CARDS.EQUIVALENT_VALUE}:</span>
            <span className="font-extrabold text-emerald-600">
              {isLoadingSummary
                ? "..."
                : formatCurrency(summary?.monetaryEquivalent ?? 0)}
            </span>
          </div>
          {summary?.isEligibleToRedeem ? (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              <span>{LOYALTY_UI.CARDS.ELIGIBLE_READY}</span>
            </div>
          ) : (
            <div className="mt-2 text-[11px] font-medium text-slate-400">
              {LOYALTY_UI.CARDS.ELIGIBLE_MIN(summary?.minPointsToRedeem ?? 0)}
            </div>
          )}
        </div>

        {/* Card 2: Points Expiring Soon */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {LOYALTY_UI.CARDS.EXPIRING_SOON}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                (summary?.pointsExpiringSoon ?? 0) > 0
                  ? "text-amber-600"
                  : "text-slate-800"
              }`}
            >
              {isLoadingSummary
                ? "..."
                : (summary?.pointsExpiringSoon ?? 0).toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold text-slate-400">{LOYALTY_UI.CARDS.UNIT}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {summary?.nearestExpiringDate ? (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {LOYALTY_UI.CARDS.EXPIRING_NOTE(formatDateOnly(summary.nearestExpiringDate))}
              </span>
            ) : (
              <span className="text-slate-400">{LOYALTY_UI.CARDS.NO_EXPIRING}</span>
            )}
          </div>
        </div>

        {/* Card 3: Total Earned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {LOYALTY_UI.CARDS.TOTAL_EARNED}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {isLoadingSummary
                ? "..."
                : (summary?.totalPointsEarned ?? 0).toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold text-slate-400">{LOYALTY_UI.CARDS.UNIT}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {LOYALTY_UI.CARDS.EARNED_SUBTITLE}
          </div>
        </div>

        {/* Card 4: Total Redeemed & Deducted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {LOYALTY_UI.CARDS.REDEEMED_AND_DEDUCTED}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{LOYALTY_UI.CARDS.REDEEMED_LABEL}</span>
              <span className="font-bold text-blue-600">
                {isLoadingSummary
                  ? "..."
                  : (summary?.totalPointsRedeemed ?? 0).toLocaleString("vi-VN")}{" "}
                {LOYALTY_UI.CARDS.UNIT}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{LOYALTY_UI.CARDS.DEDUCTED_LABEL}</span>
              <span className="font-bold text-rose-600">
                {isLoadingSummary
                  ? "..."
                  : (summary?.totalPointsDeductedOnReturn ?? 0).toLocaleString(
                      "vi-VN"
                    )}{" "}
                {LOYALTY_UI.CARDS.UNIT}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Actions & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Filter by Type */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-600 shrink-0">
            {LOYALTY_UI.TOOLBAR.FILTER_LABEL}
          </span>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(0);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {POINT_TRANSACTION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetchingSummary || isFetchingTransactions}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            title={LOYALTY_UI.TOOLBAR.REFRESH_TITLE}
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${
                isFetchingSummary || isFetchingTransactions ? "animate-spin text-blue-600" : ""
              }`}
            />
            <span>{LOYALTY_UI.TOOLBAR.REFRESH_BUTTON}</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span>{LOYALTY_UI.TOOLBAR.MANUAL_ADJUST_BUTTON}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Transaction History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              {LOYALTY_UI.TABLE.TITLE}
            </h3>
            <span className="text-xs text-slate-400">
              ({totalElements} giao dịch)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">{LOYALTY_UI.TABLE.COLUMNS.TIME}</th>
                <th className="py-3 px-4">{LOYALTY_UI.TABLE.COLUMNS.TYPE}</th>
                <th className="py-3 px-4 text-right">{LOYALTY_UI.TABLE.COLUMNS.CHANGE}</th>
                <th className="py-3 px-4 text-right">{LOYALTY_UI.TABLE.COLUMNS.BALANCE_AFTER}</th>
                <th className="py-3 px-4">{LOYALTY_UI.TABLE.COLUMNS.DOCUMENT}</th>
                <th className="py-3 px-4">{LOYALTY_UI.TABLE.COLUMNS.OPERATOR}</th>
                <th className="py-3 px-4">{LOYALTY_UI.TABLE.COLUMNS.REASON}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoadingTransactions ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Đang tải lịch sử điểm thưởng...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    {LOYALTY_UI.TABLE.EMPTY_MESSAGE}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderTypeBadge(tx.type)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-black text-sm ${
                          tx.pointsChange > 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {tx.pointsChange > 0
                          ? `+${tx.pointsChange.toLocaleString("vi-VN")}`
                          : tx.pointsChange.toLocaleString("vi-VN")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800 whitespace-nowrap">
                      {tx.balanceAfter.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.orderNumber ? (
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {tx.orderNumber}
                        </span>
                      ) : tx.returnTicketNumber ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {tx.returnTicketNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                      {tx.createdByUsername || "Hệ thống"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={tx.description || ""}>
                      {tx.description || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs">
            <span className="text-slate-500 font-medium">
              Trang {page + 1} / {totalPages} (Tổng {totalElements} bản ghi)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Points Modal */}
      <PointAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          refetchSummary();
        }}
        customerId={customerId}
        customerName={customerName}
        currentPoints={summary?.availablePoints ?? 0}
      />
    </div>
  );
};
