import React from "react";
import {
  Layers,
  Search,
} from "lucide-react";
import type { IInvoiceNumberRange } from "@/modules/settings/types/IInvoiceRange";

export type TRangeStatusFilter = "ALL" | "ACTIVE" | "WARNING_LOW" | "EXHAUSTED" | "INACTIVE";

export interface InvoiceRangeSidebarProps {
  statusFilter: TRangeStatusFilter;
  setStatusFilter: (status: TRangeStatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeRange?: IInvoiceNumberRange;
}

export const InvoiceRangeSidebar: React.FC<InvoiceRangeSidebarProps> = ({
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  activeRange,
}) => {
  return (
    <>
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-1.5">
        <Layers className="w-4 h-4 text-kv-blue-primary" />
        <span>Bộ lọc Dải số</span>
      </div>

      {/* Tìm kiếm nhanh */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Tìm kiếm ký hiệu / mẫu
        </span>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ký hiệu (vd: 1C26TAA)..."
            className="w-full border border-slate-300 h-9 pl-8 pr-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        </div>
      </div>

      {/* Lọc theo trạng thái dải số */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Trạng thái dải số
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TRangeStatusFilter)}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 cursor-pointer"
        >
          <option value="ALL">Tất cả dải số</option>
          <option value="ACTIVE">🟢 Đang sử dụng (ACTIVE)</option>
          <option value="WARNING_LOW">🟠 Sắp hết số (WARNING_LOW)</option>
          <option value="EXHAUSTED">🔴 Đã hết số (EXHAUSTED)</option>
          <option value="INACTIVE">⚪ Không sử dụng (INACTIVE)</option>
        </select>
      </div>

      {/* Thẻ tóm tắt dải số đang áp dụng */}
      {activeRange && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
              Dải số hiện tại
            </span>
            <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-800">
              {activeRange.invoiceSymbol}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-400 font-bold block">Còn lại</span>
              <span
                className={`text-sm font-black font-mono block ${
                  activeRange.remainingCount <= activeRange.warningThreshold
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {activeRange.remainingCount}
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-400 font-bold block">Tốc độ</span>
              <span className="text-sm font-black font-mono text-slate-800 block">
                ~{activeRange.dailyConsumptionRate ?? 0}/ngày
              </span>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
