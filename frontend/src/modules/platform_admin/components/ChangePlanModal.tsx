import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Package,
  Calendar,
  Check,
  Users,
  FileText,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import type {
  IChangeSubscriptionRequest,
  IHouseholdAdminItem,
  ISubscriptionPlan,
  TSubscriptionPlanCode,
} from "../types/platformAdminTypes";
import { formatCurrency } from "@/utils/formatCurrency";

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: IHouseholdAdminItem | null;
  plans: ISubscriptionPlan[];
  onConfirm: (req: IChangeSubscriptionRequest) => Promise<void>;
  isLoading: boolean;
}

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  isOpen,
  onClose,
  household,
  plans,
  onConfirm,
  isLoading,
}) => {
  const [selectedPlanCode, setSelectedPlanCode] =
    useState<TSubscriptionPlanCode>(() => household?.planCode || "STANDARD");
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [note, setNote] = useState("");

  if (!isOpen || !household) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedPlan = plans.find((p) => p.code === selectedPlanCode);
      const today = new Date().toISOString().split("T")[0];
      await onConfirm({
        householdId: household.id,
        packageId: selectedPlan?.id,
        planCode: selectedPlanCode,
        startDate: today,
        expiryDate,
        note: note.trim(),
      });
      onClose();
    } catch {
      // Handled by parent
    }
  };

  const handleQuickDuration = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setExpiryDate(d.toISOString().split("T")[0]);
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Quản Lý Gói Dịch Vụ & Hạn Mức Hộ
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Cập nhật hạn mức tài nguyên cho: {household.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Current Status Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-500 text-[11px]">Gói hiện tại:</span>
              <div className="font-bold text-slate-900 text-sm">
                {household.planName}
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-slate-500 text-[10px]">Tài khoản:</span>
                <div className="font-bold text-slate-800">
                  {household.userCount} / {household.maxUsers} users
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Hóa đơn tháng:</span>
                <div className="font-bold text-slate-800">
                  {household.invoiceCountMonth} / {household.maxInvoicesMonth} HĐ
                </div>
              </div>
            </div>
          </div>

          {/* Select Plan Grid - Trải thành hàng ngang */}
          <div>
            <label className="block font-bold text-slate-800 mb-2.5">
              Chọn gói dịch vụ mới:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
              {plans.map((p) => {
                const isSelected = selectedPlanCode === p.code;
                const isStarter = p.code === "BASIC";
                const isStandard = p.code === "STANDARD";
                const isPremium = p.code === "PREMIUM";

                // Định hình màu sắc riêng biệt cho từng gói
                const theme = isStarter
                  ? {
                      selected: "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs",
                      radioSelected: "bg-emerald-600 border-emerald-600 text-white",
                      icon: "text-emerald-600",
                      price: "text-emerald-700",
                    }
                  : isPremium
                  ? {
                      selected: "border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-xs",
                      radioSelected: "bg-purple-600 border-purple-600 text-white",
                      icon: "text-purple-600",
                      price: "text-purple-700",
                    }
                  : {
                      selected: "border-kv-blue-primary bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs",
                      radioSelected: "bg-kv-blue-primary border-kv-blue-primary text-white",
                      icon: "text-kv-blue-primary",
                      price: "text-kv-blue-primary",
                    };

                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedPlanCode(p.code)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? theme.selected
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    {p.isPopular && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Sparkles size={10} /> Phổ biến nhất
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {p.name}
                        </span>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? theme.radioSelected
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={11} />}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug mb-3 min-h-[34px]">
                        {p.description}
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-700 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Users size={13} className={theme.icon} />
                          <span>Tối đa: <strong>{p.maxUsers}</strong> tài khoản</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <FileText size={13} className={theme.icon} />
                          <span>Hạn mức: <strong>{p.maxMonthlyInvoices.toLocaleString()}</strong> HĐ/tháng</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock size={13} className={theme.icon} />
                          <span>Lưu trữ: <strong>{p.dataRetentionMonths}</strong> tháng</span>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-3.5 pt-2.5 border-t border-slate-100 font-extrabold text-sm ${theme.price}`}>
                      {formatCurrency(p.pricePerMonth)} / tháng
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duration & Expiry */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-800 mb-2">
              Thời hạn hiệu lực của gói:
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "+3 tháng", months: 3 },
                  { label: "+6 tháng", months: 6 },
                  { label: "+1 năm", months: 12 },
                  { label: "+2 năm", months: 24 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleQuickDuration(opt.months)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-kv-blue-primary rounded-xl text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-56">
                <Calendar
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={expiryDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden font-medium text-xs bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Ghi chú thay đổi (Lý do / Hóa đơn thanh toán):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Nâng cấp gói Pro theo hợp đồng số HD-2026/08"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden font-medium text-xs"
            />
          </div>

          {/* GAP 48 Notice */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-slate-700 text-[11px] flex items-start gap-2 leading-relaxed">
            <Info size={15} className="text-kv-blue-primary shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý nghiệp vụ (GAP 48):</strong> Đổi gói có hiệu lực ngay lập tức. Khi hộ vượt hạn mức hóa đơn của tháng, hệ thống vẫn cho phép bán hàng và xuất hóa đơn bình thường để bảo đảm nghĩa vụ thuế pháp lý, đồng thời ghi nhận cước phụ trội.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Xác nhận đổi gói</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
