import React from "react";
import { createPortal } from "react-dom";
import { X, Layers, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import {
  ADJUSTMENT_TYPE_LABELS,
  PRICE_ROUNDING_LABELS,
  BATCH_STATUS,
  BATCH_STATUS_LABELS,
} from "@/constants/priceAdjustment";
import { useGetPriceAdjustmentBatchByIdQuery } from "../services/priceAdjustmentApi";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface PriceAdjustmentBatchDetailModalProps {
  batchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PriceAdjustmentBatchDetailModal: React.FC<
  PriceAdjustmentBatchDetailModalProps
> = ({ batchId, isOpen, onClose }) => {
  const { data: response, isLoading } = useGetPriceAdjustmentBatchByIdQuery(
    batchId || "",
    { skip: !isOpen || !batchId }
  );

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(batchId),
    onClose,
  });

  if (!isOpen || !batchId) return null;

  const batch = response?.result;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-detail-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-auth-fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-kv-blue-primary" />
            <div>
              <h3
                id="batch-detail-modal-title"
                className="font-extrabold text-slate-800 text-base"
              >
                Chi tiết đợt điều chỉnh giá
              </h3>
              {batch && (
                <span className="text-xs font-mono text-slate-400">
                  {batch.batchCode}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="w-8 h-8 border-2 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold">Đang tải thông tin chi tiết đợt...</span>
          </div>
        ) : !batch ? (
          <div className="py-20 text-center text-xs text-rose-500 font-bold">
            Không tìm thấy thông tin đợt điều chỉnh giá
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto">
            {/* Summary card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Tên đợt:</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  {batch.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Trạng thái:</span>
                {batch.status === BATCH_STATUS.APPLIED ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                    <CheckCircle className="w-3 h-3" /> {BATCH_STATUS_LABELS[batch.status]}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full text-[11px]">
                    <Clock className="w-3 h-3" /> {BATCH_STATUS_LABELS[batch.status]}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Cơ chế áp dụng:</span>
                <span className="font-bold text-slate-700">
                  {ADJUSTMENT_TYPE_LABELS[batch.adjustmentType]} (
                  {batch.adjustmentValue > 0 ? `+${batch.adjustmentValue}` : batch.adjustmentValue})
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Phương thức làm tròn:</span>
                <span className="font-bold text-slate-700">
                  {PRICE_ROUNDING_LABELS[batch.roundingMethod]}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Nhóm áp dụng:</span>
                <span className="font-bold text-slate-700">
                  {batch.targetGroupName || "Tất cả / Chọn lẻ"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Tổng mặt hàng:</span>
                <span className="font-extrabold text-slate-800">
                  {batch.totalItems} SP (
                  <span className="text-rose-600 font-bold">
                    {batch.belowCostItems} dưới vốn
                  </span>
                  )
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Người áp dụng:</span>
                <span className="font-bold text-slate-700">
                  {batch.appliedByName || batch.appliedBy}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Thời gian áp dụng:</span>
                <span className="font-bold text-slate-700">
                  {new Date(batch.appliedAt).toLocaleString("vi-VN")}
                </span>
              </div>

              {batch.status === BATCH_STATUS.REVERTED && (
                <div className="col-span-2 sm:col-span-4 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-1 text-amber-900">
                  <span className="font-bold block">
                    Đã hoàn tác bởi: {batch.revertedByName || batch.revertedBy} lúc{" "}
                    {batch.revertedAt ? new Date(batch.revertedAt).toLocaleString("vi-VN") : ""}
                  </span>
                  <span className="text-[11px] italic text-amber-800">
                    Lý do: {batch.revertReason || "Không có"}
                  </span>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                    <tr className="text-slate-600 font-bold uppercase text-[11px]">
                      <th className="p-2.5 text-center w-10">STT</th>
                      <th className="p-2.5">Mã SKU</th>
                      <th className="p-2.5">Tên sản phẩm</th>
                      <th className="p-2.5 text-center">ĐVT</th>
                      <th className="p-2.5 text-right">Giá vốn</th>
                      <th className="p-2.5 text-right">Giá cũ</th>
                      <th className="p-2.5 text-right">Giá mới</th>
                      <th className="p-2.5 text-right">Chênh lệch</th>
                      <th className="p-2.5 text-center">Cảnh báo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {batch.items?.map((item, idx) => (
                      <tr
                        key={item.productId || idx}
                        className={
                          item.isBelowCost
                            ? "bg-rose-50/70 text-rose-950 font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                        }
                      >
                        <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] font-bold">
                          {item.productSku}
                        </td>
                        <td className="p-2.5 font-bold">{item.productName}</td>
                        <td className="p-2.5 text-center text-slate-500">{item.unit}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          {Number(item.costPrice).toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-500">
                          {Number(item.oldPrice).toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-slate-900">
                          {Number(item.newPrice).toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          {item.priceDifference > 0 ? (
                            <span className="text-emerald-600">
                              +{Number(item.priceDifference).toLocaleString("vi-VN")}đ
                            </span>
                          ) : item.priceDifference < 0 ? (
                            <span className="text-amber-600">
                              {Number(item.priceDifference).toLocaleString("vi-VN")}đ
                            </span>
                          ) : (
                            <span className="text-slate-400">0đ</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {item.isBelowCost ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase">
                              <AlertTriangle className="w-3 h-3" /> Bán lỗ
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                              An toàn
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
