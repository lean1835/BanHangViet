import React from "react";
import { Store, Star } from "lucide-react";
import type { IPosRevenueItem } from "../types/IPosRevenue";
import { formatCurrency } from "@/utils/formatCurrency";

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
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-kv-blue-primary flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Chi tiết doanh thu theo từng Điểm bán
            </h3>
            <p className="text-xs text-slate-500">
              Bao gồm tất cả điểm bán thuộc hộ (kể cả điểm chưa phát sinh doanh thu)
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Mã điểm</th>
              <th className="py-3.5 px-4">Tên điểm bán</th>
              <th className="py-3.5 px-4">Địa chỉ hoạt động</th>
              <th className="py-3.5 px-4 text-center">Số đơn hàng</th>
              <th className="py-3.5 px-4 text-center">Số HĐĐT</th>
              <th className="py-3.5 px-4 text-right">Doanh thu gộp</th>
              <th className="py-3.5 px-4 text-right">Chiết khấu</th>
              <th className="py-3.5 px-4 text-right">Doanh thu thuần</th>
              <th className="py-3.5 px-4 text-right">Tỷ trọng (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 px-4 text-center text-slate-400">
                  Chưa có dữ liệu điểm bán nào trong hộ.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const proportion = totalRevenue > 0
                  ? ((item.netRevenue / totalRevenue) * 100).toFixed(1)
                  : "0.0";

                return (
                  <tr key={item.posId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {item.posCode}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{item.posName}</span>
                        {item.isDefault && (
                          <span title="Điểm mặc định">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={item.address}>
                      {item.address}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {item.orderCount}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-purple-700">
                      {item.invoiceCount}
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                      {formatCurrency(item.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-slate-500">
                      {formatCurrency(item.discountAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(item.netRevenue)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-kv-blue-primary">
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
                <td colSpan={3} className="py-3.5 px-4 font-black uppercase text-slate-800">
                  Tổng cộng toàn hộ
                </td>
                <td className="py-3.5 px-4 text-center font-black text-slate-900">
                  {totalOrders}
                </td>
                <td className="py-3.5 px-4 text-center font-black text-purple-700">
                  {items.reduce((acc, i) => acc + i.invoiceCount, 0)}
                </td>
                <td className="py-3.5 px-4 text-right font-black">
                  {formatCurrency(items.reduce((acc, i) => acc + i.totalAmount, 0))}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-slate-500">
                  {formatCurrency(items.reduce((acc, i) => acc + i.discountAmount, 0))}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-kv-blue-primary text-sm">
                  {formatCurrency(totalRevenue)}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-slate-900">
                  100%
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
