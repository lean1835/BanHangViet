import React from "react";
import {
  Sparkles,
  TrendingUp,
  PackagePlus,
  Building2,
  Phone,
  Lock,
} from "lucide-react";
import { formatNumber } from "@/utils/formatCurrency";
import type { IPurchaseSuggestion } from "@/modules/product/types/IInventoryWarning";
import { INVENTORY_WARNING_COPY, PRODUCT_QUERY_CONFIG } from "@/constants/product";

interface PurchaseSuggestionTableProps {
  suggestions: IPurchaseSuggestion[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isOwner: boolean;
  onPageChange: (newPage: number) => void;
  onQuickReorder: (item: IPurchaseSuggestion) => void;
}

export const PurchaseSuggestionTable: React.FC<PurchaseSuggestionTableProps> = ({
  suggestions,
  isLoading,
  page,
  pageSize,
  totalPages,
  totalElements,
  isOwner,
  onPageChange,
  onQuickReorder,
}) => {
  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Quyền truy cập bị giới hạn
        </h3>
        <p className="text-xs font-semibold text-slate-500 max-w-md">
          Chức năng phân tích bán hàng và gợi ý nhập hàng chỉ dành cho Chủ hộ kinh doanh (VT-01) để phục vụ việc ra quyết định nhập hàng.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500">Đang phân tích dữ liệu bán hàng và tính toán gợi ý nhập...</span>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Chưa có đề xuất nhập hàng cho kỳ này
        </h3>
        <p className="text-xs font-semibold text-slate-500 max-w-md">
          Tất cả mặt hàng đang có số lượng tồn kho đáp ứng đủ tốc độ bán dự kiến trong kỳ, hoặc chưa có lịch sử đơn hàng hoàn tất trong khoảng thời gian đã chọn.
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
            Gợi ý nhập hàng theo tốc độ bán
          </h3>
          <p className="text-[11px] text-slate-400 font-normal">
            Đề xuất số lượng nhập hàng tối ưu dự trù đủ bán cho chu kỳ 1 tuần tiếp theo
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
                <th className="p-3 text-center w-16">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.UNIT}
                </th>
                <th className="p-3 text-right w-24">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.AVERAGE_WEEKLY_SALES}
                </th>
                <th className="p-3 text-right w-24">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.CURRENT_STOCK}
                </th>
                <th className="p-3 text-right w-24">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.SUGGESTED_QTY}
                </th>
                <th className="p-3 min-w-[200px]">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.RATIONALE}
                </th>
                <th className="p-3 min-w-[150px]">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.LAST_SUPPLIER}
                </th>
                <th className="p-3 text-center w-28">
                  {INVENTORY_WARNING_COPY.TABLE_HEADERS.ACTION}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {suggestions.map((item, index) => {
                return (
                  <tr
                    key={item.productId}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-slate-400 font-bold text-[11px]">
                      {page * pageSize + index + 1}
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 text-[11px]">
                      {item.sku}
                    </td>

                    {/* Name & Promotion Alert */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 line-clamp-2">
                          {item.productName}
                        </span>
                        {item.hasPromotion && (
                          <div
                            title={
                              item.promotionWarning ||
                              INVENTORY_WARNING_COPY.PROMOTION_ALERT_NOTE
                            }
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold w-fit"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span>Có đợt khuyến mại</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-3 text-center font-bold text-slate-600 text-[11px]">
                      {item.unit}
                    </td>

                    {/* Average Weekly Sales */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-bold text-blue-700">
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                        <span>{formatNumber(item.averageWeeklySales)}</span>
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-3 text-right font-black text-slate-700">
                      {formatNumber(item.stockQuantity)}
                    </td>

                    {/* Suggested Quantity */}
                    <td className="py-3 px-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-xs">
                        +{formatNumber(item.suggestedQuantity)}
                      </span>
                    </td>

                    {/* Rationale */}
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 text-[11px]">
                        {item.calculationRationale}
                      </span>
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
                        <button
                          type="button"
                          onClick={() => onQuickReorder(item)}
                          title="Tạo phiếu nhập hàng theo số lượng gợi ý"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200 transition-colors"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>Nhập</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
