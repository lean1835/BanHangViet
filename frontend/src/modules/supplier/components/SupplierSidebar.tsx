import React from "react";

export interface SupplierFilterState {
  debtFrom: string;
  debtTo: string;
  status: string;
}

interface SupplierSidebarProps {
  filter: SupplierFilterState;
  onFilterChange: (filter: SupplierFilterState) => void;
}

export const SupplierSidebar: React.FC<SupplierSidebarProps> = ({
  filter,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full text-xs font-semibold text-slate-700">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        Bộ lọc nhà cung cấp
      </span>

      {/* Nợ hiện tại */}
      <div className="flex flex-col gap-1.5">
        <span className="font-bold text-slate-700">Nợ hiện tại</span>
        <div className="space-y-2">
          <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-kv-blue-primary">
            <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-medium shrink-0">
              Từ
            </span>
            <input
              type="text"
              placeholder="Nhập giá trị"
              value={filter.debtFrom}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onFilterChange({ ...filter, debtFrom: val });
              }}
              className="w-full px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-kv-blue-primary">
            <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-medium shrink-0">
              Tới
            </span>
            <input
              type="text"
              placeholder="Nhập giá trị"
              value={filter.debtTo}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onFilterChange({ ...filter, debtTo: val });
              }}
              className="w-full px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Trạng thái */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-supplier-status" className="font-bold text-slate-700">
          Trạng thái
        </label>
        <select
          id="filter-supplier-status"
          value={filter.status}
          onChange={(e) =>
            onFilterChange({ ...filter, status: e.target.value })
          }
          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-normal text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary cursor-pointer"
        >
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
          <option value="ALL">Tất cả trạng thái</option>
        </select>
      </div>
    </div>
  );
};
