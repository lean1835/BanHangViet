import React from "react";
import {
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  ANOMALY_UI,
  ANOMALY_SEVERITY_STYLES,
  ANOMALY_STATUS_STYLES,
  ANOMALY_ALERT_TYPE_INFO,
} from "@/constants/anomalyAlert";
import { formatDate } from "@/utils/dateFormatter";
import type { IAnomalyAlert } from "../types/IAnomalyAlert";

interface AnomalyAlertTableProps {
  alerts: IAnomalyAlert[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onViewDetail: (alert: IAnomalyAlert) => void;
}

export const AnomalyAlertTable: React.FC<AnomalyAlertTableProps> = ({
  alerts,
  isLoading,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onViewDetail,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-32 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.SEVERITY}</th>
              <th className="py-3 px-3 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.TYPE}</th>
              <th className="py-3 px-4 min-w-[240px]">{ANOMALY_UI.TABLE.COLUMNS.TITLE}</th>
              <th className="py-3 px-3 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.ACTOR}</th>
              <th className="py-3 px-3 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.TIME}</th>
              <th className="py-3 px-3 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.STATUS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">
                  Đang tải danh sách cảnh báo bất thường...
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="font-bold text-xs">{ANOMALY_UI.TABLE.EMPTY}</p>
                </td>
              </tr>
            ) : (
              alerts.map((a) => {
                const severityStyle = ANOMALY_SEVERITY_STYLES[a.severity] || {
                  bg: "bg-slate-100 text-slate-700 border-slate-200",
                  badgeBg: "bg-slate-600 text-white",
                  label: a.severity,
                };
                const statusStyle = ANOMALY_STATUS_STYLES[a.status] || {
                  bg: "bg-slate-100 text-slate-700 border-slate-200",
                  label: a.status,
                };
                const typeInfo = ANOMALY_ALERT_TYPE_INFO[a.alertType] || {
                  label: a.alertType,
                };

                return (
                  <tr
                    key={a.id}
                    onClick={() => onViewDetail(a)}
                    className="hover:bg-blue-50/70 active:bg-blue-100/60 transition-colors font-semibold cursor-pointer select-none group"
                    title="Nhấn để xem chi tiết & đánh giá cảnh báo"
                  >
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap inline-flex items-center justify-center leading-none ${severityStyle.bg}`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-800 group-hover:text-kv-blue-primary transition-colors">
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="space-y-0.5">
                        <span
                          className="font-bold text-slate-900 block truncate group-hover:text-kv-blue-primary transition-colors"
                          title={a.title}
                        >
                          {a.title}
                        </span>
                        <span
                          className="text-[11px] text-slate-500 font-medium block truncate"
                          title={a.description}
                        >
                          {a.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">
                            {a.actorUsername || "Hệ thống"}
                          </span>
                          {a.actorFullName && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {a.actorFullName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                      {formatDate(a.detectedAt || a.createdAt)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center justify-center leading-none ${statusStyle.bg}`}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalElements > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/70 text-xs gap-2">
          <div className="text-slate-500 font-semibold">
            Hiển thị <strong className="text-slate-800">{page * (ANOMALY_UI.TABLE.PAGE_SIZE || 9) + 1}</strong> -{" "}
            <strong className="text-slate-800">
              {Math.min((page + 1) * (ANOMALY_UI.TABLE.PAGE_SIZE || 9), totalElements)}
            </strong>{" "}
            trên tổng số <strong className="text-slate-800">{totalElements}</strong> cảnh báo (9 bản ghi/trang)
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 0}
                aria-label="Trang trước"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      page === i
                        ? "bg-kv-blue-primary text-white border border-kv-blue-primary shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Trang sau"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer shadow-2xs transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
