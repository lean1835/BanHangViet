import React, { useState, useMemo } from "react";
import { APP_LANGUAGE } from "@/constants/format";
import {
  isProductStockFilter,
  PRODUCT_FILTER,
  PRODUCT_SECTION_COPY,
  PRODUCT_STOCK_FILTER_OPTIONS,
} from "@/constants/product";
import { ProductGroupManagerModal } from "@/modules/product/components/ProductGroupManagerModal";
import { useGetProductGroupsQuery } from "@/modules/product/services/productApi";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";

interface ProductSidebarProps {
  selectedGroup: string;
  setSelectedGroup: (groupId: string) => void;
  stockFilter: TStockFilter;
  setStockFilter: (filter: TStockFilter) => void;
  userRole?: string;
}

export const ProductSidebar: React.FC<ProductSidebarProps> = ({
  selectedGroup,
  setSelectedGroup,
  stockFilter,
  setStockFilter,
  userRole,
}) => {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const { data: groups = [] } = useGetProductGroupsQuery();
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) =>
      a.name.localeCompare(b.name, APP_LANGUAGE),
    );
  }, [groups]);

  return (
    <div className="flex flex-col gap-5 w-full bg-white xl:bg-transparent p-4 xl:p-0 rounded-xl xl:rounded-none border xl:border-0 border-slate-200">
      {/* Nhóm hàng */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-xs">
            {PRODUCT_SECTION_COPY.GROUP_LABEL}
          </span>
          <button
            type="button"
            onClick={() => setIsGroupModalOpen(true)}
            className="text-kv-blue-primary hover:text-kv-blue-dark font-bold text-[11px]"
          >
            {PRODUCT_SECTION_COPY.GROUP_MANAGEMENT_ACTION}
          </button>
        </div>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary transition-all cursor-pointer"
        >
          <option value={PRODUCT_FILTER.ALL}>
            {PRODUCT_SECTION_COPY.GROUP_PLACEHOLDER}
          </option>
          {sortedGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <ProductGroupManagerModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        userRole={userRole}
      />

      {/* Tồn kho */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-700 text-xs">
          {PRODUCT_SECTION_COPY.STOCK_LABEL}
        </span>
        <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            {PRODUCT_SECTION_COPY.STOCK_CRITERIA_LABEL}
          </span>
          <select
            value={stockFilter}
            onChange={(event) => {
              if (isProductStockFilter(event.target.value)) {
                setStockFilter(event.target.value);
              }
            }}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary transition-all cursor-pointer"
          >
            {PRODUCT_STOCK_FILTER_OPTIONS.map((stockFilterOption) => (
              <option key={stockFilterOption.value} value={stockFilterOption.value}>
                {stockFilterOption.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

