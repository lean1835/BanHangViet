import React from "react";
import { SlidersHorizontal, Calendar, Store, RotateCcw } from "lucide-react";
import { useReportFilter } from "../context/ReportFilterContext";
import { useGetPointsOfSaleQuery } from "@/modules/point_of_sale/services/pointOfSaleApi";

export const PosRevenueReportSidebar: React.FC = () => {
  const {
    posRevenueFilter,
    setPosRevenueFilter,
    setPosRevenuePreset,
    resetPosRevenueFilter,
  } = useReportFilter();

  const { data: posData } = useGetPointsOfSaleQuery({ size: 50 });

  return (
    <div className="flex flex-col gap-4 text-xs animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-kv-blue-primary" />
          <span>Bộ lọc điểm bán</span>
        </div>
        <button
          type="button"
          onClick={resetPosRevenueFilter}
          className="text-[10px] font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors flex items-center gap-1 cursor-pointer"
          title="Đặt lại bộ lọc về mặc định"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Khoảng thời gian nhanh
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setPosRevenuePreset("today")}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center ${
              posRevenueFilter.activePreset === "today"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setPosRevenuePreset("thisWeek")}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center ${
              posRevenueFilter.activePreset === "thisWeek"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setPosRevenuePreset("thisMonth")}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center ${
              posRevenueFilter.activePreset === "thisMonth"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setPosRevenuePreset("thisQuarter")}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center ${
              posRevenueFilter.activePreset === "thisQuarter"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Quý này
          </button>
        </div>
      </div>

      {/* Date Range Pickers */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Thời gian tùy chỉnh</span>
        </span>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày</label>
            <input
              type="date"
              value={posRevenueFilter.fromDate}
              onChange={(e) =>
                setPosRevenueFilter((prev) => ({
                  ...prev,
                  fromDate: e.target.value,
                  activePreset: "custom",
                }))
              }
              className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Đến ngày</label>
            <input
              type="date"
              value={posRevenueFilter.toDate}
              onChange={(e) =>
                setPosRevenueFilter((prev) => ({
                  ...prev,
                  toDate: e.target.value,
                  activePreset: "custom",
                }))
              }
              className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Point of Sale Selector */}
      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
        <label htmlFor="posRevenueSelect" className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <Store className="w-3 h-3 text-slate-400" />
          <span>Điểm bán</span>
        </label>
        <select
          id="posRevenueSelect"
          value={posRevenueFilter.posId}
          onChange={(e) =>
            setPosRevenueFilter((prev) => ({
              ...prev,
              posId: e.target.value,
            }))
          }
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer"
        >
          <option value="">Tất cả điểm bán ({posData?.totalElements || 0})</option>
          {posData?.content?.map((pos) => (
            <option key={pos.id} value={pos.id}>
              {pos.name} ({pos.posCode})
            </option>
          ))}
        </select>
      </div>

      {/* Hint Note Card */}
      <div className="border-t border-slate-100 pt-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 font-medium leading-relaxed">
          <p className="font-bold text-slate-700 mb-1">💡 Báo cáo điểm bán:</p>
          <p>So sánh doanh thu thuần, số đơn và tỷ trọng đóng góp của từng quầy bán hàng hoặc chi nhánh trong hộ kinh doanh.</p>
        </div>
      </div>

      {/* Reset Button */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={resetPosRevenueFilter}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
};

export default PosRevenueReportSidebar;
