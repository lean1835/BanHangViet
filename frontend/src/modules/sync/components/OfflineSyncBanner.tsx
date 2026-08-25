import React, { useEffect, useState } from "react";
import { BulkIssueInvoiceModal } from "./BulkIssueInvoiceModal";
import { BulkIssueResultModal } from "./BulkIssueResultModal";
import type { IBulkIssueInvoiceResult } from "@/modules/e_invoice/types/IInvoice";

import { checkOfflineLimitStatus } from "../utils/offlineSyncStorage";

interface OfflineSyncBannerProps {
  isOnline: boolean;
  pendingCount: number;
  conflictingOrdersCount?: number;
  warnings?: string[];
  isSyncing?: boolean;
  unissuedOrderIds?: string[];
  userRole?: string; // VT-01, VT-02, VT-03
  onSync: () => void;
  onClearUnissuedOrders?: () => void;
  onOpenConflictModal?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  pendingCount,
  conflictingOrdersCount = 0,
  warnings = [],
  isSyncing = false,
  unissuedOrderIds = [],
  userRole = "VT-02",
  onSync,
  onClearUnissuedOrders,
  onOpenConflictModal,
}) => {
  const [visibleWarnings, setVisibleWarnings] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<IBulkIssueInvoiceResult | null>(null);

  const canBulkIssue = userRole === "VT-01" || userRole === "VT-02"; // VT-03 Kế toán bị chặn theo AC-03

  useEffect(() => {
    if (warnings && warnings.length > 0) {
      setVisibleWarnings(warnings);
      const timer = setTimeout(() => {
        setVisibleWarnings([]);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisibleWarnings([]);
    }
  }, [warnings]);

  const renderBannerContent = () => {
    // 1. Chế độ Mất mạng
    if (!isOnline) {
      const limitStatus = checkOfflineLimitStatus();

      if (limitStatus.isExceeded) {
        return (
          <div className="bg-rose-700 text-white px-4 py-2.5 text-xs font-bold shadow-md flex items-center justify-between gap-4 animate-fade-in border-b-2 border-rose-900">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="truncate">
                <strong>ĐÃ VƯỢT GIỚI HẠN BÁN KHI MẤT MẠNG:</strong>{" "}
                {limitStatus.errorMessage || `Đã vượt quá số đơn hoặc số giờ cho phép bán offline (${limitStatus.maxOrders} đơn / ${limitStatus.maxHours}h).`}
              </span>
            </div>
          </div>
        );
      }

      if (limitStatus.isOrderNearLimit || limitStatus.isTimeNearLimit) {
        return (
          <div className="bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
              <span className="truncate">
                <strong>CẢNH BÁO SẮP CHẠM NGƯỠNG BÁN OFFLINE:</strong>{" "}
                {limitStatus.warningMessage || `Đã bán ${pendingCount}/${limitStatus.maxOrders} đơn khi mất mạng.`}
              </span>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
            <span className="truncate flex items-center gap-2 flex-wrap">
              <span>
                <strong>Chế độ Ngoại tuyến (Offline):</strong> Mọi đơn hàng mới sẽ được lưu tạm tại thiết bị.
              </span>
              {limitStatus.maxOrders > 0 && (
                <span className="font-extrabold px-2.5 py-0.5 bg-white/20 text-yellow-200 rounded-full border border-white/30 text-[11px]">
                  Đã lưu: {pendingCount}/{limitStatus.maxOrders} đơn
                </span>
              )}
            </span>
          </div>
        </div>
      );
    }

    // 2. Phát hiện Đơn xung đột
    if (conflictingOrdersCount > 0) {
      return (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
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
              Phát hiện <strong>{pendingCount} đơn hàng ngoại tuyến</strong> sẵn sàng đồng bộ lên máy chủ.
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

    // 4. Phát hành dồn hóa đơn sau khi phiên đồng bộ kết thúc và còn đơn chưa có hóa đơn
    if (unissuedOrderIds && unissuedOrderIds.length > 0 && canBulkIssue) {
      return (
        <>
          <div className="bg-indigo-600 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="truncate">
                <strong>Phát hành dồn hóa đơn:</strong> Có <strong>{unissuedOrderIds.length} đơn hàng</strong> vừa đồng bộ chưa phát hành hóa đơn điện tử.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-white text-indigo-700 font-extrabold px-3.5 py-1 rounded shadow-sm hover:bg-indigo-50 transition-colors text-xs shrink-0"
              >
                Phát hành
              </button>
              {onClearUnissuedOrders && (
                <button
                  onClick={onClearUnissuedOrders}
                  className="text-indigo-200 hover:text-white p-1 rounded hover:bg-indigo-700 transition-colors shrink-0 ml-1"
                  title="Bỏ qua / Đóng thông báo"
                  aria-label="Đóng"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <BulkIssueInvoiceModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            orderIds={unissuedOrderIds}
            onSuccess={(res) => {
              setIsBulkModalOpen(false);
              setBulkResult(res);
              if (onClearUnissuedOrders) {
                onClearUnissuedOrders();
              }
            }}
          />
        </>
      );
    }

    // 5. Cảnh báo nghiệp vụ từ máy chủ (Quá 24h, tồn kho, lỗi API...) - Hiển thị 3 giây
    if (visibleWarnings.length > 0) {
      return (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 text-xs font-medium flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <div>
              <strong className="font-bold">Thông báo đồng bộ Ngoại tuyến:</strong>
              <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                {visibleWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => setVisibleWarnings([])}
            className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-100 transition-colors shrink-0"
            title="Đóng thông báo"
            aria-label="Đóng"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {renderBannerContent()}
      <BulkIssueResultModal
        isOpen={!!bulkResult}
        onClose={() => setBulkResult(null)}
        result={bulkResult}
      />
    </>
  );
};

