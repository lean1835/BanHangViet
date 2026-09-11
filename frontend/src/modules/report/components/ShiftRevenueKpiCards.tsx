import React from "react";
import {
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IShiftRevenueReportResponse } from "../types/IShiftRevenueReport";

interface ShiftRevenueKpiCardsProps {
  summary: IShiftRevenueReportResponse;
  viewMode?: "shifts" | "employees";
  isLoading?: boolean;
}

export const ShiftRevenueKpiCards: React.FC<ShiftRevenueKpiCardsProps> = ({
  summary,
  viewMode = "shifts",
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs animate-pulse h-28 flex flex-col justify-between"
          >
            <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
            <div className="h-7 bg-slate-200 rounded-md w-3/4"></div>
            <div className="h-3 bg-slate-100 rounded-md w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const isEmployeeView = viewMode === "employees";
  const totalEmployees = summary.employeeSummaries.length;

  // Tính toán chỉ số theo Ca
  const avgRevPerShift =
    summary.totalShifts > 0
      ? Math.round(summary.totalRevenue / summary.totalShifts)
      : 0;

  // Tính toán chỉ số theo Nhân viên
  const avgRevPerEmployee =
    totalEmployees > 0
      ? Math.round(summary.totalRevenue / totalEmployees)
      : 0;

  const avgOrdersPerEmployee =
    totalEmployees > 0
      ? Math.round(summary.totalOrders / totalEmployees)
      : 0;

  const avgReliabilityRate =
    totalEmployees > 0
      ? Math.round(
          summary.employeeSummaries.reduce((acc, e) => acc + e.reliabilityRate, 0) /
            totalEmployees
        )
      : 100;

  const employeesWithOverThreshold = summary.employeeSummaries.filter(
    (e) => e.overThresholdShiftsCount > 0
  ).length;

  const employeesWithDiscrepancy = summary.employeeSummaries.filter(
    (e) => e.discrepancyShiftsCount > 0
  ).length;

  const hasDiscrepancy = summary.totalDiscrepancyAmount !== 0;
  const isDiffPositive = summary.totalDiscrepancyAmount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng doanh thu */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">
            {isEmployeeView ? "Tổng doanh thu nhân viên" : "Tổng doanh thu ca"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="my-1">
          <div className="text-xl font-black text-slate-900">
            {formatCurrency(summary.totalRevenue)}
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>
            Tiền mặt: <strong className="text-slate-700">{formatCurrency(summary.totalCashRevenue)}</strong>
          </span>
          <span>
            CK: <strong className="text-kv-blue-primary">{formatCurrency(summary.totalTransferRevenue)}</strong>
          </span>
        </div>
      </div>

      {/* 2. Số ca / Số nhân viên */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">
            {isEmployeeView ? "Tổng nhân sự bán hàng" : "Tổng ca làm việc"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-kv-blue-primary flex items-center justify-center">
            {isEmployeeView ? <Users className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>
        </div>
        <div className="my-1">
          <div className="text-xl font-black text-slate-900">
            {isEmployeeView ? `${totalEmployees} nhân sự` : `${summary.totalShifts} ca đã đóng`}
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          {isEmployeeView ? (
            <span>
              Tổng ca trực: <strong className="text-slate-700">{summary.totalShifts} ca</strong>
            </span>
          ) : (
            <>
              <span>
                Đơn thành công: <strong className="text-slate-700">{summary.totalOrders}</strong>
              </span>
              <span>
                Hủy: <strong className="text-rose-500">{summary.totalCanceledOrders}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Trung bình / Ca vs Trung bình / Nhân viên */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">
            {isEmployeeView ? "Doanh thu trung bình / NV" : "Doanh thu trung bình / Ca"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            {isEmployeeView ? <Award className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
        </div>
        <div className="my-1">
          <div className="text-xl font-black text-slate-900">
            {formatCurrency(isEmployeeView ? avgRevPerEmployee : avgRevPerShift)}
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium truncate">
          {isEmployeeView ? (
            <span>
              Đơn TB: <strong className="text-slate-700">{avgOrdersPerEmployee} đơn/NV</strong> (Hủy: {summary.totalCanceledOrders})
            </span>
          ) : (
            <span>Hiệu suất trên {totalEmployees} nhân viên trực ca</span>
          )}
        </div>
      </div>

      {/* 4. Đối soát két tiền & Cảnh báo lệch */}
      <div
        className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between ${
          summary.overThresholdCount > 0
            ? "bg-rose-50/50 border-rose-200"
            : hasDiscrepancy
            ? "bg-amber-50/50 border-amber-200"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            {isEmployeeView ? "Đối soát két theo nhân viên" : "Đối soát tiền két"}
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              summary.overThresholdCount > 0
                ? "bg-rose-100 text-rose-600"
                : hasDiscrepancy
                ? "bg-amber-100 text-amber-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {summary.overThresholdCount > 0 || hasDiscrepancy ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
        </div>
        <div className="my-1">
          <div
            className={`text-xl font-black ${
              !hasDiscrepancy
                ? "text-emerald-600"
                : isDiffPositive
                ? "text-amber-600"
                : "text-rose-600"
            }`}
          >
            {!hasDiscrepancy
              ? "Khớp 100%"
              : `${isDiffPositive ? "+" : ""}${formatCurrency(summary.totalDiscrepancyAmount)}`}
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold">
          {isEmployeeView ? (
            <>
              {employeesWithOverThreshold > 0 ? (
                <span className="text-rose-600">
                  {employeesWithOverThreshold} NV vượt ngưỡng
                </span>
              ) : (
                <span className="text-slate-500">
                  Độ tin cậy TB: {avgReliabilityRate}%
                </span>
              )}
              <span className="text-slate-400">
                {employeesWithDiscrepancy} NV có ca lệch
              </span>
            </>
          ) : (
            <>
              {summary.overThresholdCount > 0 ? (
                <span className="text-rose-600">
                  {summary.overThresholdCount} ca vượt ngưỡng
                </span>
              ) : (
                <span className="text-slate-500">
                  Ngưỡng: {formatCurrency(summary.threshold)}
                </span>
              )}
              <span className="text-slate-400">
                {summary.shifts.filter((s) => s.differenceAmount !== 0).length} ca lệch
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
