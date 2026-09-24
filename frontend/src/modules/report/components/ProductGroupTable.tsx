import React from "react";
import { Layers, ChevronRight, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IProductGroupRevenue } from "../types/IReport";

interface ProductGroupTableProps {
  groups: IProductGroupRevenue[];
  unassignedSummary?: IProductGroupRevenue;
  hasUnassignedProducts?: boolean;
  onSelectGroup: (groupId: string) => void;
  isLoading?: boolean;
}

export const ProductGroupTable: React.FC<ProductGroupTableProps> = ({
  groups,
  unassignedSummary,
  hasUnassignedProducts = false,
  onSelectGroup,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/4" />
        <div className="h-64 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Danh sách nhóm hàng kinh doanh
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhấp vào từng nhóm để xem chi tiết danh sách mặt hàng bên trong
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            {groups.length} nhóm
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Tên nhóm hàng</th>
                <th className="px-4 py-3.5 text-right">SL Bán</th>
                <th className="px-4 py-3.5 text-right">Doanh thu kỳ này</th>
                <th className="px-4 py-3.5 text-right w-44">Tỷ trọng đóng góp</th>
                <th className="px-4 py-3.5 text-right">Doanh thu kỳ trước</th>
                <th className="px-4 py-3.5 text-center">Tăng trưởng</th>
                <th className="px-4 py-3.5 text-center w-16">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">Chưa có dữ liệu nhóm hàng trong khoảng thời gian này</p>
                  </td>
                </tr>
              ) : (
                groups.map((g) => {
                  const growth = g.growthRatePercentage || 0;
                  const isPositiveGrowth = growth >= 0;

                  return (
                    <tr
                      key={g.groupId}
                      onClick={() => onSelectGroup(g.groupId)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-bold text-slate-900 group-hover:text-kv-blue-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-kv-blue-primary" />
                          <span>{g.groupName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                        {g.totalQuantitySold}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900">
                        {formatCurrency(g.revenue)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-kv-blue-primary"
                              style={{ width: `${Math.min(Math.max(g.percentage, 0), 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 w-10 text-right">
                            {g.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500">
                        {formatCurrency(g.previousPeriodRevenue)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPositiveGrowth
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isPositiveGrowth ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>
                            {growth > 0 ? "+" : ""}
                            {growth.toFixed(1)}%
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="w-7 h-7 rounded-lg text-slate-400 group-hover:text-kv-blue-primary group-hover:bg-kv-blue-light/50 flex items-center justify-center mx-auto transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cảnh báo mặt hàng chưa phân nhóm */}
      {hasUnassignedProducts && unassignedSummary && (
        <div
          onClick={() => onSelectGroup("UNASSIGNED")}
          className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:bg-amber-100/60 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Các mặt hàng chưa được phân nhóm ({formatCurrency(unassignedSummary.revenue)})
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chiếm {unassignedSummary.percentage.toFixed(1)}% tổng doanh số. Bấm vào đây để xem danh sách và phân nhóm danh mục.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-800">
            <span>Xem chi tiết</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};
