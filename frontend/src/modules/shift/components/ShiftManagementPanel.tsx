import React, { useEffect, useRef, useState } from "react";
import {
  DEFAULT_SHIFT_CASH_AMOUNT,
  SHIFT_DIFFERENCE_REASON_MAX_LENGTH,
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
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface ShiftManagementPanelProps {
  currentRole: string;
}

export const ShiftManagementPanel: React.FC<ShiftManagementPanelProps> = ({
  currentRole,
}) => {
  const { showSuccess, showError } = useNotification();
  const {
    data: activeShiftData,
    error: activeShiftError,
    isError: isActiveError,
    isFetching: isActiveFetching,
    isLoading: isActiveLoading,
    refetch: refetchActiveShift,
  } = useGetActiveShiftQuery(undefined, {
      skip: currentRole === USER_ROLES.ACCOUNTANT,
    });
  const currentShift = activeShiftData?.result ?? null;
  const currentExpectedCash =
    currentShift?.closingCashExpected ?? currentShift?.openingCash ?? 0;

  const { data: employees = [] } = useGetAllEmployeesQuery(undefined, {
    skip: currentRole !== USER_ROLES.OWNER,
  });

  const [openShiftMutation, { isLoading: isOpeningShift }] = useOpenShiftMutation();
  const [closeShiftMutation, { isLoading: isClosingShift }] = useCloseShiftMutation();

  const [openingCashInput, setOpeningCashInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingActualInput, setClosingActualInput] = useState(DEFAULT_SHIFT_CASH_AMOUNT);
  const [closingReason, setClosingReason] = useState("");
  const [selectedEmployeeForShift, setSelectedEmployeeForShift] = useState("");
  const [showOpenModal, setShowOpenModal] = useState(false);
  const initializedShiftIdRef = useRef<string | null>(null);

  useEffect(() => {
    const nextShiftId = currentShift?.id ?? null;
    if (initializedShiftIdRef.current === nextShiftId) return;
    initializedShiftIdRef.current = nextShiftId;
    if (currentShift) {
      setClosingActualInput(
        currentShift.closingCashExpected ?? currentShift.openingCash,
      );
    }
  }, [currentShift]);


  const handleOpenShift = async () => {
    if (isOpeningShift) return;

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

  const handleCloseShift = async () => {
    if (!currentShift || isClosingShift || isActiveFetching) return;

    try {
      const refreshedActiveShift = await refetchActiveShift().unwrap();
      if (!refreshedActiveShift.result) {
        showError(SHIFT_MESSAGES.SHIFT_NO_LONGER_OPEN);
        return;
      }

      const latestShift = refreshedActiveShift.result;
      const expectedVal =
        latestShift.closingCashExpected ?? latestShift.openingCash;
      const diff = closingActualInput - expectedVal;
      if (diff !== 0 && (!closingReason || !closingReason.trim())) {
        showError(SHIFT_MESSAGES.DIFFERENCE_REASON_REQUIRED);
        return;
      }

      await closeShiftMutation({
        id: latestShift.id,
        body: {
          closingCashActual: closingActualInput,
          differenceReason: diff !== 0 ? closingReason : undefined,
        },
      }).unwrap();
      showSuccess(SHIFT_MESSAGES.CLOSE_SUCCESS);
      setClosingReason("");
    } catch (error: unknown) {
      showError(
        SHIFT_MESSAGES.CLOSE_ERROR_PREFIX +
          getApiErrorMessage(error, SHIFT_MESSAGES.CLOSE_ERROR)
      );
    }
  };

  const openShiftDialogRef = useAccessibleDialog({
    isOpen: showOpenModal,
    onClose: () => setShowOpenModal(false),
    canClose: !isOpeningShift,
  });

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

  if (isActiveError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm font-semibold text-rose-700">
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
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-kv-green text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 lg:h-9"
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
                  {formatCurrency(currentExpectedCash)}
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
                disabled={isClosingShift}
                className="h-11 rounded-lg border border-slate-300 px-3 text-xs font-bold focus:border-kv-blue-primary focus:outline-none lg:h-9"
              />
            </div>

            <div className="flex justify-between items-center text-xs font-bold py-1">
              <span>{SHIFT_UI.MANAGEMENT.DIFFERENCE_LABEL}</span>
              <span
                className={`text-sm ${
                  closingActualInput - currentExpectedCash === 0
                    ? "text-emerald-600"
                    : closingActualInput - currentExpectedCash < 0
                    ? "text-rose-600"
                    : "text-amber-600"
                }`}
              >
                {closingActualInput - currentExpectedCash === 0
                  ? SHIFT_UI.COMMON.ZERO_AMOUNT_LABEL
                  : (closingActualInput - currentExpectedCash > 0
                      ? SHIFT_UI.COMMON.POSITIVE_AMOUNT_PREFIX
                      : "") +
                    formatCurrency(closingActualInput - currentExpectedCash)}
              </span>
            </div>

            {/* Display reason if difference exists */}
            {closingActualInput - currentExpectedCash !== 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-rose-600 flex items-center gap-1">
                  <span className="text-xs">{SHIFT_UI.MANAGEMENT.DIFFERENCE_WARNING_ICON}</span>
                  {SHIFT_UI.MANAGEMENT.DIFFERENCE_WARNING_LABEL}
                </label>
                <textarea
                  value={closingReason}
                  onChange={(e) => setClosingReason(e.target.value)}
                  required
                  maxLength={SHIFT_DIFFERENCE_REASON_MAX_LENGTH}
                  disabled={isClosingShift}
                  placeholder={SHIFT_UI.MANAGEMENT.DIFFERENCE_REASON_PLACEHOLDER}
                  style={{ resize: "none" }}
                  className="border border-rose-300 h-14 p-2 rounded-lg focus:outline-none focus:border-rose-500 text-xs"
                ></textarea>
              </div>
            )}

            <button
              onClick={handleCloseShift}
              disabled={isClosingShift || isActiveFetching}
              aria-busy={isClosingShift || isActiveFetching}
              className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 lg:h-9"
            >
              {isClosingShift ? (
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              ) : (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              {SHIFT_UI.MANAGEMENT.CLOSE_SHIFT_BUTTON}
            </button>
          </div>
        )}
      </div>

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
            aria-labelledby="management-open-shift-title"
            className="app-modal-panel my-4 flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-slate-100 bg-white text-left font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in"
          >
            <div className="app-modal-header flex items-center justify-between bg-kv-blue-primary px-5 py-3 text-white">
              <h2 id="management-open-shift-title" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
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
    </div>
  );
};
