import React, { useState } from "react";
import { useBulkIssueInvoicesMutation } from "@/modules/e_invoice/services/eInvoiceApi";
import type { IBulkIssueInvoiceResult } from "@/modules/e_invoice/types/IInvoice";

interface BulkIssueInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderIds: string[];
  syncSessionCode?: string;
  onSuccess: (result: IBulkIssueInvoiceResult) => void;
}

export const BulkIssueInvoiceModal: React.FC<BulkIssueInvoiceModalProps> = ({
  isOpen,
  onClose,
  orderIds,
  syncSessionCode = `SYNC-${Date.now().toString().slice(-6)}`,
  onSuccess,
}) => {
  const [bulkIssueInvoices, { isLoading }] = useBulkIssueInvoicesMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      const res = await bulkIssueInvoices({
        syncSessionCode,
        orderIds,
      }).unwrap();

      if (res.result) {
        onSuccess(res.result);
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Đã xảy ra lỗi khi phát hành dồn hóa đơn";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-backdrop-fade-in">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-modal-bounce-in">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Phát hành dồn hóa đơn sau khi có mạng
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Đóng"
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-1 rounded-lg hover:bg-gray-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="py-4 text-sm text-gray-600 space-y-3">
          <p>
            Hệ thống sẽ tiến hành khởi tạo và phát hành hóa đơn điện tử hàng loạt cho{" "}
            <strong className="text-gray-900">{orderIds.length} đơn hàng</strong> vừa được đồng bộ từ phiên{" "}
            <span className="font-mono text-blue-600 font-semibold">{syncSessionCode}</span>.
          </p>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {errorMessage}
            </div>
          )}

          {isLoading && (
            <div className="rounded-lg bg-blue-50 p-4 text-center text-blue-700 border border-blue-200 space-y-2">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <p className="font-medium text-xs">Đang phát hành hàng loạt hóa đơn, vui lòng không đóng trình duyệt...</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || orderIds.length === 0}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận phát hành dồn"}
          </button>
        </div>
      </div>
    </div>
  );
};
