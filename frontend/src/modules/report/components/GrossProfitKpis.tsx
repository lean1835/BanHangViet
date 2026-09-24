import React from "react";
import { DollarSign, Archive, TrendingUp, Percent, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IGrossProfitSummary } from "../types/IReport";

interface GrossProfitKpisProps {
  summary?: IGrossProfitSummary;
  isLoading?: boolean;
}

export const GrossProfitKpis: React.FC<GrossProfitKpisProps> = ({
  summary,
  isLoading = false,
}) => {
  const netRevenue = summary?.totalNetRevenue ?? 0;
  const cogs = summary?.totalCogs ?? 0;
  const grossProfit = summary?.totalGrossProfit ?? 0;
  const marginPct = summary?.grossProfitMarginPercentage ?? 0;

  const isProfitPositive = grossProfit >= 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs animate-pulse space-y-3"
          >
            <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-6 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Doanh thu thuần */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Doanh thu thuần
          </span>
          <div className="w-8 h-8 rounded-lg bg-kv-blue-light text-kv-blue-primary flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(netRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Doanh số sau khi trừ trả hàng & giảm giá
          </p>
        </div>
      </div>

      {/* 2. Tiền vốn nhập hàng (COGS) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Tiền vốn nhập hàng
            </span>
            <div className="group relative cursor-pointer" title="Giá vốn hàng bán (COGS) tính theo đơn giá nhập lúc xuất kho">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Archive className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(cogs)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tổng giá vốn các mặt hàng đã bán
          </p>
        </div>
      </div>

      {/* 3. Tiền lời gộp (Lợi nhuận gộp) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Tiền lời gộp
            </span>
            <div className="group relative cursor-pointer" title="Tiền lời gộp = Doanh thu thuần - Tiền vốn nhập hàng">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isProfitPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div
            className={`text-xl font-black tracking-tight ${
              isProfitPositive ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {isProfitPositive ? "+" : ""}
            {formatCurrency(grossProfit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Lợi nhuận trước chi phí vận hành
          </p>
        </div>
      </div>

      {/* 4. Tỷ suất lãi gộp (%) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Tỷ suất lời gộp
            </span>
            <div className="group relative cursor-pointer" title="Tỷ suất lãi gộp = (Tiền lời gộp / Doanh thu thuần) * 100%">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {marginPct.toFixed(1)}%
            </span>
            <span className="text-[11px] text-slate-400">trên doanh thu</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                marginPct >= 20 ? "bg-emerald-500" : marginPct > 0 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(Math.max(marginPct, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
