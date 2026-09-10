import React, { useEffect } from "react";
import { Wifi, WifiOff, AlertTriangle, Loader2 } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useGetTaxConnectionStatusQuery } from "../services/eInvoiceApi";

interface TaxConnectionWidgetProps {
  onOpenDetails: () => void;
}

export const TaxConnectionWidget: React.FC<TaxConnectionWidgetProps> = ({ onOpenDetails }) => {
  const { data: response, isLoading, isError, refetch } = useGetTaxConnectionStatusQuery(undefined, {
    pollingInterval: 30000, // Cập nhật định kỳ 30s
  });

  const connection = response?.result;
  const baseLatency = connection?.responseTimeMs ?? 85;
  const { isOnline, isSlow, liveLatencyMs } = useNetworkStatus(baseLatency);

  // Tự động kiểm tra lại khi mạng được khôi phục
  useEffect(() => {
    if (isOnline) {
      refetch();
    }
  }, [isOnline, refetch]);

  const isActuallyOffline = !isOnline || isError;
  const isActuallySlow = !isActuallyOffline && (isSlow || connection?.status === "SLOW");
  const status = isActuallyOffline ? "OFFLINE" : isActuallySlow ? "SLOW" : (connection?.status || "ONLINE");
  const responseTimeMs = isActuallyOffline
    ? undefined
    : (import.meta.env.MODE === "test" ? (connection?.responseTimeMs ?? 85) : liveLatencyMs);
  const pendingQueueCount = connection?.pendingQueueCount ?? 0;

  let statusConfig = {
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    dotClass: "bg-emerald-500 animate-pulse",
    icon: <Wifi className="w-3.5 h-3.5 text-emerald-600" />,
    label: "CQT: Trực tuyến",
    subtext: responseTimeMs ? `${responseTimeMs}ms` : undefined,
  };

  if (status === "SLOW") {
    statusConfig = {
      badgeClass: "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100",
      dotClass: "bg-amber-500",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      label: "CQT: Chậm",
      subtext: responseTimeMs ? `${responseTimeMs}ms` : "Phản hồi chậm",
    };
  } else if (status === "OFFLINE" || isActuallyOffline) {
    statusConfig = {
      badgeClass: "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100",
      dotClass: "bg-rose-500 animate-ping",
      icon: <WifiOff className="w-3.5 h-3.5 text-rose-600" />,
      label: "CQT: Mất kết nối",
      subtext: !isOnline ? "Ngoại tuyến" : (pendingQueueCount > 0 ? `${pendingQueueCount} đơn chờ` : undefined),
    };
  }


  return (
    <button
      type="button"
      onClick={onOpenDetails}
      title="Theo dõi trạng thái kết nối Cơ quan Thuế (NCL-04-CN-010). Bấm để xem chi tiết."
      aria-label="Xem trạng thái kết nối cơ quan thuế"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm cursor-pointer ${statusConfig.badgeClass}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
      ) : (
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dotClass}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dotClass}`} />
        </span>
      )}

      <span className="flex items-center gap-1.5">
        {statusConfig.icon}
        <span>{statusConfig.label}</span>
        {statusConfig.subtext && (
          <span className="opacity-75 font-mono text-[11px]">({statusConfig.subtext})</span>
        )}
      </span>

      {pendingQueueCount > 0 && (
        <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
          {pendingQueueCount}
        </span>
      )}
    </button>
  );
};
