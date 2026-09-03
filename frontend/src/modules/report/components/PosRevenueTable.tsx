import React, { useState, useMemo } from "react";
import { Star } from "lucide-react";
import type { IPosRevenueItem } from "../types/IPosRevenue";
import { formatCurrency } from "@/utils/formatCurrency";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";

interface PosRevenueTableProps {
  items: IPosRevenueItem[];
  totalRevenue: number;
  totalOrders: number;
  isLoading?: boolean;
}

export const PosRevenueTable: React.FC<PosRevenueTableProps> = ({
  items,
  totalRevenue,
  totalOrders,
  isLoading = false,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 8;

  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            Chi tiết doanh thu theo từng Điểm bán
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {items.length} điểm bán
        </span>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <th className="p-3">Mã điểm</th>
                <th className="p-3">Tên điểm bán</th>
                <th className="p-3">Địa chỉ hoạt động</th>
                <th className="p-3 text-center">Số đơn hàng</th>
                <th className="p-3 text-center">Số HĐĐT</th>
                <th className="p-3 text-right">Doanh thu gộp</th>
                <th className="p-3 text-right">Chiết khấu</th>
                <th className="p-3 text-right">Doanh thu thuần</th>
                <th className="p-3 text-right">Tỷ trọng (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-3"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="p-3"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="p-3"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                    <td className="p-3 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                    <td className="p-3 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                    <td className="p-3 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                    <td className="p-3 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="p-3 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                    <td className="p-3 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                    Chưa có dữ liệu điểm bán nào trong hộ.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const proportion = totalRevenue > 0
                    ? ((item.netRevenue / totalRevenue) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <tr key={item.posId} className="hover:bg-slate-50/50 group transition-all">
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {item.posCode}
                      </td>

                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.posName}</span>
                          {item.isDefault && (
                            <span title="Điểm mặc định">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-slate-500 max-w-xs truncate" title={item.address}>
                        {item.address}
                      </td>

                      <td className="p-3 text-center font-bold text-slate-800">
                        {item.orderCount}
                      </td>

                      <td className="p-3 text-center font-bold text-purple-700">
                        {item.invoiceCount}
                      </td>

                      <td className="p-3 text-right font-semibold text-slate-700">
                        {formatCurrency(item.totalAmount)}
                      </td>

                      <td className="p-3 text-right font-semibold text-slate-500">
                        {formatCurrency(item.discountAmount)}
                      </td>

                      <td className="p-3 text-right font-black text-slate-900">
                        {formatCurrency(item.netRevenue)}
                      </td>

                      <td className="p-3 text-right font-bold text-kv-blue-primary">
                        {proportion}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Footer Total Row */}
            {items.length > 0 && !isLoading && (
              <tfoot>
                <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-xs text-slate-900">
                  <td colSpan={3} className="p-3 font-black uppercase text-slate-800">
                    Tổng cộng toàn hộ
                  </td>
                  <td className="p-3 text-center font-black text-slate-900">
                    {totalOrders}
                  </td>
                  <td className="p-3 text-center font-black text-purple-700">
                    {items.reduce((acc, i) => acc + i.invoiceCount, 0)}
                  </td>
                  <td className="p-3 text-right font-black">
                    {formatCurrency(items.reduce((acc, i) => acc + i.totalAmount, 0))}
                  </td>
                  <td className="p-3 text-right font-black text-slate-500">
                    {formatCurrency(items.reduce((acc, i) => acc + i.discountAmount, 0))}
                  </td>
                  <td className="p-3 text-right font-black text-kv-blue-primary text-sm">
                    {formatCurrency(totalRevenue)}
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">
                    100%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Controls */}
        <TablePaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalElements={items.length}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          recordUnit="điểm bán"
        />
      </div>
    </div>
  );
};
