import React from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { ISupplier } from "../types/ISupplier";
import { Wallet } from "lucide-react";

interface SupplierTableProps {
  suppliers: ISupplier[];
  totalCount?: number;
  isLoading: boolean;
  canManage: boolean;
  canPayDebt?: boolean;
  onEdit: (supplier: ISupplier) => void;
  onToggleStatus: (supplier: ISupplier) => void;
  onViewDetail: (supplier: ISupplier) => void;
  onPayDebt?: (supplier: ISupplier) => void;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  totalCount,
  isLoading,
  canManage,
  canPayDebt,
  onEdit,
  onToggleStatus,
  onViewDetail,
  onPayDebt,
  page = 0,
  pageSize = 8,
  totalPages = 0,
  onPageChange,
}) => {
  const showActionColumn = canManage || Boolean(canPayDebt && onPayDebt);
  const displayTotal = totalCount ?? suppliers.length;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-auth-fade-in flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="border-b border-slate-100 px-6 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Quản lý Nhà cung cấp
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {displayTotal} nhà cung cấp
          </span>
        </div>

        {/* Table / Loading / Empty */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-slate-100/80 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-28 text-center text-xs text-slate-400 font-medium">
            Không tìm thấy nhà cung cấp nào phù hợp bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Tên nhà cung cấp</th>
                  <th className="py-3 px-4">Điện thoại</th>
                  <th className="py-3 px-4">Địa chỉ</th>
                  <th className="py-3 px-4">Ghi chú</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Nợ cần trả</th>
                  {showActionColumn && (
                    <th className="py-3 px-4 text-center w-28">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {suppliers.map((supplier) => {
                  const hasDebt = (supplier.currentDebt || 0) > 0;
                  const isActive = supplier.status !== "INACTIVE";

                  return (
                    <tr
                      key={supplier.id}
                      onClick={() => onViewDetail(supplier)}
                      className="hover:bg-sky-50/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-kv-blue-primary transition-colors">
                        {supplier.name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {supplier.phoneNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate font-normal">
                        {supplier.address || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate font-normal">
                        {supplier.note ? (
                          <span className="text-slate-700 font-medium bg-slate-100/80 px-2 py-0.5 rounded text-[11px]">
                            {supplier.note}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        <span
                          className={
                            hasDebt
                              ? "text-rose-600 font-bold"
                              : "text-slate-500 font-normal"
                          }
                        >
                          {formatCurrency(supplier.currentDebt || 0)}
                        </span>
                      </td>
                      {showActionColumn && (
                        <td
                          className="py-3.5 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {canPayDebt && onPayDebt && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPayDebt(supplier);
                                }}
                                disabled={!hasDebt}
                                title={
                                  hasDebt
                                    ? "Lập phiếu chi trả nợ"
                                    : "Nhà cung cấp này không có nợ"
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  hasDebt
                                    ? "text-rose-600 hover:bg-rose-50"
                                    : "text-slate-300 cursor-not-allowed"
                                }`}
                              >
                                <Wallet className="w-4 h-4" />
                              </button>
                            )}
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(supplier);
                                  }}
                                  title="Chỉnh sửa thông tin"
                                  className="p-1.5 text-slate-400 hover:text-kv-blue-primary hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStatus(supplier);
                                  }}
                                  title={
                                    isActive
                                      ? "Chuyển sang Ngừng hoạt động"
                                      : "Chuyển sang Đang hoạt động"
                                  }
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isActive
                                      ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                      : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                >
                                  {isActive ? (
                                    <svg
                                      aria-hidden="true"
                                      viewBox="0 0 24 24"
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="10" y1="15" x2="10" y2="9" />
                                      <line x1="14" y1="15" x2="14" y2="9" />
                                    </svg>
                                  ) : (
                                    <svg
                                      aria-hidden="true"
                                      viewBox="0 0 24 24"
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && onPageChange && (
        <div className="px-6 pb-4">
          <TablePaginationFooter
            currentPage={page}
            pageSize={pageSize}
            totalElements={displayTotal}
            totalPages={totalPages}
            onPageChange={onPageChange}
            recordUnit="nhà cung cấp"
          />
        </div>
      )}
    </div>
  );
};
