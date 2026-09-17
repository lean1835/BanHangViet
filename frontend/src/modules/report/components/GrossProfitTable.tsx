import React, { useState, useMemo } from "react";
import { Search, AlertTriangle, Package, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { IProductGrossProfit } from "../types/IReport";

interface GrossProfitTableProps {
  items: IProductGrossProfit[];
  isLoading?: boolean;
}

export const GrossProfitTable: React.FC<GrossProfitTableProps> = ({
  items,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "NEGATIVE_ONLY">("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Lọc dữ liệu
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        (item.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.productSku || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (filterMode === "NEGATIVE_ONLY") {
        return item.isNegativeMargin || item.grossProfit < 0;
      }
      return true;
    });
  }, [items, searchTerm, filterMode]);

  // Đếm số lượng bán lỗ
  const negativeCount = useMemo(() => {
    return items.filter((item) => item.isNegativeMargin || item.grossProfit < 0).length;
  }, [items]);

  // Phân trang
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Tính tổng cộng của toàn bộ kết quả lọc
  const totalQuantity = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (curr.quantitySold || 0), 0);
  }, [filteredItems]);

  const totalRevenue = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (curr.netRevenue || 0), 0);
  }, [filteredItems]);

  const totalCogs = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (curr.cogs || 0), 0);
  }, [filteredItems]);

  const totalGrossProfit = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (curr.grossProfit || 0), 0);
  }, [filteredItems]);

  const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-9 bg-slate-100 rounded-lg w-1/3" />
        <div className="h-64 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Tìm theo tên hoặc mã SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-kv-blue-primary focus:ring-2 focus:ring-kv-blue-primary/10 transition-all"
          />
        </div>

        {/* Quick Problem Filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setFilterMode("ALL");
              setCurrentPage(0);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterMode === "ALL"
                ? "bg-kv-blue-primary text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tất cả ({items.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode("NEGATIVE_ONLY");
              setCurrentPage(0);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 ${
              filterMode === "NEGATIVE_ONLY"
                ? "bg-rose-600 text-white shadow-2xs"
                : negativeCount > 0
                ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                : "bg-white text-slate-400 border border-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Bán lỗ ({negativeCount})</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider sticky top-0">
            <tr>
              <th className="px-4 py-3.5">Mã SKU</th>
              <th className="px-4 py-3.5">Tên mặt hàng</th>
              <th className="px-4 py-3.5">ĐVT</th>
              <th className="px-4 py-3.5 text-right">SL Bán</th>
              <th className="px-4 py-3.5 text-right">Doanh thu thuần</th>
              <th className="px-4 py-3.5 text-right">Tiền vốn (COGS)</th>
              <th className="px-4 py-3.5 text-right">Tiền lời gộp</th>
              <th className="px-4 py-3.5 text-right">Tỷ suất %</th>
              <th className="px-4 py-3.5 text-center">Đánh giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Không tìm thấy mặt hàng nào phù hợp với bộ lọc</p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isNegative = item.isNegativeMargin || item.grossProfit < 0;

                return (
                  <tr
                    key={item.productId || item.productSku}
                    className={`transition-colors ${
                      isNegative
                        ? "bg-rose-50/40 hover:bg-rose-50/70"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-600">
                      {item.productSku || "---"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[240px] truncate">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.unit || "---"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {item.quantitySold}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.netRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatCurrency(item.cogs)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        isNegative ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {item.grossProfit > 0 ? "+" : ""}
                      {formatCurrency(item.grossProfit)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        isNegative ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {item.grossProfitMarginPercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isNegative ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Bán lỗ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Có lãi</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Total Row */}
          {filteredItems.length > 0 && (
            <tfoot className="bg-slate-100/70 border-t-2 border-slate-200 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="px-4 py-3.5 uppercase tracking-wider text-xs">
                  Tổng cộng ({filteredItems.length} mặt hàng)
                </td>
                <td className="px-4 py-3.5 text-right font-black text-xs">
                  {totalQuantity}
                </td>
                <td className="px-4 py-3.5 text-right font-black text-xs text-kv-blue-primary">
                  {formatCurrency(totalRevenue)}
                </td>
                <td className="px-4 py-3.5 text-right font-black text-xs text-slate-700">
                  {formatCurrency(totalCogs)}
                </td>
                <td
                  className={`px-4 py-3.5 text-right font-black text-xs ${
                    totalGrossProfit >= 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {totalGrossProfit > 0 ? "+" : ""}
                  {formatCurrency(totalGrossProfit)}
                </td>
                <td
                  className={`px-4 py-3.5 text-right font-black text-xs ${
                    overallMargin >= 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {overallMargin.toFixed(1)}%
                </td>
                <td className="px-4 py-3.5" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <TablePaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalElements={filteredItems.length}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
