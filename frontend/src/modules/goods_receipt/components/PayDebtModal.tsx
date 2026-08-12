import React, { useState } from "react";
import type { ISupplier } from "../types/supplier";

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: ISupplier | null;
  onPay: (data: { amount: number; paymentMethod: "CASH" | "BANK_TRANSFER"; notes?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onPay,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState<number>(supplier?.currentDebt || 0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!isOpen || !supplier) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Số tiền thanh toán phải lớn hơn 0");
      return;
    }
    if (amount > supplier.currentDebt) {
      setError("Số tiền thanh toán không được lớn hơn tổng số nợ hiện tại");
      return;
    }

    try {
      await onPay({ amount, paymentMethod, notes });
      onClose();
    } catch {
      // Error handled upstream
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-auth-fade-in">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm">Thanh toán công nợ Nhà cung cấp</h3>
          <button type="button" onClick={onClose} aria-label="Đóng modal thanh toán công nợ" className="text-white/80 hover:text-white p-1 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
            <p className="font-bold text-slate-800 text-sm">{supplier.name}</p>
            <p className="text-slate-600">Mã NCC: <span className="font-bold">{supplier.code}</span> | SĐT: {supplier.phone}</p>
            <p className="text-rose-600 font-extrabold text-xs">
              Nợ cần trả hiện tại: {supplier.currentDebt.toLocaleString("vi-VN")} đ
            </p>
          </div>

          <div>
            <label className="block mb-1 font-bold text-slate-700">Số tiền trả (VND) *</label>
            <input
              type="number"
              min="1000"
              max={supplier.currentDebt}
              step="1000"
              value={amount}
              onChange={(e) => {
                setError("");
                setAmount(parseFloat(e.target.value) || 0);
              }}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary font-extrabold text-slate-900 text-base"
            />
            {error && <p className="text-rose-500 text-[11px] mt-1 font-normal">{error}</p>}
          </div>

          <div>
            <label className="block mb-1 font-bold text-slate-700">Hình thức thanh toán *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`h-9 rounded-lg border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === "CASH"
                    ? "border-kv-blue-primary bg-kv-blue-light text-kv-blue-primary"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="12" x="2" y="6" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                Tiền mặt
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`h-9 rounded-lg border font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-kv-blue-primary bg-kv-blue-light text-kv-blue-primary"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                Chuyển khoản
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-bold text-slate-700">Ghi chú phiếu chi</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Trả nợ hàng hóa đợt tháng 8..."
              className="w-full h-9 px-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 h-9 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold transition-all shadow-sm"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận trả nợ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
