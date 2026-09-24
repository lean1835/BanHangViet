import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { useGetSuppliersQuery } from "@/modules/supplier/services/supplierApi";

export interface SupplierReturnFilterState {
  supplierId: string;
  fromDate: string;
  toDate: string;
}

interface SupplierReturnSidebarProps {
  filter: SupplierReturnFilterState;
  onFilterChange: (filter: SupplierReturnFilterState) => void;
}

export const SupplierReturnSidebar: React.FC<SupplierReturnSidebarProps> = ({
  filter,
  onFilterChange,
}) => {
  const { data: suppliers = [] } = useGetSuppliersQuery();

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, supplierId: e.target.value });
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, fromDate: e.target.value });
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, toDate: e.target.value });
  };

  const handlePresetDate = (days: number | "thisMonth" | "all") => {
    const today = new Date();
    const toStr = today.toISOString().split("T")[0];

    if (days === "all") {
      onFilterChange({ ...filter, fromDate: "", toDate: "" });
      return;
    }

    if (days === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      onFilterChange({
        ...filter,
        fromDate: firstDay.toISOString().split("T")[0],
        toDate: toStr,
      });
      return;
    }

    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    onFilterChange({
      ...filter,
      fromDate: pastDate.toISOString().split("T")[0],
      toDate: toStr,
    });
  };

  const handleReset = () => {
    onFilterChange({
      supplierId: "",
      fromDate: "",
      toDate: "",
    });
  };

  const hasFilter =
    Boolean(filter.supplierId) || Boolean(filter.fromDate) || Boolean(filter.toDate);

  return (
    <div className="flex flex-col gap-4 text-xs animate-auth-fade-in">
      <div className="flex items-center justify-between border-b pb-2">
        <span className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-rose-600" />
          <span>Bộ Lọc Phiếu Trả</span>
        </span>
        {hasFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* Supplier select */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-700">Nhà cung cấp</label>
        <select
          value={filter.supplierId}
          onChange={handleSupplierChange}
          className="w-full h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:border-rose-500"
        >
          <option value="">Tất cả nhà cung cấp</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quick date presets */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-700">Thời gian trả</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handlePresetDate(0)}
            className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-600 text-[11px]"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => handlePresetDate(7)}
            className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-600 text-[11px]"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => handlePresetDate("thisMonth")}
            className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-600 text-[11px]"
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => handlePresetDate("all")}
            className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-600 text-[11px]"
          >
            Toàn thời gian
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-500 font-medium">Từ ngày:</span>
          <input
            type="date"
            value={filter.fromDate}
            onChange={handleFromDateChange}
            className="w-full h-8 px-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-500 font-medium">Đến ngày:</span>
          <input
            type="date"
            value={filter.toDate}
            onChange={handleToDateChange}
            className="w-full h-8 px-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>
    </div>
  );
};

export default SupplierReturnSidebar;
