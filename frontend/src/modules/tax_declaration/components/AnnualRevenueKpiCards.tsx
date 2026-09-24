import React from "react";
import {
  TrendingUp,
  ShieldCheck,
  Percent,
  CalendarClock,
  FileCheck2,
  Coins,
} from "lucide-react";
import type { IAnnualRevenueTrackingResponse } from "../types/IAnnualRevenueTracking";
import { formatDateOnly } from "@/utils/dateFormatter";

interface AnnualRevenueKpiCardsProps {
  data?: IAnnualRevenueTrackingResponse;
  isLoading?: boolean;
}

const formatCurrency = (val?: number): string => {
  if (val === undefined || val === null) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(val);
};

export const AnnualRevenueKpiCards: React.FC<AnnualRevenueKpiCardsProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-slate-200/80 border border-slate-200"
          />
        ))}
      </div>
    );
  }

  const cumulativeRevenue = data?.cumulativeRevenue ?? 0;
  const mandatoryThreshold = data?.mandatoryThreshold ?? 1_000_000_000;
  const thresholdPercentage = data?.thresholdPercentage ?? 0;
  const remainingRevenue = data?.remainingRevenueToThreshold ?? 0;
  const averageMonthly = data?.averageMonthlyRevenue ?? 0;
  const validInvoiceCount = data?.validInvoiceCount ?? 0;
  const cumulativeTax = data?.cumulativeTaxAmount ?? 0;
  const projectedReachDate = data?.projectedReachDate;
  const warningPercentage = data?.warningThresholdPercentage ?? 80;

  // Trạng thái màu sắc theo ngưỡng
  let statusBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let statusText = "Dưới mức cảnh báo";
  if (data?.warningStatus === "EXCEEDED") {
    statusBadgeColor = "bg-rose-50 text-rose-700 border-rose-200";
    statusText = "Đã vượt ngưỡng 1 tỷ";
  } else if (data?.warningStatus === "WARNING_TRIGGERED") {
    statusBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    statusText = `Sắp chạm ngưỡng (>= ${warningPercentage}%)`;
  } else if (data?.warningStatus === "ALREADY_MANDATORY") {
    statusBadgeColor = "bg-blue-50 text-blue-700 border-blue-200";
    statusText = "Diện bắt buộc từ đầu năm";
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Doanh thu lũy kế thực tế (Hero Metric) */}
      <div className="bg-gradient-to-br from-blue-50/60 via-white to-white rounded-2xl border border-blue-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-blue-900/80 text-[11px] font-black uppercase tracking-wider block">
              Doanh thu lũy kế năm {data?.year}
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {formatCurrency(cumulativeRevenue)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-100/80 text-blue-700 shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-4 pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span className="inline-flex items-center gap-1">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <strong className="text-slate-800">{validInvoiceCount}</strong> HĐ hợp lệ
          </span>
          <span className="inline-flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            Thuế: <strong className="text-slate-800">{formatCurrency(cumulativeTax)}</strong>
          </span>
        </div>
      </div>

      {/* KPI 2: Ngưỡng pháp lý bắt buộc */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Ngưỡng bắt buộc
            </span>
            <div className="text-xl font-black text-slate-900 mt-1 tracking-tight">
              {formatCurrency(mandatoryThreshold)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Mức cảnh báo đã đặt:</span>
          <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
            {warningPercentage.toFixed(1)}% ({formatCurrency(data?.warningRevenueAmount)})
          </span>
        </div>
      </div>

      {/* KPI 3: Tỷ lệ đạt được so với ngưỡng */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Tiến độ so với ngưỡng 1 tỷ
            </span>
            <div className="text-xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
              <span>{thresholdPercentage.toFixed(2)}%</span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusBadgeColor}`}
              >
                {statusText}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Percent className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Còn lại để chạm ngưỡng:</span>
          <span className="font-extrabold text-slate-800">
            {formatCurrency(remainingRevenue)}
          </span>
        </div>
      </div>

      {/* KPI 4: Tốc độ TB & Thời điểm dự kiến */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Tốc độ TB & Dự báo chạm mốc
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {formatCurrency(averageMonthly)}
              <span className="text-xs font-normal text-slate-400">/tháng</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <CalendarClock className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Dự kiến chạm 1 tỷ:</span>
          <span className="font-black text-amber-800">
            {projectedReachDate
              ? formatDateOnly(projectedReachDate)
              : cumulativeRevenue >= mandatoryThreshold
              ? "Đã đạt ngưỡng"
              : "Chưa ước tính được"}
          </span>
        </div>
      </div>
    </div>
  );
};
