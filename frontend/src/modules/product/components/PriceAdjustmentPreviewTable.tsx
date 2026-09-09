import React, { useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Send,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import {
  PRICE_ADJUSTMENT_COPY,
  PRICE_ADJUSTMENT_MESSAGES,
} from "@/constants/priceAdjustment";
import type { IPriceAdjustmentPreviewResponse } from "../types/IPriceAdjustment";

interface PriceAdjustmentPreviewTableProps {
  previewData: IPriceAdjustmentPreviewResponse;
  isApplying: boolean;
  onApply: (name: string) => void;
  onReset: () => void;
}

export const PriceAdjustmentPreviewTable: React.FC<PriceAdjustmentPreviewTableProps> = ({
  previewData,
  isApplying,
  onApply,
  onReset,
}) => {
  const [batchName, setBatchName] = useState<string>(() => {
    const today = new Date().toLocaleDateString("vi-VN");
    return `Đợt điều chỉnh giá ngày ${today}`;
  });
  const [nameError, setNameError] = useState<string | null>(null);

  const handleConfirmApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) {
      setNameError(PRICE_ADJUSTMENT_MESSAGES.NAME_REQUIRED);
      return;
    }
    setNameError(null);
    onApply(batchName.trim());
  };

  const hasBelowCost = previewData.belowCostItems > 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6 animate-auth-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
            Bước 2: Bảng xem trước kết quả thay đổi giá
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Thiết lập lại</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {PRICE_ADJUSTMENT_COPY.KPI_TOTAL}
          </span>
          <span className="text-xl font-black text-slate-800 mt-1">
            {previewData.totalItems}
          </span>
        </div>

        {/* Increased */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> {PRICE_ADJUSTMENT_COPY.KPI_INCREASED}
          </span>
          <span className="text-xl font-black text-emerald-700 mt-1">
            {previewData.increasedItems}
          </span>
        </div>

        {/* Decreased */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> {PRICE_ADJUSTMENT_COPY.KPI_DECREASED}
          </span>
          <span className="text-xl font-black text-amber-700 mt-1">
            {previewData.decreasedItems}
          </span>
        </div>

        {/* Unchanged */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Minus className="w-3.5 h-3.5" /> {PRICE_ADJUSTMENT_COPY.KPI_UNCHANGED}
          </span>
          <span className="text-xl font-black text-slate-600 mt-1">
            {previewData.unchangedItems}
          </span>
        </div>

        {/* Below cost warning */}
        <div
          className={`col-span-2 sm:col-span-1 rounded-xl p-3 flex flex-col border transition-all ${
            hasBelowCost
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <span
            className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              hasBelowCost ? "text-rose-700 font-extrabold" : "text-slate-500"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Bán dưới giá vốn
          </span>
          <span
            className={`text-xl font-black mt-1 ${
              hasBelowCost ? "text-rose-700" : "text-slate-600"
            }`}
          >
            {previewData.belowCostItems}
          </span>
        </div>
      </div>

      {/* Warning banner if any item below cost (TC-02) */}
      {hasBelowCost && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl text-rose-800 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <div className="font-extrabold text-xs md:text-sm">
              {PRICE_ADJUSTMENT_COPY.BELOW_COST_WARNING_TITLE} (Phát hiện{" "}
              {previewData.belowCostItems} mặt hàng)
            </div>
            <div className="text-xs font-medium text-rose-700 leading-relaxed">
              {PRICE_ADJUSTMENT_COPY.BELOW_COST_WARNING_DESC}
            </div>
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr className="text-slate-600 font-bold uppercase text-[11px]">
                <th className="p-3 text-center w-12">STT</th>
                <th className="p-3">Mã SKU</th>
                <th className="p-3 min-w-[180px]">Tên mặt hàng</th>
                <th className="p-3 text-center">ĐVT</th>
                <th className="p-3">Nhóm hàng</th>
                <th className="p-3 text-right">Giá vốn</th>
                <th className="p-3 text-right">Giá cũ</th>
                <th className="p-3 text-right">Giá mới</th>
                <th className="p-3 text-right">Chênh lệch</th>
                <th className="p-3 text-right">% Đổi</th>
                <th className="p-3 text-center">Cảnh báo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {previewData.items.map((item, idx) => {
                const diff = item.priceDifference;
                const isBelow = item.isBelowCost;

                return (
                  <tr
                    key={item.productId || idx}
                    className={`transition-colors ${
                      isBelow
                        ? "bg-rose-50/70 hover:bg-rose-100/70 text-rose-950 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-3 font-mono text-[11px] font-bold text-slate-700">
                      {item.productSku}
                    </td>
                    <td className="p-3 font-bold">
                      <div className="flex flex-col">
                        <span>{item.productName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-slate-500">{item.unit}</td>
                    <td className="p-3 text-slate-500">{item.groupName || "-"}</td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {Number(item.costPrice).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {Number(item.oldPrice).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                      {Number(item.newPrice).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {diff > 0 ? (
                        <span className="text-emerald-600">
                          +{Number(diff).toLocaleString("vi-VN")}đ
                        </span>
                      ) : diff < 0 ? (
                        <span className="text-amber-600">
                          {Number(diff).toLocaleString("vi-VN")}đ
                        </span>
                      ) : (
                        <span className="text-slate-400">0đ</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-[11px] font-bold">
                      {item.percentChange > 0 ? (
                        <span className="text-emerald-600">+{item.percentChange}%</span>
                      ) : item.percentChange < 0 ? (
                        <span className="text-amber-600">{item.percentChange}%</span>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isBelow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase shadow-2xs">
                          <AlertTriangle className="w-3 h-3" /> Bán lỗ
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          An toàn
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Apply Section */}
      <form
        onSubmit={handleConfirmApply}
        className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
      >
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700">
            Đặt tên cho đợt điều chỉnh giá (*):
          </label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => {
              setBatchName(e.target.value);
              setNameError(null);
            }}
            placeholder="VD: Đợt tăng giá nước ngọt theo hãng 2026..."
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 focus:border-kv-blue-primary focus:outline-none shadow-2xs"
          />
          {nameError && (
            <span className="text-[11px] font-bold text-rose-600 mt-0.5">
              ⚠️ {nameError}
            </span>
          )}
          <span className="text-[11px] text-slate-500 italic mt-0.5">
            {PRICE_ADJUSTMENT_COPY.CONFIRM_APPLY_DESC}
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="submit"
            disabled={isApplying}
            className="flex items-center justify-center gap-2 px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang áp dụng giá mới...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{PRICE_ADJUSTMENT_COPY.APPLY_BUTTON}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
