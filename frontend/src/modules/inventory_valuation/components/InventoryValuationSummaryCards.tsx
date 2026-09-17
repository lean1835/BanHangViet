import React from "react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import type { IInventoryValuationSummary } from "../types/IInventoryValuation";

interface InventoryValuationSummaryCardsProps {
  summary?: IInventoryValuationSummary;
  onViewMissingCost?: () => void;
}

export const InventoryValuationSummaryCards: React.FC<
  InventoryValuationSummaryCardsProps
> = ({ summary, onViewMissingCost }) => {
  if (!summary) return null;

  const hasMissingCost = summary.missingCostProductsCount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng vốn tồn kho */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Vốn Đọng Trong Kho
        </span>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {formatCurrency(summary.totalInventoryValue)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            <strong>{formatNumber(summary.valuedProductsCount)}</strong> mặt hàng có giá vốn ({formatNumber(summary.totalStockQuantity)} sản phẩm)
          </div>
        </div>
      </div>

      {/* 2. Giá trị bán lẻ dự kiến */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Giá Trị Theo Giá Bán Lẻ
        </span>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {formatCurrency(summary.totalRetailValue)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            Doanh thu kỳ vọng nếu tiêu thụ hết hàng tồn
          </div>
        </div>
      </div>

      {/* 3. Lãi gộp tiềm năng */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Lãi Gộp Tiềm Năng
        </span>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {formatCurrency(summary.potentialGrossProfit)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-medium">
            Tỷ suất lợi nhuận kỳ vọng: <span className="font-bold text-slate-700">{formatNumber(summary.potentialProfitMargin)}%</span>
          </div>
        </div>
      </div>

      {/* 4. Số ngày tồn trung bình & Cảnh báo thiếu giá vốn */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Lưu Kho & Rủi Ro Vốn
        </span>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {formatNumber(summary.averageDaysInStock)}
            </span>
            <span className="text-xs font-semibold text-slate-500">ngày tồn trung bình</span>
          </div>

          {hasMissingCost ? (
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-700">
                {summary.missingCostProductsCount} mặt hàng thiếu giá vốn
              </span>
              {onViewMissingCost && (
                <button
                  type="button"
                  onClick={onViewMissingCost}
                  className="font-bold text-kv-blue-primary hover:underline cursor-pointer text-[11px]"
                >
                  Xem ngay
                </button>
              )}
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-500 font-medium">
              100% mặt hàng đã được xác định giá vốn
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryValuationSummaryCards;
