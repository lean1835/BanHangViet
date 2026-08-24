import React from "react";
import {
  Calendar,
  Plus,
  Lock,
  Unlock,
  Eye,
  FileDown,
  Loader2,
  ChevronDown,
  FileSpreadsheet,
  FileCode,
  FileText,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { Dropdown, type MenuProps } from "antd";
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
  onExport: (format: TTaxExportFormat) => void;
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
  onExport,
  isExporting,
  canExport,
  roleRestrictionReason,
  onOpenLockModal,
  onOpenUnlockModal,
  onOpenCreatePeriodModal,
  isOwner = false,
  roleLockRestrictionReason,
}) => {
  const exportMenuItems: MenuProps["items"] = [
    {
      key: "EXCEL",
      label: (
        <div className="flex items-center gap-2.5 py-1.5 font-semibold text-xs text-slate-700 hover:text-blue-600 transition-colors">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.2]" />
          <span>Tải file Excel từ Máy chủ (Tờ khai + Bảng kê)</span>
        </div>
      ),
      onClick: () => onExport("EXCEL"),
    },
    {
      key: "PDF",
      label: (
        <div className="flex items-center gap-2.5 py-1.5 font-semibold text-xs text-slate-700 hover:text-blue-600 transition-colors">
          <FileText className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.2]" />
          <span>In tờ khai PDF (Mẫu 01/CNKD A4)</span>
        </div>
      ),
      onClick: () => onExport("PDF"),
    },
    {
      key: "XML",
      label: (
        <div className="flex items-center gap-2.5 py-1.5 font-semibold text-xs text-slate-700 hover:text-blue-600 transition-colors">
          <FileCode className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.2]" />
          <span>Tệp XML (eTax mô phỏng)</span>
        </div>
      ),
      onClick: () => onExport("XML"),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
      {/* Cột trái: Bộ lọc kỳ kê khai & Nút tạo mới */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl px-3.5 py-2 transition-all">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.2]" />
          <span className="text-xs font-bold text-slate-600">Kỳ kê khai:</span>
          <select
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-2"
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

        {/* Nút Lập bảng kê kỳ mới */}
        {onOpenCreatePeriodModal && (
          <button
            type="button"
            onClick={onOpenCreatePeriodModal}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 active:scale-95 active:bg-blue-200 font-bold text-xs transition-all duration-150 border border-blue-200 shadow-xs cursor-pointer select-none focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
            <span>Lập kỳ mới</span>
          </button>
        )}

        {/* Trạng thái kỳ (QTN-21) */}
        {selectedPeriod && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
              status === "LOCKED"
                ? "bg-slate-100 text-slate-700 border border-slate-300"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {status === "LOCKED" ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600 shrink-0 stroke-[2.2]" />
                <span>Đã chốt sổ liệu</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.2]" />
                <span>Đã lập bảng kê (Đang mở)</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cột phải: Các nút Thao tác */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Nút Xem trước */}
        <button
          type="button"
          onClick={onOpenPreview}
          disabled={!selectedPeriod}
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 hover:text-slate-900 active:bg-slate-300 active:scale-95 text-slate-700 font-bold text-xs transition-all duration-150 shadow-xs hover:shadow-sm border border-slate-200 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
        >
          <Eye className="w-4 h-4 text-slate-600 shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:scale-110" />
          <span>Xem trước mẫu 01</span>
        </button>

        {/* Dropdown Nút Xuất tờ khai thuế (NCL-12-CN-003) */}
        {canExport && selectedPeriod ? (
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight" arrow>
            <button
              type="button"
              disabled={isExporting}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none disabled:opacity-50 focus:outline-none"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0 stroke-[2.5]" />
              ) : (
                <FileDown className="w-4 h-4 shrink-0 stroke-[2.2] transition-transform duration-200 group-hover:-translate-y-0.5" />
              )}
              <span>Xuất tờ khai</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80 transition-transform duration-200 group-hover:translate-y-0.5" />
            </button>
          </Dropdown>
        ) : (
          <div title={roleRestrictionReason || "Bạn không có quyền xuất tờ khai thuế"}>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-70"
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
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none focus:outline-none"
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-70"
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
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none focus:outline-none"
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-70"
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
