import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wallet, CheckCircle2 } from "lucide-react";
import { CUSTOMER_UI } from "@/constants/customer";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { ICustomer } from "../types/ICustomer";

export interface DebtPaymentData {
  customerId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: ICustomer | null;
  onConfirmPayment: (data: DebtPaymentData) => void | Promise<void>;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onConfirmPayment,
}) => {
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(customer),
    onClose,
    canClose: !isSubmitting,
  });

  useEffect(() => {
    if (customer && isOpen) {
      setAmount(customer.debt);
      setPaymentMethod("CASH");
      setNotes("");
      setErrorMessage("");
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleQuickSelect = (percentage: number) => {
    if (percentage === 100) {
      setAmount(customer.debt);
    } else {
      setAmount(Math.round((customer.debt * percentage) / 100));
    }
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Vui lòng nhập số tiền thu nợ hợp lệ (lớn hơn 0).");
      return;
    }

    if (numAmount > customer.debt) {
      setErrorMessage(
        `Số tiền thu nợ (${formatCurrency(numAmount)} đ) không được vượt quá tổng dư nợ hiện tại (${formatCurrency(customer.debt)} đ).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await onConfirmPayment({
        customerId: customer.id,
        amount: numAmount,
        paymentMethod,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Có lỗi xảy ra khi ghi nhận thu nợ.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingDebt = customer.debt - (Number(amount) || 0);

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
        aria-labelledby="pay-debt-modal-title"
        className="app-modal-panel w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Wallet size={20} />
            </div>
            <div>
              <h2 id="pay-debt-modal-title" className="text-base font-extrabold text-slate-800">
                {CUSTOMER_UI.PAY_DEBT_MODAL.TITLE}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                {CUSTOMER_UI.PAY_DEBT_MODAL.SUBTITLE}
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

          {/* Customer Summary Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Khách hàng
              </span>
              <span className="font-extrabold text-slate-800 text-sm block truncate">
                {customer.name}
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                {customer.phone}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dư nợ hiện tại
              </span>
              <span className="font-black text-rose-600 text-sm block">
                {formatCurrency(customer.debt)} đ
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Hạn mức: {formatCurrency(customer.creditLimit)} đ
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                {CUSTOMER_UI.PAY_DEBT_MODAL.LABEL_AMOUNT}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelect(100)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all"
                >
                  {CUSTOMER_UI.PAY_DEBT_MODAL.QUICK_FULL}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(50)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
                >
                  {CUSTOMER_UI.PAY_DEBT_MODAL.QUICK_HALF}
                </button>
              </div>
            </div>

            <input
              type="number"
              min="1"
              max={customer.debt}
              step="1"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val === "" ? "" : Number(val));
                setErrorMessage("");
              }}
              placeholder={CUSTOMER_UI.PAY_DEBT_MODAL.PLACEHOLDER_AMOUNT}
              className="h-10 px-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
            />

            {/* Remaining Debt Calculation */}
            {typeof amount === "number" && amount > 0 && amount <= customer.debt && (
              <p className="text-[11px] font-semibold text-slate-600 flex items-center justify-between pt-0.5">
                <span>Dư nợ còn lại sau thu:</span>
                <strong className={remainingDebt === 0 ? "text-emerald-600" : "text-rose-600"}>
                  {formatCurrency(Math.max(0, remainingDebt))} đ
                  {remainingDebt === 0 && " (Hết nợ 🎉)"}
                </strong>
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {CUSTOMER_UI.PAY_DEBT_MODAL.LABEL_PAYMENT_METHOD}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="CASH">{CUSTOMER_UI.PAY_DEBT_MODAL.PAYMENT_METHODS.CASH}</option>
              <option value="BANK_TRANSFER">{CUSTOMER_UI.PAY_DEBT_MODAL.PAYMENT_METHODS.BANK_TRANSFER}</option>
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {CUSTOMER_UI.PAY_DEBT_MODAL.LABEL_NOTES}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={CUSTOMER_UI.PAY_DEBT_MODAL.PLACEHOLDER_NOTES}
              className="p-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 resize-none"
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
              {CUSTOMER_UI.PAY_DEBT_MODAL.CANCEL_BUTTON}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-all"
            >
              <CheckCircle2 size={15} />
              {isSubmitting ? "Đang xử lý..." : CUSTOMER_UI.PAY_DEBT_MODAL.SUBMIT_BUTTON}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
