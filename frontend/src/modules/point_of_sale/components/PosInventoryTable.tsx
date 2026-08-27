import React from "react";
import {
  Package,
  AlertTriangle,
  Edit2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type { IPosInventory } from "../types/IPointOfSale";
import { formatCurrency } from "@/utils/formatCurrency";
import { USER_ROLES } from "@/constants/roles";

interface PosInventoryTableProps {
  data: IPosInventory[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  lowStockOnly: boolean;
  onLowStockOnlyChange: (lowStock: boolean) => void;
  isLoading: boolean;
  onEdit: (inventory: IPosInventory) => void;
  userRole?: string;
}

export const PosInventoryTable: React.FC<PosInventoryTableProps> = ({
  data,
  totalElements,
  totalPages,
  currentPage,
  onPageChange,
  searchTerm,
  onSearchChange,
  lowStockOnly,
  onLowStockOnlyChange,
  isLoading,
  onEdit,
  userRole,
}) => {
  const isOwner = userRole === USER_ROLES.OWNER;

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, mã SKU, nhóm hàng..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>

        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => onLowStockOnlyChange(e.target.checked)}
            className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
          />
          <span className="flex items-center gap-1 text-rose-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            Chỉ xem hàng sắp hết
          </span>
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã SKU</th>
                <th className="py-3.5 px-4">Tên mặt hàng</th>
                <th className="py-3.5 px-4">Nhóm hàng</th>
                <th className="py-3.5 px-4">Đơn vị</th>
                <th className="py-3.5 px-4 text-right">Giá bán</th>
                <th className="py-3.5 px-4 text-right">Tồn tại điểm</th>
                <th className="py-3.5 px-4 text-right">Tồn tối thiểu</th>
                <th className="py-3.5 px-4 text-center">Trạng thái tồn</th>
                {isOwner && <th className="py-3.5 px-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-40"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-md w-12"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded-md w-20 ml-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded-md w-12 ml-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded-md w-12 ml-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded-full w-24 mx-auto"></div></td>
                    {isOwner && <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded-md w-10 ml-auto"></div></td>}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 9 : 8} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-3">
                        <Package className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        Chưa có dữ liệu tồn kho tại điểm này
                      </h4>
                      <p className="text-xs text-slate-500">
                        {searchTerm || lowStockOnly
                          ? "Không tìm thấy mặt hàng nào phù hợp với bộ lọc."
                          : "Vui lòng chọn khởi tạo tồn kho hàng loạt hoặc chuyển hàng từ chi nhánh khác sang."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      inv.isLowStock ? "bg-rose-50/30" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {inv.productSku}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {inv.productName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {inv.groupName || "Chung"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {inv.unit || "Cái"}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      {formatCurrency(inv.price ?? 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      <span className={inv.stockQuantity <= 0 ? "text-rose-600" : ""}>
                        {inv.stockQuantity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 font-semibold">
                      {inv.minStockQuantity ?? 0}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {inv.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                          {inv.stockQuantity <= 0 ? "Hết hàng" : "Sắp hết"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Đủ tồn
                        </span>
                      )}
                    </td>

                    {isOwner && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onEdit(inv)}
                          title="Điều chỉnh tồn kho điểm này"
                          className="p-1.5 text-slate-500 hover:text-kv-blue-primary hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500 gap-2">
          <span>
            Hiển thị <strong>{data.length}</strong> trên tổng số{" "}
            <strong>{totalElements}</strong> mặt hàng
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
