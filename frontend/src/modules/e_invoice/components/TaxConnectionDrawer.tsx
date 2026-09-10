import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  X,
  RotateCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Server,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Info,
} from "lucide-react";
import { formatDate } from "@/utils/dateFormatter";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  useGetTaxConnectionStatusQuery,
  useGetTaxConnectionHistoryQuery,
  useSimulateTaxConnectionMutation,
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

  const { isOnline } = useNetworkStatus();
  const [simulateTaxConnection, { isLoading: isSimulating }] = useSimulateTaxConnectionMutation();

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
  const isActuallyOffline = !isOnline || isStatusError;
  const status = isActuallyOffline ? "OFFLINE" : (connection?.status || "ONLINE");
  const historyLogs = historyData?.result?.historyLogs || [];
  const pendingQueueCount = connection?.pendingQueueCount ?? 0;
  const responseTimeMs = isActuallyOffline ? 0 : connection?.responseTimeMs;
  const lastSuccessfulResponseAt = connection?.lastSuccessfulResponseAt;

  const handleSimulate = async (simStatus: "ONLINE" | "SLOW" | "OFFLINE") => {
    try {
      await simulateTaxConnection({ status: simStatus }).unwrap();
      refetchStatus();
      refetchHistory();
    } catch {
      // Handled silently
    }
  };


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
        className="fixed inset-y-0 right-0 w-full max-w-2xl sm:max-w-3xl bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col h-full animate-slide-in-right overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
              title="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 id="tax-connection-drawer-title" className="text-sm sm:text-base font-extrabold text-slate-800">
              Chi tiết kết nối Cơ quan thuế
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isStatusFetching || isHistoryFetching}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-kv-blue-primary hover:bg-slate-100 transition-all text-xs font-bold flex items-center gap-1.5 border border-slate-200 bg-white shadow-2xs cursor-pointer disabled:opacity-60"
              title="Làm mới trạng thái kết nối"
            >
              <RotateCw size={14} className={isStatusFetching || isHistoryFetching ? "animate-spin" : ""} />
              <span>Kiểm tra lại</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex flex-col gap-4 sm:gap-5 flex-1">
          {/* Offline Mode Alert */}
          {!isOnline && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold animate-pulse">
              <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Thiết bị đang ở <strong>chế độ Ngoại tuyến (Offline)</strong>. Cổng kết nối CQT tự động chuyển sang chế độ gián đoạn an toàn.
              </span>
            </div>
          )}

          {/* Test Simulation Controls (NCL-04-CN-010) */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-600 text-white rounded tracking-wide">
                KIỂM THỬ CN-010
              </span>
              <span className="text-xs font-bold text-indigo-950">Mô phỏng trạng thái kết nối CQT:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                disabled={isSimulating || !isOnline}
                onClick={() => handleSimulate("ONLINE")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer disabled:opacity-50 ${
                  status === "ONLINE" && isOnline
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
                title="Mô phỏng cổng CQT hoạt động bình thường (ONLINE, ~85ms)"
              >
                🟢 Trực tuyến
              </button>
              <button
                type="button"
                disabled={isSimulating || !isOnline}
                onClick={() => handleSimulate("SLOW")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer disabled:opacity-50 ${
                  status === "SLOW" && isOnline
                    ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                    : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                }`}
                title="Mô phỏng đường truyền quá tải, phản hồi chậm (SLOW, ~1200ms)"
              >
                🟡 Chậm (1200ms)
              </button>
              <button
                type="button"
                disabled={isSimulating || !isOnline}
                onClick={() => handleSimulate("OFFLINE")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer disabled:opacity-50 ${
                  status === "OFFLINE"
                    ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                    : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                }`}
                title="Mô phỏng mất kết nối tới cơ quan thuế (OFFLINE)"
              >
                🔴 Mất kết nối
              </button>
            </div>
          </div>

          {/* Identity Profile Card (Tax Authority Identity) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">

            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-black flex items-center justify-center text-base sm:text-lg shrink-0 border mt-0.5 ${
                status === "ONLINE"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : status === "SLOW"
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-rose-50 text-rose-600 border-rose-200"
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

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 break-words leading-snug">
                  Cơ quan Thuế mô phỏng (Tổng cục Thuế)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold whitespace-nowrap inline-block shrink-0 ${
                    status === "ONLINE"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : status === "SLOW"
                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                      : "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"
                  }`}
                >
                  {status === "ONLINE"
                    ? "Trực tuyến"
                    : status === "SLOW"
                    ? "Phản hồi chậm"
                    : "Mất kết nối Cơ quan Thuế"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold pt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Server size={12} className="text-slate-400 shrink-0" />
                  Cổng tiếp nhận TCT-Gateway v2.0
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-slate-400 shrink-0" />
                  Giao thức: HTTPS / API RESTful chuẩn TCT
                </span>
                {connection?.checkedAt && (
                  <span className="flex items-center gap-1 font-mono text-kv-blue-primary bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    <Clock size={12} className="text-kv-blue-primary shrink-0" />
                    Lần kiểm tra: {formatDate(connection.checkedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metric Summary Cards (4 cards matching Image 2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-0.5 sm:gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Trạng thái kết nối
              </span>
              <span
                className={`text-xs sm:text-sm font-extrabold truncate ${
                  status === "ONLINE"
                    ? "text-emerald-600"
                    : status === "SLOW"
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {status === "ONLINE"
                  ? "TRỰC TUYẾN"
                  : status === "SLOW"
                  ? "PHẢN HỒI CHẬM"
                  : "MẤT KẾT NỐI"}
              </span>
            </div>

            <div
              className={`p-2.5 sm:p-3.5 rounded-xl border flex flex-col gap-0.5 sm:gap-1 ${
                pendingQueueCount > 0
                  ? "bg-rose-50/70 border-rose-200/80 text-rose-600"
                  : "bg-slate-50 border-slate-200/80 text-slate-800"
              }`}
            >
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Hàng đợi chờ cấp mã
              </span>
              <span className="text-xs sm:text-sm font-black truncate font-mono">
                {pendingQueueCount} hóa đơn
              </span>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-0.5 sm:gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Độ trễ (Latency)
              </span>
              <span className="text-xs sm:text-sm font-extrabold font-mono text-slate-800 truncate">
                {responseTimeMs !== undefined && responseTimeMs !== null ? `${responseTimeMs} ms` : "—"}
              </span>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-0.5 sm:gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phản hồi gần nhất
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-700 truncate">
                {lastSuccessfulResponseAt ? formatDate(lastSuccessfulResponseAt) : "Chưa ghi nhận"}
              </span>
            </div>
          </div>

          {/* Configuration / Operating Rule Row */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 rounded-lg border border-slate-200/70 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-500">Cấu hình tiến trình tự động gửi lại (Auto Retry):</span>
            <span className="font-bold text-slate-700">
              Quét tự động định kỳ 15 phút &bull; Tối đa 3 lần thử &bull; Hỗ trợ quét thủ công
            </span>
          </div>

          {/* Policy Card (matching the golden/amber card in Image 2) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50/70 to-orange-50/50 border border-amber-200 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                <ShieldCheck size={15} className="text-amber-600" />
                <span>Chính sách An tâm Bán hàng & Bảo vệ Dữ liệu Hóa đơn (NCL-04-CN-010)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider shadow-2xs">
                AN TÂM BÁN HÀNG
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Cơ chế lưu trữ ngoại tuyến</span>
                <span className="text-xs font-bold text-amber-900 mt-0.5 leading-relaxed">
                  {connection?.userGuideMessage ||
                    "Đường truyền đến CQT đang gián đoạn. Hóa đơn vẫn được lưu an toàn tại hệ thống và sẽ tự động gửi lại khi có mạng trở lại."}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Dữ liệu hóa đơn không bị mất mát
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Hành động của hệ thống</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 leading-relaxed">
                  Hệ thống tự động đưa hóa đơn vào hàng đợi xử lý và gửi duyệt cấp mã ngay khi mạng Internet và cổng CQT được khôi phục.
                </span>
                <span className="text-[11px] font-semibold text-blue-700 mt-1 flex items-center gap-1">
                  <Zap size={12} className="text-blue-600" />
                  Tự động đồng bộ không cần thao tác lại
                </span>
              </div>
            </div>
          </div>

          {/* Operational Guidance Bar */}
          <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] sm:text-xs text-slate-600">
            <Info size={14} className="text-kv-blue-primary shrink-0" />
            <span className="truncate">
              <strong>Lưu ý vận hành:</strong> Thu ngân và chủ hộ tiếp tục xuất hóa đơn bán hàng bình thường. Dữ liệu được bảo toàn tuyệt đối.
            </span>
          </div>

          {/* Quick Action Bar when Queue > 0 */}
          {pendingQueueCount > 0 && onNavigateToRetryTab && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl gap-2.5">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-amber-900">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>
                  Đang có <strong>{pendingQueueCount} hóa đơn</strong> nằm trong hàng đợi chờ gửi lại cơ quan thuế.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToRetryTab();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Zap size={13} className="text-amber-300" />
                <span>Xem hàng đợi lỗi & Gửi lại</span>
              </button>
            </div>
          )}

          {/* Detail Tabs Header - Sticky Navigation matching Image 2 */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs pt-3 -mt-2 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 border-b border-slate-200">
            <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("HISTORY")}
                className={`pb-3 text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 relative shrink-0 border-b-2 -mb-[1px] cursor-pointer ${
                  activeTab === "HISTORY"
                    ? "text-kv-blue-primary border-kv-blue-primary font-extrabold"
                    : "text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300"
                }`}
              >
                <span>Nhật ký kết nối 7 ngày</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                    activeTab === "HISTORY"
                      ? "bg-blue-100 text-kv-blue-primary"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {historyLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("TROUBLESHOOT")}
                className={`pb-3 text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 relative shrink-0 border-b-2 -mb-[1px] cursor-pointer ${
                  activeTab === "TROUBLESHOOT"
                    ? "text-kv-blue-primary border-kv-blue-primary font-extrabold"
                    : "text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300"
                }`}
              >
                <span>Hướng dẫn & Khắc phục sự cố</span>
                {status === "OFFLINE" && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                    Cần lưu ý
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          {activeTab === "HISTORY" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Lịch sử kết nối 7 ngày gần nhất ({historyLogs.length} bản ghi)
                </span>
              </div>

              {isHistoryLoading ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse bg-slate-50 rounded-xl">
                  Đang tải nhật ký kết nối...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    Chưa ghi nhận sự cố kết nối trong 7 ngày
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Hệ thống duy trì kết nối ổn định với Cơ quan thuế mô phỏng. Các hóa đơn xuất đều được gửi duyệt kịp thời.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase">
                        <th className="p-3">Thời điểm</th>
                        <th className="p-3 text-center">Trạng thái</th>
                        <th className="p-3 text-right">Độ trễ</th>
                        <th className="p-3 text-center">Hàng đợi</th>
                        <th className="p-3">Chi tiết / Lý do</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {historyLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                log.status === "ONLINE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : log.status === "SLOW"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {log.status === "ONLINE"
                                ? "Trực tuyến"
                                : log.status === "SLOW"
                                ? "Chậm"
                                : "Mất kết nối"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-[11px] text-slate-800 font-bold">
                            {log.responseTimeMs ? `${log.responseTimeMs} ms` : "—"}
                          </td>
                          <td className="p-3 text-center font-mono text-[11px]">
                            {log.pendingQueueCount ?? 0}
                          </td>
                          <td
                            className="p-3 text-[11px] text-slate-600 max-w-[200px] truncate"
                            title={log.errorMessage || "Hoạt động bình thường"}
                          >
                            {log.errorMessage || "Hoạt động bình thường"}
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
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col gap-3 text-xs">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Info size={16} className="text-kv-blue-primary" />
                  Quy trình xử lý khi gián đoạn kết nối thuế
                </h4>

                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-kv-blue-primary font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-800 block font-bold">Kiểm tra kết nối Internet tại quầy:</strong>
                      <span className="text-slate-500 leading-relaxed">
                        Đảm bảo dây mạng LAN hoặc Wi-Fi kết nối ổn định. Nếu mất mạng, hệ thống chuyển sang chế độ bán hàng ngoại tuyến an toàn.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-kv-blue-primary font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-800 block font-bold">Cơ quan thuế bảo trì cổng tiếp nhận:</strong>
                      <span className="text-slate-500 leading-relaxed">
                        Khi cổng TCT bảo trì hoặc phản hồi chậm, các hóa đơn mới lập sẽ tự động được xếp vào hàng đợi chờ duyệt cấp mã.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-kv-blue-primary font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-800 block font-bold">Gửi lại tự động hoặc thủ công:</strong>
                      <span className="text-slate-500 leading-relaxed">
                        Tiến trình nền tự động thử lại theo lịch. Bạn cũng có thể vào tab <strong>"Hàng đợi lỗi & Gửi lại (NCL-04-CN-007)"</strong> để bấm nút <em>"Quét & Gửi lại ngay"</em> bất cứ lúc nào.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {onNavigateToRetryTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToRetryTab();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Zap size={14} className="text-amber-300" />
                  <span>Đi tới Hàng đợi lỗi & Gửi lại (NCL-04-CN-007)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-3 border-t border-slate-100 bg-slate-50/90 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            Chuẩn Thông tư 78/2021/TT-BTC & Nghị định 123/2020/NĐ-CP
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
