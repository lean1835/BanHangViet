import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { useCompareRevenueQuery } from "../services/reportApi";
import { formatCurrency } from "@/utils/formatCurrency";

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

const getPresetPeriods = (preset: "monthVsMonth" | "weekVsWeek") => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  if (preset === "weekVsWeek") {
    // Period 2: last 7 days (today - 6 to today)
    const p2Start = new Date(now);
    p2Start.setDate(now.getDate() - 6);

    // Period 1: 7 days before that (today - 13 to today - 7)
    const p1End = new Date(now);
    p1End.setDate(now.getDate() - 7);
    const p1Start = new Date(now);
    p1Start.setDate(now.getDate() - 13);

    return {
      period1Start: p1Start.toISOString().split("T")[0],
      period1End: p1End.toISOString().split("T")[0],
      period2Start: p2Start.toISOString().split("T")[0],
      period2End: todayStr,
    };
  }

  // monthVsMonth: Last month vs This month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    period1Start: lastMonthStart.toISOString().split("T")[0],
    period1End: lastMonthEnd.toISOString().split("T")[0],
    period2Start: thisMonthStart.toISOString().split("T")[0],
    period2End: todayStr,
  };
};

export const RevenueComparison: React.FC = () => {
  const defaultPeriods = useMemo(() => getPresetPeriods("monthVsMonth"), []);

  const [period1Start, setPeriod1Start] = useState<string>(defaultPeriods.period1Start);
  const [period1End, setPeriod1End] = useState<string>(defaultPeriods.period1End);
  const [period2Start, setPeriod2Start] = useState<string>(defaultPeriods.period2Start);
  const [period2End, setPeriod2End] = useState<string>(defaultPeriods.period2End);
  const [activePreset, setActivePreset] = useState<"monthVsMonth" | "weekVsWeek" | "custom">("monthVsMonth");

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
    { skip: !isValid }
  );

  const result = comparisonRes?.result;

  const handlePresetClick = (preset: "monthVsMonth" | "weekVsWeek") => {
    const p = getPresetPeriods(preset);
    setPeriod1Start(p.period1Start);
    setPeriod1End(p.period1End);
    setPeriod2Start(p.period2Start);
    setPeriod2End(p.period2End);
    setActivePreset(preset);
  };

  const handleReset = () => {
    handlePresetClick("monthVsMonth");
  };

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
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Control Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-kv-blue-primary" />
              <span>So Sánh Doanh Thu Giữa Hai Kỳ</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              So sánh doanh thu thực tế thu được giữa hai khoảng thời gian độc lập.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => handlePresetClick("monthVsMonth")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
                activePreset === "monthVsMonth"
                  ? "bg-kv-blue-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tháng này vs Tháng trước
            </button>
            <button
              onClick={() => handlePresetClick("weekVsWeek")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
                activePreset === "weekVsWeek"
                  ? "bg-kv-blue-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              7 ngày qua vs 7 ngày trước
            </button>
          </div>
        </div>

        {/* Period Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Period 1 */}
          <div className="border border-blue-200 p-4 rounded-xl bg-blue-50/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Kỳ Gốc (Kỳ 1)
              </span>
              <span className="text-[11px] font-bold text-blue-600">
                {formatDateVN(period1Start)} - {formatDateVN(period1End)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold text-slate-600">Từ ngày</label>
                <input
                  type="date"
                  value={period1Start}
                  onChange={(e) => {
                    setPeriod1Start(e.target.value);
                    setActivePreset("custom");
                  }}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary text-xs font-bold text-slate-700 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold text-slate-600">Đến ngày</label>
                <input
                  type="date"
                  value={period1End}
                  onChange={(e) => {
                    setPeriod1End(e.target.value);
                    setActivePreset("custom");
                  }}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary text-xs font-bold text-slate-700 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Period 2 */}
          <div className="border border-purple-200 p-4 rounded-xl bg-purple-50/40 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                Kỳ So Sánh (Kỳ 2)
              </span>
              <span className="text-[11px] font-bold text-purple-600">
                {formatDateVN(period2Start)} - {formatDateVN(period2End)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold text-slate-600">Từ ngày</label>
                <input
                  type="date"
                  value={period2Start}
                  onChange={(e) => {
                    setPeriod2Start(e.target.value);
                    setActivePreset("custom");
                  }}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary text-xs font-bold text-slate-700 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold text-slate-600">Đến ngày</label>
                <input
                  type="date"
                  value={period2End}
                  onChange={(e) => {
                    setPeriod2End(e.target.value);
                    setActivePreset("custom");
                  }}
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary text-xs font-bold text-slate-700 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            Đặt lại
          </button>
          <button
            onClick={() => void refetch()}
            disabled={!isValid || isFetching}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>{isFetching ? "Đang xử lý..." : "Thực hiện so sánh"}</span>
          </button>
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
