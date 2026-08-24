import React from "react";
import { Info, ArrowRight, ShieldCheck } from "lucide-react";
import type { IRolloverAdjustment } from "../types/ITaxPeriodLock";
import { formatCurrency } from "@/utils/formatCurrency";

interface IRolloverAdjustmentNoticeProps {
  adjustments: IRolloverAdjustment[];
  currentPeriodLabel: string;
}

export const RolloverAdjustmentNotice: React.FC<
  IRolloverAdjustmentNoticeProps
> = ({ adjustments, currentPeriodLabel }) => {
  if (!adjustments || adjustments.length === 0) return null;

  const totalAdjustmentAmount = adjustments.reduce(
    (sum, a) => sum + Math.abs(a.adjustmentAmount),
    0
  );
  const totalTaxAmount = adjustments.reduce(
    (sum, a) => sum + Math.abs(a.adjustmentTaxAmount),
    0
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-xs text-blue-950">
              Quy tắc QTN-21: Xử lý giao dịch điều chỉnh phát sinh sau khi chốt kỳ
            </h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              <ShieldCheck className="w-3 h-3" />
              Bảo toàn số liệu
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kỳ <strong>{currentPeriodLabel}</strong> đã được chốt sổ. Có{" "}
            <strong>{adjustments.length} khoản điều chỉnh giảm</strong> từ Phiếu trả hàng phát sinh sau ngày chốt với tổng giá trị{" "}
            <strong className="text-rose-600">{formatCurrency(totalAdjustmentAmount)}</strong> (Thuế giảm:{" "}
            <strong className="text-emerald-700">{formatCurrency(totalTaxAmount)}</strong>). Các khoản này được <strong>tự động chuyển tiếp (Rollover)</strong> sang ghi nhận tại kỳ mở kế tiếp:
          </p>
        </div>
      </div>

      {/* Chi tiết từng khoản */}
      <div className="bg-white/80 rounded-lg border border-blue-100 overflow-hidden divide-y divide-blue-50 text-xs">
        {adjustments.map((item) => (
          <div
            key={item.id}
            className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-bold text-slate-800">
                Phiếu trả hàng: {item.returnTicketNumber}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                HĐ gốc: {item.originalInvoiceSeries ? `${item.originalInvoiceSeries}-` : ""}{item.originalInvoiceNumber}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 italic">{item.reason}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-extrabold text-rose-600">
                -{formatCurrency(Math.abs(item.adjustmentAmount))}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                <span>{item.originalPeriod}</span>
                <ArrowRight className="w-3 h-3 text-blue-500" />
                <span>{item.rolloverPeriod}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
