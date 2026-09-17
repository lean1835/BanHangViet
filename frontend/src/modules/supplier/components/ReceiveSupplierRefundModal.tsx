import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ArrowDownLeft,
  CheckCircle2,
  Banknote,
  CreditCard,
  Building2,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { SUPPLIER_DEBT_PAYMENT_METHODS } from "@/constants/supplierDebt";
import type { ISupplier } from "../types/ISupplier";
import type { IReceiveSupplierRefundRequest } from "../types/ISupplierDebt";

interface ReceiveSupplierRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: ISupplier | null;
  onConfirmRefund: (data: IReceiveSupplierRefundRequest) => Promise<void> | void;
}

export const ReceiveSupplierRefundModal: React.FC<ReceiveSupplierRefundModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onConfirmRefund,
}) => {
  const refundableAmount = Math.abs(supplier?.currentDebt || 0);

  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(supplier),
    onClose,
    canClose: !isSubmitting,
  });

  useEffect(() => {
    if (supplier && isOpen) {
      const maxRefund = Math.abs(supplier.currentDebt || 0);
      setAmount(maxRefund);
      setPaymentMethod("CASH");
      setNotes(`Thu tiền hoàn từ nhà cung cấp ${supplier.name} do trả hàng`);
      setErrorMessage("");
    }
  }, [supplier, isOpen]);

  if (!isOpen || !supplier) return null;

  const handleQuickSelectAmount = (percentage: number) => {
    if (percentage === 100) {
      setAmount(refundableAmount);
    } else {
      setAmount(Math.round((refundableAmount * percentage) / 100));
    }
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === "number" ? amount : Number(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Vui lòng nhập số tiền thu hoàn hợp lệ (lớn hơn 0đ)");
      return;
    }

    if (numAmount > refundableAmount) {
      setErrorMessage(
        `Số tiền thu hoàn không được vượt quá ${formatCurrency(refundableAmount)}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const payload: IReceiveSupplierRefundRequest = {
        supplierId: supplier.id,
        amount: numAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      await onConfirmRefund(payload);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Không thể ghi nhận thu tiền hoàn. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAmountNum = typeof amount === "number" ? amount : 0;
  const remainingOwed = Math.max(0, refundableAmount - currentAmountNum);

  return createPortal(
    <div
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/40 p-2 sm:p-4 backdrop-blur-xs animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receive-refund-modal-title"
        className="app-modal-panel w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="receive-refund-modal-title"
                  className="text-base font-extrabold text-slate-800 tracking-tight"
                >
                  Thu Tiền Hoàn Từ Nhà Cung Cấp
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  DƯ CÓ
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ghi nhận số tiền nhà cung cấp hoàn trả lại do trả hàng đã thanh toán
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-6 space-y-5 overflow-y-auto flex-1 text-xs"
        >
          {/* Supplier Info & Refundable Credit Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs shrink-0">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nhà cung cấp hoàn tiền
                </span>
                <p className="font-black text-slate-800 text-sm truncate">
                  {supplier.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {supplier.phoneNumber && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      SĐT: {supplier.phoneNumber}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">
                    NCC-{(supplier.id || "").slice(0, 6).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Số tiền NCC cần hoàn
              </span>
              <span className="text-lg font-black text-emerald-700 tracking-tight block">
                {formatCurrency(refundableAmount)}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Khoản dư có hiện tại
              </span>
            </div>
          </div>

          {/* Amount Input with Auto-formatting */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="refund-amount"
                className="font-bold text-slate-700 flex items-center gap-1 text-xs"
              >
                <span>Số tiền thu về (VNĐ)</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">
                  Tối đa: <strong className="text-emerald-700">{formatCurrency(refundableAmount)}</strong>
                </span>
              </div>
            </div>

            <div className="relative">
              <input
                id="refund-amount"
                type="text"
                inputMode="numeric"
                value={amount === "" ? "" : formatNumber(Number(amount))}
                onChange={(e) => {
                  const rawVal = e.target.value.replace(/\D/g, "");
                  setAmount(rawVal ? Number(rawVal) : "");
                  setErrorMessage("");
                }}
                placeholder="Nhập số tiền đã nhận từ NCC..."
                className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-300 font-black text-base text-emerald-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white transition-all shadow-2xs"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                đ
              </span>
            </div>

            {/* Quick Select percentage buttons */}
            <div className="flex items-center gap-2 pt-1">
              {[25, 50, 75, 100].map((pct) => {
                const targetVal =
                  pct === 100
                    ? refundableAmount
                    : Math.round((refundableAmount * pct) / 100);
                const isSelected = amount === targetVal;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickSelectAmount(pct)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    {pct === 100 ? "Thu toàn bộ (100%)" : `${pct}%`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block text-xs">
              Hình thức nhận tiền hoàn
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border font-bold text-xs transition-all ${
                  paymentMethod === "CASH"
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-2xs ring-1 ring-emerald-400/40"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>{SUPPLIER_DEBT_PAYMENT_METHODS.CASH}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border font-bold text-xs transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-2xs ring-1 ring-emerald-400/40"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{SUPPLIER_DEBT_PAYMENT_METHODS.BANK_TRANSFER}</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="refund-notes" className="font-bold text-slate-700 block text-xs">
              Ghi chú thu tiền
            </label>
            <textarea
              id="refund-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm thông tin chuyển khoản, lý do..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none bg-white shadow-2xs"
            />
          </div>

          {/* Ledger Calculation Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>Số tiền thu đợt này:</span>
              <span className="font-bold text-emerald-700">
                +{formatCurrency(currentAmountNum)}
              </span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-800 pt-1.5 border-t border-slate-200">
              <span>Số tiền NCC còn nợ lại sau khi thu:</span>
              <span
                className={
                  remainingOwed === 0
                    ? "text-emerald-600 font-black"
                    : "text-slate-800 font-black"
                }
              >
                {remainingOwed === 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    0 đ (Đã tất toán xong)
                  </span>
                ) : (
                  formatCurrency(remainingOwed)
                )}
              </span>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || Number(amount) <= 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Xác nhận đã thu tiền</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ReceiveSupplierRefundModal;
