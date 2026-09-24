import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Sliders, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { CUSTOMER_LOG, CUSTOMER_UI } from "@/constants/customer";
import { useCreateDebtAdjustmentMutation } from "../services/customerApi";
import type { ICustomer } from "../types/ICustomer";

interface DebtAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: ICustomer | null;
  onSuccess?: () => void;
}

export const DebtAdjustmentModal: React.FC<DebtAdjustmentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const { addLogEntry } = useDashboardDemo();

  const [adjustmentType, setAdjustmentType] = useState<"DEBT_INCREASE" | "DEBT_DECREASE">("DEBT_DECREASE");
  const [amount, setAmount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createAdjustment, { isLoading: isSubmitting }] = useCreateDebtAdjustmentMutation();

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(customer),
    onClose,
    canClose: !isSubmitting,
  });

  if (!isOpen || !customer) return null;

  const currentDebt = customer.debt ?? customer.currentDebt ?? 0;
  const numAmount = typeof amount === "number" ? amount : 0;
  const projectedDebt =
    adjustmentType === "DEBT_INCREASE"
      ? currentDebt + numAmount
      : Math.max(0, currentDebt - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!numAmount || numAmount <= 0) {
      setErrorMsg("Vui lòng nhập số tiền điều chỉnh lớn hơn 0");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Vui lòng nhập lý do điều chỉnh theo quy định kiểm toán");
      return;
    }

    try {
      await createAdjustment({
        customerId: customer.id,
        adjustmentType,
        amount: numAmount,
        reason: reason.trim(),
      }).unwrap();

      const typeText = adjustmentType === "DEBT_INCREASE" ? "tăng nợ" : "giảm nợ";
      addLogEntry(
        CUSTOMER_LOG.DEBT_ADJUSTMENT_ACTION,
        CUSTOMER_LOG.debtAdjusted(customer.name, typeText, formatCurrency(numAmount)),
      );

      showSuccess(
        `Đã lập bút toán điều chỉnh ${typeText} ${formatCurrency(numAmount)} cho "${customer.name}".`,
      );

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Không thể lập bút toán điều chỉnh công nợ.");
      setErrorMsg(msg);
      showError(msg);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjustment-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-modal-smooth-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Sliders size={18} />
            </div>
            <div>
              <h2 id="adjustment-modal-title" className="text-sm font-extrabold text-slate-800">
                {CUSTOMER_UI.ADJUSTMENT_MODAL.TITLE}
              </h2>
              <p className="text-[11px] text-slate-500">Khách hàng: <strong>{customer.name}</strong></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Debt Summary Card */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dư nợ hiện tại</span>
              <p className="text-sm font-black text-slate-800 mt-0.5">{formatCurrency(currentDebt)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dư nợ sau điều chỉnh</span>
              <p
                className={`text-sm font-black mt-0.5 ${
                  projectedDebt > currentDebt ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(projectedDebt)}
              </p>
            </div>
          </div>

          {/* Adjustment Type Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              {CUSTOMER_UI.ADJUSTMENT_MODAL.LABEL_TYPE}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType("DEBT_DECREASE")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-bold text-xs transition-all ${
                  adjustmentType === "DEBT_DECREASE"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ArrowDownRight size={16} className="text-emerald-600" />
                Giảm nợ (Khấu trừ)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("DEBT_INCREASE")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-bold text-xs transition-all ${
                  adjustmentType === "DEBT_INCREASE"
                    ? "bg-rose-50 border-rose-500 text-rose-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ArrowUpRight size={16} className="text-rose-600" />
                Tăng nợ (Bổ sung)
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="adj-amount-input" className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              {CUSTOMER_UI.ADJUSTMENT_MODAL.LABEL_AMOUNT}
            </label>
            <input
              id="adj-amount-input"
              type="number"
              min="1"
              step="any"
              placeholder={CUSTOMER_UI.ADJUSTMENT_MODAL.PLACEHOLDER_AMOUNT}
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val === "" ? "" : Number(val));
              }}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-800 shadow-xs focus:border-kv-blue-primary focus:outline-none"
            />
          </div>

          {/* Reason input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="adj-reason-input" className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              {CUSTOMER_UI.ADJUSTMENT_MODAL.LABEL_REASON}
            </label>
            <textarea
              id="adj-reason-input"
              rows={3}
              maxLength={500}
              placeholder={CUSTOMER_UI.ADJUSTMENT_MODAL.PLACEHOLDER_REASON}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-xs focus:border-kv-blue-primary focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 text-right">{reason.length}/500 ký tự</span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-all"
            >
              {CUSTOMER_UI.ADJUSTMENT_MODAL.CANCEL_BUTTON}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Đang lập bút toán...</span>
              ) : (
                <span>{CUSTOMER_UI.ADJUSTMENT_MODAL.SUBMIT_BUTTON}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
export default DebtAdjustmentModal;
