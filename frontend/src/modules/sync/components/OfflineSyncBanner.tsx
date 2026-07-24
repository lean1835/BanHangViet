import React from "react";

interface OfflineSyncBannerProps {
  isOnline: boolean;
  pendingCount: number;
  conflictingOrdersCount?: number;
  warnings?: string[];
  isSyncing?: boolean;
  onSync: () => void;
  onOpenConflictModal?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  pendingCount,
  conflictingOrdersCount = 0,
  warnings = [],
  isSyncing = false,
  onSync,
  onOpenConflictModal,
}) => {
  // 1. Chế độ Mất mạng
  if (!isOnline) {
    return (
      <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
          <span className="truncate">
            ⚠️ <strong>Chế độ Mất mạng (Offline):</strong> Mọi đơn hàng mới sẽ được lưu tạm tại thiết bị và đồng bộ sau.
            {pendingCount > 0 && ` (Đang có ${pendingCount} đơn chờ đồng bộ)`}
          </span>
        </div>
        <span className="text-[11px] bg-rose-700/80 px-2.5 py-1 rounded font-bold shrink-0">
          NCL 08 Offline Active
        </span>
      </div>
    );
  }

  // 2. Phát hiện Đơn xung đột
  if (conflictingOrdersCount > 0) {
    return (
      <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base shrink-0">⚡</span>
          <span className="truncate">
            <strong>Cảnh báo xung đột:</strong> Có {conflictingOrdersCount} đơn hàng ngoại tuyến bị trùng mã với dữ liệu máy chủ.
          </span>
        </div>
        <button
          onClick={onOpenConflictModal}
          className="bg-white text-amber-800 font-extrabold px-3 py-1 rounded shadow-sm hover:bg-amber-50 transition-colors text-xs shrink-0"
        >
          Giải quyết xung đột ngay
        </button>
      </div>
    );
  }

  // 3. Có đơn hàng ngoại tuyến chờ đồng bộ
  if (pendingCount > 0) {
    return (
      <div className="bg-kv-blue-primary text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">
            🔄 Phát hiện <strong>{pendingCount} đơn hàng ngoại tuyến</strong> sẵn sàng đồng bộ lên máy chủ.
          </span>
        </div>
        <button
          disabled={isSyncing}
          onClick={onSync}
          className="bg-kv-green hover:bg-emerald-600 text-white font-extrabold px-3.5 py-1 rounded shadow-sm transition-colors text-xs shrink-0 disabled:opacity-50 flex items-center gap-1.5"
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang đồng bộ...
            </>
          ) : (
            "Đồng bộ ngay"
          )}
        </button>
      </div>
    );
  }

  // 4. Cảnh báo nghiệp vụ từ máy chủ (Quá 24h, tồn kho, lỗi API...)
  if (warnings.length > 0) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 text-xs font-medium flex items-start justify-between gap-3 animate-fade-in">
        <div className="flex items-start gap-2">
          <span className="text-sm shrink-0">💡</span>
          <div>
            <strong className="font-bold">Thông báo đồng bộ Ngoại tuyến:</strong>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
