import React, { useState, useMemo, useEffect } from "react";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { Wallet, Lock, X, AlertTriangle, CheckCircle2, Banknote, Sparkles } from "lucide-react";
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
import { USER_ROLES } from "@/constants/roles";
import {
  useGetShiftsHistoryQuery,
  useGetActiveShiftQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
} from "@/modules/shift/services/shiftApi";
import { useGetShiftCashSummaryQuery } from "@/modules/shift/services/cashTransactionApi";
import type { IShiftResponse } from "@/modules/shift/types/IShift";
import { useGetAllEmployeesQuery } from "@/modules/employee/services/employeeApi";
import { createPortal } from "react-dom";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { BankTransferReconciliationSection } from "./BankTransferReconciliationSection";
import { ShiftCashSummaryCard } from "./ShiftCashSummaryCard";
import { ShiftCashTransactionsTable } from "./ShiftCashTransactionsTable";

interface ShiftHistoryTableProps {
  currentRole: string;
}

export const ShiftHistoryTable: React.FC<ShiftHistoryTableProps> = ({ currentRole }) => {
  const { showSuccess, showError } = useNotification();
  const {
    data: shiftsHistoryData,
    error: shiftsHistoryError,
    isError: isHistoryError,
    isFetching: isHistoryFetching,
    isLoading,
    refetch: refetchShiftsHistory,
  } = useGetShiftsHistoryQuery(undefined, { refetchOnMountOrArgChange: true });
  const rawShifts = shiftsHistoryData?.result;
  const shifts = useMemo(() => rawShifts || [], [rawShifts]);

  const {
    data: activeShiftData,
    error: activeShiftError,
    isError: isActiveError,
    refetch: refetchActiveShift,
  } = useGetActiveShiftQuery(undefined, {
      skip: currentRole === USER_ROLES.ACCOUNTANT,
      refetchOnMountOrArgChange: true,
    });
  const currentShift = activeShiftData?.result ?? null;

  const { data: employees = [] } = useGetAllEmployeesQuery(undefined, {
    skip: currentRole !== USER_ROLES.OWNER,
  });

  const [openShiftMutation, { isLoading: isOpeningShift }] = useOpenShiftMutation();
  const [closeShiftMutation, { isLoading: isClosingShift }] = useCloseShiftMutation();

  // Local Modal States
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [shiftToClose, setShiftToClose] = useState<IShiftResponse | null>(null);
  const [viewingCashShift, setViewingCashShift] = useState<IShiftResponse | null>(null);
  const [openingCashInput, setOpeningCashInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [selectedEmployeeForShift, setSelectedEmployeeForShift] = useState("");
  const [closingActualInput, setClosingActualInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingReason, setClosingReason] = useState("");

  // Cash summary for shift to close
  const { data: closeShiftCashSummaryData } = useGetShiftCashSummaryQuery(
    shiftToClose?.id ?? "",
    { skip: !shiftToClose }
  );
  const closeShiftCashSummary = closeShiftCashSummaryData?.result;
  const hasPendingExpenses = (closeShiftCashSummary?.pendingExpenseCount ?? 0) > 0;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, SHIFT_SEARCH_DEBOUNCE_MS);

  // Pagination state (8 records/page)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, shifts.length]);

  const filteredShifts = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase();
    return shifts.filter((s) => {
      return (
        s.id.toLowerCase().includes(q) ||
        (s.fullName || "").toLowerCase().includes(q) ||
        (s.username || "").toLowerCase().includes(q) ||
        (s.differenceReason || "").toLowerCase().includes(q)
      );
    });
  }, [shifts, debouncedSearchQuery]);

  const paginatedShifts = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredShifts.slice(start, start + PAGE_SIZE);
  }, [filteredShifts, page]);

  const handleOpenShift = async () => {
    if (isOpeningShift) return;
    if (currentShift && !selectedEmployeeForShift) {
      showError(SHIFT_MESSAGES.EMPLOYEE_REQUIRED);
      return;
    }

    try {
      await openShiftMutation({
        openingCash: openingCashInput,
        userId: selectedEmployeeForShift || undefined,
      }).unwrap();
      showSuccess(SHIFT_MESSAGES.OPEN_SUCCESS);
      setSelectedEmployeeForShift("");
      setShowOpenModal(false);
    } catch (error: unknown) {
      showError(
        SHIFT_MESSAGES.OPEN_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.OPEN_ERROR)
      );
    }
  };

  const handlePrepareCloseShift = async (selectedShift: IShiftResponse) => {
    if (isHistoryFetching || isClosingShift) return;

    try {
      const refreshedHistory = await refetchShiftsHistory().unwrap();
      const latestShift = refreshedHistory.result.find(
        (shift) => shift.id === selectedShift.id,
      );

      if (!latestShift || latestShift.status !== SHIFT_STATUS.OPEN) {
        showError(SHIFT_MESSAGES.SHIFT_NO_LONGER_OPEN);
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
    if (!shiftToClose || isClosingShift || isHistoryFetching) return;
    if (hasPendingExpenses) {
      showError(
        `Không thể đóng ca! Ca này đang có ${closeShiftCashSummary?.pendingExpenseCount} khoản chi chờ duyệt. Vui lòng phê duyệt hoặc từ chối trước khi đóng ca.`
      );
      return;
    }
    const targetShiftId = shiftToClose.id;

    try {
      const refreshedHistory = await refetchShiftsHistory().unwrap();
      const latestShift = refreshedHistory.result.find(
        (shift) => shift.id === targetShiftId,
      );
      if (!latestShift || latestShift.status !== SHIFT_STATUS.OPEN) {
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
    canClose: !isClosingShift && !isHistoryFetching,
  });
  const openShiftDialogRef = useAccessibleDialog({
    isOpen: showOpenModal,
    onClose: () => setShowOpenModal(false),
    canClose: !isOpeningShift,
  });
  const viewCashDialogRef = useAccessibleDialog({
    isOpen: Boolean(viewingCashShift),
    onClose: () => setViewingCashShift(null),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
        {SHIFT_UI.HISTORY.LOADING_MESSAGE}
      </div>
    );
  }

  if (isHistoryError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center text-sm font-semibold text-rose-700">
        <p>{getApiErrorMessage(shiftsHistoryError, SHIFT_MESSAGES.ACTIVE_SHIFT_LOAD_ERROR)}</p>
        <button
          type="button"
          onClick={() => void refetchShiftsHistory()}
          className="mt-3 min-h-11 rounded-lg border border-rose-300 bg-white px-4 font-bold transition-colors hover:bg-rose-100"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (currentRole !== USER_ROLES.ACCOUNTANT && isActiveError) {
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
    <div className="flex flex-col gap-4">
      {/* Top Actions Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={SHIFT_UI.HISTORY.SEARCH_PLACEHOLDER}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-kv-blue-primary"
            />
            <span className="absolute left-3 top-2 text-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
          </div>
        </div>

        {currentRole === USER_ROLES.OWNER && (
          <div className="shrink-0 w-full md:w-auto flex justify-end">
            {currentShift ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  onClick={() => void handlePrepareCloseShift(currentShift)}
                  disabled={isHistoryFetching || isClosingShift}
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto lg:h-9"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {SHIFT_UI.HISTORY.CLOSE_CURRENT_SHIFT_BUTTON}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpeningCashInput(DEFAULT_SHIFT_CASH_AMOUNT);
                    setSelectedEmployeeForShift("");
                    setShowOpenModal(true);
                  }}
                  disabled={isOpeningShift}
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-kv-green px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto lg:h-9"
                >
                  {SHIFT_UI.HISTORY.OPEN_FOR_EMPLOYEE_BUTTON}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpeningCashInput(DEFAULT_SHIFT_CASH_AMOUNT);
                  setSelectedEmployeeForShift("");
                  setShowOpenModal(true);
                }}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-kv-green px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 sm:w-auto lg:h-9"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                {SHIFT_UI.COMMON.OPEN_SHIFT_BUTTON}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm w-full flex flex-col justify-between min-h-[500px]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm text-left">
              {SHIFT_UI.HISTORY.TITLE}
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {filteredShifts.length} ca làm việc
            </span>
          </div>
        <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs sm:text-sm">
              <th className="p-3">{SHIFT_UI.COMMON.TABLE_COLUMNS.CODE}</th>
              <th className="p-3">{SHIFT_UI.COMMON.TABLE_COLUMNS.EMPLOYEE}</th>
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
              <th className="p-3 text-center">
                {SHIFT_UI.COMMON.TABLE_COLUMNS.ACTIONS}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredShifts.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                  {SHIFT_UI.COMMON.EMPTY_HISTORY_MESSAGE}
                </td>
              </tr>
            ) : (
              paginatedShifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-800 font-mono text-xs">
                    {s.id.slice(-SHIFT_CODE_SUFFIX_LENGTH)}
                  </td>
                  <td className="p-3 font-bold text-slate-900 text-xs sm:text-sm">{s.fullName || s.username}</td>
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
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewingCashShift(s)}
                        title="Xem sổ quỹ thu chi ngoài bán hàng của ca"
                        className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Thu/Chi</span>
                      </button>
                      {currentRole === USER_ROLES.OWNER && s.status === SHIFT_STATUS.OPEN && (
                        <button
                          onClick={() => void handlePrepareCloseShift(s)}
                          disabled={isHistoryFetching || isClosingShift}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {SHIFT_UI.HISTORY.CLOSE_FOR_EMPLOYEE_BUTTON}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <TablePaginationFooter
        currentPage={page}
        pageSize={PAGE_SIZE}
        totalElements={filteredShifts.length}
        onPageChange={setPage}
        recordUnit="ca làm việc"
      />
    </div>

      {/* Local Close Shift Modal */}
      {showCloseModal && shiftToClose && createPortal(
        <div
          onClick={() => {
            if (isClosingShift || isHistoryFetching) return;
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
            aria-labelledby="history-close-shift-title"
            className="app-modal-panel my-auto flex w-full max-w-3xl lg:max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in"
          >
            {/* Header */}
            <div className="app-modal-header flex items-center justify-between bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 px-5 sm:px-6 py-4 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="history-close-shift-title" className="text-sm font-bold uppercase tracking-wider text-white">
                    {SHIFT_UI.HISTORY.CLOSE_MODAL.TITLE}
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
                  if (isClosingShift || isHistoryFetching) return;
                  setShowCloseModal(false);
                  setShiftToClose(null);
                }}
                disabled={isClosingShift || isHistoryFetching}
                type="button"
                aria-label="Đóng hộp thoại đóng ca hộ"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="app-modal-body flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <p className="text-slate-500 font-normal text-xs leading-relaxed">
                {SHIFT_UI.HISTORY.CLOSE_MODAL.DESCRIPTION}
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
                                {SHIFT_UI.HISTORY.CLOSE_MODAL.DIFFERENCE_REASON_LABEL} <span className="text-rose-500">*</span>
                              </label>
                              <textarea
                                value={closingReason}
                                onChange={(e) => setClosingReason(e.target.value)}
                                required
                                maxLength={SHIFT_DIFFERENCE_REASON_MAX_LENGTH}
                                disabled={isClosingShift}
                                placeholder={
                                  SHIFT_UI.HISTORY.CLOSE_MODAL.DIFFERENCE_REASON_PLACEHOLDER
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

                    {/* Cảnh báo nếu có khoản chi chờ duyệt */}
                    {hasPendingExpenses && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-700 font-bold flex items-center gap-3">
                        <span className="shrink-0 text-lg">⚠️</span>
                        <div className="leading-relaxed">
                          Ca này còn <b>{closeShiftCashSummary?.pendingExpenseCount} khoản chi</b> chờ duyệt ({formatCurrency(closeShiftCashSummary?.totalPendingExpense || 0)}). Bạn phải duyệt hoặc từ chối các khoản chi trước khi đóng ca!
                        </div>
                      </div>
                    )}

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
                disabled={isClosingShift || isHistoryFetching}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {SHIFT_UI.COMMON.CANCEL_BUTTON}
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                disabled={isClosingShift || isHistoryFetching || hasPendingExpenses}
                aria-busy={isClosingShift || isHistoryFetching}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30 transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {(isClosingShift || isHistoryFetching) && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                )}
                {SHIFT_UI.HISTORY.CLOSE_MODAL.CONFIRM_BUTTON}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Local Open Shift Modal */}
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
            aria-labelledby="history-open-shift-title"
            className="app-modal-panel my-4 flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-slate-100 bg-white text-left font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in"
          >
            <div className="app-modal-header flex items-center justify-between bg-kv-blue-primary px-5 py-3 text-white">
              <h2 id="history-open-shift-title" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {SHIFT_UI.COMMON.OPEN_MODAL.TITLE}
              </h2>
              <button
                onClick={() => {
                  if (!isOpeningShift) setShowOpenModal(false);
                }}
                type="button"
                disabled={isOpeningShift}
                aria-label="Đóng hộp thoại mở ca làm việc"
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
                {SHIFT_UI.COMMON.OPEN_MODAL.OWNER_DESCRIPTION}
              </p>

              {currentRole === USER_ROLES.OWNER && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500 font-bold uppercase">
                    {SHIFT_UI.COMMON.OPEN_MODAL.EMPLOYEE_LABEL}
                  </label>
                  <select
                    value={selectedEmployeeForShift}
                    onChange={(e) => setSelectedEmployeeForShift(e.target.value)}
                    disabled={isOpeningShift}
                    className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold bg-white text-slate-700 w-full"
                  >
                    <option value="">
                      {currentShift
                        ? SHIFT_UI.COMMON.OPEN_MODAL.EMPLOYEE_OPTION_LABEL
                        : SHIFT_UI.COMMON.OPEN_MODAL.SELF_OPTION_LABEL}
                    </option>
                    {employees
                      .filter((emp) => emp.isActive && emp.roleCode === USER_ROLES.CASHIER)
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.username})
                        </option>
                      ))}
                  </select>
                </div>
              )}

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
                  disabled={
                    isOpeningShift || Boolean(currentShift && !selectedEmployeeForShift)
                  }
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

      {/* View Cash Transactions Modal for Shift History */}
      {viewingCashShift && createPortal(
        <div
          onClick={() => setViewingCashShift(null)}
          className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-xs animate-backdrop-fade-in sm:items-center sm:p-4"
        >
          <div
            ref={viewCashDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-cash-detail-title"
            className="app-modal-panel my-4 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in max-h-[90vh]"
          >
            <div className="app-modal-header flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 id="history-cash-detail-title" className="text-sm font-extrabold uppercase tracking-wide text-white">
                    Sổ quỹ thu / chi - Ca #{viewingCashShift.id.slice(-SHIFT_CODE_SUFFIX_LENGTH)}
                  </h2>
                  <p className="text-[11px] text-blue-100 font-medium">
                    Nhân viên phụ trách: <span className="font-bold text-white">{viewingCashShift.fullName || viewingCashShift.username}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCashShift(null)}
                type="button"
                aria-label="Đóng sổ quỹ ca"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="app-modal-body flex flex-col gap-4 p-5 overflow-y-auto max-h-[calc(90vh-120px)] pos-tabs-scrollbar">
              <ShiftCashSummaryCard shiftId={viewingCashShift.id} canCreate={false} />
              <ShiftCashTransactionsTable
                shiftId={viewingCashShift.id}
                isOwner={currentRole === USER_ROLES.OWNER}
              />
            </div>

            <div className="app-modal-footer flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
              <span className="text-xs text-slate-500 font-medium">
                Khoản thu chi ngoài ca không tính vào doanh thu bán hàng & không xuất hóa đơn
              </span>
              <button
                type="button"
                onClick={() => setViewingCashShift(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-2xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
