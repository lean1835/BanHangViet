import React from "react";
import { DollarSign, ShoppingBag, Receipt, Trophy } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IPosRevenueSummary } from "../types/IPosRevenue";

interface PosRevenueKpisProps {
  summary?: IPosRevenueSummary | null;
  isLoading?: boolean;
}

export const PosRevenueKpis: React.FC<PosRevenueKpisProps> = ({
  summary,
  isLoading = false,
}) => {
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const totalInvoices = summary?.totalInvoices ?? 0;
  const topPos = summary?.topPerformingPosName || "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* KPI 1: Tổng doanh thu */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-kv-blue-light text-kv-blue-primary flex items-center justify-center shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Tổng doanh thu thuần
          </span>
          <p className="text-lg font-black text-kv-blue-primary mt-0.5 truncate">
            {isLoading ? "..." : formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* KPI 2: Tổng đơn hàng */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Tổng số đơn hàng
          </span>
          <p className="text-lg font-black text-emerald-600 mt-0.5">
            {isLoading ? "..." : `${totalOrders} đơn`}
          </p>
        </div>
      </div>

      {/* KPI 3: Hóa đơn điện tử */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Hóa đơn điện tử
          </span>
          <p className="text-lg font-black text-purple-600 mt-0.5">
            {isLoading ? "..." : `${totalInvoices} HĐ`}
          </p>
        </div>
      </div>

      {/* KPI 4: Điểm bán dẫn đầu */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Điểm bán dẫn đầu
          </span>
          <p className="text-sm font-bold text-slate-900 mt-0.5 truncate" title={topPos}>
            {isLoading ? "..." : topPos}
          </p>
        </div>
      </div>
    </div>
  );
};
