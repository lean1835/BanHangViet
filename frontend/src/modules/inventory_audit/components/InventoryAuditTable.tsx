import React from "react";
import { formatNumber } from "@/utils/formatCurrency";
import type { IInventoryAudit } from "../types/IInventoryAudit";
import { INVENTORY_AUDIT_COPY } from "@/constants/inventoryAudit";

interface InventoryAuditTableProps {
  audits: IInventoryAudit[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onSelectAudit: (id: string) => void;
}

const formatDateDMY = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString || "";
  }
};

export const InventoryAuditTable: React.FC<InventoryAuditTableProps> = ({
  audits,
  isLoading,
  page,
  pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onSelectAudit,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-kv-blue-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="font-semibold text-xs text-slate-600">Đang tải danh sách phiếu kiểm kê kho...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full animate-auth-fade-in">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            Danh sách phiếu kiểm kê kho
          </h3>
          <p className="text-[11px] text-slate-400 font-normal">
            Theo dõi kết quả kiểm đếm thực tế và lịch sử điều chỉnh số lượng tồn kho
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {totalElements} phiếu kiểm kê
        </span>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <th className="p-3 w-12 text-center">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.INDEX}</th>
                <th className="p-3">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.AUDIT_NUMBER}</th>
                <th className="p-3">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.AUDIT_DATE}</th>
                <th className="p-3">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.CREATED_BY}</th>
                <th className="p-3 text-right">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.TOTAL_ITEMS}</th>
                <th className="p-3 text-right">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.TOTAL_DIFF}</th>
                <th className="p-3 text-center">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.STATUS}</th>
                <th className="p-3">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.NOTES}</th>
                <th className="p-3 text-center w-24">{INVENTORY_AUDIT_COPY.TABLE_HEADERS.ACTION}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
            {audits.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-600">
                      {INVENTORY_AUDIT_COPY.EMPTY_MESSAGE}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tạo phiếu kiểm kê để theo dõi chênh lệch và điều chỉnh tồn kho.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              audits.map((audit, index) => {
                const diff = audit.totalDifferenceQty || 0;
                const isIncrease = diff > 0;

                return (
                  <tr
                    key={audit.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectAudit(audit.id)}
                  >
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      {page * pageSize + index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-kv-blue-primary group-hover:underline">
                      {audit.auditNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {formatDateDMY(audit.auditDate || audit.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {audit.createdByUserName || "Chủ hộ kinh doanh"}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700">
                      {audit.totalItems} mặt hàng
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {diff === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                          Khớp (0)
                        </span>
                      ) : isIncrease ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          +{formatNumber(diff)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          {formatNumber(diff)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {INVENTORY_AUDIT_COPY.STATUS_LABELS.COMPLETED}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                      {audit.notes || "—"}
                    </td>
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectAudit(audit.id)}
                        className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-kv-blue-light hover:text-kv-blue-primary text-slate-700 font-bold text-[11px] transition-colors"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <div>
            Hiển thị bản ghi từ <span className="font-bold text-slate-800">{page * pageSize + 1}</span> đến{" "}
            <span className="font-bold text-slate-800">{Math.min((page + 1) * pageSize, totalElements)}</span> trong tổng số{" "}
            <span className="font-bold text-slate-800">{totalElements}</span> bản ghi
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 0}
              className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700"
            >
              Trang trước
            </button>
            <span className="px-3 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-700">
              Trang {page + 1} / {totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default InventoryAuditTable;
