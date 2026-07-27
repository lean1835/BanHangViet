import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useGetGoodsReceiptByIdQuery } from "../services/productApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";

interface GoodsReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: string | null;
}

export const GoodsReceiptDetailModal: React.FC<GoodsReceiptDetailModalProps> = ({
  isOpen,
  onClose,
  receiptId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { data: responseData, isLoading, error } = useGetGoodsReceiptByIdQuery(receiptId || "", {
    skip: !receiptId || !isOpen,
  });

  const detailInfo = responseData;

  useEffect(() => {
    if (!isOpen) return;
    
    // Accessibility: Lock background scrolling
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    // Accessibility: Focus modal container
    modalRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute total
  const details = detailInfo?.details || [];
  const totalAmount = details.reduce((sum: number, detail: any) => {
    const qty = Number(detail.quantity || 0);
    const price = Number(detail.purchasePrice || 0);
    return sum + qty * price;
  }, 0);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goods-receipt-detail-modal-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden my-4 animate-modal-bounce-in focus:outline-none"
      >
        {/* Header */}
        <div className="bg-kv-blue-primary text-white px-5 py-3 flex items-center justify-between">
          <h2 id="goods-receipt-detail-modal-title" className="text-xs font-bold uppercase tracking-wider">
            Chi tiết phiếu nhập kho
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal"
            className="text-white/80 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6 text-slate-700 text-xs font-semibold">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400">Đang tải chi tiết phiếu nhập...</div>
          ) : error ? (
            <div className="py-10 text-center text-rose-500">
              Lỗi: Không thể lấy thông tin chi tiết phiếu nhập kho!
            </div>
          ) : !detailInfo ? (
            <div className="py-10 text-center text-slate-400">Không tìm thấy thông tin phiếu.</div>
          ) : (
            <>
              {/* Receipt Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-slate-400 font-medium block">Mã số phiếu</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {detailInfo.receiptNumber?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Thời gian nhập kho</span>
                  <span className="text-slate-800">{formatDate(detailInfo.receivedAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Người lập phiếu</span>
                  <span className="text-slate-800">{detailInfo.createdByUserName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Ghi chú / Nhà cung cấp</span>
                  <span className="text-slate-800 font-medium">{detailInfo.notes || "---"}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex flex-col gap-2">
                <span className="text-slate-800 font-extrabold text-sm border-b pb-2">
                  Danh mục hàng hóa nhập
                </span>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-3">Tên hàng</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-right">Số lượng</th>
                        <th className="p-3 text-right">Đơn giá nhập</th>
                        <th className="p-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {details.map((detail: any) => (
                        <tr key={detail.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{detail.productName}</td>
                          <td className="p-3 font-mono text-slate-500">{detail.productSku}</td>
                          <td className="p-3 text-right font-bold text-indigo-600">
                            {Number(detail.quantity)}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(Number(detail.purchasePrice))}
                          </td>
                          <td className="p-3 text-right font-bold text-kv-blue-primary">
                            {formatCurrency(Number(detail.quantity) * Number(detail.purchasePrice))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-sm">
                <span className="text-slate-500 font-bold">Tổng giá trị phiếu nhập:</span>
                <span className="text-lg font-extrabold text-rose-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-slate-300 font-bold hover:bg-slate-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
