import React, { useState, useEffect } from "react";
import {
  DEFAULT_SHIFT_CASH_AMOUNT,
  SHIFT_MESSAGES,
  SHIFT_UI,
} from "@/constants/shift";
import { APP_LOCALE } from "@/constants/format";
import { USER_ROLES } from "@/constants/roles";
import {
  useGetActiveShiftQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
} from "@/modules/shift/services/shiftApi";
import { useGetAllEmployeesQuery } from "@/modules/employee/services/employeeApi";
import { createPortal } from "react-dom";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/modules/shift/utils/getApiErrorMessage";

interface ShiftManagementPanelProps {
  currentRole: string;
}

export const ShiftManagementPanel: React.FC<ShiftManagementPanelProps> = ({
  currentRole,
}) => {
  const { data: activeShiftData, isLoading: isActiveLoading } = useGetActiveShiftQuery();
  const currentShift = activeShiftData?.result || null;

  const { data: employees = [] } = useGetAllEmployeesQuery();

  const [openShiftMutation] = useOpenShiftMutation();
  const [closeShiftMutation] = useCloseShiftMutation();

  const [openingCashInput, setOpeningCashInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingActualInput, setClosingActualInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingReason, setClosingReason] = useState("");
  const [selectedEmployeeForShift, setSelectedEmployeeForShift] = useState("");

  useEffect(() => {
    if (currentShift) {
      setClosingActualInput(currentShift.closingCashExpected || currentShift.openingCash);
    }
  }, [currentShift]);


  const handleOpenShift = async () => {
    try {
      await openShiftMutation({
        openingCash: openingCashInput,
        userId: selectedEmployeeForShift || undefined,
      }).unwrap();
      alert(SHIFT_MESSAGES.OPEN_SUCCESS);
      setSelectedEmployeeForShift("");
    } catch (error: unknown) {
      alert(
        SHIFT_MESSAGES.OPEN_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.OPEN_ERROR)
      );
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    const expectedVal = currentShift.closingCashExpected || 0;
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
    } catch (error: unknown) {
      alert(
        SHIFT_MESSAGES.CLOSE_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.CLOSE_ERROR)
      );
    }
  };

  const [showOpenModal, setShowOpenModal] = useState(false);

  if (isActiveLoading) {
    return (
      <div className="p-4 text-center text-slate-400 font-medium">
        {SHIFT_UI.MANAGEMENT.LOADING_MESSAGE}
      </div>
    );
  }

  // Accountant cannot edit or open/close ca
  if (currentRole === USER_ROLES.ACCOUNTANT) {
    return (
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center text-slate-500 font-semibold">
        {SHIFT_UI.MANAGEMENT.ACCOUNTANT_RESTRICTION}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full min-h-[250px]">
      <div>
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4">
          {SHIFT_UI.MANAGEMENT.TITLE}
        </h3>

        {currentShift === null ? (
          /* CASE: Shift CLOSED */
          <div className="flex flex-col gap-4 font-semibold text-slate-700">
            <p className="text-slate-500 leading-relaxed font-medium text-[11px]">
              {SHIFT_UI.MANAGEMENT.NO_ACTIVE_SHIFT_DESCRIPTION}
            </p>

            <button
              onClick={() => {
                setOpeningCashInput(DEFAULT_SHIFT_CASH_AMOUNT);
                setSelectedEmployeeForShift("");
                setShowOpenModal(true);
              }}
              className="bg-kv-green hover:bg-emerald-600 transition-colors text-white h-9 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm text-xs w-full"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              {SHIFT_UI.COMMON.OPEN_SHIFT_BUTTON}
            </button>
          </div>
        ) : (
          /* CASE: Shift OPENED */
          <div className="flex flex-col gap-3 font-semibold text-slate-700">
            <div className="bg-kv-blue-light/50 border border-slate-200 p-3.5 rounded-lg flex flex-col gap-2 font-bold text-slate-700">
              <div className="flex justify-between text-xs">
                <span>{SHIFT_UI.MANAGEMENT.EMPLOYEE_LABEL}</span>
                <span className="text-slate-900 font-extrabold">{currentShift.fullName || currentShift.username}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{SHIFT_UI.MANAGEMENT.OPENED_AT_LABEL}</span>
                <span className="text-slate-900 font-extrabold">
                  {new Date(currentShift.openedAt).toLocaleString(APP_LOCALE)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{SHIFT_UI.MANAGEMENT.OPENING_FUND_LABEL}</span>
                <span className="text-slate-900 font-extrabold">
                  {formatCurrency(currentShift.openingCash)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-kv-blue-primary">
                <span>{SHIFT_UI.MANAGEMENT.EXPECTED_CASH_LABEL}</span>
                <span className="text-lg font-extrabold">
                  {formatCurrency(currentShift.closingCashExpected)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label>{SHIFT_UI.MANAGEMENT.ACTUAL_CASH_INPUT_LABEL}</label>
              <input
                type="text"
                value={formatNumber(closingActualInput)}
                onChange={(e) => {
                  const rawVal = e.target.value.replace(/\D/g, "");
                  setClosingActualInput(rawVal ? Number(rawVal) : 0);
                }}
                className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold"
              />
            </div>

            <div className="flex justify-between items-center text-xs font-bold py-1">
              <span>{SHIFT_UI.MANAGEMENT.DIFFERENCE_LABEL}</span>
              <span
                className={`text-sm ${
                  closingActualInput - (currentShift.closingCashExpected || 0) === 0
                    ? "text-emerald-600"
                    : closingActualInput - (currentShift.closingCashExpected || 0) < 0
                    ? "text-rose-600"
                    : "text-amber-600"
                }`}
              >
                {closingActualInput - (currentShift.closingCashExpected || 0) === 0
                  ? SHIFT_UI.COMMON.ZERO_AMOUNT_LABEL
                  : (closingActualInput - (currentShift.closingCashExpected || 0) > 0
                      ? SHIFT_UI.COMMON.POSITIVE_AMOUNT_PREFIX
                      : "") +
                    formatCurrency(closingActualInput - (currentShift.closingCashExpected || 0))}
              </span>
            </div>

            {/* Display reason if difference exists */}
            {closingActualInput - (currentShift.closingCashExpected || 0) !== 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-rose-600 flex items-center gap-1">
                  <span className="text-xs">{SHIFT_UI.MANAGEMENT.DIFFERENCE_WARNING_ICON}</span>
                  {SHIFT_UI.MANAGEMENT.DIFFERENCE_WARNING_LABEL}
                </label>
                <textarea
                  value={closingReason}
                  onChange={(e) => setClosingReason(e.target.value)}
                  required
                  placeholder={SHIFT_UI.MANAGEMENT.DIFFERENCE_REASON_PLACEHOLDER}
                  style={{ resize: "none" }}
                  className="border border-rose-300 h-14 p-2 rounded-lg focus:outline-none focus:border-rose-500 text-xs"
                ></textarea>
              </div>
            )}

            <button
              onClick={handleCloseShift}
              className="bg-rose-600 hover:bg-rose-700 transition-colors text-white h-9 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm mt-2 w-full text-xs"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {SHIFT_UI.MANAGEMENT.CLOSE_SHIFT_BUTTON}
            </button>
          </div>
        )}
      </div>

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
