import React from "react";

const DEFAULT_SUPPLIER_GROUPS = [
  "ALL",
  "Nông sản - Thực phẩm",
  "Bánh kẹo - Nước giải khát",
  "Hóa mỹ phẩm - Tiêu dùng",
  "Thiết bị - Gia dụng",
  "Nhà cung cấp khác",
];

interface SupplierSidebarFilterProps {
  searchQuery: string;
  selectedGroup: string;
  onGroupChange: (g: string) => void;
  minDebt: number | "";
  onMinDebtChange: (v: number | "") => void;
  maxDebt: number | "";
  onMaxDebtChange: (v: number | "") => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onStatusFilterChange: (s: "ALL" | "ACTIVE" | "INACTIVE") => void;
  onReset: () => void;
  groupsList?: string[];
  onOpenCreateGroupModal?: () => void;
}

export const SupplierSidebarFilter: React.FC<SupplierSidebarFilterProps> = ({
  searchQuery,
  selectedGroup,
  onGroupChange,
  minDebt,
  onMinDebtChange,
  maxDebt,
  onMaxDebtChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
  groupsList = DEFAULT_SUPPLIER_GROUPS,
  onOpenCreateGroupModal,
}) => {
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedGroup !== "ALL" ||
    minDebt !== "" ||
    maxDebt !== "" ||
    statusFilter !== "ACTIVE";

  return (
    <div className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
      <div className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center justify-between border-b pb-2">
        <span>Bộ lọc nhà cung cấp</span>
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-bold text-kv-blue-primary hover:underline lowercase normal-case"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Nhóm nhà cung cấp Dropdown */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="sidebar-group-filter" className="font-bold text-slate-700">
            Nhóm nhà cung cấp
          </label>
          {onOpenCreateGroupModal && (
            <button
              type="button"
              onClick={onOpenCreateGroupModal}
              className="text-kv-blue-primary hover:underline text-xs font-semibold cursor-pointer"
            >
              Tạo mới
            </button>
          )}
        </div>
        <select
          id="sidebar-group-filter"
          value={selectedGroup}
          onChange={(e) => onGroupChange(e.target.value)}
          className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
        >
          {groupsList.map((group) => (
            <option key={group} value={group}>
              {group === "ALL" ? "Tất cả các nhóm" : group}
            </option>
          ))}
        </select>
      </div>

      {/* Nợ hiện tại (Range Filter) */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <label className="font-bold text-slate-700">Nợ hiện tại</label>
        <div className="flex flex-col gap-2">
          {/* Từ */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:border-kv-blue-primary shadow-xs">
            <span className="px-3 py-1.5 bg-slate-100 border-r border-slate-300 text-slate-600 font-bold text-xs select-none min-w-[42px] text-center">
              Từ
            </span>
            <input
              type="number"
              min="0"
              value={minDebt}
              onChange={(e) => onMinDebtChange(e.target.value ? Number(e.target.value) : "")}
              placeholder="Nhập giá trị"
              className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none bg-transparent"
            />
          </div>

          {/* Tới */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:border-kv-blue-primary shadow-xs">
            <span className="px-3 py-1.5 bg-slate-100 border-r border-slate-300 text-slate-600 font-bold text-xs select-none min-w-[42px] text-center">
              Tới
            </span>
            <input
              type="number"
              min="0"
              value={maxDebt}
              onChange={(e) => onMaxDebtChange(e.target.value ? Number(e.target.value) : "")}
              placeholder="Nhập giá trị"
              className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Trạng thái Dropdown */}
      <div className="flex flex-col gap-1.5 border-t pt-3">
        <label htmlFor="sidebar-status-filter" className="font-bold text-slate-700">
          Trạng thái
        </label>
        <select
          id="sidebar-status-filter"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as any)}
          className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
        >
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng hoạt động</option>
          <option value="ALL">Tất cả trạng thái</option>
        </select>
      </div>
    </div>
  );
};
