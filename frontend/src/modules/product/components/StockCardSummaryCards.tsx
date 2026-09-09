import React from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { formatNumber } from "@/utils/formatCurrency";
import { STOCK_CARD_MESSAGES } from "@/constants/product";

interface StockCardSummaryCardsProps {
  openingStock: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
  closingStock: number;
  currentStock: number;
  unit: string;
  isDiscrepancy?: boolean;
  warning?: string | null;
}

export const StockCardSummaryCards: React.FC<StockCardSummaryCardsProps> = ({
  openingStock,
  totalQuantityIn,
  totalQuantityOut,
  closingStock,
  currentStock,
  unit,
  isDiscrepancy = false,
  warning,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Cảnh báo sai lệch tồn kho (TC-03) - Thiết kế gọn gàng, tinh tế */}
      {isDiscrepancy && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-900 shadow-2xs text-xs animate-auth-fade-in"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded bg-rose-100 text-rose-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold text-rose-800">
                {STOCK_CARD_MESSAGES.DISCREPANCY_ALERT_TITLE}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-200 text-rose-800">
                Cảnh báo lệch tồn
              </span>
              <span className="text-rose-700 text-[11px] font-medium line-clamp-1 sm:line-clamp-none">
                {warning ||
                  "Số liệu tồn kho lũy kế từ chuỗi chứng từ không khớp với số tồn thực tế hiện tại trong hệ thống."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid 5 Thẻ chỉ số chuẩn định dạng cũ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Tồn đầu kỳ */}
        <div className="flex flex-col justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Tồn đầu kỳ
            </span>
            <CalendarCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(openingStock)}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {unit}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5">
            Trước thời điểm lọc
          </span>
        </div>

        {/* 2. Tổng nhập */}
        <div className="flex flex-col justify-between p-3 rounded-xl border border-emerald-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Tổng nhập
            </span>
            <div className="p-1 rounded bg-emerald-100 text-emerald-600">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
              +{formatNumber(totalQuantityIn)}
            </span>
            <span className="text-sm font-medium text-emerald-600">
              {unit}
            </span>
          </div>
          <span className="text-xs text-emerald-600 mt-0.5">
            Nhập kho, trả hàng, kiểm kê (+)
          </span>
        </div>

        {/* 3. Tổng xuất */}
        <div className="flex flex-col justify-between p-3 rounded-xl border border-rose-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Tổng xuất
            </span>
            <div className="p-1 rounded bg-rose-100 text-rose-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-xl sm:text-2xl font-bold text-rose-600 tracking-tight">
              {totalQuantityOut > 0
                ? `-${formatNumber(totalQuantityOut)}`
                : totalQuantityOut === 0
                ? "0"
                : formatNumber(totalQuantityOut)}
            </span>
            <span className="text-sm font-medium text-rose-600">
              {unit}
            </span>
          </div>
          <span className="text-xs text-rose-600 mt-0.5">
            Bán hàng, trả NCC, kiểm kê (-)
          </span>
        </div>

        {/* 4. Tồn cuối kỳ */}
        <div className="flex flex-col justify-between p-3 rounded-xl border-2 border-blue-400 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-kv-blue-primary mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-kv-blue-primary">
              Tồn cuối kỳ
            </span>
            <div className="p-1 rounded bg-blue-100 text-kv-blue-primary">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-xl sm:text-2xl font-bold text-blue-600 tracking-tight">
              {formatNumber(closingStock)}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {unit}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-0.5">
            = Đầu kỳ + Nhập - Xuất
          </span>
        </div>

        {/* 5. Tồn thực tế DB */}
        <div
          className={`flex flex-col justify-between p-3 rounded-xl border shadow-2xs bg-white ${
            isDiscrepancy ? "border-rose-300" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tồn thực tế DB
            </span>
            {isDiscrepancy ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isDiscrepancy ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {formatNumber(currentStock)}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {unit}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs font-semibold">
            {isDiscrepancy ? (
              <span className="text-rose-600">Lệch so với chuỗi chứng từ</span>
            ) : (
              <span className="text-emerald-600">Khớp dữ liệu chứng từ</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCardSummaryCards;
