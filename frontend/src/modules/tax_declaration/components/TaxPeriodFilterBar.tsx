import React from "react";
import {
  Calendar,
  Lock,
  Unlock,
  Eye,
  FileDown,
  Loader2,
  ChevronDown,
  FileSpreadsheet,
  FileCode,
  FileText,
} from "lucide-react";
import { Dropdown, type MenuProps } from "antd";
import type { ITaxPeriodOption, TTaxExportFormat } from "../types/ITaxDeclaration";
import { REPORT_UI } from "@/constants/report";

interface ITaxPeriodFilterBarProps {
  periods: ITaxPeriodOption[];
  selectedPeriod: ITaxPeriodOption;
  onSelectPeriod: (period: ITaxPeriodOption) => void;
  status: "OPEN" | "LOCKED";
  onOpenPreview: () => void;
  onExport: (format: TTaxExportFormat) => void;
  isExporting: boolean;
  canExport: boolean;
  roleRestrictionReason?: string;
}

export const TaxPeriodFilterBar: React.FC<ITaxPeriodFilterBarProps> = ({
  periods,
  selectedPeriod,
  onSelectPeriod,
  status,
  onOpenPreview,
  onExport,
  isExporting,
  canExport,
  roleRestrictionReason,
}) => {
  const exportMenuItems: MenuProps["items"] = [
    {
      key: "PDF",
      label: (
        <div className="flex items-center gap-2 py-1 font-semibold text-xs text-slate-700 hover:text-kv-blue-primary">
          <FileText className="w-4 h-4 text-rose-500" />
          <span>{REPORT_UI.TAX_DECLARATION.BTN_EXPORT_PDF}</span>
        </div>
      ),
      onClick: () => onExport("PDF"),
    },
    {
      key: "EXCEL",
      label: (
        <div className="flex items-center gap-2 py-1 font-semibold text-xs text-slate-700 hover:text-kv-blue-primary">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>{REPORT_UI.TAX_DECLARATION.BTN_EXPORT_EXCEL}</span>
        </div>
      ),
      onClick: () => onExport("EXCEL"),
    },
    {
      key: "XML",
      label: (
        <div className="flex items-center gap-2 py-1 font-semibold text-xs text-slate-700 hover:text-kv-blue-primary">
          <FileCode className="w-4 h-4 text-blue-600" />
          <span>{REPORT_UI.TAX_DECLARATION.BTN_EXPORT_XML}</span>
        </div>
      ),
      onClick: () => onExport("XML"),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Cột trái: Bộ lọc kỳ kê khai */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-kv-blue-primary" />
          <span className="text-xs font-bold text-slate-600">
            {REPORT_UI.TAX_DECLARATION.PERIOD_LABEL}
          </span>
          <select
            className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer"
            value={selectedPeriod.value}
            onChange={(e) => {
              const target = periods.find((p) => p.value === e.target.value);
              if (target) onSelectPeriod(target);
            }}
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Trạng thái kỳ (QTN-21) */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            status === "LOCKED"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {status === "LOCKED" ? (
            <>
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{REPORT_UI.TAX_DECLARATION.STATUS_LOCKED}</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-blue-600" />
              <span>{REPORT_UI.TAX_DECLARATION.STATUS_OPEN}</span>
            </>
          )}
        </div>
      </div>

      {/* Cột phải: Các nút Thao tác */}
      <div className="flex items-center gap-2.5">
        {/* Nút Xem trước */}
        <button
          type="button"
          onClick={onOpenPreview}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition shadow-sm border border-slate-200 cursor-pointer"
        >
          <Eye className="w-4 h-4 text-slate-600" />
          <span>{REPORT_UI.TAX_DECLARATION.BTN_PREVIEW}</span>
        </button>

        {/* Dropdown Nút Xuất tờ khai thuế */}
        {canExport ? (
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight" arrow>
            <button
              type="button"
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-kv-blue-primary hover:bg-blue-600 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{REPORT_UI.TAX_DECLARATION.BTN_EXPORT}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
          </Dropdown>
        ) : (
          <div title={roleRestrictionReason || "Bạn không có quyền xuất tờ khai thuế"}>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-70"
            >
              <Lock className="w-4 h-4" />
              <span>{REPORT_UI.TAX_DECLARATION.BTN_EXPORT}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
