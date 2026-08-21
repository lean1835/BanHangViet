import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  PackagePlus,
  Phone,
  Building2,
  Lock,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import type { ILowStockWarning } from "@/modules/product/types/IInventoryWarning";
import { INVENTORY_WARNING_COPY, PRODUCT_QUERY_CONFIG } from "@/constants/product";

interface LowStockWarningTableProps {
  warnings: ILowStockWarning[];
  isStockAdequate: boolean;
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isOwner: boolean;
  onPageChange: (newPage: number) => void;
  onEditMinStock: (item: ILowStockWarning) => void;
  onQuickReorder: (item: ILowStockWarning) => void;
}

export const LowStockWarningTable: React.FC<LowStockWarningTableProps> = ({
  warnings,
  isStockAdequate,
  isLoading,
  page,
  pageSize,
  totalPages,
  totalElements,
  isOwner,
  onPageChange,
  onEditMinStock,
  onQuickReorder,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500">Đang tải danh sách cảnh báo tồn kho...</span>
      </div>
    );
  }

  if (isStockAdequate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] bg-emerald-50/50 rounded-xl border border-emerald-200/80 p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3 shadow-inner">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-base font-black text-emerald-900 mb-1">
          {INVENTORY_WARNING_COPY.STOCK_ADEQUATE_TITLE}
        </h3>
        <p className="text-xs font-semibold text-emerald-700/80 max-w-md">
          {INVENTORY_WARNING_COPY.STOCK_ADEQUATE_DESCRIPTION}
        </p>
      </div>
    );
  }

  const startItem = page * pageSize + PRODUCT_QUERY_CONFIG.DISPLAY_INDEX_OFFSET;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full animate-auth-fade-in">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            Danh sách hàng hóa dưới ngưỡng tồn tối thiểu
          </h3>
          <p className="text-[11px] text-slate-400 font-normal">
            Các mặt hàng cần ưu tiên nhập bổ sung để đảm bảo nguồn cung bán hàng
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {totalElements} mặt hàng
        </span>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <th className="p-3 text-center w-12">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.INDEX}
                </th>
                <th className="p-3 w-28">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.SKU}
                </th>
                <th className="p-3 min-w-[180px]">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.PRODUCT_NAME}
                </th>
                <th className="p-3 w-28">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.GROUP}
                </th>
                <th className="p-3 text-center w-16">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.UNIT}
                </th>
                <th className="p-3 text-right w-24">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.CURRENT_STOCK}
                </th>
                <th className="p-3 text-right w-24">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.MIN_STOCK}
                </th>
                <th className="p-3 text-right w-24">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.SHORTAGE}
                </th>
                <th className="p-3 text-right w-28">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.PRICE}
                </th>
                <th className="p-3 min-w-[160px]">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.LAST_SUPPLIER}
                </th>
                <th className="p-3 text-center w-28">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.ACTION}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {warnings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-600">
                        Không tìm thấy mặt hàng phù hợp
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Vui lòng thử tìm kiếm bằng từ khóa hoặc mã SKU khác.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                warnings.map((item, index) => {
                const isOutOfStock = item.stockQuantity <= 0;
                return (
                  <tr
                    key={item.productId}
                    className={`hover:bg-amber-50/40 transition-colors ${
                      isOutOfStock ? "bg-rose-50/20" : ""
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-slate-400 font-bold text-[11px]">
                      {page * pageSize + index + 1}
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 text-[11px]">
                      {item.sku}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 line-clamp-2">
                        {item.productName}
                      </div>
                    </td>

                    {/* Group */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold truncate max-w-[110px]">
                        {item.groupName || "Mặc định"}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-3 text-center font-bold text-slate-600 text-[11px]">
                      {item.unit}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-black">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded text-[11px]">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {formatNumber(item.stockQuantity)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded text-[11px]">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {formatNumber(item.stockQuantity)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Min Stock */}
                    <td className="py-3 px-3 text-right font-black text-slate-700">
                      {formatNumber(item.minStockQuantity)}
                    </td>

                    {/* Shortage */}
                    <td className="py-3 px-3 text-right">
                      <span className="inline-block font-black text-rose-600 text-[11px]">
                        +{formatNumber(item.shortageQuantity)}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right font-bold text-slate-800">
                      {formatCurrency(item.price)}
                    </td>

                    {/* Supplier */}
                    <td className="py-3 px-3">
                      {item.lastSupplierName ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-slate-800 font-bold line-clamp-1">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span title={item.lastSupplierName}>{item.lastSupplierName}</span>
                          </div>
                          {item.lastSupplierPhone && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{item.lastSupplierPhone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa có NCC</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-center gap-1">
                        {isOwner ? (
                          <button
                            type="button"
                            onClick={() => onEditMinStock(item)}
                            title="Sửa ngưỡng tồn tối thiểu"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-kv-blue-primary hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span
                            title="Chỉ Chủ hộ kinh doanh mới được phép sửa ngưỡng tồn"
                            className="p-1.5 text-slate-300 cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onQuickReorder(item)}
                          title="Tạo phiếu nhập hàng cho mặt hàng này"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200 transition-colors"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Nhập</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
            <div>
              Hiển thị bản ghi từ <span className="font-bold text-slate-800">{startItem}</span> đến{" "}
              <span className="font-bold text-slate-800">{endItem}</span> trong tổng số{" "}
              <span className="font-bold text-slate-800">{totalElements}</span> bản ghi
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
                className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700"
              >
                Trang trước
              </button>
              <span className="px-3 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-700">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => onPageChange(page + 1)}
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
