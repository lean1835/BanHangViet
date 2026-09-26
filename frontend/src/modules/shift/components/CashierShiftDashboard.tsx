import React, { useState } from "react";
import { Lock, X, AlertTriangle, CheckCircle2, Banknote, Sparkles } from "lucide-react";
import {
  DEFAULT_SHIFT_CASH_AMOUNT,
  SHIFT_DIFFERENCE_REASON_MAX_LENGTH,
  SHIFT_CODE_SUFFIX_LENGTH,
  SHIFT_MESSAGES,
  SHIFT_SEARCH_DEBOUNCE_MS,
  SHIFT_STATUS,
  SHIFT_STATUS_LABELS,
  SHIFT_UI,
} from "@/constants/shift";
import {
  useGetActiveShiftQuery,
  useGetShiftsHistoryQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
} from "@/modules/shift/services/shiftApi";
import { createPortal } from "react-dom";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { IShiftResponse } from "@/modules/shift/types/IShift";
import { BankTransferReconciliationSection } from "./BankTransferReconciliationSection";
import { ShiftHandoverModal } from "./ShiftHandoverModal";
import { ShiftCashSummaryCard } from "./ShiftCashSummaryCard";
import { ShiftCashTransactionsTable } from "./ShiftCashTransactionsTable";
import { CreateCashTransactionModal } from "./CreateCashTransactionModal";
import { useGetShiftCashSummaryQuery } from "../services/cashTransactionApi";
import type { CashTransactionType } from "../types/ICashTransaction";

export const CashierShiftDashboard: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const {
    data: activeShiftData,
    error: activeShiftError,
    isError: isActiveError,
    isFetching: isActiveFetching,
    isLoading: isActiveLoading,
    refetch: refetchActiveShift,
  } = useGetActiveShiftQuery(undefined, { refetchOnMountOrArgChange: true });
  const currentShift = activeShiftData?.result ?? null;
  const currentExpectedCash =
    currentShift?.closingCashExpected ?? currentShift?.openingCash ?? 0;

  const {
    data: shiftsHistoryData,
    error: shiftsHistoryError,
    isError: isHistoryError,
    isLoading: isHistoryLoading,
    refetch: refetchShiftsHistory,
  } = useGetShiftsHistoryQuery(undefined, { refetchOnMountOrArgChange: true });
  const shifts = shiftsHistoryData?.result || [];

  const [openShiftMutation, { isLoading: isOpeningShift }] = useOpenShiftMutation();
  const [closeShiftMutation, { isLoading: isClosingShift }] = useCloseShiftMutation();

  // Inputs & Modal States
  const [openingCashInput, setOpeningCashInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingActualInput, setClosingActualInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingReason, setClosingReason] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showCreateCashModal, setShowCreateCashModal] = useState(false);
  const [createCashType, setCreateCashType] = useState<CashTransactionType>("EXPENSE");
  const [shiftToClose, setShiftToClose] = useState<IShiftResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, SHIFT_SEARCH_DEBOUNCE_MS);

  const { data: cashSummaryData } = useGetShiftCashSummaryQuery(currentShift?.id || "", {
    skip: !currentShift?.id,
    pollingInterval: 15000,
  });
  const cashSummary = cashSummaryData?.result;

  const handleOpenShift = async () => {
    if (isOpeningShift) return;

    try {
      await openShiftMutation({
        openingCash: openingCashInput,
      }).unwrap();
      showSuccess(SHIFT_MESSAGES.OPEN_SUCCESS);
      setShowOpenModal(false);
    } catch (error: unknown) {
      showError(
        SHIFT_MESSAGES.OPEN_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.OPEN_ERROR)
      );
    }
  };

  const handlePrepareCloseShift = async () => {
    if (isActiveFetching || isClosingShift) return;

    try {
      const refreshedActiveShift = await refetchActiveShift().unwrap();
      if (!refreshedActiveShift.result) {
        showError(SHIFT_MESSAGES.SHIFT_NO_LONGER_OPEN);
        return;
      }

      const latestShift = refreshedActiveShift.result;

      if (cashSummary?.pendingExpenseCount && cashSummary.pendingExpenseCount > 0) {
        showError(
          `Ca bán hàng còn ${cashSummary.pendingExpenseCount} khoản chi đang chờ Chủ hộ duyệt. Vui lòng liên hệ Chủ hộ phê duyệt hoặc từ chối trước khi chốt ca!`
        );
        return;
      }

      setShiftToClose(latestShift);
      setClosingActualInput(
        latestShift.closingCashExpected ?? latestShift.openingCash,
      );
      setClosingReason("");
      setShowCloseModal(true);
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error, SHIFT_MESSAGES.ACTIVE_SHIFT_REFRESH_ERROR),
      );
    }
  };

  const handleCloseShift = async () => {
    if (!shiftToClose || isClosingShift || isActiveFetching) return;
    const targetShiftId = shiftToClose.id;

    try {
      const refreshedActiveShift = await refetchActiveShift().unwrap();
      const latestShift = refreshedActiveShift.result;
      if (!latestShift || latestShift.id !== targetShiftId) {
        showError(SHIFT_MESSAGES.SHIFT_NO_LONGER_OPEN);
        setShowCloseModal(false);
        setShiftToClose(null);
        return;
      }

      setShiftToClose(latestShift);
      const expectedVal =
        latestShift.closingCashExpected ?? latestShift.openingCash;
      const diff = closingActualInput - expectedVal;

      if (diff !== 0 && !closingReason.trim()) {
        showError(SHIFT_MESSAGES.DIFFERENCE_REASON_REQUIRED);
        return;
      }

      await closeShiftMutation({
        id: latestShift.id,
        body: {
          closingCashActual: closingActualInput,
          differenceReason: diff !== 0 ? closingReason.trim() : undefined,
        },
      }).unwrap();
      showSuccess(SHIFT_MESSAGES.CLOSE_SUCCESS);
      setClosingReason("");
      setShowCloseModal(false);
      setShiftToClose(null);
    } catch (error: unknown) {
      showError(
        SHIFT_MESSAGES.CLOSE_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.CLOSE_ERROR)
      );
    }
  };

  const closeShiftDialogRef = useAccessibleDialog({
    isOpen: showCloseModal && Boolean(shiftToClose),
    onClose: () => {
      setShowCloseModal(false);
      setShiftToClose(null);
    },
    canClose: !isClosingShift && !isActiveFetching,
  });
  const openShiftDialogRef = useAccessibleDialog({
    isOpen: showOpenModal,
    onClose: () => setShowOpenModal(false),
    canClose: !isOpeningShift,
  });

  if (isActiveLoading || isHistoryLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold animate-pulse">
        {SHIFT_UI.CASHIER.LOADING_MESSAGE}
      </div>
    );
  }

  if (isActiveError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center text-sm font-semibold text-rose-700">
        <p>{getApiErrorMessage(activeShiftError, SHIFT_MESSAGES.ACTIVE_SHIFT_LOAD_ERROR)}</p>
        <button
          type="button"
          onClick={() => void refetchActiveShift()}
          className="mt-3 min-h-11 rounded-lg border border-rose-300 bg-white px-4 font-bold transition-colors hover:bg-rose-100"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Cashier Shift Info (KPI / Opening form) */}
      <div className="bg-white py-8 px-6 rounded-xl border border-slate-200 shadow-sm min-h-[200px] flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-slate-800 text-sm">
            {SHIFT_UI.CASHIER.CURRENT_SHIFT_TITLE}
          </h3>
          {currentShift && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHandoverModal(true)}
                disabled={isActiveFetching || isClosingShift}
                className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-3 py-1.5 rounded-lg font-bold shadow-sm text-[10px] disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Bàn giao ca</span>
              </button>
              <button
                onClick={() => void handlePrepareCloseShift()}
                disabled={isActiveFetching || isClosingShift}
                className="bg-rose-600 hover:bg-rose-700 transition-colors text-white px-3 py-1.5 rounded-lg font-bold shadow-sm text-[10px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {SHIFT_UI.CASHIER.CLOSE_SHIFT_BUTTON}
              </button>
            </div>
          )}
        </div>

        {currentShift ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {SHIFT_UI.CASHIER.OPENING_FUND_LABEL}
                </div>
                <div className="text-xl font-extrabold text-slate-800">
                  {formatCurrency(currentShift.openingCash)}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {SHIFT_UI.CASHIER.OPENED_AT_LABEL} {formatDate(currentShift.openedAt)}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {SHIFT_UI.CASHIER.TOTAL_REVENUE_LABEL}
                </div>
                <div className="text-xl font-extrabold text-indigo-700">
                  {formatCurrency(currentShift.totalRevenue ?? 0)}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex flex-wrap gap-x-2">
                  <span>TM: <b className="text-slate-700">{formatCurrency(currentShift.cashRevenue ?? 0)}</b></span>
                  <span>CK: <b className="text-slate-700">{formatCurrency(currentShift.bankRevenue ?? 0)}</b></span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {SHIFT_UI.CASHIER.EXPECTED_CASH_LABEL}
                </div>
                <div className="text-xl font-extrabold text-kv-blue-primary">
                  {formatCurrency(currentExpectedCash)}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {SHIFT_UI.CASHIER.EXPECTED_CASH_HINT}
                </div>
              </div>
            </div>
            </div>
            <div className="mt-4">
              <BankTransferReconciliationSection shiftId={currentShift.id} />
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <ShiftCashSummaryCard
                shiftId={currentShift.id}
                onOpenCreateModal={(t) => {
                  setCreateCashType(t);
                  setShowCreateCashModal(true);
                }}
              />
              <ShiftCashTransactionsTable shiftId={currentShift.id} isOwner={false} />
            </div>
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg py-6 px-5 flex flex-col sm:flex-row justify-between items-center gap-4 flex-1">
            <div className="text-left">
              <div className="font-extrabold text-amber-800 text-sm">
                {SHIFT_UI.CASHIER.NO_ACTIVE_SHIFT_TITLE}
              </div>
              <div className="text-slate-500 text-[11px] mt-1 font-medium">
                {SHIFT_UI.CASHIER.NO_ACTIVE_SHIFT_DESCRIPTION}
              </div>
            </div>
            <div>
              <button
                onClick={() => {
                  setOpeningCashInput(DEFAULT_SHIFT_CASH_AMOUNT);
                  setShowOpenModal(true);
                }}
                className="bg-kv-green hover:bg-emerald-600 text-white font-bold h-10 px-6 rounded-lg shadow-sm text-xs transition-colors whitespace-nowrap"
              >
                {SHIFT_UI.COMMON.OPEN_SHIFT_BUTTON}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Personal Shift History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 mb-4 gap-2">
          <h3 className="font-extrabold text-slate-800 text-sm text-left">
            {SHIFT_UI.CASHIER.HISTORY_TITLE}
          </h3>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={SHIFT_UI.CASHIER.SEARCH_PLACEHOLDER}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-8 text-xs font-semibold text-slate-700 focus:border-kv-blue-primary focus:outline-none lg:h-8"
            />
            <span className="absolute right-2.5 top-2.5 text-slate-400">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
          </div>
        </div>
        {isHistoryError ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center text-sm font-semibold text-rose-700"
          >
            <p>
              {getApiErrorMessage(
                shiftsHistoryError,
                "Không thể tải lịch sử ca làm việc. Vui lòng thử lại.",
              )}
            </p>
            <button
              type="button"
              onClick={() => void refetchShiftsHistory()}
              className="mt-3 min-h-11 rounded-lg border border-rose-300 bg-white px-4 font-bold transition-colors hover:bg-rose-100"
            >
              Thử lại
            </button>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs sm:text-sm">
                <th className="p-3">{SHIFT_UI.COMMON.TABLE_COLUMNS.CODE}</th>
                <th className="p-3">{SHIFT_UI.COMMON.TABLE_COLUMNS.OPENED_AT}</th>
                <th className="p-3">{SHIFT_UI.COMMON.TABLE_COLUMNS.CLOSED_AT}</th>
                <th className="p-3 text-right">
                  {SHIFT_UI.COMMON.TABLE_COLUMNS.OPENING_CASH}
                </th>
                <th className="p-3 text-right">
                  {SHIFT_UI.COMMON.TABLE_COLUMNS.EXPECTED_CASH}
                </th>
                <th className="p-3 text-right">
                  {SHIFT_UI.COMMON.TABLE_COLUMNS.ACTUAL_CASH}
                </th>
                <th className="p-3 text-right">
                  {SHIFT_UI.COMMON.TABLE_COLUMNS.DIFFERENCE}
                </th>
                <th className="p-3">
                  {SHIFT_UI.COMMON.TABLE_COLUMNS.DIFFERENCE_REASON}
                </th>
                <th className="p-3 text-center">
                  {SHIFT_UI.COMMON.TABLE_COLUMNS.STATUS}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {(() => {
                const filtered = shifts.filter(
                  (s) =>
                    s.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                    (s.differenceReason || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase())
                );
                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        {SHIFT_UI.COMMON.EMPTY_HISTORY_MESSAGE}
                      </td>
                    </tr>
                  );
                }
                return filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800 font-mono text-xs">
                      {s.id.slice(-SHIFT_CODE_SUFFIX_LENGTH)}
                    </td>
                    <td className="p-3 text-slate-600 text-xs">{formatDate(s.openedAt)}</td>
                    <td className="p-3 text-slate-600 text-xs">{formatDate(s.closedAt)}</td>
                    <td className="p-3 text-right text-xs sm:text-sm">{formatCurrency(s.openingCash)}</td>
                    <td className="p-3 text-right text-xs sm:text-sm">{formatCurrency(s.closingCashExpected)}</td>
                    <td className="p-3 text-right font-bold text-slate-800 text-xs sm:text-sm">
                      {s.closingCashActual !== null
                        ? formatCurrency(s.closingCashActual)
                        : SHIFT_UI.COMMON.EMPTY_VALUE}
                    </td>
                    <td
                      className={`p-3 text-right font-bold text-xs sm:text-sm ${
                        (s.differenceAmount || 0) === 0
                          ? "text-emerald-600"
                          : (s.differenceAmount || 0) < 0
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`}
                    >
                      {s.status === SHIFT_STATUS.OPEN
                        ? SHIFT_UI.COMMON.EMPTY_VALUE
                        : formatCurrency(s.differenceAmount)}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[150px] truncate text-xs" title={s.differenceReason || ""}>
                      {s.differenceReason || SHIFT_UI.COMMON.EMPTY_VALUE}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap inline-block text-center min-w-[76px] ${
                          s.status === SHIFT_STATUS.OPEN
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.status === SHIFT_STATUS.OPEN
                          ? SHIFT_STATUS_LABELS[SHIFT_STATUS.OPEN]
                          : SHIFT_STATUS_LABELS[SHIFT_STATUS.CLOSED]}
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* 3. Cashier Close Shift Modal */}
      {showCloseModal && shiftToClose && createPortal(
        <div
          onClick={() => {
            if (isClosingShift || isActiveFetching) return;
            setShowCloseModal(false);
            setShiftToClose(null);
          }}
          className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-2 backdrop-blur-sm animate-backdrop-fade-in sm:items-center sm:p-4"
        >
          <div
            ref={closeShiftDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cashier-close-shift-title"
            className="app-modal-panel my-auto flex w-full max-w-3xl lg:max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in"
          >
            {/* Header */}
            <div className="app-modal-header flex items-center justify-between bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 px-5 sm:px-6 py-4 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="cashier-close-shift-title" className="text-sm font-bold uppercase tracking-wider text-white">
                    {SHIFT_UI.CASHIER.CLOSE_MODAL.TITLE}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-rose-100 font-medium">
                    <span>Nhân viên: <strong className="text-white font-semibold">{shiftToClose.fullName || shiftToClose.username}</strong></span>
                    {shiftToClose.pointOfSaleName && (
                      <>
                        <span>•</span>
                        <span>Quầy: <strong className="text-white font-semibold">{shiftToClose.pointOfSaleName}</strong></span>
                      </>
                    )}
                    <span>•</span>
                    <span>Mở ca: <strong className="text-white font-semibold">{formatDate(shiftToClose.openedAt)}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isClosingShift || isActiveFetching) return;
                  setShowCloseModal(false);
                  setShiftToClose(null);
                }}
                type="button"
                disabled={isClosingShift || isActiveFetching}
                aria-label="Đóng hộp thoại đóng ca bán hàng"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="app-modal-body flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <p className="text-slate-500 font-normal text-xs leading-relaxed">
                {SHIFT_UI.CASHIER.CLOSE_MODAL.DESCRIPTION}
              </p>

              {(() => {
                const expectedVal =
                  shiftToClose.closingCashExpected ?? shiftToClose.openingCash;
                const diff = closingActualInput - expectedVal;

                return (
                  <>
                    {/* Phần 1: Đối Soát Tiền Mặt Tại Két */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Đối Soát Tiền Mặt Tại Két
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setClosingActualInput(expectedVal)}
                          disabled={isClosingShift}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Khớp nhanh tiền kì vọng ({formatCurrency(expectedVal)})</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Cột trái: Nhập số tiền thực tế & Lý do chênh lệch */}
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                              {SHIFT_UI.COMMON.RECONCILIATION.ACTUAL_CASH_INPUT_LABEL} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={formatNumber(closingActualInput)}
                                onChange={(e) => {
                                  const rawVal = e.target.value.replace(/\D/g, "");
                                  setClosingActualInput(rawVal ? Number(rawVal) : 0);
                                }}
                                disabled={isClosingShift}
                                className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-slate-300 bg-white text-base font-extrabold font-mono text-slate-800 shadow-2xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                                placeholder="0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                                đ
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Nhập số tiền mặt thực tế đếm được trong két khi bàn giao ca.
                            </span>
                          </div>

                          {diff !== 0 && (
                            <div className="flex flex-col gap-1.5 rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                              <label className="text-rose-700 flex items-center gap-1 text-xs font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                {SHIFT_UI.COMMON.RECONCILIATION.DIFFERENCE_REASON_LABEL} <span className="text-rose-500">*</span>
                              </label>
                              <textarea
                                value={closingReason}
                                onChange={(e) => setClosingReason(e.target.value)}
                                required
                                maxLength={SHIFT_DIFFERENCE_REASON_MAX_LENGTH}
                                disabled={isClosingShift}
                                placeholder={
                                  SHIFT_UI.COMMON.RECONCILIATION.DIFFERENCE_REASON_PLACEHOLDER
                                }
                                rows={2}
                                className="w-full p-2.5 rounded-lg border border-rose-300 bg-white text-xs text-slate-700 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none"
                              />
                              <div className="text-right text-[10px] text-rose-600 font-medium">
                                {closingReason.length}/{SHIFT_DIFFERENCE_REASON_MAX_LENGTH} ký tự
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cột phải: Bảng đối soát số liệu tiền mặt */}
                        <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-2.5 shadow-2xs">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
                            Bảng Tóm Tắt Kiểm Kê
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">{SHIFT_UI.COMMON.RECONCILIATION.EXPECTED_CASH_LABEL}</span>
                            <span className="font-bold font-mono text-slate-700">{formatCurrency(expectedVal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">{SHIFT_UI.COMMON.RECONCILIATION.ACTUAL_CASH_LABEL}</span>
                            <span className="font-bold font-mono text-slate-900">{formatCurrency(closingActualInput)}</span>
                          </div>
                          <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700">{SHIFT_UI.COMMON.RECONCILIATION.DIFFERENCE_LABEL}</span>
                            <div className="text-right">
                              {diff === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Khớp tiền (0 đ)
                                </span>
                              ) : diff < 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Thiếu: -{formatCurrency(Math.abs(diff))}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Thừa: +{formatCurrency(diff)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phần 2: Đối Soát Chuyển Khoản Ngân Hàng */}
                    <div className="mt-2">
                      <BankTransferReconciliationSection shiftId={shiftToClose.id} />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="app-modal-footer border-t border-slate-200 bg-slate-50/70 px-5 sm:px-6 py-3.5 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowCloseModal(false);
                  setShiftToClose(null);
                }}
                disabled={isClosingShift || isActiveFetching}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {SHIFT_UI.COMMON.CANCEL_BUTTON}
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                disabled={isClosingShift || isActiveFetching}
                aria-busy={isClosingShift || isActiveFetching}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30 transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {(isClosingShift || isActiveFetching) && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                )}
                {SHIFT_UI.CASHIER.CLOSE_MODAL.CONFIRM_BUTTON}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Cashier Open Shift Modal */}
      {showOpenModal && createPortal(
        <div
          onClick={() => {
            if (!isOpeningShift) setShowOpenModal(false);
          }}
          className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-2 backdrop-blur-sm animate-backdrop-fade-in sm:items-center sm:p-4"
        >
          <div
            ref={openShiftDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cashier-open-shift-title"
            className="app-modal-panel my-4 flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-slate-100 bg-white text-left font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in"
          >
            <div className="app-modal-header flex items-center justify-between bg-kv-blue-primary px-5 py-3 text-white">
              <h2 id="cashier-open-shift-title" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {SHIFT_UI.COMMON.OPEN_MODAL.TITLE}
              </h2>
              <button
                onClick={() => {
                  if (!isOpeningShift) setShowOpenModal(false);
                }}
                type="button"
                disabled={isOpeningShift}
                aria-label="Đóng hộp thoại mở ca bán hàng"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60 lg:h-8 lg:w-8"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="app-modal-body flex flex-col gap-4 p-5">
              <p className="text-slate-500 font-medium text-xs leading-relaxed">
                {SHIFT_UI.COMMON.OPEN_MODAL.CASHIER_DESCRIPTION}
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-bold uppercase">
                  {SHIFT_UI.COMMON.OPEN_MODAL.OPENING_CASH_LABEL}
                </label>
                <input
                  type="text"
                  value={formatNumber(openingCashInput)}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, "");
                    setOpeningCashInput(rawVal ? Number(rawVal) : 0);
                  }}
                  disabled={isOpeningShift}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold bg-white w-full"
                />
              </div>

              <div className="app-modal-footer sticky bottom-0 -mx-5 -mb-5 mt-2 flex gap-3 border-t border-slate-200 bg-white p-5">
                <button
                  onClick={handleOpenShift}
                  disabled={isOpeningShift}
                  aria-busy={isOpeningShift}
                  className="flex-1 bg-kv-green hover:bg-emerald-600 text-white font-bold h-9 rounded-lg transition-colors text-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isOpeningShift && (
                    <span
                      aria-hidden="true"
                      className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]"
                    />
                  )}
                  {SHIFT_UI.COMMON.OPEN_MODAL.CONFIRM_BUTTON}
                </button>
                <button
                  onClick={() => setShowOpenModal(false)}
                  disabled={isOpeningShift}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold h-9 rounded-lg transition-colors text-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {SHIFT_UI.COMMON.CANCEL_BUTTON}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showHandoverModal && (
        <ShiftHandoverModal
          isOpen={showHandoverModal}
          onClose={() => setShowHandoverModal(false)}
          onHandoverSuccess={() => {
            refetchActiveShift();
            refetchShiftsHistory();
          }}
        />
      )}

      {showCreateCashModal && currentShift && (
        <CreateCashTransactionModal
          isOpen={showCreateCashModal}
          onClose={() => setShowCreateCashModal(false)}
          shiftId={currentShift.id}
          defaultType={createCashType}
          isOwner={false}
          onSuccess={() => {
            refetchActiveShift();
          }}
        />
      )}
    </div>
  );
};
