import React from "react";
import type { IBulkIssueInvoiceResult } from "@/modules/e_invoice/types/IInvoice";

interface BulkIssueResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: IBulkIssueInvoiceResult | null;
}

export const BulkIssueResultModal: React.FC<BulkIssueResultModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!isOpen || !result) return null;

  const { totalProcessed, successCount, failedCount, failedItems = [] } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b pb-3 shrink-0">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>📊</span> Kết quả phát hành dồn hóa đơn
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="py-4 overflow-y-auto space-y-4 flex-1">
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-gray-50 p-3 border">
              <p className="text-xs text-gray-500 font-medium">Tổng đơn xử lý</p>
              <p className="text-xl font-bold text-gray-800">{totalProcessed}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 border border-green-200">
              <p className="text-xs text-green-600 font-medium">Thành công</p>
              <p className="text-xl font-bold text-green-700">{successCount}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 border border-red-200">
              <p className="text-xs text-red-600 font-medium">Thất bại / Lỗi</p>
              <p className="text-xl font-bold text-red-700">{failedCount}</p>
            </div>
          </div>

          {/* Success Notification */}
          {failedCount === 0 && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold">Phát hành toàn bộ thành công!</p>
                <p className="text-xs text-emerald-600">
                  Tất cả {successCount} hóa đơn điện tử đã được sinh và gửi lên Cơ quan thuế mô phỏng để cấp mã.
                </p>
              </div>
            </div>
          )}

          {/* Failed Items List (AC-02) */}
          {failedCount > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">
                Danh sách {failedCount} đơn hàng chưa phát hành được hóa đơn:
              </h4>
              <div className="divide-y rounded-lg border border-red-200 bg-red-50/50 max-h-48 overflow-y-auto">
                {failedItems.map((item, idx) => (
                  <div key={idx} className="p-3 text-xs flex justify-between items-start gap-3">
                    <div>
                      <span className="font-mono font-semibold text-gray-900">{item.orderNumber}</span>
                    </div>
                    <div className="text-right text-red-600 font-medium">
                      {item.errorMessage}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic">
                * Các đơn lỗi được liệt kê riêng để nhân viên bán hàng/chủ hộ kiểm tra và sửa lại thông tin.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
