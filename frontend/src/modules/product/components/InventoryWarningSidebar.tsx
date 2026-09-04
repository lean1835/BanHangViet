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

      {/* Ngưỡng ngày (Hàng bán chậm & tồn lâu) */}
      {filter.activeTab === "slow_moving" && (
        <div className="flex flex-col gap-2">
          <span className="font-bold text-slate-700 text-xs">
            Ngưỡng không bán quá:
          </span>
          <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500">
            <select
              value={filter.thresholdDays || 60}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  thresholdDays: Number(e.target.value),
                })
              }
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary transition-all cursor-pointer"
            >
              <option value={30}>30 ngày (1 tháng)</option>
              <option value={60}>60 ngày (2 tháng - Khuyên dùng)</option>
              <option value={90}>90 ngày (1 quý)</option>
              <option value={180}>180 ngày (6 tháng)</option>
              <option value={365}>365 ngày (1 năm)</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              * Lọc các mặt hàng không phát sinh giao dịch bán trong khoảng thời gian đã chọn để hỗ trợ quyết định xả hàng.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
