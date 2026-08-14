import React from "react";
import { Lock, Unlock, History, User, Calendar, FileCheck } from "lucide-react";
import type { IPeriodLockAudit } from "../types/ITaxPeriodLock";
import { formatCurrency } from "@/utils/formatCurrency";

interface IPeriodLockAuditTimelineProps {
  history: IPeriodLockAudit[];
  periodLabel: string;
}

export const PeriodLockAuditTimeline: React.FC<
  IPeriodLockAuditTimelineProps
> = ({ history, periodLabel }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 italic text-xs">
        Chưa có lịch sử chốt hoặc mở lại nào được ghi nhận cho {periodLabel}.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
          <History className="w-4 h-4 text-kv-blue-primary" />
          <span>Nhật ký kiểm toán Chốt & Mở lại kỳ ({periodLabel})</span>
        </h3>
        <span className="text-xs text-slate-400">
          Tổng cộng {history.length} lượt thao tác
        </span>
      </div>

      {/* Timeline items */}
      <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {history.map((entry) => (
          <div key={entry.id} className="relative pl-10">
            {/* Timeline Icon */}
            <div
              className={`absolute left-1.5 top-0.5 w-6 h-6 rounded-full flex items-center justify-center -translate-x-1/2 border-2 bg-white ${
                entry.action === "LOCK"
                  ? "border-rose-500 text-rose-600"
                  : "border-amber-500 text-amber-600"
              }`}
            >
              {entry.action === "LOCK" ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </div>

            {/* Content card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      entry.action === "LOCK"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {entry.action === "LOCK" ? "CHỐT KHÓA SỐ LIỆU" : "MỞ LẠI KỲ"}
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {entry.periodLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(entry.performedAt).toLocaleString("vi-VN")}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-600 text-[11px] pt-1">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Thực hiện bởi: <strong>{entry.performedBy}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Doanh thu khóa:{" "}
                    <strong>{formatCurrency(entry.totalRevenueAtAction)}</strong> | Thuế:{" "}
                    <strong className="text-rose-600">
                      {formatCurrency(entry.totalTaxAtAction)}
                    </strong>
                  </span>
                </div>
              </div>

              {entry.reason && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 text-[11px]">
                  <strong className="text-amber-800">Lý do mở lại:</strong> {entry.reason}
                </div>
              )}

              {entry.notes && (
                <div className="text-[11px] text-slate-500 italic">
                  Ghi chú: {entry.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
