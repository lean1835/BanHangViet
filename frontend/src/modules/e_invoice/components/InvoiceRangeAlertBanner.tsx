import React from "react";
import { AlertTriangle, AlertOctagon, ArrowRight, Layers } from "lucide-react";
import { useGetActiveInvoiceRangeQuery } from "@/modules/settings/services/invoiceRangeApi";

interface InvoiceRangeAlertBannerProps {
  onNavigateToRangeTab: () => void;
}

export const InvoiceRangeAlertBanner: React.FC<InvoiceRangeAlertBannerProps> = ({
  onNavigateToRangeTab,
}) => {
  const { data: rangeResponse } = useGetActiveInvoiceRangeQuery();
  const range = rangeResponse?.result;

  if (!range) return null;

  const isExhausted = range.status === "EXHAUSTED" || (range.remainingCount !== undefined && range.remainingCount <= 0);
  const isWarningLow =
    range.status === "WARNING_LOW" ||
    (range.remainingCount !== undefined &&
      range.warningThreshold !== undefined &&
      range.remainingCount > 0 &&
      range.remainingCount <= range.warningThreshold);

  if (!isExhausted && !isWarningLow) return null;

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in ${
        isExhausted
          ? "bg-rose-50 border-rose-300 text-rose-800"
          : "bg-amber-50 border-amber-300 text-amber-900"
      }`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isExhausted ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
          }`}
        >
          {isExhausted ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-xs font-extrabold flex items-center gap-2">
            <span>
              {isExhausted
                ? "DẢI SỐ HÓA ĐƠN ĐÃ DÙNG HẾT"
                : "CẢNH BÁO: DẢI SỐ HÓA ĐƠN SẮP HẾT"}
            </span>
            <span className="font-mono px-1.5 py-0.5 rounded bg-white/70 text-[11px] font-bold border border-current">
              {range.invoiceSymbol}
            </span>
          </div>
          <div className="text-xs mt-0.5 leading-relaxed font-medium">
            {isExhausted ? (
              <span>
                Dải số hiện tại đã cạn kiệt. Hệ thống sẽ tạm dừng phát hành hóa đơn mới cho đến khi dải số mới được khai báo.
              </span>
            ) : (
              <span>
                Ký hiệu <strong>{range.invoiceSymbol}</strong> chỉ còn{" "}
                <strong className="font-mono text-sm">{range.remainingCount}</strong> số (ngưỡng cảnh báo{" "}
                {range.warningThreshold}). Tốc độ tiêu thụ trung bình ~{range.dailyConsumptionRate ?? 0} số/ngày.
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNavigateToRangeTab}
        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
          isExhausted
            ? "bg-rose-600 hover:bg-rose-700 text-white"
            : "bg-amber-600 hover:bg-amber-700 text-white"
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>Khai báo dải mới ngay</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
