import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  EXTRA_PAYMENT_METHOD_OPTIONS,
  type TExtraPaymentMethod,
} from "@/constants/productExchange";
import type { IExchangeEligibilityResponse } from "../types/IProductExchange";

interface ExchangeSummaryPanelProps {
  totalReturnAmount: number;
  totalExchangeAmount: number;
  differenceAmount: number;
  eligibilityData?: IExchangeEligibilityResponse | null;
  isCheckingEligibility: boolean;
  extraPaymentMethod: TExtraPaymentMethod;
  onChangePaymentMethod: (method: TExtraPaymentMethod) => void;
  reason: string;
  onChangeReason: (reason: string) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  onSubmitExchange: () => void;
  onRedirectToReturn: () => void;
  isSubmitting: boolean;
  hasReturnItems: boolean;
  hasExchangeItems: boolean;
}

export const ExchangeSummaryPanel: React.FC<ExchangeSummaryPanelProps> = ({
  totalReturnAmount,
  totalExchangeAmount,
  differenceAmount,
  eligibilityData,
  isCheckingEligibility,
  extraPaymentMethod,
  onChangePaymentMethod,
  reason,
  onChangeReason,
  notes,
  onChangeNotes,
  onSubmitExchange,
  onRedirectToReturn,
  isSubmitting,
  hasReturnItems,
  hasExchangeItems,
}) => {
  // Determine exchange type locally and override with eligibilityData if available
  const isDiffZero = Math.abs(differenceAmount) < 0.01;
  const isDiffPositive = differenceAmount > 0.01;
  const isDiffNegative = differenceAmount < -0.01;

  const canSubmit = hasReturnItems && hasExchangeItems && !isDiffNegative && !isSubmitting;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md p-6 space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              4. Tổng Kết Đổi Hàng
            </h3>
          </div>
        </div>

        {isCheckingEligibility ? (
          <span className="text-xs text-indigo-600 dark:text-indigo-400 animate-pulse font-medium">
            Đang kiểm tra điều kiện đổi...
          </span>
        ) : eligibilityData?.message ? (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-xs text-right">
            {eligibilityData.message}
          </span>
        ) : null}
      </div>

      {/* Figures Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            Tổng Tiền Hàng Trả (A)
          </span>
          <span className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 block">
            {formatCurrency(totalReturnAmount)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
            Tổng Tiền Hàng Đổi (B)
          </span>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1 block">
            {formatCurrency(totalExchangeAmount)}
          </span>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDiffZero
              ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
              : isDiffPositive
              ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700"
              : "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700"
          }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-wider block ${
              isDiffZero
                ? "text-emerald-800 dark:text-emerald-300"
                : isDiffPositive
                ? "text-indigo-800 dark:text-indigo-300"
                : "text-rose-800 dark:text-rose-300"
            }`}
          >
            Chênh Lệch Giá Trị (B - A)
          </span>
          <span
            className={`text-2xl font-black mt-1 block ${
              isDiffZero
                ? "text-emerald-700 dark:text-emerald-300"
                : isDiffPositive
                ? "text-indigo-700 dark:text-indigo-300"
                : "text-rose-700 dark:text-rose-300"
            }`}
          >
            {differenceAmount > 0 ? `+${formatCurrency(differenceAmount)}` : formatCurrency(differenceAmount)}
          </span>
          <span className="text-[11px] opacity-80 mt-1 block font-medium">
            {isDiffZero
              ? "Ngang giá (chênh lệch = 0)"
              : isDiffPositive
              ? "Khách thanh toán thêm"
              : "Giá trị món mới thấp hơn"}
          </span>
        </div>
      </div>

      {/* Case 1: Đổi Ngang Giá (Diff == 0) */}
      {hasReturnItems && hasExchangeItems && isDiffZero && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-600 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
              Đổi Hàng Ngang Giá (Chênh lệch: 0 đ)
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Không phát sinh thêm chi phí hoặc hoàn tiền. Tồn kho được cập nhật tự động.
            </p>
          </div>
        </div>
      )}

      {/* Case 2: Đổi Sang Món Đắt Hơn (Diff > 0) */}
      {hasReturnItems && hasExchangeItems && isDiffPositive && (
        <div className="space-y-4 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-600">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 text-base">
                Đổi Sang Món Giá Cao Hơn (+{formatCurrency(differenceAmount)})
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                Khách thanh toán thêm <strong>{formatCurrency(differenceAmount)}</strong> và hệ thống tạo hóa đơn bổ sung.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">
              Phương thức thanh toán khoản chênh lệch:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {EXTRA_PAYMENT_METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangePaymentMethod(opt.value)}
                  className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                    extraPaymentMethod === opt.value
                      ? "border-blue-500 bg-blue-100/70 dark:bg-blue-900/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700"
                  }`}
                >
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Case 3: Đổi Sang Món Rẻ Hơn (Diff < 0) */}
      {hasReturnItems && hasExchangeItems && isDiffNegative && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 text-base">
                Món Đổi Sang Giá Thấp Hơn ({formatCurrency(differenceAmount)})
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Đổi hàng không áp dụng hoàn tiền thừa. Vui lòng chuyển sang tính năng Trả Hàng để hoàn tiền cho khách.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRedirectToReturn}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Chuyển Sang Trả Hàng</span>
          </button>
        </div>
      )}

      {/* Input: Reason & Internal Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Lý do đổi hàng:
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => onChangeReason(e.target.value)}
            placeholder="Ví dụ: Khách đổi kích cỡ, đổi màu sắc, đổi sang sản phẩm tương đương..."
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Ghi chú nội bộ (nếu có):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Ghi chú thêm cho thu ngân hoặc chủ hộ..."
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2 flex items-center justify-end gap-3">
        {isDiffNegative ? (
          <div className="text-xs text-rose-600 font-medium">
            * Vui lòng chuyển sang Trả Hàng để xử lý hoàn tiền.
          </div>
        ) : (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmitExchange}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition ${
              !canSubmit
                ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                : isDiffZero
                ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg"
                : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg"
            }`}
          >
            {isSubmitting ? (
              <span>Đang xử lý đổi hàng...</span>
            ) : isDiffZero ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận Đổi Hàng Ngang Giá</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Xác Nhận & Xuất HĐ Bổ Sung</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
