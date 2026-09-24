import React from "react";
import { useSearchParams } from "react-router-dom";
import { RotateCcw, AlertCircle } from "lucide-react";
import { useGetProductGroupsQuery } from "@/modules/product/services/productApi";
import {
  INVENTORY_VALUATION_SORT_FIELDS,
  INVENTORY_VALUATION_MESSAGES,
} from "@/constants/inventoryValuation";
import type { IGetInventoryValuationQueryParams } from "../types/IInventoryValuation";

interface InventoryValuationSidebarProps {
  filter?: IGetInventoryValuationQueryParams;
  onFilterChange?: (newFilter: IGetInventoryValuationQueryParams) => void;
}

export const InventoryValuationSidebar: React.FC<
  InventoryValuationSidebarProps
> = ({ filter: controlledFilter, onFilterChange: controlledOnChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: groups = [] } = useGetProductGroupsQuery();

  const todayStr = new Date().toISOString().split("T")[0];

  // Derive filter from props or URL search params
  const filter: IGetInventoryValuationQueryParams = controlledFilter ?? {
    asOfDate: searchParams.get("asOfDate") || "",
    groupId: searchParams.get("groupId") || "",
    search: searchParams.get("search") || "",
    sortBy: searchParams.get("sortBy") || "inventoryValue",
    sortDir: (searchParams.get("sortDir") as "asc" | "desc") || "desc",
  };

  const updateFilter = (newFilter: IGetInventoryValuationQueryParams) => {
    if (controlledOnChange) {
      controlledOnChange(newFilter);
    } else {
      const newParams = new URLSearchParams(searchParams);
      if (newFilter.asOfDate) {
        newParams.set("asOfDate", newFilter.asOfDate);
      } else {
        newParams.delete("asOfDate");
      }

      if (newFilter.groupId) {
        newParams.set("groupId", newFilter.groupId);
      } else {
        newParams.delete("groupId");
      }

      if (newFilter.sortBy) {
        newParams.set("sortBy", newFilter.sortBy);
      } else {
        newParams.delete("sortBy");
      }

      if (newFilter.sortDir) {
        newParams.set("sortDir", newFilter.sortDir);
      } else {
        newParams.delete("sortDir");
      }

      if (newFilter.search) {
        newParams.set("search", newFilter.search);
      } else {
        newParams.delete("search");
      }

      setSearchParams(newParams);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val > todayStr) {
      alert(INVENTORY_VALUATION_MESSAGES.FUTURE_DATE_NOT_ALLOWED);
      return;
    }
    updateFilter({ ...filter, asOfDate: val });
  };

  const handlePresetDate = (
    preset: "today" | "yesterday" | "lastMonthEnd" | "lastQuarterEnd"
  ) => {
    const now = new Date();

    if (preset === "today") {
      updateFilter({ ...filter, asOfDate: "" });
      return;
    }

    if (preset === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      updateFilter({ ...filter, asOfDate: d.toISOString().split("T")[0] });
      return;
    }

    if (preset === "lastMonthEnd") {
      const d = new Date(now.getFullYear(), now.getMonth(), 0);
      updateFilter({ ...filter, asOfDate: d.toISOString().split("T")[0] });
      return;
    }

    if (preset === "lastQuarterEnd") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const lastQuarterEndMonth = currentQuarter * 3;
      const d = new Date(now.getFullYear(), lastQuarterEndMonth, 0);
      updateFilter({ ...filter, asOfDate: d.toISOString().split("T")[0] });
      return;
    }
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter({ ...filter, groupId: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter({ ...filter, sortBy: e.target.value });
  };

  const handleReset = () => {
    updateFilter({
      asOfDate: "",
      groupId: "",
      search: "",
      sortBy: "inventoryValue",
      sortDir: "desc",
    });
  };

  const isHistorical = Boolean(filter.asOfDate && filter.asOfDate < todayStr);
  const hasActiveFilter =
    Boolean(filter.asOfDate) ||
    Boolean(filter.groupId) ||
    Boolean(filter.search) ||
    filter.sortBy !== "inventoryValue";

  return (
    <div className="flex flex-col gap-4 text-xs animate-auth-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <span className="font-extrabold text-sm text-slate-800">
          Bộ Lọc Báo Cáo
        </span>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-kv-blue-primary hover:text-kv-blue-dark flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* 1. Chọn thời điểm chốt số liệu */}
      <div className="flex flex-col gap-2">
        <label className="font-bold text-slate-700">
          Thời điểm chốt số liệu:
        </label>

        {/* Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handlePresetDate("today")}
            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] border transition-all cursor-pointer text-center ${
              !filter.asOfDate
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Hiện tại (Real-time)
          </button>
          <button
            type="button"
            onClick={() => handlePresetDate("yesterday")}
            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] border transition-all cursor-pointer text-center ${
              filter.asOfDate ===
              new Date(Date.now() - 86400000).toISOString().split("T")[0]
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Hôm qua
          </button>
          <button
            type="button"
            onClick={() => handlePresetDate("lastMonthEnd")}
            className="px-2.5 py-1.5 rounded-lg font-semibold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-kv-blue-light hover:text-kv-blue-primary text-[11px] cursor-pointer text-center"
          >
            Cuối tháng trước
          </button>
          <button
            type="button"
            onClick={() => handlePresetDate("lastQuarterEnd")}
            className="px-2.5 py-1.5 rounded-lg font-semibold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-kv-blue-light hover:text-kv-blue-primary text-[11px] cursor-pointer text-center"
          >
            Cuối quý trước
          </button>
        </div>

        {/* Date picker */}
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[11px] text-slate-500 font-medium">
            Hoặc chọn ngày chốt quá khứ:
          </span>
          <input
            type="date"
            max={todayStr}
            value={filter.asOfDate || todayStr}
            onChange={handleDateChange}
            className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500"
          />
        </div>

        {isHistorical && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Đang xem dữ liệu lịch sử tái dựng tại ngày <strong>{filter.asOfDate}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 2. Lọc theo nhóm hàng */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-700">Nhóm hàng</label>
        <select
          value={filter.groupId || ""}
          onChange={handleGroupChange}
          className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-500"
        >
          <option value="">Tất cả các nhóm</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Tiêu chí sắp xếp */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-700">Sắp xếp ưu tiên</label>
        <select
          value={filter.sortBy || "inventoryValue"}
          onChange={handleSortChange}
          className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-500"
        >
          {INVENTORY_VALUATION_SORT_FIELDS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default InventoryValuationSidebar;
