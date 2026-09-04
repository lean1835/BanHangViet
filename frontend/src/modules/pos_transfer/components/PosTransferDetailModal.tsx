import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Truck,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { IPosTransfer } from "../types/IPosTransfer";
import { useGetTransferByIdQuery } from "../services/posTransferApi";
import { formatDate } from "@/utils/dateFormatter";
import { USER_ROLES } from "@/constants/roles";

interface PosTransferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer?: IPosTransfer | null;
  onReceive: (id: string) => Promise<void>;
  onCancel: (id: string, reason: string) => Promise<void>;
  isReceiving?: boolean;
  isCanceling?: boolean;
  userRole?: string;
}

export const PosTransferDetailModal: React.FC<PosTransferDetailModalProps> = ({
  isOpen,
  onClose,
  transfer,
  onReceive,
  onCancel,
  isReceiving = false,
  isCanceling = false,
  userRole,
}) => {
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isReceiving && !isCanceling,
  });

  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const { data: detailData, isLoading: isLoadingDetail } = useGetTransferByIdQuery(
    transfer?.id || "",
    { skip: !isOpen || !transfer?.id }
  );

  const activeTransfer = detailData || transfer;

  if (!isOpen || !activeTransfer) return null;

  const isPending =
    activeTransfer.status === "IN_TRANSIT" ||
    (activeTransfer.status as any) === "PENDING";
  const isCompleted = activeTransfer.status === "COMPLETED";
  const isCanceled = activeTransfer.status === "CANCELED";

  const items = activeTransfer.items || [];

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng nhập lý do hủy phiếu chuyển");
      return;
    }
    await onCancel(activeTransfer.id, cancelReason.trim());
    setShowCancelPrompt(false);
    setCancelReason("");
  };

  const isOwner = userRole === USER_ROLES.OWNER;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-kv-blue-light text-kv-blue-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Chi tiết phiếu chuyển hàng
                </h2>
                <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                  {activeTransfer.transferNumber || activeTransfer.transferCode || "—"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ngày lập: {activeTransfer.transferredAt ? formatDate(activeTransfer.transferredAt) : "—"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Status & Flow Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Luồng điều chuyển
              </span>

              {isPending && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Đang trên đường chuyển
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Đã nhận hàng thành công
                </span>
              )}
              {isCanceled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Đã hủy phiếu
                </span>
              )}
            </div>

            {/* Sender -> Receiver Card */}
            <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/70">
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Điểm gửi (Kho xuất)</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {activeTransfer.fromPointOfSaleName}
                </p>
                <p className="text-[11px] text-slate-500">Mã: {activeTransfer.fromPosCode || "—"}</p>
              </div>

              <div className="p-2 rounded-full bg-slate-100 text-slate-400 shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="flex-1 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Điểm nhận (Kho nhập)</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {activeTransfer.toPointOfSaleName}
                </p>
                <p className="text-[11px] text-slate-500">Mã: {activeTransfer.toPosCode || "—"}</p>
              </div>
            </div>

            {/* Audit Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
              <div>
                <span className="text-slate-400">Người lập:</span>{" "}
                <strong>{activeTransfer.createdByFullName || "Chủ hộ"}</strong>
              </div>
              {activeTransfer.receivedByFullName && (
                <div>
                  <span className="text-slate-400">Người nhận:</span>{" "}
                  <strong>{activeTransfer.receivedByFullName}</strong>
                </div>
              )}
              {activeTransfer.receivedAt && (
                <div>
                  <span className="text-slate-400">Thời gian nhận:</span>{" "}
                  <strong>{formatDate(activeTransfer.receivedAt)}</strong>
                </div>
              )}
              {activeTransfer.canceledByFullName && (
                <div>
                  <span className="text-slate-400">Người hủy:</span>{" "}
                  <strong>{activeTransfer.canceledByFullName}</strong>
                </div>
              )}
            </div>

            {activeTransfer.notes && (
              <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100">
                <strong>Ghi chú:</strong> {activeTransfer.notes}
              </p>
            )}

            {activeTransfer.cancelReason && (
              <p className="text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <strong>Lý do hủy:</strong> {activeTransfer.cancelReason}
              </p>
            )}
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Danh sách mặt hàng chuyển ({items.length})
              </h3>
              {isLoadingDetail && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Đang cập nhật chi tiết...
                </span>
              )}
            </div>
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3">Mã SKU</th>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-3">Đơn vị</th>
                    <th className="py-2.5 px-3 text-right">Số lượng chuyển</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingDetail && items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                        Đang tải danh sách hàng chuyển...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        Không có mặt hàng nào trong phiếu chuyển
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {item.productSku || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.unit || "Cái"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          {item.quantity}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cancel prompt inline */}
          {showCancelPrompt && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <h4 className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Nhập lý do hủy phiếu chuyển hàng
              </h4>
              <textarea
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelError) setCancelError("");
                }}
                placeholder="Ví dụ: Đổi ý không chuyển hàng nữa, nhầm số lượng..."
                rows={2}
                className="w-full p-2.5 text-xs rounded-lg border border-rose-300 bg-white outline-none focus:ring-2 focus:ring-rose-200"
              />
              {cancelError && <p className="text-xs text-rose-600 font-medium">{cancelError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCanceling}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-xs flex items-center gap-1.5"
                >
                  {isCanceling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận hủy phiếu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            Đóng
          </button>

          {isPending && !showCancelPrompt && (
            <div className="flex items-center gap-2">
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  disabled={isCanceling}
                  className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all"
                >
                  Hủy phiếu chuyển
                </button>
              )}

              <button
                type="button"
                onClick={() => onReceive(activeTransfer.id)}
                disabled={isReceiving}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isReceiving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Xác nhận đã nhận đủ hàng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
