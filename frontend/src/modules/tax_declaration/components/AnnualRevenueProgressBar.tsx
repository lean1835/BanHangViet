import React from "react";
import { AlertCircle, CheckCircle2, Flame } from "lucide-react";
import type { IAnnualRevenueTrackingResponse } from "../types/IAnnualRevenueTracking";

interface AnnualRevenueProgressBarProps {
  data?: IAnnualRevenueTrackingResponse;
}

const formatCurrencyCompact = (val: number): string => {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(val % 1_000_000_000 === 0 ? 0 : 2)} tỷ`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)} tr`;
  }
  return new Intl.NumberFormat("vi-VN").format(val);
};

export const AnnualRevenueProgressBar: React.FC<AnnualRevenueProgressBarProps> = ({
  data,
}) => {
  const mandatoryThreshold = data?.mandatoryThreshold ?? 1_000_000_000;
  const warningPercentage = data?.warningThresholdPercentage ?? 80;
  const warningRevenue = data?.warningRevenueAmount ?? mandatoryThreshold * 0.8;
  const thresholdPercentage = data?.thresholdPercentage ?? 0;

  // Thanh hiển thị tối đa 120% để nếu vượt ngưỡng vẫn thấy phần vượt rõ rệt
  const displayPercentage = Math.min(Math.max(thresholdPercentage, 0), 120);
  const visualFillWidth = Math.min((displayPercentage / 100) * 100, 100);

  // Chọn màu thanh tiến độ
  let barGradient = "from-emerald-500 to-teal-500";
  let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  let statusBannerText = `Doanh thu hiện an toàn (< ${warningPercentage.toFixed(0)}%).`;

  if (data?.warningStatus === "EXCEEDED") {
    barGradient = "from-rose-500 to-red-600";
    statusIcon = <Flame className="w-4 h-4 text-rose-600" />;
    statusBannerText = "Doanh thu đã đạt mốc 1 tỷ đồng.";
  } else if (data?.warningStatus === "WARNING_TRIGGERED") {
    barGradient = "from-amber-400 to-orange-500";
    statusIcon = <AlertCircle className="w-4 h-4 text-amber-600" />;
    statusBannerText = `Doanh thu đã chạm mức cảnh báo (${warningPercentage.toFixed(0)}%).`;
  } else if (data?.warningStatus === "ALREADY_MANDATORY") {
    barGradient = "from-blue-500 to-indigo-600";
    statusIcon = <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    statusBannerText = "Hộ kinh doanh thuộc diện áp dụng HĐĐT máy tính tiền.";
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col gap-3.5">
      {/* Header thanh tiến độ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="text-xs font-bold text-slate-800">{statusBannerText}</span>
        </div>
        <div className="text-xs font-extrabold text-slate-600">
          Tiến độ:{" "}
          <span className="text-sm font-black text-blue-700">
            {thresholdPercentage.toFixed(2)}%
          </span>{" "}
          <span className="text-slate-400 font-normal">/ 100% (1 Tỷ)</span>
        </div>
      </div>

      {/* Vùng thanh tiến độ chính */}
      <div className="relative pt-6 pb-1">
        {/* Điểm mốc cảnh báo (Warning Pin) */}
        <div
          className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-10 transition-all duration-300 pointer-events-none"
          style={{ left: `${Math.min(Math.max(warningPercentage, 10), 92)}%` }}
          title={`Mức cảnh báo do chủ hộ đặt: ${warningPercentage}% (${formatCurrencyCompact(
            warningRevenue
          )})`}
        >
          <span className="text-[10px] font-black text-amber-900 bg-amber-100/95 border border-amber-300/90 px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
            Cảnh báo: {warningPercentage.toFixed(0)}%
          </span>
          <div className="w-0.5 h-2 bg-amber-500 mt-0.5" />
        </div>

        {/* Điểm mốc 100% Bắt buộc (1 Tỷ) */}
        <div
          className="absolute top-0 right-0 flex flex-col items-end z-10 pointer-events-none"
          title="Ngưỡng bắt buộc pháp lý: 1.000.000.000 VNĐ"
        >
          <span className="text-[10px] font-black text-rose-900 bg-rose-100/95 border border-rose-300/90 px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
            Mốc 1 Tỷ
          </span>
          <div className="w-0.5 h-2 bg-rose-500 mt-0.5 mr-2" />
        </div>

        {/* Đường track rỗng */}
        <div className="h-3.5 w-full bg-slate-100/90 rounded-full overflow-hidden p-0.5 border border-slate-200/90 shadow-inner relative">
          {/* Thanh fill tiến độ */}
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out shadow-xs`}
            style={{ width: `${Math.min(visualFillWidth, 100)}%` }}
          />
        </div>

        {/* Vạch phụ mốc cảnh báo trên track */}
        <div
          className="absolute bottom-1.5 w-0.5 h-3.5 bg-amber-700/60 pointer-events-none -translate-x-1/2"
          style={{ left: `${warningPercentage}%` }}
        />
      </div>

      {/* Chú giải chân thanh tiến độ: tinh giản, thoáng đãng */}
      <div className="flex flex-wrap items-center justify-between gap-y-1 text-[11px] text-slate-500 font-medium border-t border-slate-100/80 pt-2.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
          <span>0 đ</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-2xs" />
          <span>Cảnh báo: <strong className="text-slate-700">{formatCurrencyCompact(warningRevenue)}</strong> ({warningPercentage.toFixed(0)}%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-2xs" />
          <span>Mốc 1 tỷ: <strong className="text-slate-700">1.000.000.000 đ</strong></span>
        </span>
      </div>
    </div>
  );
};
