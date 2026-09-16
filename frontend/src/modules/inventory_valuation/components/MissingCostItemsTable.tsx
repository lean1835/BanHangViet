import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { APP_ROUTES } from "@/constants/routes";
import { INVENTORY_VALUATION_UI } from "@/constants/inventoryValuation";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { IMissingCostProduct } from "../types/IInventoryValuation";

interface MissingCostItemsTableProps {
  items: IMissingCostProduct[];
  onBackToValuation?: () => void;
  pageSize?: number;
}

export const MissingCostItemsTable: React.FC<MissingCostItemsTableProps> = ({
  items,
  onBackToValuation,
  pageSize = 8,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const totalStock = items.reduce(
    (sum, item) => sum + (item.stockQuantity || 0),
    0
  );

  const totalElements = items.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Banner cảnh báo theo TC-02 */}
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs text-amber-900">
              {INVENTORY_VALUATION_UI.MISSING_COST_WARNING_TITLE}
            </h4>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              {INVENTORY_VALUATION_UI.MISSING_COST_WARNING_DESC}
            </p>
            <p className="text-[11px] text-amber-700 font-medium pt-0.5">
              • Để bổ sung giá vốn: Vui lòng lập <strong>Phiếu nhập kho</strong> cho các mặt hàng này theo đúng quy tắc QTN-23.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>Danh Sách Mặt Hàng Thiếu Giá Vốn</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-100 text-amber-800">
                {items.length} mặt hàng
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Tổng số lượng tồn kho chưa định giá: <strong>{formatNumber(totalStock)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBackToValuation && (
              <button
                type="button"
                onClick={onBackToValuation}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại báo cáo</span>
              </button>
            )}
            <Link
              to={APP_ROUTES.PRODUCT_STOCK_ENTRY}
              className="px-3 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <span>Lập phiếu nhập kho</span>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">Mặt hàng & SKU</th>
                <th className="p-3">Nhóm hàng</th>
                <th className="p-3 text-center">Đơn vị tính</th>
                <th className="p-3 text-right">SL Tồn kho</th>
                <th className="p-3 text-right">Giá bán lẻ (đ)</th>
                <th className="p-3">Trạng thái cảnh báo</th>
                <th className="p-3 w-28 text-center">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedItems.map((item, idx) => (
                <tr key={item.productId || idx} className="hover:bg-slate-50">
                  <td className="p-3 text-center text-slate-400 font-bold">
                    {currentPage * pageSize + idx + 1}
                  </td>

                  <td className="p-3">
                    <span className="font-bold text-slate-800 block text-xs">
                      {item.productName}
                    </span>
                    {item.sku && (
                      <span className="text-[11px] text-slate-400">
                        SKU: {item.sku}
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                      {item.groupName || "Chưa phân nhóm"}
                    </span>
                  </td>

                  <td className="p-3 text-center text-slate-600">
                    {item.unit || "Cái"}
                  </td>

                  <td className="p-3 text-right font-bold text-slate-800">
                    {formatNumber(item.stockQuantity)}
                  </td>

                  <td className="p-3 text-right text-slate-600 font-medium">
                    {formatCurrency(item.retailPrice)}
                  </td>

                  <td className="p-3">
                    <span className="text-amber-800 text-[11px] font-medium">
                      {item.warningMessage || "Chưa có giá vốn"}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <Link
                      to={APP_ROUTES.PRODUCT_STOCK_ENTRY}
                      className="px-2.5 py-1 rounded border border-slate-200 bg-white text-kv-blue-primary hover:bg-slate-50 font-bold text-xs transition-all"
                    >
                      Nhập hàng
                    </Link>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-emerald-600 font-bold"
                  >
                    Tất cả các mặt hàng đều đã có giá vốn hợp lệ. Không có cảnh báo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalElements > 0 && (
        <TablePaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          recordUnit="mặt hàng"
        />
      )}
    </div>
  );
};

export default MissingCostItemsTable;
