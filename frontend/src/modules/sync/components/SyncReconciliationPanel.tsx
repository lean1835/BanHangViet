import { useState, useMemo } from "react";
import { CheckCircle2, AlertTriangle, RefreshCw, Calendar, Filter } from "lucide-react";
import {
  useGetSyncSessionsQuery,
  useGetSyncReconciliationSummaryQuery,
} from "../services/syncApi";
import { SyncSessionDetailModal } from "./SyncSessionDetailModal";
import type { TSyncSessionStatus } from "../types/ISync";

interface SyncReconciliationPanelProps {
  currentRole?: string;
  selectedDate?: string;
}

export const SyncReconciliationPanel = ({
  currentRole = "VT-01",
  selectedDate,
}: SyncReconciliationPanelProps) => {
  const getTodayISO = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const defaultDate = selectedDate || getTodayISO();

  const [selectedStatus, setSelectedStatus] = useState<TSyncSessionStatus | "ALL">("ALL");
  const [fromDate, setFromDate] = useState<string>(defaultDate);
  const [toDate, setToDate] = useState<string>(defaultDate);
  const [page, setPage] = useState<number>(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const summaryFilterParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (selectedStatus && selectedStatus !== "ALL") {
      params.status = selectedStatus;
    }
    if (fromDate && fromDate.trim()) {
      params.fromDate = fromDate.trim();
    }
    if (toDate && toDate.trim()) {
      params.toDate = toDate.trim();
    }
    return params;
  }, [selectedStatus, fromDate, toDate]);

  // Queries
  const { data: summaryData, isLoading: isSummaryLoading } =
    useGetSyncReconciliationSummaryQuery(summaryFilterParams, {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });

  const filterParams = useMemo(() => {
    return {
      ...summaryFilterParams,
      page,
      size: 6,
    };
  }, [summaryFilterParams, page]);

  const { data: sessionsData, isLoading: isSessionsLoading, isError: isSessionsError } =
    useGetSyncSessionsQuery(filterParams, {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });

  const summary = summaryData?.result;
  const sessions = sessionsData?.result?.content || [];
  const totalPages = sessionsData?.result?.totalPages || 0;

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
      {/* Header & Controls */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-800">
              Báo cáo đối soát phiên đồng bộ
            </h3>
            {currentRole === "VT-02" && (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Xem cá nhân
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu vết và đối soát số đơn gửi từ thiết bị client so với máy chủ sau từng phiên kết nối lại.
          </p>
        </div>
      </div>

      {/* High level summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-100/40 border-b border-slate-200 shrink-0">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Tổng số phiên đồng bộ
          </span>
          <span className="text-xl font-extrabold text-slate-800">
            {isSummaryLoading ? "--" : summary?.totalSessions ?? 0}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">
              Phiên khớp dữ liệu
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-extrabold text-emerald-700">
            {isSummaryLoading ? "--" : summary?.matchedSessions ?? 0}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-rose-600 tracking-wider">
              Phiên lệch dữ liệu
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-xl font-extrabold text-rose-700">
            {isSummaryLoading ? "--" : summary?.discrepancySessions ?? 0}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-blue-600 block tracking-wider">
            Đơn đã đồng bộ
          </span>
          <span className="text-xl font-extrabold text-blue-700">
            {isSummaryLoading ? "--" : summary?.totalSyncedOrders ?? 0}
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3 px-4 bg-white border-b border-slate-200 flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
          <Filter className="w-3.5 h-3.5" />
          <span>Lọc:</span>
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as any);
            setPage(0);
          }}
          className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
        >
          <option value="ALL">Tất cả trạng thái đối soát</option>
          <option value="MATCHED">Khớp dữ liệu (MATCHED)</option>
          <option value="DISCREPANCY">Lệch dữ liệu (DISCREPANCY)</option>
        </select>

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
            }}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
          />
          <span className="text-xs text-slate-400">đến</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
          />

          {(fromDate !== defaultDate || toDate !== defaultDate || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                const todayStr = getTodayISO();
                setFromDate(todayStr);
                setToDate(todayStr);
                setSelectedStatus("ALL");
                setPage(0);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full overflow-x-auto">
        {isSessionsLoading ? (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-kv-blue-primary" />
            <span className="text-xs font-medium">Đang tải lịch sử phiên đồng bộ...</span>
          </div>
        ) : isSessionsError ? (
          <div className="text-center py-12 text-rose-500 text-xs font-bold flex flex-col items-center gap-2">
            <span>Không thể tải dữ liệu lịch sử đối soát phiên đồng bộ.</span>
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium">
            Chưa có phiên đồng bộ nào phù hợp với điều kiện lọc.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Mã phiên</th>
                <th className="py-2.5 px-4">Người thực hiện</th>
                <th className="py-2.5 px-4">Thời gian đồng bộ</th>
                <th className="py-2.5 px-4 text-center">Gửi / Nhận</th>
                <th className="py-2.5 px-4 text-center">Trùng / Lỗi</th>
                <th className="py-2.5 px-4 text-center">Kết luận đối soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((sess) => {
                const isMatched = sess.status === "MATCHED";
                return (
                  <tr
                    key={sess.id}
                    onClick={() => setSelectedSessionId(sess.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-extrabold text-slate-800">
                      {sess.sessionCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {sess.userFullName || sess.username || "--"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {sess.syncedAt ? new Date(sess.syncedAt).toLocaleString("vi-VN") : "--"}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className="text-slate-500">{sess.totalSent}</span> /{" "}
                      <span className="text-emerald-600">{sess.totalReceived}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      <span className="font-semibold text-blue-600">{sess.totalDuplicated}</span> trùng
                      {sess.totalFailed > 0 && (
                        <span className="ml-1 font-bold text-rose-600">
                          ({sess.totalFailed} lỗi)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isMatched
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isMatched ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Khớp</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Lệch</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị {sessions.length} / {sessionsData?.result?.totalElements || 0} phiên (Trang {page + 1} / {totalPages})
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSessionId && (
        <SyncSessionDetailModal
          isOpen={!!selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          sessionId={selectedSessionId}
        />
      )}
    </div>
  );
};
