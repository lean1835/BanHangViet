import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Mail,
  MessageSquare,
  AlertTriangle,
  History,
  HelpCircle,
} from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { useRetryDeliveryMutation } from "../services/invoiceDeliveryApi";
import type { IFailedDeliveryItem } from "../types/IInvoiceDelivery";

interface RetryDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: IFailedDeliveryItem | null;
  onSuccess?: () => void;
}

export const RetryDeliveryModal: React.FC<RetryDeliveryModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [selectedChannel, setSelectedChannel] = useState<"EMAIL" | "ZALO">("EMAIL");
  const [recipient, setRecipient] = useState<string>("");
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(true);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const [retryDelivery, { isLoading: isRetrying }] = useRetryDeliveryMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (item) {
      setSelectedChannel(item.channel || "EMAIL");
      setRecipient(item.recipientAddress || item.customerEmail || item.customerPhone || "");
      setSaveAsDefault(!!item.customerName);
      setShowHistory(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleChannelChange = (channel: "EMAIL" | "ZALO") => {
    setSelectedChannel(channel);
    if (channel === "EMAIL") {
      setRecipient(item.customerEmail || (item.channel === "EMAIL" ? item.recipientAddress : ""));
    } else {
      setRecipient(item.customerPhone || (item.channel === "ZALO" ? item.recipientAddress : ""));
    }
  };

  const handleRetrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRecipient = recipient.trim();

    if (!cleanRecipient) {
      showWarning(
        selectedChannel === "EMAIL"
          ? "Vui lòng nhập địa chỉ Email của khách hàng!"
          : "Vui lòng nhập số điện thoại Zalo của khách hàng!"
      );
      return;
    }

    if (selectedChannel === "EMAIL") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanRecipient)) {
        showWarning("Địa chỉ Email không đúng định dạng. Ví dụ hợp lệ: khachhang@gmail.com");
        return;
      }
    } else {
      const phoneRegex = /^0\d{9,10}$/;
      if (!phoneRegex.test(cleanRecipient.replace(/[\s.-]/g, ""))) {
        showWarning("Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và gồm 10 chữ số)!");
        return;
      }
    }

    try {
      const res = await retryDelivery({
        invoiceId: item.invoiceId || item.lookupCode,
        channel: selectedChannel,
        recipientAddress: cleanRecipient,
        saveAsCustomerDefault: saveAsDefault,
        customerId: item.customerPhone,
      }).unwrap();

      showSuccess(
        res.message ||
          `Đã gửi lại hóa đơn thành công qua ${
            selectedChannel === "EMAIL" ? "Thư điện tử" : "Zalo"
          } tới ${cleanRecipient}!`
      );
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const msg = errorObj?.data?.message || errorObj?.message;
      showError(msg || "Gửi lại hóa đơn thất bại! Vui lòng kiểm tra lại địa chỉ hoặc dịch vụ gửi.");
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col my-auto animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-kv-blue-primary/10 text-kv-blue-primary flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">
                Gửi Lại Hóa Đơn Cho Khách Hàng
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mã tra cứu: <strong className="text-slate-800 font-mono">{item.lookupCode}</strong>
                {item.invoiceNumber && (
                  <span className="ml-2">
                    | Số HĐ: <strong className="text-slate-800">{item.invoiceNumber}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleRetrySubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Previous Failure Reason Alert */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-extrabold text-rose-800 uppercase tracking-wide text-[11px]">
                Lần gửi trước thất bại ({item.attemptCount} lần đã thử)
              </div>
              <p className="text-rose-700 font-medium mt-0.5 leading-relaxed">
                {item.failureReason}
              </p>
              <div className="text-[10px] text-rose-500 mt-1 font-mono">
                Lần cuối: {formatDateTime(item.lastAttemptAt)} | Kênh: {item.channel} ({item.recipientAddress})
              </div>
            </div>
          </div>

          {/* Customer info preview */}
          {item.customerName && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500">Khách hàng:</span>{" "}
                <strong className="text-slate-800 font-bold">{item.customerName}</strong>
              </div>
              {item.customerPhone && (
                <span className="text-slate-600 font-mono text-[11px]">
                  SĐT: {item.customerPhone}
                </span>
              )}
            </div>
          )}

          {/* Select Channel */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Chọn kênh gửi lại
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChannelChange("EMAIL")}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  selectedChannel === "EMAIL"
                    ? "border-kv-blue-primary bg-blue-50/50 text-kv-blue-primary font-bold shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedChannel === "EMAIL"
                      ? "bg-kv-blue-primary text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Thư Điện Tử (Email)</div>
                  <div className="text-[10px] text-slate-500 font-normal">Gửi file PDF & link</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChannelChange("ZALO")}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                  selectedChannel === "ZALO"
                    ? "border-kv-blue-primary bg-blue-50/50 text-kv-blue-primary font-bold shadow-sm"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedChannel === "ZALO"
                      ? "bg-kv-blue-primary text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Tin Nhắn Zalo</div>
                  <div className="text-[10px] text-slate-500 font-normal">Gửi qua Zalo OA</div>
                </div>
              </button>
            </div>
          </div>

          {/* Input Recipient */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              {selectedChannel === "EMAIL" ? (
                <span>
                  Địa chỉ Email nhận mới <strong className="text-rose-500">*</strong>
                </span>
              ) : (
                <span>
                  Số điện thoại Zalo nhận mới <strong className="text-rose-500">*</strong>
                </span>
              )}
            </label>
            <input
              type={selectedChannel === "EMAIL" ? "email" : "tel"}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={
                selectedChannel === "EMAIL"
                  ? "Ví dụ: khachhang.moi@gmail.com"
                  : "Ví dụ: 0912345678"
              }
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:outline-none focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-800"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {selectedChannel === "EMAIL"
                  ? "Kiểm tra kỹ chính tả tên miền (@gmail.com, @yahoo.com...)"
                  : "Đảm bảo số điện thoại đã kích hoạt tài khoản Zalo"}
              </span>
            </p>
          </div>

          {/* Default Channel Save Option (NCL-06-CN-006) */}
          {item.customerName && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">
                    Lưu làm kênh nhận mặc định cho khách hàng này (NCL-06-CN-006)
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Hệ thống sẽ tự động điền sẵn {selectedChannel === "EMAIL" ? "Email" : "Zalo"} này
                    trong các lần mua hàng tiếp theo tại quầy.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Toggle History Accordion */}
          {item.history && item.history.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Lịch sử các lần gửi ({item.history.length} lần)</span>
                </div>
                <span className="text-[11px] text-kv-blue-primary font-semibold">
                  {showHistory ? "Thu gọn" : "Xem chi tiết"}
                </span>
              </button>

              {showHistory && (
                <div className="p-3 bg-white divide-y divide-slate-100 text-xs max-h-40 overflow-y-auto">
                  {item.history.map((h, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-700">
                          Lần {h.attempt} • Kênh {h.channel} ({h.recipientAddress})
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {formatDateTime(h.sentAt)}
                        </span>
                      </div>
                      <p className="text-rose-600 text-[11px] font-medium leading-tight">
                        {h.errorMessage}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Đóng
            </button>

            <button
              type="submit"
              disabled={isRetrying}
              className="px-5 h-10 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isRetrying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang gửi lại...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Xác nhận gửi lại</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
