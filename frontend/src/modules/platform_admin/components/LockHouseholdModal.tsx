import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertOctagon, ShieldAlert } from "lucide-react";
import type { IHouseholdAdminItem } from "../types/platformAdminTypes";

interface LockHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: IHouseholdAdminItem | null;
  onConfirm: (id: string, reason: string) => Promise<void>;
  isLoading: boolean;
}

const QUICK_REASONS = [
  "Hộ tạm ngừng kinh doanh theo yêu cầu",
  "Chậm thanh toán phí duy trì gói dịch vụ",
  "Có dấu hiệu vi phạm điều khoản nền tảng",
  "Yêu cầu phong tỏa từ cơ quan có thẩm quyền",
];

export const LockHouseholdModal: React.FC<LockHouseholdModalProps> = ({
  isOpen,
  onClose,
  household,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !household) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Vui lòng nhập lý do khóa tối thiểu 5 ký tự");
      return;
    }

    try {
      await onConfirm(household.id, reason.trim());
      setReason("");
      setError(null);
      onClose();
    } catch {
      // Handled by parent toast
    }
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
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col animate-fade-in mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shadow-xs flex items-center justify-center">
              <AlertOctagon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug">
                Khóa Tài Khoản Hộ Kinh Doanh
              </h3>
              <p className="text-xs text-rose-600 font-medium">
                Nghiệp vụ Quản trị nền tảng (VT-04)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Household Info Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-extrabold text-slate-900 text-base tracking-tight truncate">
                {household.name}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đang hoạt động
              </span>
            </div>

            {/* 4 cân đối cột thông tin */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block mb-0.5">Mã số thuế:</span>
                <span className="font-mono text-slate-800 font-bold">{household.taxCode}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block mb-0.5">Người đại diện:</span>
                <span className="text-slate-800 font-semibold truncate block">{household.representative}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block mb-0.5">Gói dịch vụ:</span>
                <span className="text-slate-800 font-semibold">{household.planName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block mb-0.5">Số tài khoản:</span>
                <span className="text-slate-800 font-semibold">{household.userCount} / {household.maxUsers} users</span>
              </div>
            </div>
          </div>

          {/* Warning Banner với căn lề chuẩn (hanging indent) */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-slate-700">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <span>Hệ quả khi khóa tài khoản hộ kinh doanh:</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 pl-1">
              <div className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>Mọi tài khoản (<strong className="text-slate-800">{household.userCount} người dùng</strong>) thuộc hộ bị chặn đăng nhập ngay lập tức.</span>
              </div>
              <div className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>Các phiên làm việc đang mở (active tokens / sessions) bị thu hồi và chấm dứt.</span>
              </div>
              <div className="flex items-start gap-2 leading-relaxed text-emerald-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                <span>Toàn bộ dữ liệu hóa đơn, chứng từ và danh mục hàng hóa được bảo toàn 100%, không bị xóa (GAP 48).</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium text-xs">
              {error}
            </div>
          )}

          {/* Textarea nhập lý do */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5 text-xs">
              Lý do khóa tài khoản <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Nhập chi tiết lý do tạm dừng hoạt động của hộ..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              className="w-full p-3 border border-slate-300 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden font-medium text-xs transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Gợi ý lý do nhanh 2 cột đều nhau */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
              Gợi ý lý do nhanh:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_REASONS.map((r) => {
                const isChosen = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      if (error) setError(null);
                    }}
                    className={`text-left px-3 py-2.5 border rounded-xl text-[11px] font-medium transition-all cursor-pointer flex items-center h-full min-h-[42px] leading-snug ${
                      isChosen
                        ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs font-semibold ring-1 ring-rose-300"
                        : "bg-slate-50 hover:bg-rose-50/60 hover:text-rose-700 hover:border-rose-200 border-slate-200 text-slate-600"
                    }`}
                  >
                    + {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer buttons căn phải cân đối */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer inline-flex items-center justify-center text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-500/25 inline-flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Đang khóa...</span>
                </>
              ) : (
                <span>Xác nhận khóa hộ</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
