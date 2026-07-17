import React, { useState } from "react";
import { createPortal } from "react-dom";
import { User, Home, AlertCircle, Check } from "lucide-react";

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void; // Bấm quay lại màn hình chính
  onConfirm: (openingCash: number) => void | Promise<void>;
  fullName?: string;
  householdName?: string;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fullName = "Nhân viên bán hàng",
  householdName = "Bán Hàng Việt (Hộ kinh doanh)",
}) => {
  const [openingCash, setOpeningCash] = useState<number>(1000000);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Mệnh giá tiền thối nhanh
  const denominations = [
    { label: "100.000đ", value: 100000 },
    { label: "200.000đ", value: 200000 },
    { label: "500.000đ", value: 500000 },
    { label: "1.000.000đ", value: 1000000 },
    { label: "2.000.000đ", value: 2000000 },
    { label: "5.000.000đ", value: 5000000 },
  ];

  const handleSelectDenomination = (val: number) => {
    setOpeningCash(val);
    setErrorMsg("");
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setOpeningCash(val);
    if (val >= 0) {
      setErrorMsg("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (openingCash === undefined || openingCash === null || isNaN(openingCash)) {
      setErrorMsg("Vui lòng nhập số tiền đầu ca");
      return;
    }
    if (openingCash < 0) {
      setErrorMsg("Số tiền mặt đầu ca không được phép nhỏ hơn 0");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(openingCash);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || "Không thể mở ca làm việc!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in font-semibold text-xs text-slate-700">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col my-4 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="bg-kv-blue-primary text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🕒</span>
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Mở ca làm việc mới
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-white/80 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {/* Alert Warning */}
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 flex gap-2.5 leading-relaxed text-[11px]">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Để bắt đầu bán hàng và lập hóa đơn, vui lòng khai báo số tiền mặt hiện tại có trong két đựng tiền (tiền thối lại). Ca làm việc sẽ tự động liên kết các giao dịch của bạn.
            </span>
          </div>

          {/* User & Household Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 font-bold text-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                <User size={15} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Nhân viên trực ca</span>
                <span className="text-slate-800 text-[11px] font-extrabold">{fullName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t pt-3">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                <Home size={15} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cửa hàng / Hộ kinh doanh</span>
                <span className="text-slate-800 text-[11px] font-extrabold">{householdName}</span>
              </div>
            </div>
          </div>

          {/* Opening Cash Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-700 font-bold">Số tiền mặt đầu ca (Tiền quỹ két):</label>
            <div className="relative">
              <input
                type="number"
                value={openingCash}
                onChange={handleCashChange}
                placeholder="Nhập số tiền mặt..."
                className="w-full border border-slate-300 h-10 pl-3 pr-10 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-800"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase">đ</span>
            </div>
            {errorMsg && (
              <span className="text-[10px] text-rose-500 font-bold mt-1">
                {errorMsg}
              </span>
            )}
          </div>

          {/* Quick Denominations Grid */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Mệnh giá chọn nhanh</label>
            <div className="grid grid-cols-3 gap-2">
              {denominations.map((den) => (
                <button
                  key={den.value}
                  type="button"
                  onClick={() => handleSelectDenomination(den.value)}
                  className={`h-8 border rounded-lg font-bold text-center transition-all ${
                    openingCash === den.value
                      ? "bg-kv-blue-primary/10 border-kv-blue-primary text-kv-blue-primary shadow-sm"
                      : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                  }`}
                >
                  {den.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 border-t pt-4">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors h-10 rounded-lg text-slate-700 font-bold"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-kv-green hover:bg-emerald-600 text-white transition-colors h-10 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              Xác nhận mở ca
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
