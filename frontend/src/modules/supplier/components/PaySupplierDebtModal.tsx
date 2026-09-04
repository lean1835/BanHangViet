import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wallet, CheckCircle2, Calendar } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDateOnly, getLocalDateString } from "@/utils/dateFormatter";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import {
  SUPPLIER_DEBT_UI,
  SUPPLIER_DEBT_MESSAGES,
  SUPPLIER_DEBT_PAYMENT_METHODS,
} from "@/constants/supplierDebt";
import type { ISupplier } from "../types/ISupplier";
import type { IPaySupplierDebtRequest } from "../types/ISupplierDebt";

interface PaySupplierDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: ISupplier | null;
  onConfirmPayment: (data: IPaySupplierDebtRequest) => Promise<void> | void;
}

export const PaySupplierDebtModal: React.FC<PaySupplierDebtModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onConfirmPayment,
}) => {
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentDebt = supplier?.currentDebt || 0;

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(supplier),
    onClose,
    canClose: !isSubmitting,
  });

  useEffect(() => {
    if (supplier && isOpen) {
      setAmount(supplier.currentDebt || 0);
      setPaymentMethod("CASH");
      setDueDate("");
      setNotes("");
      setErrorMessage("");
    }
  }, [supplier, isOpen]);

  if (!isOpen || !supplier) return null;

  const handleQuickSelectAmount = (percentage: number) => {
    if (percentage === 100) {
      setAmount(currentDebt);
    } else {
      setAmount(Math.round((currentDebt * percentage) / 100));
    }
    setErrorMessage("");
  };

  const handleQuickSelectDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(getLocalDateString(d));
  };

  const handleSelectEndOfMonth = () => {
    const d = new Date();
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setDueDate(getLocalDateString(endOfMonth));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage(SUPPLIER_DEBT_MESSAGES.INVALID_AMOUNT);
      return;
    }

    if (numAmount > currentDebt) {
      setErrorMessage(
        `${SUPPLIER_DEBT_MESSAGES.AMOUNT_EXCEEDS_DEBT} (Tối đa: ${formatCurrency(currentDebt)})`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const payload: IPaySupplierDebtRequest = {
        supplierId: supplier.id,
        amount: numAmount,
        paymentMethod,
        dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null,
        notes: notes.trim() ? notes.trim() : null,
      };

      await onConfirmPayment(payload);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(SUPPLIER_DEBT_MESSAGES.PAY_FAILED);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingDebt = Math.max(0, currentDebt - (Number(amount) || 0));

  // Compute preview days for selected dueDate
  const getSelectedDueDaysPreview = () => {
    if (!dueDate) return null;
    const target = new Date(dueDate);
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return `(Quá hạn ${Math.abs(diffDays)} ngày)`;
    if (diffDays === 0) return "(Hạn chót hôm nay)";
    return `(Hạn trả: ${formatDateOnly(dueDate)} - Còn ${diffDays} ngày)`;
  };

  return createPortal(
    <div
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/40 p-2 sm:p-4 backdrop-blur-sm animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-supplier-debt-title"
        className="app-modal-panel w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-sky-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <Wallet size={20} />
            </div>
            <div>
              <h2
                id="pay-supplier-debt-title"
                className="text-base font-extrabold text-slate-800"
              >
                {SUPPLIER_DEBT_UI.PAY_MODAL.TITLE}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                {SUPPLIER_DEBT_UI.PAY_MODAL.SUBTITLE}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Supplier Info Summary Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {SUPPLIER_DEBT_UI.PAY_MODAL.LABEL_SUPPLIER}
              </span>
              <span className="font-extrabold text-slate-800 text-sm block truncate">
                {supplier.name}
              </span>
              <span className="text-slate-500 text-[11px] font-semibold">
                {supplier.phoneNumber}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {SUPPLIER_DEBT_UI.PAY_MODAL.LABEL_CURRENT_DEBT}
              </span>
              <span className="font-extrabold text-rose-600 text-sm block">
                {formatCurrency(currentDebt)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Mã NCC: NCC-{(supplier.id || "").slice(0, 6).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                {SUPPLIER_DEBT_UI.PAY_MODAL.LABEL_AMOUNT}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelectAmount(100)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 hover:bg-sky-200 transition-all"
                >
                  {SUPPLIER_DEBT_UI.PAY_MODAL.QUICK_FULL}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectAmount(50)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
                >
                  {SUPPLIER_DEBT_UI.PAY_MODAL.QUICK_HALF}
                </button>
              </div>
            </div>

            <input
              type="text"
              value={amount === "" ? "" : formatNumber(Number(amount))}
              onChange={(e) => {
                const rawVal = e.target.value.replace(/\D/g, "");
                setAmount(rawVal ? Number(rawVal) : "");
                setErrorMessage("");
              }}
              placeholder={SUPPLIER_DEBT_UI.PAY_MODAL.PLACEHOLDER_AMOUNT}
              className="h-10 px-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-600 shadow-sm"
            />

            {/* Remaining Debt Calculation */}
            {typeof amount === "number" && amount > 0 && amount <= currentDebt && (
              <p className="text-[11px] font-semibold text-slate-600 flex items-center justify-between pt-0.5">
                <span>{SUPPLIER_DEBT_UI.PAY_MODAL.LABEL_REMAINING_DEBT}:</span>
                <strong
                  className={
                    remainingDebt === 0 ? "text-emerald-600" : "text-rose-600"
                  }
                >
                  {formatCurrency(remainingDebt)}
                  {remainingDebt === 0 && " (Hết nợ)"}
                </strong>
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {SUPPLIER_DEBT_UI.PAY_MODAL.LABEL_PAYMENT_METHOD}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-600 cursor-pointer shadow-sm"
            >
              <option value="CASH">
                {SUPPLIER_DEBT_PAYMENT_METHODS.CASH}
              </option>
              <option value="BANK_TRANSFER">
                {SUPPLIER_DEBT_PAYMENT_METHODS.BANK_TRANSFER}
              </option>
            </select>
          </div>

          {/* Due Date & Presets (When partially paid) */}
          {remainingDebt > 0 && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-600" />
                  {SUPPLIER_DEBT_UI.PAY_MODAL.LABEL_DUE_DATE}
                </label>
                {dueDate && (
                  <span className="text-[11px] font-bold text-amber-700">
                    {getSelectedDueDaysPreview()}
                  </span>
                )}
              </div>

              {/* Quick Preset Buttons for Due Date */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-500">
                  Chọn nhanh:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickSelectDays(7)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all"
                >
                  +7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectDays(15)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all"
                >
                  +15 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectDays(30)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all"
                >
                  +30 ngày
                </button>
                <button
                  type="button"
                  onClick={handleSelectEndOfMonth}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all"
                >
                  Cuối tháng
                </button>
              </div>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-sky-600 cursor-pointer shadow-sm"
              />
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {SUPPLIER_DEBT_UI.PAY_MODAL.LABEL_NOTES}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={SUPPLIER_DEBT_UI.PAY_MODAL.PLACEHOLDER_NOTES}
              className="p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-600 resize-none shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              {SUPPLIER_DEBT_UI.PAY_MODAL.CANCEL_BUTTON}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-all"
            >
              <CheckCircle2 size={15} />
              {isSubmitting
                ? SUPPLIER_DEBT_UI.PAY_MODAL.SUBMITTING_BUTTON
                : SUPPLIER_DEBT_UI.PAY_MODAL.SUBMIT_BUTTON}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
