import React, { useState, useEffect } from "react";
import {
  DEFAULT_SHIFT_CASH_AMOUNT,
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
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";

export const CashierShiftDashboard: React.FC = () => {
  const { data: activeShiftData, isLoading: isActiveLoading } = useGetActiveShiftQuery();
  const currentShift = activeShiftData?.result || null;

  const { data: shiftsHistoryData, isLoading: isHistoryLoading } = useGetShiftsHistoryQuery();
  const shifts = shiftsHistoryData?.result || [];

  const [openShiftMutation] = useOpenShiftMutation();
  const [closeShiftMutation] = useCloseShiftMutation();

  const { orders } = useDashboardDemo();

  const cashSales = orders
    .filter((order) => {
      const isCompleted = order.status === "COMPLETED";
      const isCash = order.paymentMethod === "CASH";
      if (!isCompleted || !isCash) return false;
      if (!currentShift?.openedAt) return true;
      try {
        const orderTime = new Date(order.createdAt).getTime();
        const shiftOpenTime = new Date(currentShift.openedAt).getTime();
        return orderTime >= shiftOpenTime;
      } catch (e) {
        return true;
      }
    })
    .reduce((sum, order) => sum + order.finalAmount, 0);

  const expectedCash = currentShift ? currentShift.openingCash + cashSales : 0;

  // Inputs & Modal States
  const [openingCashInput, setOpeningCashInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingActualInput, setClosingActualInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingReason, setClosingReason] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, SHIFT_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (currentShift) {
      setClosingActualInput(expectedCash);
    }
  }, [currentShift, expectedCash]);


  const handleOpenShift = async () => {
    try {
      await openShiftMutation({
        openingCash: openingCashInput,
      }).unwrap();
      alert(SHIFT_MESSAGES.OPEN_SUCCESS);
    } catch (error: unknown) {
      alert(
        SHIFT_MESSAGES.OPEN_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.OPEN_ERROR)
      );
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    const expectedVal = expectedCash;
    const diff = closingActualInput - expectedVal;

    if (diff !== 0 && (!closingReason || !closingReason.trim())) {
      alert(SHIFT_MESSAGES.DIFFERENCE_REASON_REQUIRED);
      return;
    }

    try {
      await closeShiftMutation({
        id: currentShift.id,
        body: {
          closingCashActual: closingActualInput,
          differenceReason: diff !== 0 ? closingReason : undefined,
        },
      }).unwrap();
      alert(SHIFT_MESSAGES.CLOSE_SUCCESS);
      setClosingReason("");
      setShowCloseModal(false);
    } catch (error: unknown) {
      alert(
        SHIFT_MESSAGES.CLOSE_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.CLOSE_ERROR)
      );
    }
  };

  if (isActiveLoading || isHistoryLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold animate-pulse">
        {SHIFT_UI.CASHIER.LOADING_MESSAGE}
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
            <button
              onClick={() => {
                setClosingActualInput(expectedCash);
                setShowCloseModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 transition-colors text-white px-3 py-1.5 rounded-lg font-bold shadow-sm text-[10px]"
            >
              {SHIFT_UI.CASHIER.CLOSE_SHIFT_BUTTON}
            </button>
          )}
        </div>

        {currentShift ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {formatCurrency(expectedCash)}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {SHIFT_UI.CASHIER.EXPECTED_CASH_HINT}
                </div>
              </div>
            </div>
          </div>
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
              className="border border-slate-300 w-full h-8 px-3 pr-8 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700"
            />
            <span className="absolute right-2.5 top-2.5 text-slate-400">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
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
                    <td className="p-3 font-bold text-slate-800 font-mono text-[10px]">
                      {s.id.slice(-SHIFT_CODE_SUFFIX_LENGTH)}
                    </td>
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
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Cashier Close Shift Modal */}
      {showCloseModal && currentShift && createPortal(
        <div
          onClick={() => setShowCloseModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col my-4 animate-modal-bounce-in text-left font-semibold text-slate-700"
          >
            <div className="bg-rose-600 px-5 py-3 text-white flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {SHIFT_UI.CASHIER.CLOSE_MODAL.TITLE}
              </h2>
              <button
                onClick={() => setShowCloseModal(false)}
                type="button"
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                {SHIFT_UI.COMMON.CLOSE_ICON}
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 font-semibold text-slate-700">
              <p className="text-slate-500 font-medium text-xs leading-relaxed">
                {SHIFT_UI.CASHIER.CLOSE_MODAL.DESCRIPTION}
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">
                  {SHIFT_UI.COMMON.RECONCILIATION.ACTUAL_CASH_INPUT_LABEL}
                </label>
                <input
                  type="text"
                  value={formatNumber(closingActualInput)}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, "");
                    setClosingActualInput(rawVal ? Number(rawVal) : 0);
                  }}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold bg-white"
                />
              </div>

              {(() => {
                const expectedVal = expectedCash;
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
                          {SHIFT_UI.COMMON.RECONCILIATION.DIFFERENCE_REASON_LABEL}
                        </label>
                        <textarea
                          value={closingReason}
                          onChange={(e) => setClosingReason(e.target.value)}
                          required
                          placeholder={
                            SHIFT_UI.COMMON.RECONCILIATION.DIFFERENCE_REASON_PLACEHOLDER
                          }
                          style={{ resize: "none" }}
                          className="border border-rose-300 h-16 p-2 rounded-lg focus:outline-none focus:border-rose-500 text-xs"
                        ></textarea>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleCloseShift}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 rounded-lg transition-colors text-xs"
                >
                  {SHIFT_UI.CASHIER.CLOSE_MODAL.CONFIRM_BUTTON}
                </button>
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold h-9 rounded-lg transition-colors text-xs"
                >
                  {SHIFT_UI.COMMON.CANCEL_BUTTON}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Cashier Open Shift Modal */}
      {showOpenModal && createPortal(
        <div
          onClick={() => setShowOpenModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden flex flex-col my-4 animate-modal-bounce-in text-left font-semibold text-slate-700"
          >
            <div className="bg-kv-blue-primary text-white px-5 py-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {SHIFT_UI.COMMON.OPEN_MODAL.TITLE}
              </h2>
              <button
                onClick={() => setShowOpenModal(false)}
                type="button"
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                {SHIFT_UI.COMMON.CLOSE_ICON}
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
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
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold bg-white w-full"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={async () => {
                    await handleOpenShift();
                    setShowOpenModal(false);
                  }}
                  className="flex-1 bg-kv-green hover:bg-emerald-600 text-white font-bold h-9 rounded-lg transition-colors text-xs"
                >
                  {SHIFT_UI.COMMON.OPEN_MODAL.CONFIRM_BUTTON}
                </button>
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold h-9 rounded-lg transition-colors text-xs"
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
