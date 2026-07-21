import React, { useState } from "react";
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
import type { IShiftResponse } from "@/modules/shift/types/IShift";
import { useGetAllEmployeesQuery } from "@/modules/employee/services/employeeApi";
import { createPortal } from "react-dom";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

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
  } = useGetShiftsHistoryQuery();
  const shifts = shiftsHistoryData?.result || [];

  const {
    data: activeShiftData,
    error: activeShiftError,
    isError: isActiveError,
    refetch: refetchActiveShift,
  } = useGetActiveShiftQuery(undefined, {
      skip: currentRole === USER_ROLES.ACCOUNTANT,
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
  const [openingCashInput, setOpeningCashInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [selectedEmployeeForShift, setSelectedEmployeeForShift] = useState("");
  const [closingActualInput, setClosingActualInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingReason, setClosingReason] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, SHIFT_SEARCH_DEBOUNCE_MS);

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

  // Filter shifts based on search query
  const filteredShifts = shifts.filter((s) => {
    const q = debouncedSearchQuery.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      (s.fullName || "").toLowerCase().includes(q) ||
      (s.username || "").toLowerCase().includes(q) ||
      (s.differenceReason || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Top Actions Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={SHIFT_UI.HISTORY.SEARCH_PLACEHOLDER}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm focus:border-kv-blue-primary focus:outline-none lg:h-9"
            />
            <span className="absolute right-2.5 top-3 text-slate-400">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm w-full">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4 text-left">
          {SHIFT_UI.HISTORY.TITLE}
        </h3>
        <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
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
              {currentRole === USER_ROLES.OWNER && (
                <th className="p-3 text-center">
                  {SHIFT_UI.COMMON.TABLE_COLUMNS.ACTIONS}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredShifts.length === 0 ? (
              <tr>
                <td colSpan={currentRole === USER_ROLES.OWNER ? 11 : 10} className="p-8 text-center text-slate-400 font-medium">
                  {SHIFT_UI.COMMON.EMPTY_HISTORY_MESSAGE}
                </td>
              </tr>
            ) : (
              filteredShifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-800 font-mono text-[10px]">
                    {s.id.slice(-SHIFT_CODE_SUFFIX_LENGTH)}
                  </td>
                  <td className="p-3 font-bold text-slate-900">{s.fullName || s.username}</td>
                  <td className="p-3 text-slate-500">{formatDate(s.openedAt)}</td>
                  <td className="p-3 text-slate-500">{formatDate(s.closedAt)}</td>
                  <td className="p-3 text-right">{formatCurrency(s.openingCash)}</td>
                  <td className="p-3 text-right">{formatCurrency(s.closingCashExpected)}</td>
                  <td className="p-3 text-right font-bold text-slate-800">
                    {s.closingCashActual !== null
                      ? formatCurrency(s.closingCashActual)
                      : SHIFT_UI.COMMON.EMPTY_VALUE}
                  </td>
                  <td
                    className={`p-3 text-right font-bold ${
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
                  <td className="p-3 text-slate-500 max-w-[150px] truncate" title={s.differenceReason || ""}>
                    {s.differenceReason || SHIFT_UI.COMMON.EMPTY_VALUE}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap inline-block text-center min-w-[70px] ${
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
                  {currentRole === USER_ROLES.OWNER && (
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {s.status === SHIFT_STATUS.OPEN && (
                          <button
                            onClick={() => void handlePrepareCloseShift(s)}
                            disabled={isHistoryFetching || isClosingShift}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {SHIFT_UI.HISTORY.CLOSE_FOR_EMPLOYEE_BUTTON}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
            className="app-modal-panel my-4 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-100 bg-white text-left font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in"
          >
            <div className="app-modal-header flex items-center justify-between bg-rose-600 px-5 py-3 text-white">
              <h2 id="history-close-shift-title" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {SHIFT_UI.HISTORY.CLOSE_MODAL.TITLE}
              </h2>
              <button
                onClick={() => {
                  if (isClosingShift || isHistoryFetching) return;
                  setShowCloseModal(false);
                  setShiftToClose(null);
                }}
                disabled={isClosingShift || isHistoryFetching}
                type="button"
                aria-label="Đóng hộp thoại đóng ca hộ"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg text-white/80 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60 lg:h-8 lg:w-8"
              >
                <span aria-hidden="true">{SHIFT_UI.COMMON.CLOSE_ICON}</span>
              </button>
            </div>

            <div className="app-modal-body flex flex-col gap-4 p-5">
              <p className="text-slate-500 font-medium text-xs leading-relaxed">
                {SHIFT_UI.HISTORY.CLOSE_MODAL.DESCRIPTION}
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-bold uppercase">
                  {SHIFT_UI.COMMON.RECONCILIATION.ACTUAL_CASH_INPUT_LABEL}
                </label>
                <input
                  type="text"
                  value={formatNumber(closingActualInput)}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, "");
                    setClosingActualInput(rawVal ? Number(rawVal) : 0);
                  }}
                  disabled={isClosingShift}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold bg-white w-full"
                />
              </div>

              {(() => {
                const expectedVal =
                  shiftToClose.closingCashExpected ?? shiftToClose.openingCash;
                const diff = closingActualInput - expectedVal;

                return (
                  <>
                    <div className="bg-slate-50 p-3 rounded-lg border flex flex-col gap-1.5 text-xs text-slate-600 font-bold">
                      <div className="flex justify-between">
                        <span>{SHIFT_UI.COMMON.RECONCILIATION.EXPECTED_CASH_LABEL}</span>
                        <span className="font-extrabold text-slate-900">{formatCurrency(expectedVal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{SHIFT_UI.COMMON.RECONCILIATION.ACTUAL_CASH_LABEL}</span>
                        <span className="font-extrabold text-slate-900">{formatCurrency(closingActualInput)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1.5">
                        <span>{SHIFT_UI.COMMON.RECONCILIATION.DIFFERENCE_LABEL}</span>
                        <span className={diff === 0 ? "text-emerald-600" : diff < 0 ? "text-rose-600" : "text-amber-600"}>
                          {diff === 0
                            ? SHIFT_UI.COMMON.ZERO_AMOUNT_LABEL
                            : (diff > 0 ? SHIFT_UI.COMMON.POSITIVE_AMOUNT_PREFIX : "") +
                              formatCurrency(diff)}
                        </span>
                      </div>
                    </div>

                    {diff !== 0 && (
                      <div className="flex flex-col gap-1">
                        <label className="text-rose-600 flex items-center gap-1 text-xs">
                          {SHIFT_UI.HISTORY.CLOSE_MODAL.DIFFERENCE_REASON_LABEL}
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
                          style={{ resize: "none" }}
                          className="border border-rose-300 h-16 p-2 rounded-lg focus:outline-none focus:border-rose-500 text-xs w-full"
                        ></textarea>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="app-modal-footer sticky bottom-0 -mx-5 -mb-5 mt-2 flex gap-3 border-t border-slate-200 bg-white p-5">
                <button
                  onClick={handleCloseShift}
                  disabled={isClosingShift || isHistoryFetching}
                  aria-busy={isClosingShift || isHistoryFetching}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 rounded-lg transition-colors text-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(isClosingShift || isHistoryFetching) && (
                    <span
                      aria-hidden="true"
                      className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]"
                    />
                  )}
                  {SHIFT_UI.HISTORY.CLOSE_MODAL.CONFIRM_BUTTON}
                </button>
                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    setShiftToClose(null);
                  }}
                  disabled={isClosingShift || isHistoryFetching}
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg text-white/80 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60 lg:h-8 lg:w-8"
              >
                <span aria-hidden="true">{SHIFT_UI.COMMON.CLOSE_ICON}</span>
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
    </div>
  );
};
