import React from "react";
import {
  Store,
  Edit2,
  Trash2,
  Star,
  Users,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import type { IPointOfSale } from "../types/IPointOfSale";
import { USER_ROLES } from "@/constants/roles";

interface PointOfSaleTableProps {
  data: IPointOfSale[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onStatusFilterChange: (status: "ALL" | "ACTIVE" | "INACTIVE") => void;
  isLoading: boolean;
  onEdit: (pos: IPointOfSale) => void;
  onDelete: (pos: IPointOfSale) => void;
  onSetDefault: (pos: IPointOfSale) => void;
  onAssignEmployees: (pos: IPointOfSale) => void;
  onAddNew: () => void;
  userRole?: string;
}

export const PointOfSaleTable: React.FC<PointOfSaleTableProps> = ({
  data,
  totalElements,
  totalPages,
  currentPage,
  onPageChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  onEdit,
  onDelete,
  onSetDefault,
  onAssignEmployees,
  onAddNew,
  userRole,
}) => {
  const isOwner = userRole === USER_ROLES.OWNER;

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên điểm bán, mã quầy, địa chỉ, ký hiệu HĐ..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-600 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                onStatusFilterChange(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
              }
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-xl shadow-sm shadow-blue-500/20 transition-all shrink-0"
            >
              + Thêm điểm bán
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã điểm bán</th>
                <th className="py-3.5 px-4">Tên điểm bán</th>
                <th className="py-3.5 px-4">Địa chỉ hoạt động</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">Ký hiệu HĐ riêng</th>
                <th className="py-3.5 px-4 text-center">Mặc định</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-36"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-48"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-16"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded-full w-12 mx-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded-md w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-3">
                        <Store className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        Chưa có điểm bán nào
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        {searchTerm
                          ? "Không tìm thấy điểm bán phù hợp với từ khóa tìm kiếm."
                          : "Hệ thống hỗ trợ khai báo nhiều quầy hoặc nhiều chi nhánh trong cùng một tài khoản hộ."}
                      </p>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={onAddNew}
                          className="px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark rounded-xl shadow-xs transition-all"
                        >
                          + Khai báo điểm bán đầu tiên
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((pos) => (
                  <tr
                    key={pos.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      pos.isDefault ? "bg-amber-50/30" : ""
                    }`}
                  >
                    {/* Mã điểm bán */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {pos.posCode}
                    </td>

                    {/* Tên điểm bán */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {pos.name}
                    </td>

                    {/* Địa chỉ */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={pos.address}>
                      {pos.address}
                    </td>

                    {/* Số điện thoại */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {pos.phoneNumber || "—"}
                    </td>

                    {/* Ký hiệu hóa đơn */}
                    <td className="py-3.5 px-4">
                      {pos.invoiceSymbol ? (
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-kv-blue-primary border border-blue-100">
                          {pos.invoiceSymbol}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chung</span>
                      )}
                    </td>

                    {/* Điểm mặc định */}
                    <td className="py-3.5 px-4 text-center">
                      {pos.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Mặc định
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4 text-center">
                      {pos.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          Ngừng
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isOwner && (
                          <>
                            {/* Gán nhân viên */}
                            <button
                              type="button"
                              onClick={() => onAssignEmployees(pos)}
                              title="Gán nhân viên vào điểm này"
                              className="p-1.5 text-slate-500 hover:text-kv-blue-primary hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Users className="w-4 h-4" />
                            </button>

                            {/* Đặt mặc định */}
                            {!pos.isDefault && pos.isActive && (
                              <button
                                type="button"
                                onClick={() => onSetDefault(pos)}
                                title="Đặt làm điểm bán mặc định"
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}

                            {/* Chỉnh sửa */}
                            <button
                              type="button"
                              onClick={() => onEdit(pos)}
                              title="Chỉnh sửa điểm bán"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Xóa (chặn xóa nếu là mặc định) */}
                            {!pos.isDefault && (
                              <button
                                type="button"
                                onClick={() => onDelete(pos)}
                                title="Xóa điểm bán"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500 gap-2">
          <span>
            Hiển thị <strong>{data.length}</strong> trên tổng số{" "}
            <strong>{totalElements}</strong> điểm bán
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-700">
                Trang {currentPage + 1} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
