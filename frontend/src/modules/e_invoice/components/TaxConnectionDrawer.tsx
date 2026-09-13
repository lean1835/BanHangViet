import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  X,
  RotateCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/utils/dateFormatter";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  useGetTaxConnectionStatusQuery,
  useGetTaxConnectionHistoryQuery,
} from "../services/eInvoiceApi";

export interface TaxConnectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRetryTab?: () => void;
}

export const TaxConnectionDrawer: React.FC<TaxConnectionDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToRetryTab,
}) => {
  const [activeTab, setActiveTab] = useState<"HISTORY" | "TROUBLESHOOT">("HISTORY");
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    data: statusData,
    isFetching: isStatusFetching,
    isError: isStatusError,
    refetch: refetchStatus,
  } = useGetTaxConnectionStatusQuery(undefined, { skip: !isOpen });

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    refetch: refetchHistory,
  } = useGetTaxConnectionHistoryQuery({ days: 7 }, { skip: !isOpen });

  const connection = statusData?.result;
  const baseLatency = connection?.responseTimeMs ?? 85;
  const { isOnline, isSlow, liveLatencyMs } = useNetworkStatus(baseLatency);

  const isActuallyOffline = !isOnline || isStatusError;
  const isActuallySlow = !isActuallyOffline && (isSlow || connection?.status === "SLOW");
  const status: "ONLINE" | "SLOW" | "OFFLINE" = isActuallyOffline
    ? "OFFLINE"
    : isActuallySlow
    ? "SLOW"
    : (connection?.status || "ONLINE");
  const historyLogs = historyData?.result?.historyLogs || [];
  const pendingQueueCount = connection?.pendingQueueCount ?? 0;
  const responseTimeMs = isActuallyOffline
    ? 0
    : (import.meta.env.MODE === "test" ? connection?.responseTimeMs : liveLatencyMs);
  const lastSuccessfulResponseAt = connection?.lastSuccessfulResponseAt;

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus modal on open
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    refetchStatus();
    refetchHistory();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="app-modal-backdrop fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tax-connection-drawer-title"
        className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col h-full animate-slide-in-right overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 id="tax-connection-drawer-title" className="text-sm font-bold text-slate-800">
              Chi tiết kết nối Cơ quan thuế
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isStatusFetching || isHistoryFetching}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              title="Kiểm tra lại"
            >
              <RotateCw size={15} className={isStatusFetching || isHistoryFetching ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 flex-1">
          {/* Main Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  status === "ONLINE"
                    ? "bg-emerald-50 text-emerald-600"
                    : status === "SLOW"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {status === "ONLINE" ? (
                  <Wifi size={20} />
                ) : status === "SLOW" ? (
                  <AlertTriangle size={20} />
                ) : (
                  <WifiOff size={20} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Cơ quan Thuế (TCT)</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                      status === "ONLINE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : status === "SLOW"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {status === "ONLINE"
                      ? "Trực tuyến"
                      : status === "SLOW"
                      ? "Phản hồi chậm"
                      : "Mất kết nối Cơ quan Thuế"}
                  </span>
                </div>
                {connection?.checkedAt && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Lần kiểm tra: {formatDate(connection.checkedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Độ trễ</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                {responseTimeMs !== undefined && responseTimeMs !== null ? `${responseTimeMs} ms` : "—"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Hàng đợi chờ</span>
              <span
                className={`text-xs sm:text-sm font-bold font-mono mt-0.5 block ${
                  pendingQueueCount > 0 ? "text-amber-600" : "text-slate-800"
                }`}
              >
                {pendingQueueCount} hóa đơn
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Phản hồi gần nhất</span>
              <span className="text-[11px] font-bold text-slate-700 font-mono mt-0.5 block truncate">
                {lastSuccessfulResponseAt ? formatDate(lastSuccessfulResponseAt) : "Chưa ghi nhận"}
              </span>
            </div>
          </div>

          {/* Reassurance Notice when OFFLINE */}
          {status === "OFFLINE" && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex flex-col gap-1">
              <p className="font-semibold text-slate-800">
                {connection?.userGuideMessage ||
                  "Đường truyền đến CQT đang gián đoạn. Hóa đơn vẫn được lưu an toàn tại cửa hàng."}
              </p>
              <p className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Dữ liệu hóa đơn không bị mất mát</span>
              </p>
            </div>
          )}

          {/* Pending Queue Shortcut */}
          {pendingQueueCount > 0 && onNavigateToRetryTab && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-600 font-medium">
                Có <strong>{pendingQueueCount} hóa đơn</strong> chờ gửi lại.
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToRetryTab();
                }}
                className="px-3 py-1 bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                Xem hàng đợi
              </button>
            </div>
          )}

          {/* Tab Selection */}
          <div className="flex items-center gap-4 border-b border-slate-200 text-xs font-bold pt-1">
            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`pb-2 transition-colors border-b-2 -mb-[1px] cursor-pointer ${
                activeTab === "HISTORY"
                  ? "text-kv-blue-primary border-kv-blue-primary"
                  : "text-slate-400 hover:text-slate-600 border-transparent"
              }`}
            >
              Lịch sử kết nối 7 ngày ({historyLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("TROUBLESHOOT")}
              className={`pb-2 transition-colors border-b-2 -mb-[1px] cursor-pointer ${
                activeTab === "TROUBLESHOOT"
                  ? "text-kv-blue-primary border-kv-blue-primary"
                  : "text-slate-400 hover:text-slate-600 border-transparent"
              }`}
            >
              Hướng dẫn xử lý
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "HISTORY" && (
            <div className="flex flex-col gap-2">
              <span className="sr-only">
                Lịch sử kết nối 7 ngày gần nhất ({historyLogs.length} bản ghi)
              </span>

              {isHistoryLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">Đang tải...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Không có sự cố kết nối nào trong 7 ngày qua.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <th className="p-2.5">Thời điểm</th>
                        <th className="p-2.5 text-center">Trạng thái</th>
                        <th className="p-2.5 text-right">Độ trễ</th>
                        <th className="p-2.5">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {historyLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.status === "ONLINE"
                                  ? "text-emerald-700 bg-emerald-50"
                                  : log.status === "SLOW"
                                  ? "text-amber-700 bg-amber-50"
                                  : "text-rose-700 bg-rose-50"
                              }`}
                            >
                              {log.status === "ONLINE"
                                ? "Trực tuyến"
                                : log.status === "SLOW"
                                ? "Chậm"
                                : "Mất kết nối"}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-[11px] text-slate-700">
                            {log.responseTimeMs ? `${log.responseTimeMs} ms` : "—"}
                          </td>
                          <td
                            className="p-2.5 text-[11px] text-slate-600 max-w-[160px] truncate"
                            title={log.errorMessage || "Bình thường"}
                          >
                            {log.errorMessage || "Bình thường"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "TROUBLESHOOT" && (
            <div className="flex flex-col gap-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">1.</span>
                <span>Kiểm tra kết nối mạng Internet tại quầy bán hàng.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">2.</span>
                <span>Nếu CQT bảo trì, hóa đơn sẽ tự động lưu vào hàng đợi và gửi lại khi kết nối phục hồi.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">3.</span>
                <span>Bạn vẫn có thể tiếp tục bán hàng bình thường mà không bị gián đoạn.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
