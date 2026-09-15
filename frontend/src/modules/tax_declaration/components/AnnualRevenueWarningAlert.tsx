import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import type { IAnnualRevenueTrackingResponse } from "../types/IAnnualRevenueTracking";

interface AnnualRevenueWarningAlertProps {
  data?: IAnnualRevenueTrackingResponse;
}

const formatCurrency = (val?: number): string => {
  if (val === undefined || val === null) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(val);
};

export const AnnualRevenueWarningAlert: React.FC<AnnualRevenueWarningAlertProps> = ({
  data,
}) => {
  if (!data) return null;

  const {
    warningStatus,
    shouldShowWarning,
    isMandatoryFromBeginning,
    year,
  } = data;

  // Hộ đã thuộc diện bắt buộc từ đầu năm
  if (isMandatoryFromBeginning || warningStatus === "ALREADY_MANDATORY") {
    return (
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl px-4 py-3 flex items-center gap-3 text-blue-900 shadow-2xs">
        <div className="p-1.5 rounded-lg bg-blue-100/80 text-blue-700 shrink-0">
          <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div className="text-xs font-semibold text-blue-900">
          Hộ kinh doanh thuộc diện áp dụng HĐĐT máy tính tiền từ đầu năm {year}.
        </div>
      </div>
    );
  }

  // Trường hợp vượt ngưỡng bắt buộc 1 tỷ (EXCEEDED)
  if (warningStatus === "EXCEEDED" && shouldShowWarning) {
    return (
      <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">
                Doanh thu năm {year} đã vượt ngưỡng 1 tỷ đồng
              </h4>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase">
                Bắt buộc áp dụng HĐĐT
              </span>
            </div>
            <p className="text-xs font-medium text-rose-800 mt-0.5">
              Doanh thu lũy kế đã vượt 1.000.000.000 đ. Hộ cần phát hành hóa đơn điện tử khởi tạo từ máy tính tiền.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Doanh thu vượt mức cảnh báo do chủ hộ đặt (WARNING_TRIGGERED)
  if (warningStatus === "WARNING_TRIGGERED" && shouldShowWarning) {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <AlertCircle className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                Cảnh báo: Doanh thu năm {year} sắp chạm ngưỡng 1 tỷ đồng
              </h4>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Mức cảnh báo {data.warningThresholdPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs font-medium text-amber-900 mt-0.5">
              Doanh thu lũy kế đã đạt {formatCurrency(data.cumulativeRevenue)} ({data.thresholdPercentage.toFixed(1)}%). Chủ động chuẩn bị nghĩa vụ hóa đơn điện tử.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dưới mức cảnh báo (BELOW_WARNING) - Thanh thông báo tối giản
  return (
    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl px-4 py-3 flex items-center gap-3 text-slate-700 shadow-2xs">
      <div className="p-1.5 rounded-lg bg-emerald-100/80 text-emerald-700 shrink-0">
        <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-extrabold text-emerald-950">
          Doanh thu an toàn:
        </span>
        <span className="text-slate-600 font-medium">
          Doanh thu năm {year} hiện dưới mức cảnh báo so với ngưỡng bắt buộc 1 tỷ đồng.
        </span>
      </div>
    </div>
  );
};
