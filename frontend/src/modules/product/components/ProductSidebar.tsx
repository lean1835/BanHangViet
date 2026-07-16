import React from "react";
import { PRODUCT_GROUPS } from "../types/product";

interface ProductSidebarProps {
  selectedGroup: string;
  setSelectedGroup: (groupId: string) => void;
  stockFilter: "ALL" | "IN_STOCK" | "OUT_OF_STOCK";
  setStockFilter: (filter: "ALL" | "IN_STOCK" | "OUT_OF_STOCK") => void;
}

export const ProductSidebar: React.FC<ProductSidebarProps> = ({
  selectedGroup,
  setSelectedGroup,
  stockFilter,
  setStockFilter,
}) => {
  return (
    <div className="flex flex-col gap-5 w-full bg-white xl:bg-transparent p-4 xl:p-0 rounded-xl xl:rounded-none border xl:border-0 border-slate-200">
      {/* Nhóm hàng */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-xs">Nhóm hàng</span>
          <button
            type="button"
            onClick={() => alert("Chức năng thêm mới Nhóm hàng...")}
            className="text-kv-blue-primary hover:text-kv-blue-dark font-bold text-[11px]"
          >
            Tạo mới
          </button>
        </div>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary transition-all cursor-pointer"
        >
          <option value="ALL">Chọn nhóm hàng</option>
          {PRODUCT_GROUPS.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tồn kho */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-700 text-xs">Tồn kho</span>
        <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Tiêu chí tồn
          </span>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary transition-all cursor-pointer"
          >
            <option value="ALL">Tất cả</option>
            <option value="IN_STOCK">Còn hàng (Tồn &gt; 0)</option>
            <option value="OUT_OF_STOCK">Hết hàng (Tồn = 0)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

