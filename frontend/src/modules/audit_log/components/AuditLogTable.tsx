import React from "react";
import {
  AlertTriangle,
  RotateCw,
  PlusCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ChevronRight as ArrowRightIcon,
} from "lucide-react";
import type { IActivityLog } from "../types/IAuditLog";
import { AUDIT_LOG_UI, AUDIT_ACTION_MAP, AUDIT_TABLE_MAP } from "@/constants/auditLog";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";

interface AuditLogTableProps {
  logs: IActivityLog[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onViewDetail: (log: IActivityLog) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  isLoading,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onViewDetail,
}) => {
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getTargetTableLabel = (table?: string) => {
    if (!table) return "Hệ thống";
    const lower = table.toLowerCase();
    return AUDIT_TABLE_MAP[lower] || AUDIT_TABLE_MAP[table] || table;
  };

  const getActionBadge = (action: string) => {
    const actUpper = (action || "").toUpperCase().trim();
    const actionInfo = AUDIT_ACTION_MAP[actUpper];
    const displayLabel = actionInfo?.label || action.replace(/_/g, " ");

    if (
      actUpper.includes("CANCEL") ||
      actUpper.includes("REJECT") ||
      actUpper.includes("DELETE") ||
      actUpper.includes("HUY")
    ) {
      return {
        label: displayLabel,
        rawCode: action,
        className: "bg-rose-100 text-rose-700 border-rose-200",
        icon: <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (
      actUpper.includes("ISSUE") ||
      actUpper.includes("CREATE") ||
      actUpper.includes("APPROVE") ||
      actUpper.includes("COMPLETE") ||
      actUpper.includes("SUCCESS")
    ) {
      return {
        label: displayLabel,
        rawCode: action,
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (
      actUpper.includes("ADJUST") ||
      actUpper.includes("UPDATE") ||
      actUpper.includes("REOPEN") ||
      actUpper.includes("SET") ||
      actUpper.includes("SUA")
    ) {
      return {
        label: displayLabel,
        rawCode: action,
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: <RotateCw className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    if (
      actUpper.includes("AUDIT") ||
      actUpper.includes("KIEM_KE") ||
      actUpper.includes("SCAN") ||
      actUpper.includes("RESTORE") ||
      actUpper.includes("ADD")
    ) {
      return {
        label: displayLabel,
        rawCode: action,
        className: "bg-sky-100 text-sky-700 border-sky-200",
        icon: <PlusCircle className="w-3 h-3 mr-1 shrink-0" />,
      };
    }
    return {
      label: displayLabel,
      rawCode: action,
      className: "bg-slate-100 text-slate-700 border-slate-200",
      icon: <FileText className="w-3 h-3 mr-1 shrink-0" />,
    };
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            Danh sách sự kiện kiểm toán
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {totalElements.toLocaleString("vi-VN")} bản ghi
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center flex-1 py-20 text-slate-400 gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kv-blue-primary"></div>
          <span className="text-xs font-bold">
            Đang tải nhật ký kiểm toán...
          </span>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col justify-center items-center flex-1 py-20 text-slate-400 gap-2 font-semibold">
          <ShieldCheck className="w-12 h-12 text-slate-300" />
          <p className="font-bold text-sm text-slate-600">{AUDIT_LOG_UI.EMPTY_LOGS}</p>
          <span className="text-xs text-slate-400">
            Thử điều chỉnh lại bộ lọc hoặc thời gian tìm kiếm.
          </span>
        </div>
      ) : (
        <div className="flex flex-col flex-1 justify-between">
          <div className="overflow-x-auto">
            <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                  <th className="p-3 w-[8%] text-center">{AUDIT_LOG_UI.COLUMNS.SEQUENCE}</th>
                  <th className="p-3 w-[19%]">{AUDIT_LOG_UI.COLUMNS.TIMESTAMP}</th>
                  <th className="p-3 w-[25%]">{AUDIT_LOG_UI.COLUMNS.ACTOR}</th>
                  <th className="p-3 w-[23%]">{AUDIT_LOG_UI.COLUMNS.ACTION}</th>
                  <th className="p-3 w-[21%]">{AUDIT_LOG_UI.COLUMNS.TARGET}</th>
                  <th className="p-3 w-[4%] text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
                {logs.map((item) => {
                  const badge = getActionBadge(item.action);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewDetail(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onViewDetail(item);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Xem chi tiết nhật ký kiểm toán #${item.sequenceNumber}`}
                      className="hover:bg-slate-50/50 group transition-all cursor-pointer select-none"
                    >
                      {/* Sequence */}
                      <td className="p-3 text-center whitespace-nowrap align-middle">
                        <span className="font-mono font-bold text-xs bg-slate-100 group-hover:bg-blue-100 text-slate-800 group-hover:text-kv-blue-primary px-2.5 py-1 rounded-md border border-slate-200/80 transition-colors">
                          #{item.sequenceNumber}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="p-3 font-mono font-bold text-slate-600 whitespace-nowrap text-xs align-middle">
                        {formatDateTime(item.createdAt)}
                      </td>

                      {/* Actor User */}
                      <td className="p-3 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-kv-blue-primary font-black text-xs flex items-center justify-center shrink-0 uppercase border border-slate-200 shadow-2xs transition-colors">
                            {(item.fullName || item.username || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800 block leading-tight text-xs truncate">
                              {item.fullName || item.username || "Hệ thống"}
                            </span>
                            {item.username && (
                              <span className="text-[10px] text-slate-400 font-mono font-semibold block truncate">
                                @{item.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="p-3 whitespace-nowrap align-middle">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold border shadow-2xs ${badge.className}`}
                          title={`Mã gốc: ${item.action}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                          <span className="sr-only">{item.action}</span>
                        </span>
                      </td>

                      {/* Target Table & Friendly ID */}
                      <td className="p-3 whitespace-nowrap align-middle">
                        <div className="text-xs text-slate-700 font-bold">
                          <span>{getTargetTableLabel(item.targetTable)}</span>
                          {item.targetId && (
                            <span
                              className="font-mono text-[10px] text-slate-400 block font-normal truncate"
                              title={`Mã đối tượng: ${item.targetId}`}
                            >
                              #{item.targetId.length > 12 ? `${item.targetId.slice(-8)}` : item.targetId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Arrow Indicator on Hover */}
                      <td className="p-3 text-center whitespace-nowrap align-middle">
                        <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-kv-blue-primary group-hover:translate-x-1 transition-all mx-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <TablePaginationFooter
            currentPage={page}
            pageSize={8}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={onPageChange}
            recordUnit="bản ghi"
          />
        </div>
      )}
    </div>
  );
};
