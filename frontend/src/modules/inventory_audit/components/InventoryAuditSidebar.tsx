import React from "react";
import {
  INVENTORY_AUDIT_FILTER_OPTIONS,
  INVENTORY_AUDIT_FILTER_STATUS,
  type TInventoryAuditFilterStatus,
} from "@/constants/inventoryAudit";
import type { IInventoryAuditFilterState } from "../types/IInventoryAudit";

interface InventoryAuditSidebarProps {
  filter: IInventoryAuditFilterState;
  onFilterChange: (newFilter: IInventoryAuditFilterState) => void;
}

export const InventoryAuditSidebar: React.FC<InventoryAuditSidebarProps> = ({
  filter,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full text-xs font-semibold text-slate-700">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        Bộ lọc kiểm kê kho
      </span>

      {/* Trạng thái chênh lệch (Dropdown) */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="inventory-audit-status-filter"
          className="font-bold text-slate-700 text-xs"
        >
          Tiêu chí chênh lệch
        </label>
        <select
          id="inventory-audit-status-filter"
          value={filter.statusFilter}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              statusFilter: e.target.value as TInventoryAuditFilterStatus,
            })
          }
          className="h-9 w-full px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-kv-blue-primary shadow-xs transition-all cursor-pointer"
        >
          {INVENTORY_AUDIT_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Khoảng thời gian kiểm kê */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <span className="font-bold text-slate-700">Thời gian kiểm kê</span>
        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Từ ngày:</label>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) =>
                onFilterChange({ ...filter, dateFrom: e.target.value })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-kv-blue-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Đến ngày:</label>
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) =>
                onFilterChange({ ...filter, dateTo: e.target.value })
              }
              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-kv-blue-primary focus:outline-none"
            />
          </div>

          {(filter.dateFrom || filter.dateTo || filter.statusFilter !== INVENTORY_AUDIT_FILTER_STATUS.ALL) && (
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filter,
                  dateFrom: "",
                  dateTo: "",
                  statusFilter: INVENTORY_AUDIT_FILTER_STATUS.ALL,
                })
              }
              className="w-full text-center text-xs text-kv-blue-primary hover:underline font-semibold pt-1"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Thông tin quy tắc nghiệp vụ */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 leading-relaxed space-y-1 mt-2">
        <div className="font-bold text-slate-800">
          Quy tắc kiểm kê kho
        </div>
        <p>
          Số tồn chỉ thay đổi qua bán hàng, nhập hàng, trả hàng hoặc phiếu kiểm kê. Mọi chênh lệch kiểm kê bắt buộc phải kèm lý do lưu vết.
        </p>
      </div>
    </div>
  );
};

export default InventoryAuditSidebar;
