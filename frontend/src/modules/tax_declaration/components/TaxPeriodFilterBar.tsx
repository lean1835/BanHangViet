import React from "react";
import {
  Calendar,
  Plus,
  Lock,
  Unlock,
  FileDown,
  Loader2,
  ChevronDown,
} from "lucide-react";
import type {
  ITaxPeriodOption,
  TTaxExportFormat,
  TTaxPeriodStatus,
} from "../types/ITaxDeclaration";

interface ITaxPeriodFilterBarProps {
  periods: ITaxPeriodOption[];
  selectedPeriod?: ITaxPeriodOption;
  onSelectPeriod: (period: ITaxPeriodOption) => void;
  status?: TTaxPeriodStatus;
  onOpenPreview: () => void;
  onExport?: (format: TTaxExportFormat) => void;
  isExporting: boolean;
  canExport: boolean;
  roleRestrictionReason?: string;
  onOpenLockModal?: () => void;
  onOpenUnlockModal?: () => void;
  onOpenCreatePeriodModal?: () => void;
  isOwner?: boolean;
  roleLockRestrictionReason?: string;
}

export const TaxPeriodFilterBar: React.FC<ITaxPeriodFilterBarProps> = ({
  periods,
  selectedPeriod,
  onSelectPeriod,
  status = "GENERATED",
  onOpenPreview,
  isExporting,
  canExport,
  roleRestrictionReason,
  onOpenLockModal,
  onOpenUnlockModal,
  onOpenCreatePeriodModal,
  isOwner = false,
  roleLockRestrictionReason,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
      {/* Cột trái: Bộ lọc kỳ kê khai */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-slate-100/70 rounded-xl px-3.5 py-2 transition-all w-full sm:w-[380px] group shadow-2xs cursor-pointer">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.2]" />
            <span className="text-xs font-bold text-slate-600 shrink-0">Kỳ kê khai:</span>
            <span className="text-xs font-bold text-slate-800 truncate">
              {selectedPeriod?.label || (periods.length === 0 ? "Chưa có kỳ kê khai nào" : "Chọn kỳ kê khai")}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform group-hover:text-slate-600" />

          {/* Native select phủ toàn bộ chiều rộng hộp để dropdown menu bung ra đúng bằng 100% kích thước hộp */}
          <select
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs font-bold"
            value={selectedPeriod?.value || ""}
            onChange={(e) => {
              const target = periods.find((p) => p.value === e.target.value);
              if (target) onSelectPeriod(target);
            }}
          >
            {periods.length === 0 && (
              <option value="">Chưa có kỳ kê khai nào</option>
            )}
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cột phải: Các nút Thao tác */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Nút Lập bảng kê kỳ mới */}
        {onOpenCreatePeriodModal && (
          <button
            type="button"
            onClick={onOpenCreatePeriodModal}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 active:scale-95 active:bg-blue-200 font-bold text-xs transition-all duration-150 border border-blue-200 shadow-xs cursor-pointer select-none focus:outline-none shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
            <span>Lập kỳ mới</span>
          </button>
        )}
        {/* Nút Xuất tờ khai thuế -> Mở xem trước mẫu 01 & Tải file (NCL-12-CN-003) */}
        {canExport && selectedPeriod ? (
          <button
            type="button"
            onClick={onOpenPreview}
            disabled={isExporting}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none disabled:opacity-50 focus:outline-none shrink-0"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0 stroke-[2.5]" />
            ) : (
              <FileDown className="w-4 h-4 shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:-translate-y-0.5" />
            )}
            <span>Xuất tờ khai</span>
          </button>
        ) : (
          <div title={roleRestrictionReason || "Bạn không có quyền xuất tờ khai thuế"}>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-70 shrink-0"
            >
              <Lock className="w-4 h-4 shrink-0 stroke-[2]" />
              <span>Xuất tờ khai</span>
            </button>
          </div>
        )}

        {/* Nút Chốt kỳ / Mở lại kỳ (NCL-12-CN-004) */}
        {selectedPeriod && (
          <>
            {status !== "LOCKED" ? (
              isOwner ? (
                <button
                  type="button"
                  onClick={onOpenLockModal}
                  className="group inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[136px] rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none focus:outline-none shrink-0"
                >
                  <Lock className="w-4 h-4 shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:rotate-12" />
                  <span>Chốt kỳ kê khai</span>
                </button>
              ) : (
                <div
                  title={
                    roleLockRestrictionReason ||
                    "Chỉ Chủ hộ kinh doanh (VT-01) mới có quyền chốt kỳ kê khai"
                  }
                >
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[136px] rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-70 shrink-0"
                  >
                    <Lock className="w-4 h-4 shrink-0 stroke-[2]" />
                    <span>Chốt kỳ kê khai</span>
                  </button>
                </div>
              )
            ) : isOwner ? (
              <button
                type="button"
                onClick={onOpenUnlockModal}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[136px] rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none focus:outline-none shrink-0"
              >
                <Unlock className="w-4 h-4 shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:-rotate-12" />
                <span>Mở lại kỳ</span>
              </button>
            ) : (
              <div
                title={
                  roleLockRestrictionReason ||
                  "Chỉ Chủ hộ kinh doanh (VT-01) mới có quyền mở lại kỳ kê khai"
                }
              >
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[136px] rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-70 shrink-0"
                >
                  <Unlock className="w-4 h-4 shrink-0 stroke-[2]" />
                  <span>Mở lại kỳ</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
