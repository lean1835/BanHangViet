import React, { useState } from "react";
import type { ILocalOfflineOrder, TConflictResolutionStrategy } from "../types/ISync";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflictingOrders: ILocalOfflineOrder[];
  currentRole: string;
  isSyncing?: boolean;
  onResolve: (orderNumber: string, strategy: TConflictResolutionStrategy) => Promise<void>;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  conflictingOrders,
  currentRole,
  isSyncing = false,
  onResolve,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (!isOpen || conflictingOrders.length === 0) return null;

  const currentOrder = conflictingOrders[selectedIndex] || conflictingOrders[0];
  const isOwner = currentRole === "VT-01" || currentRole === "owner";

  const handleChooseStrategy = async (strategy: TConflictResolutionStrategy) => {
    if (!currentOrder) return;
    await onResolve(currentOrder.orderNumber, strategy);
    if (conflictingOrders.length <= 1) {
      onClose();
    } else {
      setSelectedIndex((prev) => Math.min(prev, conflictingOrders.length - 2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Xung đột dữ liệu đơn hàng ngoại tuyến ({selectedIndex + 1}/{conflictingOrders.length})
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Phát hiện mã đơn hàng trùng lặp giữa máy lẻ và máy chủ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {!isOwner && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <strong className="font-bold">Yêu cầu quyền Chủ hộ kinh doanh (VT-01):</strong>
                <p className="mt-0.5">
                  Tài khoản hiện tại của bạn không đủ thẩm quyền giải quyết xung đột. Vui lòng báo Chủ hộ kinh doanh thực hiện thao tác này.
                </p>
              </div>
            </div>
          )}

          {/* Current Order Overview */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
              <span className="text-xs font-bold text-slate-600">Mã đơn hàng:</span>
              <span className="text-sm font-extrabold text-slate-900">{currentOrder.orderNumber}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Thời gian lập (Máy lẻ):</span>
                <span className="font-semibold text-slate-800">
                  {currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleString("vi-VN") : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Hình thức thanh toán:</span>
                <span className="font-semibold text-slate-800">{currentOrder.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Số lượng mặt hàng:</span>
                <span className="font-semibold text-slate-800">{currentOrder.items?.length || 0} sản phẩm</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tổng tiền thanh toán:</span>
                <span className="font-extrabold text-kv-blue-primary text-sm">
                  {currentOrder.finalAmount?.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          </div>

          {/* Decision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Strategy 1: Keep Server */}
            <div className="rounded-xl border border-slate-200 p-4 hover:border-slate-400 transition-all flex flex-col justify-between bg-white shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs">1</span>
                  <h4 className="font-bold text-slate-800 text-xs">Giữ đơn trên máy chủ (Server)</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Bỏ qua dữ liệu đơn hàng ở máy lẻ này. Giữ nguyên thông tin đơn hàng và tồn kho đã được ghi nhận trên hệ thống máy chủ trước đó.
                </p>
              </div>
              <button
                disabled={!isOwner || isSyncing}
                onClick={() => handleChooseStrategy("KEEP_SERVER")}
                className="mt-4 w-full py-2 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-bold text-xs hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSyncing ? "Đang xử lý..." : "Chọn: Giữ đơn trên máy chủ"}
              </button>
            </div>

            {/* Strategy 2: Overwrite Server */}
            <div className="rounded-xl border border-rose-200 p-4 hover:border-rose-400 transition-all flex flex-col justify-between bg-rose-50/40 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold text-xs">2</span>
                  <h4 className="font-bold text-rose-800 text-xs">Ghi đè bằng đơn máy lẻ (Client)</h4>
                </div>
                <p className="text-[11px] text-rose-600/90 leading-relaxed">
                  Cập nhật lại toàn bộ đơn hàng trên server theo số liệu máy lẻ này. Hệ thống sẽ hoàn tồn kho cũ và khấu trừ tồn kho theo đơn mới.
                </p>
              </div>
              <button
                disabled={!isOwner || isSyncing}
                onClick={() => handleChooseStrategy("OVERWRITE_SERVER")}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSyncing ? "Đang xử lý..." : "Chọn: Ghi đè bằng đơn máy lẻ"}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
          <span className="text-[11px] text-slate-400 font-medium">
            Mọi thao tác giải quyết xung đột đều được lưu nhật ký hoạt động (NCL 07).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
