import React, { useMemo } from "react";
import { APP_LANGUAGE } from "@/constants/format";
import {
  PRODUCT_FILTER,
  PRODUCT_SECTION_COPY,
  PURCHASE_SUGGESTION_PERIODS,
  INVENTORY_WARNING_COPY,
} from "@/constants/product";
import { useGetProductGroupsQuery } from "@/modules/product/services/productApi";
import type { IInventoryWarningFilterState } from "@/modules/product/types/IInventoryWarning";

interface InventoryWarningSidebarProps {
  filter: IInventoryWarningFilterState;
  onFilterChange: (newFilter: IInventoryWarningFilterState) => void;
}

export const InventoryWarningSidebar: React.FC<InventoryWarningSidebarProps> = ({
  filter,
  onFilterChange,
}) => {
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
        <span className="font-bold text-slate-700 text-xs">
          {PRODUCT_SECTION_COPY.GROUP_LABEL}
        </span>
        <select
          value={filter.groupId}
          onChange={(e) =>
            onFilterChange({ ...filter, groupId: e.target.value })
          }
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

      {/* Phân tích theo kỳ (Gợi ý nhập hàng) */}
      {filter.activeTab === "suggestions" && (
        <div className="flex flex-col gap-2">
          <span className="font-bold text-slate-700 text-xs">
            {INVENTORY_WARNING_COPY.PERIOD_LABEL}
          </span>
          <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
            <select
              value={filter.periodDays}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  periodDays: Number(e.target.value),
                })
              }
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary transition-all cursor-pointer"
            >
              {PURCHASE_SUGGESTION_PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              * Hệ thống tính tốc độ bán trung bình tuần từ các đơn hàng hoàn tất trong khoảng thời gian này để gợi ý số lượng cần bù.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
