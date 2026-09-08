import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCode, message } from "antd";
import {
  QrCode,
  Send,
  Mail,
  MessageSquare,
  Copy,
  Check,
  Download,
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Star,
  CheckCircle2,
} from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import {
  useSendInvoiceViaEmailMutation,
  useSendInvoiceViaZaloMutation,
} from "../services/invoiceDeliveryApi";
import type { IInvoice } from "../types/IInvoice";
import type { TDeliveryMethod, IDeliveryLog } from "../types/IInvoiceDelivery";
import type { ICustomer } from "@/modules/customer/types/ICustomer";

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: IInvoice;
  customer?: ICustomer | null;
  onDeliverySuccess?: (log: IDeliveryLog) => void;
}

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customer,
  onDeliverySuccess,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();

  // Resolve effective customer from prop or lookup from localStorage / invoice details
  const effectiveCustomer: ICustomer | null = React.useMemo(() => {
    if (customer) return customer;
    try {
      const raw = localStorage.getItem("pos_customers");
      if (raw) {
        const list: ICustomer[] = JSON.parse(raw);
        const found = list.find(
          (c) =>
            (invoice.buyerPhone && (c.phone === invoice.buyerPhone || c.phoneNumber === invoice.buyerPhone)) ||
            (invoice.buyerEmail && c.email === invoice.buyerEmail) ||
            (invoice.buyerName && c.name?.toLowerCase() === invoice.buyerName?.toLowerCase())
        );
        if (found) return found;
      }
    } catch {
      /* ignore */
    }

    // If invoice has buyer phone or email, create a customer context
    if (invoice.buyerEmail || invoice.buyerPhone) {
      return {
        id: `cust-${invoice.buyerPhone || invoice.buyerEmail}`,
        name: invoice.buyerName || "Khách quen",
        phone: invoice.buyerPhone || "",
        email: invoice.buyerEmail || "",
        defaultInvoiceChannel: invoice.buyerEmail ? ("EMAIL" as const) : ("ZALO" as const),
        creditLimit: 0,
        debt: 0,
      };
    }
    return null;
  }, [customer, invoice]);

  // Determine initial default channel (NCL-06-CN-006)
  const initialDefaultChannel: TDeliveryMethod = (() => {
    if (effectiveCustomer?.defaultInvoiceChannel) {
      return effectiveCustomer.defaultInvoiceChannel;
    }
    if (effectiveCustomer) {
      if (effectiveCustomer.email) return "EMAIL";
      if (effectiveCustomer.phone || effectiveCustomer.phoneNumber) return "ZALO";
    }
    return "QR"; // Khách lẻ mặc định hiện mã QR tại quầy (TC-03)
  })();

  const [activeTab, setActiveTab] = useState<TDeliveryMethod>(initialDefaultChannel);
  const [email, setEmail] = useState(invoice.buyerEmail || effectiveCustomer?.email || "");
  const [zaloPhone, setZaloPhone] = useState(
    invoice.buyerPhone || effectiveCustomer?.phone || effectiveCustomer?.phoneNumber || ""
  );
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Sync initial tab and contact details when modal opens or customer changes
  useEffect(() => {
    if (isOpen) {
      const def = effectiveCustomer?.defaultInvoiceChannel || (effectiveCustomer?.email ? "EMAIL" : effectiveCustomer?.phone ? "ZALO" : "QR");
      setActiveTab(def);
      setEmail(invoice.buyerEmail || effectiveCustomer?.email || "");
      setZaloPhone(invoice.buyerPhone || effectiveCustomer?.phone || effectiveCustomer?.phoneNumber || "");
      setSaveAsDefault(false);
    }
  }, [isOpen, effectiveCustomer, invoice]);

  const emailSubject = `[Bán Hàng Việt] Hóa đơn điện tử ${invoice.invoiceNumber || invoice.lookupCode}`;
  const emailContent = `Kính gửi khách hàng ${invoice.buyerName || customer?.name || "Quý khách"},\n\nHộ kinh doanh Bán Hàng Việt xin gửi tới Quý khách thông tin hóa đơn điện tử số ${
    invoice.invoiceNumber || invoice.lookupCode
  }.\n\nQuý khách có thể tra cứu và tải lại hóa đơn tại đường dẫn:\n${
    window.location.origin
  }/lookup-invoice?code=${invoice.lookupCode}\n\nTrân trọng!`;

  const zaloMessagePreview = `[BÁN HÀNG VIỆT] Kính gửi Quý khách ${
    invoice.buyerName || customer?.name || ""
  }, hóa đơn điện tử #${invoice.invoiceNumber || invoice.lookupCode} trị giá ${
    Number(invoice.finalAmount || 0).toLocaleString("vi-VN")
  } đ đã được phát hành. Xem chi tiết tại: ${
    window.location.origin
  }/lookup-invoice?code=${invoice.lookupCode}`;

  const [sendInvoiceViaEmail, { isLoading: isSendingEmail }] = useSendInvoiceViaEmailMutation();
  const [sendInvoiceViaZalo, { isLoading: isSendingZalo }] = useSendInvoiceViaZaloMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const lookupUrl = `${window.location.origin}/lookup-invoice?code=${invoice.lookupCode}`;
  const isChangedFromDefault = effectiveCustomer && effectiveCustomer.defaultInvoiceChannel && activeTab !== effectiveCustomer.defaultInvoiceChannel;

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

  const saveCustomerDefaultChannelLocally = (channel: "QR" | "EMAIL" | "ZALO", recipientAddr?: string) => {
    if (!effectiveCustomer?.id && !invoice.buyerPhone) return;
    try {
      const raw = localStorage.getItem("pos_customers");
      if (raw) {
        const list: ICustomer[] = JSON.parse(raw);
        const idx = list.findIndex(
          (c) =>
            (effectiveCustomer?.id && c.id === effectiveCustomer.id) ||
            (effectiveCustomer?.phone && c.phone === effectiveCustomer.phone) ||
            (invoice.buyerPhone && c.phone === invoice.buyerPhone)
        );
        if (idx >= 0) {
          list[idx].defaultInvoiceChannel = channel;
          list[idx].defaultInvoiceRecipient = recipientAddr;
          list[idx].channelUpdatedAt = new Date().toISOString();
          localStorage.setItem("pos_customers", JSON.stringify(list));
        }
      }
    } catch {
      /* ignore */
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showWarning("Vui lòng nhập địa chỉ email của khách hàng!");
      return;
    }

    if (invoice.status !== "ISSUED") {
      showError("Chỉ có thể gửi thư điện tử cho hóa đơn đã phát hành (trạng thái ISSUED)!");
      return;
    }

    try {
      await sendInvoiceViaEmail({
        invoiceId: invoice.id,
        email: email.trim(),
      }).unwrap();

      if (saveAsDefault && effectiveCustomer) {
        saveCustomerDefaultChannelLocally("EMAIL", email.trim());
      }

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
      showSuccess(`Đã gửi hóa đơn điện tử thành công tới email ${email.trim()}`);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const apiErrorMsg = errorObj?.data?.message || errorObj?.message;
      showError(apiErrorMsg || "Gửi thư điện tử thất bại! Vui lòng kiểm tra lại địa chỉ email hoặc kết nối hệ thống.");
    }
  };

  const handleSendZalo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = zaloPhone.trim().replace(/[\s.-]/g, "");
    if (!cleanPhone) {
      showWarning("Vui lòng nhập số điện thoại Zalo của khách hàng!");
      return;
    }

    if (!/^0\d{9,10}$/.test(cleanPhone)) {
      showWarning("Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 10 chữ số)!");
      return;
    }

    if (invoice.status !== "ISSUED") {
      showError("Chỉ có thể gửi qua Zalo cho hóa đơn đã phát hành (trạng thái ISSUED)!");
      return;
    }

    try {
      await sendInvoiceViaZalo({
        invoiceId: invoice.id,
        phoneNumber: cleanPhone,
        message: zaloMessagePreview,
      }).unwrap();

      if (saveAsDefault && effectiveCustomer) {
        saveCustomerDefaultChannelLocally("ZALO", cleanPhone);
      }

      const newLog: IDeliveryLog = {
        id: `log-${Date.now()}`,
        invoiceId: invoice.id,
        method: "ZALO",
        recipient: cleanPhone,
        sentAt: new Date().toISOString(),
        status: "SUCCESS",
        note: `Gửi tin nhắn Zalo thành công tới ${cleanPhone}`,
      };

      onDeliverySuccess?.(newLog);
      showSuccess(`Đã gửi liên kết hóa đơn thành công qua Zalo đến số ${cleanPhone}`);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const apiErrorMsg = errorObj?.data?.message || errorObj?.message;
      showError(apiErrorMsg || "Gửi qua Zalo thất bại! Vui lòng kiểm tra số điện thoại hoặc kết nối Zalo OA.");
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col my-auto animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-kv-blue-primary/10 text-kv-blue-primary flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-800">
                  Gửi Hóa Đơn Cho Khách Hàng
                </h2>
                {effectiveCustomer?.defaultInvoiceChannel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-kv-blue-primary border border-blue-200 text-[10px] font-extrabold" title="Đã nhận diện kênh mặc định từ hồ sơ khách quen">
                    <Star className="w-3 h-3 fill-kv-blue-primary" />
                    <span>Khách quen</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Mã tra cứu: <strong className="text-slate-700 font-mono">{invoice.lookupCode}</strong>
                {effectiveCustomer?.name && (
                  <span className="ml-2">| Khách: <strong className="text-slate-700">{effectiveCustomer.name}</strong></span>
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

        {/* Channel Navigation 3 Tabs */}
        <div className="grid grid-cols-3 p-1.5 mx-6 mt-4 bg-slate-100/80 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("QR")}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "QR"
                ? "bg-white text-kv-blue-primary shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Mã QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("EMAIL")}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "EMAIL"
                ? "bg-white text-emerald-600 shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-500" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ZALO")}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "ZALO"
                ? "bg-white text-blue-600 shadow-sm font-extrabold"
                : "hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>Zalo OA</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Default Channel Notice for Regular Customer (TC-01) */}
          {effectiveCustomer && effectiveCustomer.defaultInvoiceChannel === activeTab && (
            <div className="mb-4 p-2.5 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center gap-2 text-xs text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-kv-blue-primary shrink-0" />
              <span>
                Đã tự động chọn <strong>{activeTab === "ZALO" ? "Zalo" : activeTab === "EMAIL" ? "Email" : "Mã QR"}</strong> theo kênh nhận mặc định của khách quen <strong>{effectiveCustomer.name}</strong>.
              </span>
            </div>
          )}

          {/* Change Channel Prompt for Regular Customer (TC-02) */}
          {effectiveCustomer && isChangedFromDefault && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Khách đổi sang kênh khác (Mặc định: {effectiveCustomer.defaultInvoiceChannel})</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-800 text-[11px] shrink-0">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded border-amber-300 text-kv-blue-primary focus:ring-kv-blue-primary"
                />
                <span>Lưu làm mặc định mới</span>
              </label>
            </div>
          )}

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
              {invoice.status !== "ISSUED" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Lưu ý: Hóa đơn chưa phát hành</p>
                    <p className="text-[11px] text-amber-700 font-normal mt-0.5 leading-relaxed">
                      Hóa đơn đang ở trạng thái <strong className="font-extrabold text-amber-900">{invoice.status}</strong>. Chỉ hóa đơn đã được phát hành (ISSUED) mới có thể gửi qua Email cho khách hàng.
                    </p>
                  </div>
                </div>
              )}
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

          {/* TAB 3: ZALO (NCL-06-CN-006) */}
          {activeTab === "ZALO" && (
            <form onSubmit={handleSendZalo} className="flex flex-col gap-3.5">
              {invoice.status !== "ISSUED" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Lưu ý: Hóa đơn chưa phát hành</p>
                    <p className="text-[11px] text-amber-700 font-normal mt-0.5 leading-relaxed">
                      Hóa đơn đang ở trạng thái <strong className="font-extrabold text-amber-900">{invoice.status}</strong>. Chỉ hóa đơn đã phát hành mới có thể gửi tin qua Zalo.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Số điện thoại Zalo của khách hàng:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={zaloPhone}
                    onChange={(e) => setZaloPhone(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <MessageSquare className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tin nhắn mẫu qua Zalo Doanh nghiệp (Zalo OA):
                </label>
                <div className="w-full p-3 text-xs font-medium bg-slate-100/90 border border-slate-200 rounded-xl text-slate-700 leading-relaxed font-sans whitespace-pre-line select-none">
                  {zaloMessagePreview}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSendingZalo}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-extrabold text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {isSendingZalo ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  <span>{isSendingZalo ? "Đang gửi qua Zalo..." : "GỬI TIN NHẮN ZALO"}</span>
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
