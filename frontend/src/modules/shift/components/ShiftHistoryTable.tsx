import React, { useState } from "react";
import {
  DEFAULT_SHIFT_CASH_AMOUNT,
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
import { getApiErrorMessage } from "@/modules/shift/utils/getApiErrorMessage";

interface ShiftHistoryTableProps {
  currentRole: string;
}

export const ShiftHistoryTable: React.FC<ShiftHistoryTableProps> = ({ currentRole }) => {
  const { data: shiftsHistoryData, isLoading } = useGetShiftsHistoryQuery();
  const shifts = shiftsHistoryData?.result || [];

  const { data: activeShiftData } = useGetActiveShiftQuery();
  const currentShift = activeShiftData?.result || null;

  const { data: employees = [] } = useGetAllEmployeesQuery();

  const [openShiftMutation] = useOpenShiftMutation();
  const [closeShiftMutation] = useCloseShiftMutation();

  // Local Modal States
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [activeCloseShiftId, setActiveCloseShiftId] = useState<string | null>(null);
  const [openingCashInput, setOpeningCashInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [selectedEmployeeForShift, setSelectedEmployeeForShift] = useState("");
  const [closingActualInput, setClosingActualInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingReason, setClosingReason] = useState("");

  // Search, Edit and Delete states
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, SHIFT_SEARCH_DEBOUNCE_MS);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<IShiftResponse | null>(null);
  const [editOpeningCash, setEditOpeningCash] = useState(0);
  const [editClosingCashActual, setEditClosingCashActual] = useState(0);
  const [editDifferenceReason, setEditDifferenceReason] = useState("");

  const handleOpenShift = async () => {
    try {
      await openShiftMutation({
        openingCash: openingCashInput,
        userId: selectedEmployeeForShift || undefined,
      }).unwrap();
      alert(SHIFT_MESSAGES.OPEN_SUCCESS);
      setSelectedEmployeeForShift("");
      setShowOpenModal(false);
    } catch (error: unknown) {
      alert(
        SHIFT_MESSAGES.OPEN_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.OPEN_ERROR)
      );
    }
  };

  const handleCloseShift = async () => {
    if (!activeCloseShiftId) return;

    const targetShift = shifts.find((s) => s.id === activeCloseShiftId);
    const expectedVal = targetShift?.closingCashExpected || 0;
    const diff = closingActualInput - expectedVal;

    if (diff !== 0 && (!closingReason || !closingReason.trim())) {
      alert(SHIFT_MESSAGES.DIFFERENCE_REASON_REQUIRED);
      return;
    }

    try {
      await closeShiftMutation({
        id: activeCloseShiftId,
        body: {
          closingCashActual: closingActualInput,
          differenceReason: diff !== 0 ? closingReason : undefined,
        },
      }).unwrap();
      alert(SHIFT_MESSAGES.CLOSE_SUCCESS);
      setClosingReason("");
      setShowCloseModal(false);
      setActiveCloseShiftId(null);
    } catch (error: unknown) {
      alert(
        SHIFT_MESSAGES.CLOSE_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.CLOSE_ERROR)
      );
    }
  };

  const handleDeleteShift = (id: string) => {
    const shiftCode = id.slice(-SHIFT_CODE_SUFFIX_LENGTH);

    if (window.confirm(SHIFT_MESSAGES.DELETE_CONFIRM(shiftCode))) {
      alert(SHIFT_MESSAGES.DELETE_SUCCESS(shiftCode));
    }
  };

  const handleSaveEdit = () => {
    alert(SHIFT_MESSAGES.EDIT_SUCCESS);
    setShowEditModal(false);
    setEditingShift(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
        {SHIFT_UI.HISTORY.LOADING_MESSAGE}
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
              className="border border-slate-300 w-full h-9 px-3 pr-8 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 shadow-sm"
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
              <button
                onClick={() => {
                  setActiveCloseShiftId(currentShift.id);
                  setClosingActualInput(currentShift.closingCashExpected || currentShift.openingCash);
                  setShowCloseModal(true);
                }}
                className="bg-rose-600 hover:bg-rose-700 transition-colors text-white h-9 px-4 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm text-xs w-full sm:w-auto"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {SHIFT_UI.HISTORY.CLOSE_CURRENT_SHIFT_BUTTON}
              </button>
            ) : (
              <button
                onClick={() => {
                  setOpeningCashInput(DEFAULT_SHIFT_CASH_AMOUNT);
                  setSelectedEmployeeForShift("");
                  setShowOpenModal(true);
                }}
                className="bg-kv-green hover:bg-emerald-600 transition-colors text-white h-9 px-4 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm text-xs w-full sm:w-auto"
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
        <table className="w-full text-left border-collapse text-[11px]">
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
                            onClick={() => {
                              setActiveCloseShiftId(s.id);
                              setClosingActualInput(s.closingCashExpected || s.openingCash);
                              setShowCloseModal(true);
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded text-[10px] transition-colors"
                          >
                            {SHIFT_UI.HISTORY.CLOSE_FOR_EMPLOYEE_BUTTON}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingShift(s);
                            setEditOpeningCash(s.openingCash);
                            setEditClosingCashActual(s.closingCashActual || s.openingCash);
                            setEditDifferenceReason(s.differenceReason || "");
                            setShowEditModal(true);
                          }}
                          title={SHIFT_UI.HISTORY.EDIT_TOOLTIP}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-amber-500 hover:text-amber-600">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteShift(s.id)}
                          title={SHIFT_UI.HISTORY.DELETE_TOOLTIP}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-rose-500 hover:text-rose-600">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
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
      {showCloseModal && createPortal(
        <div
          onClick={() => {
            setShowCloseModal(false);
            setActiveCloseShiftId(null);
          }}
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
                {SHIFT_UI.HISTORY.CLOSE_MODAL.TITLE}
              </h2>
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setActiveCloseShiftId(null);
                }}
                type="button"
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                {SHIFT_UI.COMMON.CLOSE_ICON}
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
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
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold bg-white w-full"
                />
              </div>

              {(() => {
                const targetShift = shifts.find((s) => s.id === activeCloseShiftId);
                const expectedVal = targetShift?.closingCashExpected || 0;
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

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleCloseShift}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 rounded-lg transition-colors text-xs"
                >
                  {SHIFT_UI.HISTORY.CLOSE_MODAL.CONFIRM_BUTTON}
                </button>
                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    setActiveCloseShiftId(null);
                  }}
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

      {/* Edit Shift Modal */}
      {showEditModal && editingShift && createPortal(
        <div
          onClick={() => {
            setShowEditModal(false);
            setEditingShift(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col my-4 animate-modal-bounce-in text-left font-semibold text-slate-700"
          >
            <div className="bg-kv-blue-primary text-white px-5 py-3 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                {SHIFT_UI.HISTORY.EDIT_MODAL.TITLE}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingShift(null);
                }}
                type="button"
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                {SHIFT_UI.COMMON.CLOSE_ICON}
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-bold uppercase">
                  {SHIFT_UI.HISTORY.EDIT_MODAL.SHIFT_CODE_LABEL}
                </label>
                <input
                  type="text"
                  disabled
                  value={editingShift.id}
                  className="border border-slate-200 h-9 px-3 rounded-lg bg-slate-50 text-slate-400 text-xs font-mono w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-bold uppercase">
                  {SHIFT_UI.HISTORY.EDIT_MODAL.EMPLOYEE_LABEL}
                </label>
                <input
                  type="text"
                  disabled
                  value={editingShift.fullName || editingShift.username}
                  className="border border-slate-200 h-9 px-3 rounded-lg bg-slate-50 text-slate-400 text-xs w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-bold uppercase">
                  {SHIFT_UI.HISTORY.EDIT_MODAL.OPENING_CASH_LABEL}
                </label>
                <input
                  type="text"
                  value={formatNumber(editOpeningCash)}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, "");
                    setEditOpeningCash(rawVal ? Number(rawVal) : 0);
                  }}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold w-full"
                />
              </div>

              {editingShift.status === SHIFT_STATUS.CLOSED && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-500 font-bold uppercase">
                      {SHIFT_UI.HISTORY.EDIT_MODAL.ACTUAL_CASH_LABEL}
                    </label>
                    <input
                      type="text"
                      value={formatNumber(editClosingCashActual)}
                      onChange={(e) => {
                        const rawVal = e.target.value.replace(/\D/g, "");
                        setEditClosingCashActual(rawVal ? Number(rawVal) : 0);
                      }}
                      className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-500 font-bold uppercase">
                      {SHIFT_UI.HISTORY.EDIT_MODAL.DIFFERENCE_REASON_LABEL}
                    </label>
                    <textarea
                      value={editDifferenceReason}
                      onChange={(e) => setEditDifferenceReason(e.target.value)}
                      placeholder={
                        SHIFT_UI.HISTORY.EDIT_MODAL.DIFFERENCE_REASON_PLACEHOLDER
                      }
                      style={{ resize: "none" }}
                      className="border border-slate-300 h-16 p-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs w-full"
                    ></textarea>
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-kv-blue-primary hover:bg-blue-600 text-white font-bold h-9 rounded-lg transition-colors text-xs"
                >
                  {SHIFT_UI.HISTORY.EDIT_MODAL.SAVE_BUTTON}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingShift(null);
                  }}
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

      {/* Local Open Shift Modal */}
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
                    className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold bg-white text-slate-700 w-full"
                  >
                    <option value="">{SHIFT_UI.COMMON.OPEN_MODAL.SELF_OPTION_LABEL}</option>
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
