import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { E_INVOICE_STATUS, E_INVOICE_DEFAULTS } from "@/constants/eInvoice";
import { USER_ROLES } from "@/constants/roles";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import type { IInvoice } from "../types/IInvoice";
import type { IDeliveryLog } from "../types/IInvoiceDelivery";
import { CancelInvoiceModal } from "./CancelInvoiceModal";
import { SendInvoiceModal } from "./SendInvoiceModal";
import { PrintInvoiceModal } from "./PrintInvoiceModal";
import { useGetInvoiceLogsQuery } from "../services/eInvoiceApi";
import {
  getStatusClassName,
  getStatusLabel,
  convertNumberToWords,
} from "../utils/eInvoiceHelpers";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: IInvoice;
  currentRole: string;
  onSendToTax: (id: string) => Promise<void>;
  onResendToTax: (id: string) => Promise<void>;
  onCancelInvoice: (id: string, reason: string) => Promise<void>;
  onUpdateInvoice: (
    id: string,
    buyerInfo: {
      buyerName: string;
      buyerTaxCode: string;
      buyerAddress: string;
      buyerPhone: string;
      buyerEmail: string;
    }
  ) => Promise<void>;
}

const formatInvoiceDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString || "";
  }
};

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  currentRole,
  onSendToTax,
  onResendToTax,
  onCancelInvoice,
  onUpdateInvoice,
}) => {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [deliveryLogs, setDeliveryLogs] = useState<IDeliveryLog[]>(invoice.deliveryLogs || []);
  const [isActionPending, setIsActionPending] = useState(false);

  // States for buyer editing
  const [buyerName, setBuyerName] = useState(invoice.buyerName || invoice.customer || "");
  const [buyerTaxCode, setBuyerTaxCode] = useState(invoice.buyerTaxCode || "");
  const [buyerAddress, setBuyerAddress] = useState(invoice.buyerAddress || "");
  const [buyerPhone, setBuyerPhone] = useState(invoice.buyerPhone || "");
  const [buyerEmail, setBuyerEmail] = useState(invoice.buyerEmail || "");

  // Sync state if invoice changes
  React.useEffect(() => {
    setBuyerName(invoice.buyerName || invoice.customer || "");
    setBuyerTaxCode(invoice.buyerTaxCode || "");
    setBuyerAddress(invoice.buyerAddress || "");
    setBuyerPhone(invoice.buyerPhone || "");
    setBuyerEmail(invoice.buyerEmail || "");
  }, [invoice]);

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  // Query status logs from Backend API GET /invoices/{id}/logs
  const { data: logsResponse } = useGetInvoiceLogsQuery(invoice?.id, {
    skip: !isOpen || !invoice?.id,
  });
  const backendLogs = logsResponse?.result;

  if (!isOpen) return null;

  const isOwnerOrAccountant = currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;
  const isTaxAuthority = currentRole === USER_ROLES.TAX_AUTHORITY || currentRole === "VT-05";
  const canCancel = invoice.status === E_INVOICE_STATUS.ISSUED && isOwnerOrAccountant;

  const handleSendToTaxClick = async () => {
    setIsActionPending(true);
    try {
      // 1. Save inputs
      await onUpdateInvoice(invoice.id, {
        buyerName: buyerName.trim(),
        buyerTaxCode: buyerTaxCode.trim(),
        buyerAddress: buyerAddress.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerEmail: buyerEmail.trim(),
      });

      // 2. Resend/Send to tax
      if (invoice.status === E_INVOICE_STATUS.SEND_ERROR) {
        await onResendToTax(invoice.id);
      } else {
        await onSendToTax(invoice.id);
      }
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    await onCancelInvoice(invoice.id, reason);
  };

  // Build status logs timeline with robust active checks
  const timelineEvents =
    backendLogs && backendLogs.length > 0
      ? backendLogs.map((log) => {
          const isTaxResponse =
            log.toStatus === E_INVOICE_STATUS.ISSUED ||
            log.toStatus === E_INVOICE_STATUS.SEND_ERROR;
          const performer = isTaxResponse
            ? "Cơ quan Thuế"
            : log.changedByFullName
            ? `Thực hiện: ${log.changedByFullName}`
            : "Hệ thống";

          return {
            title: getStatusLabel(log.toStatus as any) || "Chuyển trạng thái",
            time: log.createdAt,
            description: `${log.notes || "Thao tác hệ thống"} (${performer})`,
            active: true,
            error: log.toStatus === E_INVOICE_STATUS.SEND_ERROR,
            warning: log.toStatus === E_INVOICE_STATUS.CANCELED,
          };
        })
      : [
          {
            title: "Khởi tạo hóa đơn",
            time: invoice.createdAt || invoice.time,
            description: `Khởi tạo hóa đơn nháp từ đơn hàng ${invoice.orderNumber || ""}.`,
            active: true,
          },
          {
            title: "Gửi cơ quan thuế",
            time: invoice.sentToTaxAt || invoice.createdAt || invoice.time,
            description: "Hệ thống đã gửi dữ liệu lên Cơ quan Thuế mô phỏng.",
            active:
              invoice.status === E_INVOICE_STATUS.WAITING_TAX_CODE ||
              invoice.status === E_INVOICE_STATUS.ISSUED ||
              invoice.status === E_INVOICE_STATUS.SEND_ERROR ||
              invoice.status === E_INVOICE_STATUS.ADJUSTED ||
              !!invoice.sentToTaxAt,
          },
          {
            title: invoice.status === E_INVOICE_STATUS.SEND_ERROR ? "Cơ quan thuế từ chối" : "Cơ quan thuế cấp mã",
            time: invoice.taxResponseAt,
            description:
              invoice.status === E_INVOICE_STATUS.SEND_ERROR
                ? `Lỗi: ${invoice.taxAuthorityResponse || "Dữ liệu hóa đơn không hợp lệ."}`
                : `Cấp mã thành công: ${invoice.taxAuthorityCode || ""}`,
            active:
              invoice.status === E_INVOICE_STATUS.ISSUED ||
              invoice.status === E_INVOICE_STATUS.SEND_ERROR ||
              invoice.status === E_INVOICE_STATUS.ADJUSTED ||
              !!invoice.taxResponseAt,
            error: invoice.status === E_INVOICE_STATUS.SEND_ERROR,
          },
          {
            title: "Hủy hóa đơn",
            time: invoice.canceledAt,
            description: `Hóa đơn đã bị hủy bởi ${invoice.canceledByUsername || "Chủ hộ/Kế toán"}. Lý do: ${
              invoice.cancelReason || "Không có"
            }`,
            active: invoice.status === E_INVOICE_STATUS.CANCELED,
            warning: true,
          },
        ].filter((e) => e.active);

  return createPortal(
    <div
      onClick={onClose}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 animate-backdrop-fade-in sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết hóa đơn ${invoice.lookupCode}`}
        className="app-modal-panel flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in lg:h-[90vh]"
      >
        {/* Header */}
        <div className="app-modal-header flex items-center justify-between bg-slate-800 px-5 py-3 text-white">
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>Chi Tiết Hóa Đơn Điện Tử: {invoice.lookupCode}</span>
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center text-lg text-white/80 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row lg:items-stretch gap-6">
          <div className="flex-1 shrink-0 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 text-[10px] text-slate-800 font-medium relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] text-slate-800 text-[3.5rem] font-extrabold rotate-[30deg] uppercase whitespace-nowrap">
              Hóa đơn điện tử
            </div>

            {/* Invoice Header */}
            <div className="flex justify-between border-b pb-4 flex-wrap gap-4">
              <div>
                <h1 className="text-sm font-extrabold text-kv-blue-primary tracking-wide">
                  HÓA ĐƠN GIÁ TRỊ GIA TĂNG
                </h1>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                  (Bản mô phỏng hóa đơn điện tử)
                </p>
                <p className="text-[10px] font-bold text-slate-600 mt-2 flex items-center gap-2">
                  <span>Ngày lập: {formatInvoiceDateTime(invoice.createdAt || invoice.time)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${getStatusClassName(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </p>
              </div>
              <div className="text-right flex flex-col gap-0.5 font-bold text-slate-600 text-[10px]">
                <p>Mẫu số: <span className="text-slate-800 font-extrabold">{invoice.invoicePattern || "1"}</span></p>
                <p>Ký hiệu: <span className="text-slate-800 font-extrabold">{invoice.invoiceSymbol || invoice.symbol}</span></p>
                <p>Số HĐ: <span className="text-kv-blue-primary font-mono font-extrabold">{invoice.invoiceNumber || "Chưa cấp số"}</span></p>
                <p>Mã tra cứu: <span className="text-slate-800 font-mono font-extrabold">{invoice.lookupCode}</span></p>
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-b pb-3 text-[10px] leading-relaxed text-slate-600">
              <p className="font-extrabold text-slate-800 text-xs uppercase mb-1">
                Đơn vị bán hàng: {invoice.householdName || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
              </p>
              <p>Mã số thuế: <span className="font-bold text-slate-800">0102030405-999</span></p>
              <p>Địa chỉ: Số 12 Ba Đình, Thành phố Hà Nội, Việt Nam</p>
              <p>Điện thoại: 024.3999999</p>
            </div>

            {/* Buyer Info */}
            <div className="border-b pb-3 text-[10px] leading-relaxed text-slate-600">
              <p className="font-extrabold text-slate-800 text-xs uppercase mb-1">Thông tin người mua hàng</p>
              {!isTaxAuthority && (invoice.status === E_INVOICE_STATUS.DRAFT || invoice.status === E_INVOICE_STATUS.SEND_ERROR) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-1">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Họ tên người mua</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Khách vãng lai"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Mã số thuế</label>
                    <input
                      type="text"
                      value={buyerTaxCode}
                      onChange={(e) => setBuyerTaxCode(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Mã số thuế..."
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Địa chỉ</label>
                    <input
                      type="text"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Địa chỉ..."
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Điện thoại</label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Số điện thoại..."
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Email</label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-[10px] font-semibold focus:outline-none focus:border-kv-blue-primary"
                      placeholder="Email..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <p>Họ tên người mua: <span className="font-bold text-slate-800">{invoice.buyerName || invoice.customer || "Khách vãng lai"}</span></p>
                  <p>Mã số thuế: <span className="font-bold text-slate-800">{invoice.buyerTaxCode || "-"}</span></p>
                  <p className="sm:col-span-2">Địa chỉ: {invoice.buyerAddress || "-"}</p>
                  <p>Điện thoại: {invoice.buyerPhone || "-"}</p>
                  <p>Email: {invoice.buyerEmail || "-"}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="flex-1">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[9px] uppercase">
                    <th className="p-2 border-r border-slate-200 text-center w-8">STT</th>
                    <th className="p-2 border-r border-slate-200">Tên hàng hóa, dịch vụ</th>
                    <th className="p-2 border-r border-slate-200 text-center w-12">ĐVT</th>
                    <th className="p-2 border-r border-slate-200 text-center w-12">SL</th>
                    <th className="p-2 border-r border-slate-200 text-right w-20">Đơn giá</th>
                    <th className="p-2 border-r border-slate-200 text-center w-14">Thuế (%)</th>
                    <th className="p-2 text-right w-24">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-semibold">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{item.productName}</td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-500">{item.unit || "Lon"}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 border-r border-slate-200 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2 border-r border-slate-200 text-center text-slate-500">{item.taxRatePercentage}%</td>
                        <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2 border-r border-slate-200 text-center">1</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-800">Hàng hóa tổng hợp (Lĩnh vực bán lẻ)</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-500">Lần</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">1</td>
                      <td className="p-2 border-r border-slate-200 text-right">{formatCurrency(invoice.amount)}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-500">8%</td>
                      <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(invoice.amount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Area */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2 font-bold text-slate-700 text-xs">
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-slate-500">Cộng tiền hàng (Chưa thuế):</span>
                <span>{formatCurrency(invoice.totalAmountBeforeTax || invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="font-semibold text-slate-500">Tổng tiền thuế GTGT:</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              {invoice.discountAmount !== undefined && invoice.discountAmount > 0 && (
                <div className="flex justify-between text-[10px] text-rose-500">
                  <span className="font-semibold">Chiết khấu thương mại:</span>
                  <span>-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-950">
                <span>Tổng tiền thanh toán:</span>
                <span className="font-extrabold text-kv-blue-primary">{formatCurrency(invoice.finalAmount)}</span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-2 text-[9px] font-semibold text-slate-500 italic leading-relaxed">
                Số tiền viết bằng chữ: <span className="text-slate-800 font-bold not-italic">{convertNumberToWords(invoice.finalAmount)}</span>
              </div>
            </div>

            {/* Digital Signatures Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-slate-100">
              {/* Buyer column */}
              <div className="flex flex-col items-center text-center">
                <span className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wide">Người mua hàng</span>
                <span className="text-[8px] text-slate-400 mt-0.5 italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-center justify-center text-slate-300 font-semibold text-[9px] italic">
                  (Ký số điện tử)
                </div>
              </div>

              {/* Seller column */}
              <div className="flex flex-col items-center text-center relative">
                <span className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wide">Người bán hàng</span>
                <span className="text-[8px] text-slate-400 mt-0.5 italic">(Ký, đóng dấu điện tử)</span>
                
                {invoice.status !== E_INVOICE_STATUS.DRAFT ? (
                  <div className="mt-2.5 px-3 py-2 border-2 border-rose-500 rounded bg-rose-50/40 text-[8px] text-rose-700 font-bold flex flex-col items-center gap-0.5 rotate-[-2deg] shadow-sm max-w-[180px] leading-normal select-none">
                    <span className="text-[9px] text-rose-600 flex items-center gap-1 font-black">
                      🛡️ ĐÃ KÝ SỐ ĐIỆN TỬ
                    </span>
                    <span className="uppercase tracking-wide text-[7px] text-rose-600">HỘ KINH DOANH BÁN HÀNG VIỆT</span>
                    <span>MST: 0102030405-999</span>
                    <span>Ngày ký: {formatInvoiceDateTime(invoice.createdAt || invoice.time)}</span>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center text-slate-300 font-semibold text-[9px] italic">
                    (Chưa ký số)
                  </div>
                )}
              </div>

              {/* Tax Authority Stamp for ISSUED invoices */}
              {invoice.status === E_INVOICE_STATUS.ISSUED && invoice.taxAuthorityCode && invoice.taxAuthorityCode !== E_INVOICE_DEFAULTS.EMPTY_TAX_AUTHORITY_CODE && (
                <div className="col-span-1 sm:col-span-2 flex justify-center mt-2">
                  <div className="px-4 py-2 border-2 border-emerald-500 rounded bg-emerald-50/40 text-[8px] text-emerald-800 font-bold flex items-center gap-3 rotate-[1deg] shadow-sm max-w-[320px] leading-normal select-none">
                    <span className="text-[12px] text-emerald-600 font-black">✓</span>
                    <div className="flex flex-col text-left">
                      <span className="font-black uppercase tracking-wider text-[9px]">MÃ CƠ QUAN THUẾ CẤP</span>
                      <span className="font-mono text-[9px] tracking-wider text-slate-800 font-extrabold">{invoice.taxAuthorityCode}</span>
                      <span>Ngày cấp: {formatInvoiceDateTime(invoice.taxResponseAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Timeline & Admin Controls */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6 self-stretch">
            {/* Timeline */}
            <div className="flex-1 min-h-[220px] bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-slate-800 text-xs border-b pb-2.5 uppercase tracking-wide shrink-0">
                Lịch sử trạng thái
              </h3>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="relative border-l border-slate-200 pl-4 ml-2 flex flex-col gap-5 text-[10px] py-1">
                  {timelineEvents.map((event, idx) => (
                    <div key={idx} className="relative">
                      {/* Circle Node */}
                      <span className={`absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-white ${
                        event.error 
                          ? "border-rose-500 text-rose-500" 
                          : event.warning 
                          ? "border-amber-500 text-amber-500" 
                          : "border-kv-blue-primary text-kv-blue-primary"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          event.error 
                            ? "bg-rose-500" 
                            : event.warning 
                            ? "bg-amber-500" 
                            : "bg-kv-blue-primary"
                        }`} />
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-slate-800 text-xs">{event.title}</span>
                        <span className="font-bold text-slate-400 font-mono text-[9px]">
                          {event.time ? formatDate(event.time) : "Đang chờ..."}
                        </span>
                        <p className="text-slate-500 leading-normal font-medium mt-1 pr-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Admin actions block */}
            {!isTaxAuthority && (
              <div className="shrink-0 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                <h3 className="font-extrabold text-slate-800 text-xs border-b pb-2.5 uppercase tracking-wide">
                  Thao tác nghiệp vụ
                </h3>

              <div className="flex flex-col gap-2 font-bold">
                {/* Send invoice to customer (QR, Zalo, Email) */}
                <button
                  type="button"
                  onClick={() => setShowSendModal(true)}
                  className="w-full flex min-h-9 py-1.5 items-center justify-center rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                  GỬI HÓA ĐƠN CHO KHÁCH
                </button>

                {/* Print invoice */}
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="w-full flex min-h-9 py-1.5 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 text-[11px] font-bold hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                  </svg>
                  IN HÓA ĐƠN CHO KHÁCH
                </button>

                {/* Submit to tax authority */}
                {(invoice.status === E_INVOICE_STATUS.DRAFT || invoice.status === E_INVOICE_STATUS.SEND_ERROR) && (
                  <button
                    type="button"
                    onClick={handleSendToTaxClick}
                    disabled={isActionPending}
                    className="w-full flex min-h-9 py-1.5 items-center justify-center rounded-lg bg-kv-blue-primary text-white text-[11px] font-bold hover:bg-kv-blue-dark transition-colors shadow-sm disabled:cursor-wait disabled:opacity-60"
                  >
                    {isActionPending ? (
                      <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <svg className="w-3.5 h-3.5 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                      </svg>
                    )}
                    {invoice.status === E_INVOICE_STATUS.SEND_ERROR ? "SỬA LỖI & GỬI LẠI THUẾ" : "GỬI CƠ QUAN THUẾ"}
                  </button>
                )}

                {/* Cancel invoice */}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    disabled={isActionPending}
                    className="w-full flex min-h-9 py-1.5 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-[11px] font-bold hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-sm disabled:opacity-60"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    YÊU CẦU HỦY HÓA ĐƠN
                  </button>
                )}

                {/* Adjust invoice */}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/e-invoices/${invoice.id}/adjust`);
                    }}
                    className="w-full flex min-h-9 py-1.5 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-bold hover:bg-amber-100 hover:text-amber-800 transition-colors shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    LẬP HÓA ĐƠN ĐIỀU CHỈNH
                  </button>
                )}

                {currentRole === USER_ROLES.CASHIER && invoice.status === E_INVOICE_STATUS.ISSUED && (
                  <span className="text-[10px] text-slate-400 font-semibold italic text-center p-2 border border-dashed rounded-lg">
                    🔒 Tài khoản thu ngân không được quyền thực hiện điều chỉnh hoặc hủy hóa đơn.
                  </span>
                )}

                {invoice.status === E_INVOICE_STATUS.CANCELED && (
                  <div className="text-[10px] text-rose-700 font-semibold p-3 border border-rose-200 bg-rose-50 rounded-lg text-center leading-relaxed">
                    Hóa đơn này đã được hủy vào ngày {invoice.canceledAt ? formatDate(invoice.canceledAt) : ""}. Không thể thực hiện thêm thao tác.
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Cancel Dialog Portal */}
        {showCancelModal && (
          <CancelInvoiceModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onConfirm={handleCancelConfirm}
            invoiceLookupCode={invoice.lookupCode}
          />
        )}

        {/* Send Invoice Modal Portal */}
        {showSendModal && (
          <SendInvoiceModal
            isOpen={showSendModal}
            onClose={() => setShowSendModal(false)}
            invoice={invoice}
            onDeliverySuccess={(log) => setDeliveryLogs([log, ...deliveryLogs])}
          />
        )}

        {/* Print Invoice Modal Portal */}
        {showPrintModal && (
          <PrintInvoiceModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            invoice={invoice}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
export default InvoiceDetailModal;
