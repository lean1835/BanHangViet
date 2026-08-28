import React from "react";
import {
  Sparkles,
  Lightbulb,
  Award,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import type { IPeakSalesInsight } from "../types/ISalesAnalytics";
import { SALES_ANALYTICS_COPY } from "@/constants/salesAnalytics";

interface PeakInsightsCardProps {
  insights: IPeakSalesInsight;
  totalOrders: number;
}

export const PeakInsightsCard: React.FC<PeakInsightsCardProps> = ({
  insights,
  totalOrders,
}) => {
  if (totalOrders === 0) {
    return (
      <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/80 flex items-start gap-3.5">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
            Chưa đủ số liệu để sinh khuyến nghị
          </h4>
          <p className="text-xs text-amber-700 font-medium">
            Khoảng thời gian đã chọn chưa ghi nhận đơn hàng hoàn thành. Hãy mở rộng khoảng ngày để nhận phân tích thông minh về khung giờ và khuyến nghị xếp ca.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5 w-full">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              {SALES_ANALYTICS_COPY.PEAK_HOURS.INSIGHTS_TITLE}
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">
              Gợi ý tối ưu vận hành dựa trên phân tích dòng tiền và lưu lượng khách thực tế
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Peak Slots Cards */}
      {insights.topPeakSlots && insights.topPeakSlots.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Top khung giờ vàng phát sinh doanh thu lớn nhất
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.topPeakSlots.map((slot, idx) => (
              <div
                key={idx}
                className="bg-slate-50 hover:bg-blue-50/50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1.5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-kv-blue-primary" />
                    <span>{slot.dayName}</span>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                      idx === 0
                        ? "bg-amber-100 text-amber-700 border border-amber-300"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs font-black text-indigo-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{slot.hourLabel}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 mt-1">
                  <span className="text-slate-500 font-semibold text-[11px]">
                    {formatNumber(slot.orderCount)} đơn
                  </span>
                  <span className="font-black text-emerald-700">
                    {formatCurrency(slot.totalRevenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extreme Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Peak Hour */}
        <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700">
            <Award className="w-3.5 h-3.5" />
            <span>Khung giờ cao điểm</span>
          </div>
          <span className="font-mono text-sm font-black text-slate-800">
            {insights.peakHourLabel || "Chưa có"}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {formatCurrency(insights.peakHourRevenue)} ({insights.peakHourOrderCount} đơn)
          </span>
        </div>

        {/* Lowest Hour */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
            <Clock className="w-3.5 h-3.5" />
            <span>Khung giờ vắng khách</span>
          </div>
          <span className="font-mono text-sm font-black text-slate-800">
            {insights.lowestHourLabel || "Chưa có"}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {formatCurrency(insights.lowestHourRevenue)} ({insights.lowestHourOrderCount} đơn)
          </span>
        </div>

        {/* Busiest Day */}
        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
            <Calendar className="w-3.5 h-3.5" />
            <span>Ngày bán chạy nhất</span>
          </div>
          <span className="text-sm font-black text-slate-800">
            {insights.busiestDayName || "Chưa có"}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {formatCurrency(insights.busiestDayRevenue)} ({insights.busiestDayOrderCount} đơn)
          </span>
        </div>

        {/* Quietest Day */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
            <Calendar className="w-3.5 h-3.5" />
            <span>Ngày vắng khách nhất</span>
          </div>
          <span className="text-sm font-black text-slate-800">
            {insights.quietestDayName || "Chưa có"}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {formatCurrency(insights.quietestDayRevenue)} ({insights.quietestDayOrderCount} đơn)
          </span>
        </div>
      </div>

      {/* Recommendations Box */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 rounded-xl border border-blue-200/70 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-black text-kv-blue-primary uppercase tracking-wide">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Khuyến nghị quản trị & xếp ca làm việc</span>
          </div>
          <div className="flex flex-col gap-2">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
