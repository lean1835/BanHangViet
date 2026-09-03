import React from "react";
import { User, ShieldCheck } from "lucide-react";
import {
  ANOMALY_UI,
  ANOMALY_SEVERITY_STYLES,
  ANOMALY_STATUS_STYLES,
  ANOMALY_ALERT_TYPE_INFO,
} from "@/constants/anomalyAlert";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
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
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[500px]">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 className="font-extrabold text-slate-800 text-sm">
            Danh sách cảnh báo bất thường
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {totalElements} cảnh báo
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
              <th className="p-3 w-32 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.SEVERITY}</th>
              <th className="p-3 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.TYPE}</th>
              <th className="p-3 min-w-[240px]">{ANOMALY_UI.TABLE.COLUMNS.TITLE}</th>
              <th className="p-3 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.ACTOR}</th>
              <th className="p-3 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.TIME}</th>
              <th className="p-3 whitespace-nowrap">{ANOMALY_UI.TABLE.COLUMNS.STATUS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kv-blue-primary"></div>
                    <span className="text-xs font-bold">
                      Đang tải danh sách cảnh báo bất thường...
                    </span>
                  </div>
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
    </div>

      {totalElements > 0 && (
        <TablePaginationFooter
          currentPage={page}
          pageSize={ANOMALY_UI.TABLE.PAGE_SIZE}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={onPageChange}
          recordUnit="cảnh báo"
        />
      )}
    </div>
  );
};
