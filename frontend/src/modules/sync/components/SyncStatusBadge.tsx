import React from "react";
import type { TSyncStatus } from "../types/ISync";

interface SyncStatusBadgeProps {
  status?: TSyncStatus | string;
  isOffline?: boolean;
  className?: string;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status = "SYNCED",
  isOffline = false,
  className = "",
}) => {
  if (status === "PENDING" || (isOffline && (!status || status === "PENDING"))) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 ${className}`}
        title="Đơn hàng được tạo ngoại tuyến và đang chờ đồng bộ"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
        <span>Chờ đồng bộ</span>
      </span>
    );
  }

  if (status === "CONFLICT") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200 ${className}`}
        title="Đơn hàng gặp xung đột dữ liệu với máy chủ"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        <span>Xung đột</span>
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-300 ${className}`}
        title="Đồng bộ thất bại"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        <span>Thất bại</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 ${className}`}
      title="Đã đồng bộ thành công với hệ thống máy chủ"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span>Đã đồng bộ</span>
    </span>
  );
};
