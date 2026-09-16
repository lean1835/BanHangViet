import React, { useState } from "react";
import { Tooltip } from "antd";
import {
  Banknote,
  QrCode,
  BookOpen,
  Calendar,
  Wallet,
  PieChart,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IPaymentMethodStat, IDailyPaymentTrend } from "../types/IReport";

interface PaymentMethodChartsProps {
  methods: IPaymentMethodStat[];
  dailyTrends: IDailyPaymentTrend[];
  totalRevenue: number;
  isLoading?: boolean;
}

export const PaymentMethodCharts: React.FC<PaymentMethodChartsProps> = ({
  methods,
  dailyTrends,
  totalRevenue,
  isLoading = false,
}) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-64 animate-pulse" />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-64 animate-pulse" />
      </div>
    );
  }

  const getMethodColor = (m: string) => {
    if (m === "CASH") return { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50" };
    if (m === "BANK_TRANSFER") return { bg: "bg-kv-blue-primary", text: "text-kv-blue-primary", light: "bg-kv-blue-light" };
    return { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50" };
  };

  const getMethodIcon = (m: string, className = "w-4 h-4") => {
    if (m === "CASH") return <Banknote className={`${className} text-emerald-600 shrink-0`} />;
    if (m === "BANK_TRANSFER") return <QrCode className={`${className} text-kv-blue-primary shrink-0`} />;
    if (m === "DEBT") return <BookOpen className={`${className} text-amber-600 shrink-0`} />;
    return <CreditCard className={`${className} text-slate-500 shrink-0`} />;
  };

  const sortedTrends = [...dailyTrends].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const maxDayTotal = Math.max(
    ...sortedTrends.map((d) =>
      Math.max(
        d.totalAmount || 0,
        (d.cashAmount || 0) + (d.bankTransferAmount || 0) + (d.debtAmount || 0)
      )
    ),
    100000
  );
  const chartHeight = 150;

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const renderTooltipContent = (t: IDailyPaymentTrend) => {
    const debt = t.debtAmount || 0;
    const total = t.totalAmount || (t.cashAmount + t.bankTransferAmount + debt);
    const cashPct = total > 0 ? ((t.cashAmount / total) * 100).toFixed(1) : "0.0";
    const transferPct = total > 0 ? ((t.bankTransferAmount / total) * 100).toFixed(1) : "0.0";
    const debtPct = total > 0 ? ((debt / total) * 100).toFixed(1) : "0.0";

    const parts = (t.date || "").split("-");
    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : t.date;

    return (
      <div className="p-0.5 space-y-2.5 min-w-[220px] text-xs font-sans">
        {/* Header: Ngày & Tổng doanh số */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Calendar className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" />
            <span>Ngày {displayDate}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Tổng: {formatCurrency(total)}
          </span>
        </div>

        {/* Danh sách hình thức thanh toán */}
        <div className="space-y-2 text-slate-700">
          {/* Tiền mặt */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Tiền mặt:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900">
                {formatCurrency(t.cashAmount)}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
                {cashPct}%
              </span>
            </div>
          </div>

          {/* Chuyển khoản / QR */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-600">
              <QrCode className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" />
              <span>Chuyển khoản:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900">
                {formatCurrency(t.bankTransferAmount)}
              </span>
              <span className="bg-kv-blue-light text-kv-blue-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
                {transferPct}%
              </span>
            </div>
          </div>

          {/* Ghi nợ */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-600">
              <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Ghi nợ:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-amber-700">
                {formatCurrency(debt)}
              </span>
              <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
                {debtPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Tổng thu ngày */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400 text-[11px] font-medium">
            <Wallet className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" />
            <span>Tổng trong ngày:</span>
          </span>
          <span className="font-black text-kv-blue-primary text-sm">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Tỷ trọng cơ cấu thanh toán */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-kv-blue-primary shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Cơ cấu hình thức thanh toán
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tỷ trọng doanh số và số lượng giao dịch theo từng phương thức
          </p>
        </div>

        <div className="my-6 space-y-4">
          {methods.map((m) => {
            const colors = getMethodColor(m.method);
            return (
              <div key={m.method} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    {getMethodIcon(m.method, "w-4 h-4")}
                    {m.methodName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">
                      {m.transactionCount} giao dịch
                    </span>
                    <span className="font-black text-slate-900">
                      {formatCurrency(m.totalAmount)}
                    </span>
                    <span className={`font-bold ${colors.text}`}>
                      ({m.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${colors.bg} transition-all duration-500`}
                    style={{ width: `${Math.min(Math.max(m.percentage, 0), 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Wallet className="w-4 h-4 text-slate-500 shrink-0" />
            Tổng cộng doanh thu
          </span>
          <span className="text-sm font-black text-slate-900">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
      </div>

      {/* 2. Biểu đồ xu hướng thanh toán theo ngày */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-kv-blue-primary shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                Xu hướng thanh toán theo ngày
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân bổ số tiền giữa Tiền mặt, Chuyển khoản và Ghi nợ
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Tiền mặt
            </span>
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <QrCode className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" /> Chuyển khoản
            </span>
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Ghi nợ
            </span>
          </div>
        </div>

        {/* Chart Bars */}
        <div className="relative pt-6 pb-2 min-h-[180px] flex items-end">
          {sortedTrends.length === 0 ? (
            <div className="w-full text-center text-xs text-slate-400 py-10">
              Chưa có dữ liệu theo ngày
            </div>
          ) : (
            <div className="flex items-end gap-2 justify-between w-full overflow-x-auto pb-2">
              {sortedTrends.map((t) => {
                const isHovered = hoveredDate === t.date;
                const cashHeight = (t.cashAmount / maxDayTotal) * chartHeight;
                const transferHeight = (t.bankTransferAmount / maxDayTotal) * chartHeight;
                const debtHeight = ((t.debtAmount || 0) / maxDayTotal) * chartHeight;

                return (
                  <Tooltip
                    key={t.date}
                    title={renderTooltipContent(t)}
                    placement="top"
                    color="#ffffff"
                    arrow={{ pointAtCenter: true }}
                    styles={{
                      body: {
                        backgroundColor: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 10px 25px -5px rgba(0, 104, 255, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
                        color: "#1A1A2E",
                      },
                    }}
                    mouseEnterDelay={0.05}
                  >
                    <div
                      className={`flex flex-col items-center flex-1 min-w-[38px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                        isHovered ? "bg-slate-100/90 shadow-2xs" : "hover:bg-slate-50"
                      }`}
                      onMouseEnter={() => setHoveredDate(t.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      {/* Stacked bar or paired bars */}
                      <div className="flex items-end gap-1 w-full justify-center h-[150px]">
                        <div
                          style={{ height: `${Math.max(cashHeight, t.cashAmount > 0 ? 4 : 0)}px` }}
                          className="w-2 sm:w-2.5 rounded-t-xs bg-emerald-500 opacity-90 transition-all group-hover:opacity-100 group-hover:brightness-110 shadow-2xs"
                        />
                        <div
                          style={{ height: `${Math.max(transferHeight, t.bankTransferAmount > 0 ? 4 : 0)}px` }}
                          className="w-2 sm:w-2.5 rounded-t-xs bg-kv-blue-primary opacity-90 transition-all group-hover:opacity-100 group-hover:brightness-110 shadow-2xs"
                        />
                        <div
                          style={{ height: `${Math.max(debtHeight, (t.debtAmount || 0) > 0 ? 4 : 0)}px` }}
                          className="w-2 sm:w-2.5 rounded-t-xs bg-amber-500 opacity-90 transition-all group-hover:opacity-100 group-hover:brightness-110 shadow-2xs"
                        />
                      </div>

                      <span
                        className={`text-[10px] font-medium mt-2 truncate transition-colors ${
                          isHovered ? "text-kv-blue-primary font-bold" : "text-slate-500"
                        }`}
                      >
                        {formatDateLabel(t.date)}
                      </span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
