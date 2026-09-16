import React, { useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
} from "lucide-react";
import {
  SYSTEM_LOG_CATEGORY,
  SYSTEM_LOG_CATEGORY_LABELS,
  SYSTEM_LOG_SEVERITY,
  type ISystemAuditLog,
  type TSystemLogSeverity,
} from "../types/platformAdminTypes";
import {
  useGetPlatformSystemLogsQuery,
  useGetActiveIncidentQuery,
  useDismissIncidentMutation,
  useGetAdminHouseholdsQuery,
} from "../services/platformAdminApi";
import { WideIncidentBanner } from "../components/WideIncidentBanner";
import { SystemLogDetailModal } from "../components/SystemLogDetailModal";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";

export const PlatformAdminLogsPage: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [householdFilter, setHouseholdFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<ISystemAuditLog | null>(null);

  const { data: households = [] } = useGetAdminHouseholdsQuery();

  const {
    data: logs = [],
    isLoading,
    refetch,
  } = useGetPlatformSystemLogsQuery({
    severity: severityFilter,
    category: categoryFilter,
    householdId: householdFilter,
    searchQuery,
  });

  // Pagination state (10 records/page)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  React.useEffect(() => {
    setPage(0);
  }, [severityFilter, categoryFilter, householdFilter, searchQuery, logs.length]);

  const paginatedLogs = React.useMemo(() => {
    const start = page * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, page]);

  const { data: incident } = useGetActiveIncidentQuery();
  const [dismissIncident, { isLoading: isDismissing }] =
    useDismissIncidentMutation();

  const getSeverityBadge = (sev: TSystemLogSeverity) => {
    switch (sev) {
      case SYSTEM_LOG_SEVERITY.CRITICAL:
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
            CRITICAL
          </span>
        );
      case SYSTEM_LOG_SEVERITY.ERROR:
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
            ERROR
          </span>
        );
      case SYSTEM_LOG_SEVERITY.WARNING:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
            WARNING
          </span>
        );
      case SYSTEM_LOG_SEVERITY.INFO:
      default:
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
      {/* System-wide Outage Incident Banner (AC-TC-02) */}
      {incident && incident.active && (
        <WideIncidentBanner
          incident={incident}
          onDismiss={() => dismissIncident()}
          isDismissing={isDismissing}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">
            Nhật Ký Vận Hành Toàn Nền Tảng
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Theo dõi lỗi kỹ thuật, phản hồi CQT mô phỏng, hàng đợi hóa đơn và phát hiện sự cố diện rộng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            <span>Làm mới log</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm hành động, mã lỗi, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden font-medium"
            />
          </div>

          {/* Severity Tabs */}
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
            {[
              { key: "ALL", label: "Tất cả" },
              { key: SYSTEM_LOG_SEVERITY.CRITICAL, label: "Khẩn cấp" },
              { key: SYSTEM_LOG_SEVERITY.ERROR, label: "Lỗi" },
              { key: SYSTEM_LOG_SEVERITY.WARNING, label: "Cảnh báo" },
              { key: SYSTEM_LOG_SEVERITY.INFO, label: "Thông tin" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSeverityFilter(tab.key)}
                className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${severityFilter === tab.key
                    ? "bg-white text-kv-blue-primary shadow-xs font-bold"
                    : "hover:text-slate-900"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">Tất cả nhóm sự kiện</option>
            {Object.entries(SYSTEM_LOG_CATEGORY).map(([key, val]) => (
              <option key={key} value={val}>
                {SYSTEM_LOG_CATEGORY_LABELS[val]}
              </option>
            ))}
          </select>

          {/* Household Dropdown */}
          <select
            value={householdFilter}
            onChange={(e) => setHouseholdFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">Tất cả hộ kinh doanh</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Tổng cộng: <strong>{logs.length}</strong> bản ghi
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <th className="p-3">Thời gian</th>
              <th className="p-3 text-center">Mức độ</th>
              <th className="p-3">Nhóm sự kiện</th>
              <th className="p-3">Hộ kinh doanh</th>
              <th className="p-3">Mô tả sự kiện & Mã lỗi</th>
              <th className="p-3">Độ trễ</th>
              <th className="p-3">IP Address</th>
              <th className="p-3 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <span className="inline-block h-5 w-5 rounded-full border-2 border-kv-blue-primary border-t-transparent animate-spin mr-2" />
                  Đang tải nhật ký vận hành kỹ thuật...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Không tìm thấy sự kiện nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/80 transition-colors font-mono"
                >
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-3 text-center">
                    {getSeverityBadge(log.severity)}
                  </td>
                  <td className="p-3 font-sans font-semibold text-slate-800">
                    {SYSTEM_LOG_CATEGORY_LABELS[log.category] || log.category}
                  </td>
                  <td className="p-3 font-sans">
                    {log.householdName ? (
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {log.householdName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.taxCode}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Toàn nền tảng</span>
                    )}
                  </td>
                  <td className="p-3 font-sans max-w-sm">
                    <div className="font-medium text-slate-800 line-clamp-1">
                      {log.action}
                    </div>
                    {log.errorCode && (
                      <span className="inline-block font-mono text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100 mt-0.5">
                        {log.errorCode}
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {log.latencyMs ? (
                      <span
                        className={`font-bold ${log.latencyMs > 3000
                            ? "text-rose-600"
                            : "text-slate-600"
                          }`}
                      >
                        {log.latencyMs} ms
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                  <td className="p-3 text-right font-sans">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-kv-blue-primary rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye size={12} />
                      <span>Xem</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {logs.length > 0 && (
        <TablePaginationFooter
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalElements={logs.length}
          onPageChange={setPage}
          recordUnit="sự kiện"
        />
      )}

      {/* Security note footer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>
            Nhật ký tuân thủ nguyên tắc QTN-25 (Bất biến) và giới hạn quyền VT-04 (Cách ly 100% dữ liệu nghiệp vụ của hộ).
          </span>
        </div>
      </div>

      {/* Detail Modal */}
      <SystemLogDetailModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
};

export default PlatformAdminLogsPage;
