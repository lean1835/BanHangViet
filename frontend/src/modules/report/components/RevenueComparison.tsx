import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useCompareRevenueQuery } from "../services/reportApi";
import { useReportFilter } from "../context/ReportFilterContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import { z } from "zod";

export const revenueComparisonSchema = z
  .object({
    period1Start: z.string().min(1, "Vui lòng chọn ngày bắt đầu Kỳ gốc."),
    period1End: z.string().min(1, "Vui lòng chọn ngày kết thúc Kỳ gốc."),
    period2Start: z.string().min(1, "Vui lòng chọn ngày bắt đầu Kỳ so sánh."),
    period2End: z.string().min(1, "Vui lòng chọn ngày kết thúc Kỳ so sánh."),
  })
  .refine((data) => data.period1Start <= data.period1End, {
    message: "Kỳ gốc: Ngày bắt đầu không được lớn hơn ngày kết thúc.",
  })
  .refine((data) => data.period2Start <= data.period2End, {
    message: "Kỳ so sánh: Ngày bắt đầu không được lớn hơn ngày kết thúc.",
  })
  .refine(
    (data) =>
      data.period1Start > data.period2End || data.period1End < data.period2Start,
    {
      message: "Kỳ gốc và Kỳ so sánh không được có khoảng thời gian trùng lặp.",
    }
  );

export const RevenueComparison: React.FC = () => {
  const { comparisonFilter } = useReportFilter();
  const { period1Start, period1End, period2Start, period2End } = comparisonFilter;

  // Zod validation
  const validationError = useMemo(() => {
    const parseResult = revenueComparisonSchema.safeParse({
      period1Start,
      period1End,
      period2Start,
      period2End,
    });
    if (!parseResult.success) {
      return parseResult.error.issues[0]?.message || "Khoảng thời gian không hợp lệ.";
    }
    return null;
  }, [period1Start, period1End, period2Start, period2End]);

  const isValid = !validationError;

  const {
    data: comparisonRes,
    isLoading,
    isFetching,
    refetch,
  } = useCompareRevenueQuery(
    { period1Start, period1End, period2Start, period2End },
    {
      skip: !isValid,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  useOnOrderCompleted(refetch);

  const result = comparisonRes?.result;

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split("-").reverse().join("/");
  };

  // Compute visual relative widths
  const maxRevenue = Math.max(result?.period1Revenue || 0, result?.period2Revenue || 0, 1);
  const p1WidthPercent = Math.max(Math.round(((result?.period1Revenue || 0) / maxRevenue) * 100), 2);
  const p2WidthPercent = Math.max(Math.round(((result?.period2Revenue || 0) / maxRevenue) * 100), 2);

  const isGrowth = (result?.differenceAmount || 0) >= 0;

  return (
    <div className="flex flex-col gap-6 w-full animate-auth-fade-in">
      {/* Validation Warning */}
      {validationError && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-kv-blue-primary" />
            <span>So Sánh Doanh Thu Giữa Hai Kỳ</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kỳ 1 (Kỳ gốc): <strong className="text-blue-600 font-bold">{formatDateVN(period1Start)} - {formatDateVN(period1End)}</strong>
            {" vs "}
            Kỳ 2 (Kỳ so sánh): <strong className="text-purple-600 font-bold">{formatDateVN(period2Start)} - {formatDateVN(period2End)}</strong>
          </p>
        </div>
      </div>

      {/* Comparison Results */}
      {isLoading || isFetching ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 text-xs font-semibold">
          <RefreshCw className="w-8 h-8 animate-spin text-kv-blue-primary mb-2" />
          <span>Đang tính toán so sánh dữ liệu hai kỳ...</span>
        </div>
      ) : result && isValid ? (
        <div className="flex flex-col gap-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period 1 Revenue */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] text-blue-600 font-extrabold uppercase tracking-wide block">
                Doanh Thu Kỳ Gốc
              </span>
              <div className="my-2">
                <span className="text-xl font-black text-slate-800">
                  {formatCurrency(result.period1Revenue)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold truncate">
                {formatDateVN(period1Start)} - {formatDateVN(period1End)}
              </span>
            </div>

            {/* Period 2 Revenue */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] text-purple-600 font-extrabold uppercase tracking-wide block">
                Doanh Thu Kỳ So Sánh
              </span>
              <div className="my-2">
                <span className="text-xl font-black text-slate-800">
                  {formatCurrency(result.period2Revenue)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold truncate">
                {formatDateVN(period2Start)} - {formatDateVN(period2End)}
              </span>
            </div>

            {/* Difference Amount */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide block">
                Mức Chênh Lệch (VNĐ)
              </span>
              <div className="my-2 flex items-center gap-1.5">
                <span className={`text-xl font-black ${isGrowth ? "text-emerald-600" : "text-rose-600"}`}>
                  {isGrowth ? "+" : ""}{formatCurrency(result.differenceAmount)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                Kỳ 2 so với Kỳ 1
              </span>
            </div>

            {/* Growth Percentage */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide block">
                Tỷ Lệ Tăng Trưởng
              </span>
              <div className="my-2 flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-black border ${
                    isGrowth
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {isGrowth ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {isGrowth ? "+" : ""}{result.differencePercentage?.toFixed(2)}%
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {isGrowth ? "Tăng trưởng tích cực" : "Doanh thu bị sụt giảm"}
              </span>
            </div>
          </div>

          {/* Visual Comparison Chart / Bar Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            <h4 className="font-extrabold text-slate-800 text-sm border-b pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-kv-blue-primary" />
              <span>Biểu Đồ So Sánh Trực Quan</span>
            </h4>

            <div className="flex flex-col gap-4">
              {/* Bar 1 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-blue-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                    Kỳ Gốc ({formatDateVN(period1Start)} - {formatDateVN(period1End)})
                  </span>
                  <span className="text-slate-800 font-extrabold">
                    {formatCurrency(result.period1Revenue)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden flex items-center p-1">
                  <div
                    style={{ width: `${p1WidthPercent}%` }}
                    className="h-full bg-blue-500 rounded-md transition-all duration-500 flex items-center justify-end px-2"
                  >
                    {p1WidthPercent > 15 && (
                      <span className="text-[10px] text-white font-extrabold">
                        {p1WidthPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bar 2 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                    Kỳ So Sánh ({formatDateVN(period2Start)} - {formatDateVN(period2End)})
                  </span>
                  <span className="text-slate-800 font-extrabold">
                    {formatCurrency(result.period2Revenue)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden flex items-center p-1">
                  <div
                    style={{ width: `${p2WidthPercent}%` }}
                    className="h-full bg-purple-600 rounded-md transition-all duration-500 flex items-center justify-end px-2"
                  >
                    {p2WidthPercent > 15 && (
                      <span className="text-[10px] text-white font-extrabold">
                        {p2WidthPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Insight Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                isGrowth
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                  : "bg-rose-50/60 border-rose-200 text-rose-900"
              }`}
            >
              {isGrowth ? (
                <TrendingUp className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <div className="text-xs font-semibold leading-relaxed">
                <strong className="font-extrabold block">Đánh giá chung:</strong>
                {isGrowth ? (
                  <span>
                    Doanh thu Kỳ so sánh tăng <strong className="text-emerald-700">+{result.differencePercentage?.toFixed(2)}%</strong> so với Kỳ gốc (tăng tương ứng <strong>+{formatCurrency(result.differenceAmount)}</strong>). Hoạt động kinh doanh đang có xu hướng tăng trưởng rất tốt!
                  </span>
                ) : (
                  <span>
                    Doanh thu Kỳ so sánh giảm <strong className="text-rose-700">{result.differencePercentage?.toFixed(2)}%</strong> so với Kỳ gốc (giảm tương ứng <strong>{formatCurrency(result.differenceAmount)}</strong>). Cần rà soát các chương trình bán hàng để thúc đẩy doanh thu!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
