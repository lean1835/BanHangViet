import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/dateFormatter";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { DAYS_IN_STOCK_LEVELS } from "@/constants/inventoryValuation";
import type { IInventoryValuationItem } from "../types/IInventoryValuation";

interface InventoryValuationItemTableProps {
  items: IInventoryValuationItem[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (field: string) => void;
  pageSize?: number;
}

export const InventoryValuationItemTable: React.FC<
  InventoryValuationItemTableProps
> = ({
  items,
  sortBy = "inventoryValue",
  sortDir = "desc",
  onSortChange,
  pageSize = 8,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Pagination slice
  const totalElements = items.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600" />
    );
  };

  const handleHeaderClick = (field: string) => {
    if (onSortChange) {
      onSortChange(field);
      setCurrentPage(0);
    }
  };

  const getDaysBadge = (days: number) => {
    const isCritical = days >= DAYS_IN_STOCK_LEVELS.CRITICAL;
    return (
      <span
        className={`text-xs font-medium ${
          isCritical ? "text-rose-600 font-bold" : "text-slate-700"
        }`}
      >
        {days} ngày
      </span>
    );
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Danh Sách Chi Tiết Tồn Kho & Giá Vốn
            </h3>
            <p className="text-xs text-slate-400">
              Sắp xếp theo thứ tự giá trị vốn đọng giảm dần theo yêu cầu nghiệp vụ
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {totalElements} mặt hàng
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3 w-10 text-center">#</th>

                {/* Tên mặt hàng */}
                <th
                  onClick={() => handleHeaderClick("productName")}
                  className="p-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Mặt hàng & Mã SKU</span>
                    {renderSortIcon("productName")}
                  </div>
                </th>

                {/* Nhóm hàng */}
                <th className="p-3">Nhóm hàng</th>

                {/* Số lượng tồn */}
                <th
                  onClick={() => handleHeaderClick("stockQuantity")}
                  className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>SL Tồn kho</span>
                    {renderSortIcon("stockQuantity")}
                  </div>
                </th>

                {/* Giá vốn */}
                <th
                  onClick={() => handleHeaderClick("costPrice")}
                  className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Giá vốn (QTN-23)</span>
                    {renderSortIcon("costPrice")}
                  </div>
                </th>

                {/* Giá trị tồn theo vốn */}
                <th
                  onClick={() => handleHeaderClick("inventoryValue")}
                  className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none font-extrabold text-blue-700"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Vốn tồn kho (đ)</span>
                    {renderSortIcon("inventoryValue")}
                  </div>
                </th>

                {/* Giá bán lẻ */}
                <th className="p-3 text-right">Giá bán lẻ (đ)</th>

                {/* Giá trị theo giá bán */}
                <th className="p-3 text-right">Doanh thu dự kiến (đ)</th>

                {/* Ngày nhập gần nhất */}
                <th className="p-3 text-center">Nhập gần nhất</th>

                {/* Số ngày tồn kho */}
                <th
                  onClick={() => handleHeaderClick("daysInStock")}
                  className="p-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Ngày lưu kho</span>
                    {renderSortIcon("daysInStock")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedItems.map((item, idx) => (
                <tr
                  key={item.productId || idx}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  {/* STT */}
                  <td className="p-3 text-center text-slate-400 font-bold">
                    {currentPage * pageSize + idx + 1}
                  </td>

                  {/* Tên & SKU */}
                  <td className="p-3">
                    <span className="font-extrabold text-slate-800 block text-xs">
                      {item.productName}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {item.sku && <span>SKU: {item.sku}</span>}
                      <span>• ĐVT: {item.unit || "Cái"}</span>
                    </div>
                  </td>

                  {/* Nhóm hàng */}
                  <td className="p-3 text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[11px]">
                      {item.groupName || "Chưa phân nhóm"}
                    </span>
                  </td>

                  {/* Số lượng tồn */}
                  <td className="p-3 text-right">
                    {item.stockQuantity < 0 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-extrabold text-rose-600">
                          {formatNumber(item.stockQuantity)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          Âm kho
                        </span>
                      </div>
                    ) : (
                      <span className="font-extrabold text-slate-800">
                        {formatNumber(item.stockQuantity)}
                      </span>
                    )}
                  </td>

                  {/* Giá vốn bình quân */}
                  <td className="p-3 text-right text-slate-600 font-semibold">
                    {formatCurrency(item.costPrice)}
                  </td>

                  {/* Vốn tồn kho */}
                  <td className="p-3 text-right text-xs sm:text-sm">
                    {item.stockQuantity < 0 ? (
                      <div>
                        <span className="font-bold text-slate-400">0 đ</span>
                        <span className="block text-[10px] text-rose-500 font-medium">Tồn âm (0 đ)</span>
                      </div>
                    ) : (
                      <span className="font-black text-blue-700">
                        {formatCurrency(item.inventoryValue)}
                      </span>
                    )}
                  </td>

                  {/* Giá bán lẻ */}
                  <td className="p-3 text-right text-slate-500 font-medium">
                    {formatCurrency(item.retailPrice)}
                  </td>

                  {/* Doanh thu dự kiến */}
                  <td className="p-3 text-right text-indigo-700 font-bold">
                    {item.stockQuantity < 0 ? "0 đ" : formatCurrency(item.retailValue)}
                  </td>

                  {/* Ngày nhập gần nhất */}
                  <td className="p-3 text-center text-slate-500 text-xs">
                    {item.lastImportDate ? formatDateShort(item.lastImportDate) : "—"}
                  </td>

                  {/* Ngày lưu kho */}
                  <td className="p-3 text-center">
                    {getDaysBadge(item.daysInStock || 0)}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="p-12 text-center text-slate-400 font-semibold"
                  >
                    Không có mặt hàng nào phù hợp với điều kiện tìm kiếm.
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

export default InventoryValuationItemTable;
