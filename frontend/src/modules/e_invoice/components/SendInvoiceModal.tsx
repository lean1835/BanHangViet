import React, { useState } from "react";
import { createPortal } from "react-dom";
import { QRCode, message } from "antd";
import {
  QrCode,
  Send,
  Mail,
  Copy,
  Check,
  Download,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useSendInvoiceViaEmailMutation } from "../services/invoiceDeliveryApi";
import type { IInvoice } from "../types/IInvoice";
import type { TDeliveryMethod, IDeliveryLog } from "../types/IInvoiceDelivery";

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: IInvoice;
  onDeliverySuccess?: (log: IDeliveryLog) => void;
}

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onDeliverySuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TDeliveryMethod>("QR");
  const [email, setEmail] = useState(invoice.buyerEmail || "");
  const emailSubject = `[Bán Hàng Việt] Hóa đơn điện tử ${invoice.invoiceNumber || invoice.lookupCode}`;
  const emailContent = `Kính gửi khách hàng ${invoice.buyerName || invoice.customer || ""},\n\nHộ kinh doanh Bán Hàng Việt xin gửi tới Quý khách thông tin hóa đơn điện tử số ${
    invoice.invoiceNumber || invoice.lookupCode
  }.\n\nQuý khách có thể tra cứu và tải lại hóa đơn tại đường dẫn:\n${
    window.location.origin
  }/lookup-invoice?code=${invoice.lookupCode}\n\nTrân trọng!`;
  const [isCopied, setIsCopied] = useState(false);

  const [sendInvoiceViaEmail, { isLoading: isSendingEmail }] = useSendInvoiceViaEmailMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const lookupUrl = `${window.location.origin}/lookup-invoice?code=${invoice.lookupCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(lookupUrl);
    setIsCopied(true);
    message.success("Đã sao chép liên kết tra cứu hóa đơn!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById("invoice-qr-code")?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = `QR_HoaDon_${invoice.lookupCode}.png`;
      a.href = url;
      a.click();
      message.success("Đã tải mã QR hóa đơn!");
    } else {
      message.error("Không thể xuất mã QR!");
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      message.warning("Vui lòng nhập địa chỉ email của khách hàng!");
      return;
    }
    try {
      await sendInvoiceViaEmail({
        invoiceId: invoice.id,
        email: email.trim(),
      }).unwrap();

      const newLog: IDeliveryLog = {
        id: `log-${Date.now()}`,
        invoiceId: invoice.id,
        method: "EMAIL",
        recipient: email.trim(),
        sentAt: new Date().toISOString(),
        status: "SUCCESS",
        note: `Gửi email thành công tới ${email.trim()}`,
      };

      onDeliverySuccess?.(newLog);
      message.success(`Đã gửi hóa đơn điện tử tới email ${email.trim()}`);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const apiErrorMsg = errorObj?.data?.message || errorObj?.message;
      message.error(apiErrorMsg || "Gửi thư điện tử thất bại!");
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-kv-blue-primary/10 text-kv-blue-primary flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">
                Gửi Hóa Đơn Cho Khách Hàng
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mã tra cứu: <strong className="text-slate-700 font-mono">{invoice.lookupCode}</strong>
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

        {/* Channel Navigation Tabs */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-slate-100/80 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("QR")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "QR"
                ? "bg-white text-kv-blue-primary shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Mã QR Tra Cứu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("EMAIL")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "EMAIL"
                ? "bg-white text-emerald-600 shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-500" />
            <span>Thư Điện Tử (Email)</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: QR CODE */}
          {activeTab === "QR" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                id="invoice-qr-code"
                className="p-4 bg-white border-2 border-kv-blue-primary/30 rounded-2xl shadow-inner flex flex-col items-center"
              >
                <QRCode
                  value={lookupUrl}
                  size={200}
                  icon="/logo.png"
                  bordered={false}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg font-semibold border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Khách quét mã bằng camera điện thoại để xem & tải hóa đơn</span>
              </div>

              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-mono text-slate-600 text-[11px]">
                  {lookupUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isCopied ? "Đã chép" : "Sao chép"}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 py-2.5 px-4 bg-kv-blue-primary text-white rounded-xl font-bold text-xs hover:bg-kv-blue-dark transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải ảnh QR</span>
                </button>

                <a
                  href={lookupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Xem trước</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL */}
          {activeTab === "EMAIL" && (
            <form onSubmit={handleSendEmail} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Địa chỉ Thư điện tử (Email):
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="khachhang@domain.com"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <Mail className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tiêu đề thư (Mẫu tự động từ hệ thống):
                </label>
                <div className="w-full px-3 py-2 text-xs font-semibold bg-slate-100/90 border border-slate-200 rounded-xl text-slate-600 select-none">
                  {emailSubject}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nội dung thư mẫu (Tự động đính kèm liên kết tra cứu):
                </label>
                <div className="w-full p-3 text-xs font-medium bg-slate-100/90 border border-slate-200 rounded-xl text-slate-600 leading-relaxed font-sans whitespace-pre-line select-none">
                  {emailContent}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {isSendingEmail ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span>{isSendingEmail ? "Đang gửi..." : "GỬI THƯ ĐIỆN TỬ"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SendInvoiceModal;
