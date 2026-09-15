import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  ShoppingBag,
  FileDown,
  Lock,
  Clock,
} from "lucide-react";
import type { ITaxPeriodReminderResponse } from "../types/ITaxReminder";
import { formatDateShort } from "@/utils/dateFormatter";

interface TaxPeriodProgressChecklistBannerProps {
  reminder?: ITaxPeriodReminderResponse | null;
  onSelectTab?: (tab: "ANNEX" | "PURCHASE_REGISTER" | "TAX_GROUPS" | "AUDIT_HISTORY") => void;
  onOpenExport?: () => void;
  onOpenLockModal?: () => void;
  onMarkAsExported?: () => void;
  isMarkingExported?: boolean;
}

export const TaxPeriodProgressChecklistBanner: React.FC<
  TaxPeriodProgressChecklistBannerProps
> = ({
  reminder,
  onSelectTab,
  onOpenExport,
  onOpenLockModal,
  onMarkAsExported,
  isMarkingExported = false,
}) => {
  if (!reminder || reminder.isClosed) {
    return null;
  }

  const { isOverdue, daysRemaining, filingDeadline, checklist, title, message } = reminder;

  // Tính số bước đã hoàn thành trên tổng số 4 bước
  const completedStepsCount = [
    checklist?.salesRegisterGenerated,
    checklist?.purchaseRegisterGenerated,
    checklist?.declarationExported,
    checklist?.periodLocked,
  ].filter(Boolean).length;

  const isDanger = isOverdue || reminder.severity === "DANGER";

  return (
    <div
      className={`rounded-2xl border p-4 shadow-2xs transition-all duration-200 animate-in fade-in ${
        isDanger
          ? "bg-red-50/40 border-red-200 text-slate-800"
          : "bg-amber-50/30 border-amber-200 text-slate-800"
      }`}
    >
      {/* 1. Header cảnh báo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isDanger
                ? "bg-red-100 text-red-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {isDanger ? (
              <AlertCircle className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-900">{title}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDanger
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-amber-100 text-amber-700 border-amber-200"
                }`}
              >
                {isDanger
                  ? `Quá hạn ${Math.abs(daysRemaining)} ngày`
                  : `Còn ${daysRemaining} ngày`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {message} Hạn nộp theo luật:{" "}
              <strong>{formatDateShort(filingDeadline)}</strong>.
            </p>
          </div>
        </div>

        {/* Tiến độ hoàn thành */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">
            Tiến độ kỳ:{" "}
            <strong
              className={
                completedStepsCount === 4 ? "text-emerald-600" : "text-slate-900"
              }
            >
              {completedStepsCount}/4 bước
            </strong>
          </span>
        </div>
      </div>

      {/* 2. Checklist 4 bước trực quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3">
        {/* Bước 1: Bảng kê bán ra */}
        <div
          onClick={() => onSelectTab && onSelectTab("ANNEX")}
          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer select-none ${
            checklist?.salesRegisterGenerated
              ? "bg-white/90 border-emerald-200 shadow-2xs hover:bg-emerald-50/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
          }`}
          title="Bấm để xem Bảng kê bán ra"
        >
          <div className="flex items-center gap-2 min-w-0">
            {checklist?.salesRegisterGenerated ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-800 block truncate">
                1. Bảng kê bán ra
              </span>
              <span className="text-[10px] text-slate-500 block">
                {checklist?.salesRegisterGenerated ? "Đã tổng hợp HĐ" : "Chưa tổng hợp"}
              </span>
            </div>
          </div>
          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* Bước 2: Bảng kê mua vào */}
        <div
          onClick={() => onSelectTab && onSelectTab("PURCHASE_REGISTER")}
          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer select-none ${
            checklist?.purchaseRegisterGenerated
              ? "bg-white/90 border-emerald-200 shadow-2xs hover:bg-emerald-50/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
          }`}
          title="Bấm để xem Bảng kê mua vào"
        >
          <div className="flex items-center gap-2 min-w-0">
            {checklist?.purchaseRegisterGenerated ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-800 block truncate">
                2. Bảng kê mua vào
              </span>
              <span className="text-[10px] text-slate-500 block">
                {checklist?.purchaseRegisterGenerated
                  ? "Đã tổng hợp phiếu nhập"
                  : "Chưa tổng hợp"}
              </span>
            </div>
          </div>
          <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* Bước 3: Xuất tờ khai thuế */}
        <div
          onClick={() => onOpenExport && onOpenExport()}
          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer select-none ${
            checklist?.declarationExported
              ? "bg-white/90 border-emerald-200 shadow-2xs hover:bg-emerald-50/20"
              : "bg-white border-blue-200 hover:border-blue-300 shadow-2xs hover:bg-blue-50/30"
          }`}
          title="Bấm để mở giao diện xem trước & xuất tệp tờ khai"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {checklist?.declarationExported ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-800 block truncate">
                3. Xuất tờ khai thuế
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 block">
                  {checklist?.declarationExported
                    ? "Đã xuất tệp hồ sơ"
                    : "Chưa xuất tờ khai"}
                </span>
                {!checklist?.declarationExported && onMarkAsExported && (
                  <button
                    type="button"
                    disabled={isMarkingExported}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsExported();
                    }}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer p-0 bg-transparent border-none"
                    title="Nếu đã nộp ngoài hệ thống, bấm vào đây để đánh dấu đã xong"
                  >
                    (Đã nộp)
                  </button>
                )}
              </div>
            </div>
          </div>
          <FileDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </div>

        {/* Bước 4: Chốt sổ kỳ thuế */}
        <div
          onClick={() => onOpenLockModal && onOpenLockModal()}
          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer select-none ${
            checklist?.periodLocked
              ? "bg-white/90 border-emerald-200 shadow-2xs hover:bg-emerald-50/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:bg-slate-50"
          }`}
          title="Bấm để chốt sổ và khóa kỳ kê khai"
        >
          <div className="flex items-center gap-2 min-w-0">
            {checklist?.periodLocked ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-800 block truncate">
                4. Chốt sổ kỳ thuế
              </span>
              <span className="text-[10px] text-slate-500 block">
                {checklist?.periodLocked ? "Đã khóa số liệu" : "Chưa chốt sổ"}
              </span>
            </div>
          </div>
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>
    </div>
  );
};
