import React, { useState } from "react";
import { createPortal } from "react-dom";
import { QRCode } from "antd";
import { Printer, X, Receipt, ShieldCheck } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { formatCurrency } from "@/utils/formatCurrency";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";
import { convertNumberToWords } from "@/modules/e_invoice/utils/eInvoiceHelpers";
import {
  getExchangeTypeLabel,
  getPaymentMethodLabel,
  formatExchangeTicketDateTime,
} from "../utils/productExchangeHelpers";
import type { IProductExchangeTicket } from "../types/IProductExchange";

interface ProductExchangePrintModalProps {
  ticket: IProductExchangeTicket | null;
  onClose: () => void;
}

export const ProductExchangePrintModal: React.FC<ProductExchangePrintModalProps> = ({
  ticket,
  onClose,
}) => {
  const [showQr, setShowQr] = useState<boolean>(true);

  const dialogRef = useAccessibleDialog({
    isOpen: Boolean(ticket),
    onClose,
  });

  const { data: householdResponse } = useGetMyHouseholdQuery(undefined, {
    skip: !ticket,
  });
  const household = householdResponse?.result;

  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const returnItems = ticket.items?.filter((i) => i.itemType === "RETURN_ITEM") || [];
  const exchangeItems = ticket.items?.filter((i) => i.itemType === "EXCHANGE_ITEM") || [];

  const createdDateStr = ticket.createdAt
    ? formatExchangeTicketDateTime(ticket.createdAt)
    : new Date().toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const lookupUrl = `${window.location.origin}/product-exchanges?code=${ticket.ticketNumber}`;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-fade-in"
    >
      {/* Printable Area Wrapper with print styles (K80 thermal receipt standard) */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-exchange-container, #printable-exchange-container * {
            visibility: visible !important;
          }
          #printable-exchange-container {
            position: relative !important;
            margin: 0 auto !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            max-width: 100% !important;
            padding: 2mm 2mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-hidden flex flex-col my-auto animate-modal-bounce-in"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-kv-blue-primary/10 text-kv-blue-primary flex items-center justify-center font-bold shrink-0">
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-800 truncate">
                Xem Trước Bản In Phiếu Đổi Hàng
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                Mã phiếu: <strong className="text-slate-700 font-mono">{ticket.ticketNumber}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Controls / Options Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Phiếu Đổi Hàng Cửa Hàng</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600">Khổ in:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-white font-bold text-xs">
                K80 (80mm)
              </span>
            </div>

            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showQr}
                onChange={(e) => setShowQr(e.target.checked)}
                className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary"
              />
              <span>In QR</span>
            </label>
          </div>
        </div>

        {/* Printable Section Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-200/40 flex justify-center items-start">
          <div
            id="printable-exchange-container"
            className="bg-white shadow-md border border-slate-300 text-slate-900 font-sans transition-all w-[360px] p-4 text-[11px] leading-tight"
          >
            {/* ─── STORE HEADER ─── */}
            <div className="text-center pb-2.5 border-b-2 border-slate-900 break-words">
              <h3 className="font-black text-base sm:text-lg uppercase text-slate-900 tracking-tight">
                {household?.name || "BÁN HÀNG VIỆT"}
              </h3>
              <p className="text-[10px] text-slate-700 font-medium mt-0.5">
                {household?.address
                  ? `ĐC: ${household.address}`
                  : "ĐC: Số 123 Nguyễn Trãi, Thanh Xuân, Hà Nội"}
              </p>
              <p className="text-[10px] text-slate-700 font-medium">
                MST: {household?.taxCode || "0102030405"} &nbsp;|&nbsp; Điện thoại:{" "}
                {household?.phoneNumber || "024.1234.5678"}
              </p>
            </div>

            {/* ─── DOCUMENT TITLE ─── */}
            <div className="text-center my-3">
              <h2 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-900">
                PHIẾU ĐỔI HÀNG
              </h2>
              <p className="text-[9px] text-slate-600 italic mt-0.5">
                (Chứng từ đổi hàng hóa tại quầy / Cửa hàng Bán Hàng Việt)
              </p>
              <div className="mt-2 text-[10px] text-slate-800 flex flex-wrap justify-center items-center gap-3 border-y border-slate-200 py-1 bg-slate-50/80 font-mono font-semibold">
                <span>
                  Mã phiếu: <strong>{ticket.ticketNumber}</strong>
                </span>
                {ticket.originalInvoiceNumber && (
                  <span>
                    HĐ gốc: <strong>{ticket.originalInvoiceNumber}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* ─── TRANSACTION META INFO ─── */}
            <div className="py-2 text-[10px] space-y-1 text-slate-800 border-b border-dashed border-slate-300 break-words">
              <div className="flex flex-wrap justify-between gap-1">
                <span>
                  <strong>Khách hàng:</strong> {ticket.customerName || "Khách lẻ"}
                </span>
                <span>
                  <strong>Ngày lập:</strong> {createdDateStr}
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                <span>
                  <strong>Thu ngân:</strong> {ticket.createdByName || "Nhân viên"}
                </span>
                <span>
                  <strong>Hình thức:</strong> {getExchangeTypeLabel(ticket.exchangeType)}
                </span>
              </div>
              {ticket.reason && (
                <div className="flex flex-wrap justify-between gap-1">
                  <span>
                    <strong>Lý do:</strong> <span className="italic">{ticket.reason}</span>
                  </span>
                </div>
              )}
            </div>

            {/* ─── [1] HÀNG TRẢ LẠI (HOÀN KHO) ─── */}
            <div className="my-2.5">
              <div className="font-black uppercase text-[10px] text-slate-900 mb-1 flex items-center justify-between">
                <span>[1] HÀNG TRẢ LẠI (HOÀN KHO)</span>
                <span className="text-[9px] font-normal text-slate-500 font-sans">
                  ({returnItems.length} sản phẩm)
                </span>
              </div>
              <table className="w-full text-left border-collapse text-[10px] min-w-full">
                <thead>
                  <tr className="border-b-2 border-slate-900 font-extrabold text-slate-900 bg-slate-100">
                    <th className="p-1 w-6 text-center">STT</th>
                    <th className="p-1">Tên hàng hóa</th>
                    <th className="p-1 text-center w-7">SL</th>
                    <th className="p-1 text-right w-16">Đ.Giá</th>
                    <th className="p-1 text-right w-18">T.Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {returnItems.map((item, idx) => (
                    <tr key={item.id || idx} className="align-top">
                      <td className="p-1 text-center font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-1 font-semibold text-slate-900 break-words">
                        <div>{item.productName}</div>
                      </td>
                      <td className="p-1 text-center font-bold">{item.quantity}</td>
                      <td className="p-1 text-right whitespace-nowrap">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="p-1 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  {returnItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-2 text-center text-slate-400 italic">
                        Không có mặt hàng trả lại
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-between font-bold text-[10.5px] py-1 mt-1 border-t border-slate-300 text-slate-800">
                <span>Cộng tiền hàng trả lại (A):</span>
                <span className="font-mono text-slate-900">
                  {formatCurrency(ticket.totalReturnAmount)}
                </span>
              </div>
            </div>

            {/* ─── [2] HÀNG ĐỔI SANG (TRỪ KHO) ─── */}
            <div className="my-2.5">
              <div className="font-black uppercase text-[10px] text-slate-900 mb-1 flex items-center justify-between">
                <span>[2] HÀNG ĐỔI MỚI (TRỪ KHO)</span>
                <span className="text-[9px] font-normal text-slate-500 font-sans">
                  ({exchangeItems.length} sản phẩm)
                </span>
              </div>
              <table className="w-full text-left border-collapse text-[10px] min-w-full">
                <thead>
                  <tr className="border-b-2 border-slate-900 font-extrabold text-slate-900 bg-slate-100">
                    <th className="p-1 w-6 text-center">STT</th>
                    <th className="p-1">Tên hàng hóa</th>
                    <th className="p-1 text-center w-7">SL</th>
                    <th className="p-1 text-right w-16">Đ.Giá</th>
                    <th className="p-1 text-right w-18">T.Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {exchangeItems.map((item, idx) => (
                    <tr key={item.id || idx} className="align-top">
                      <td className="p-1 text-center font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-1 font-semibold text-slate-900 break-words">
                        <div>{item.productName}</div>
                      </td>
                      <td className="p-1 text-center font-bold">{item.quantity}</td>
                      <td className="p-1 text-right whitespace-nowrap">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="p-1 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  {exchangeItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-2 text-center text-slate-400 italic">
                        Không có mặt hàng đổi mới
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-between font-bold text-[10.5px] py-1 mt-1 border-t border-slate-300 text-slate-800">
                <span>Cộng tiền hàng đổi mới (B):</span>
                <span className="font-mono text-slate-900">
                  {formatCurrency(ticket.totalExchangeAmount)}
                </span>
              </div>
            </div>

            {/* ─── SUMMARY BLOCK (STYLE HÓA ĐƠN THANH TOÁN NHANH) ─── */}
            <div className="border-t-2 border-slate-900 pt-2 space-y-1.5 text-[10px]">
              {/* 1. Tiền hàng trả */}
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Tổng tiền hàng trả lại (A):</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(ticket.totalReturnAmount)}
                </span>
              </div>

              {/* 2. Tiền hàng đổi */}
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Tổng tiền hàng đổi mới (B):</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(ticket.totalExchangeAmount)}
                </span>
              </div>

              {/* 3. Chênh lệch thanh toán */}
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-900 text-slate-900 bg-slate-50 px-2 py-1 rounded">
                <span className="font-bold text-slate-800 text-[11px] sm:text-xs whitespace-nowrap">
                  Chênh lệch thanh toán:
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-slate-950 font-mono whitespace-nowrap">
                  {ticket.differenceAmount > 0
                    ? `+${formatCurrency(ticket.differenceAmount)}`
                    : formatCurrency(ticket.differenceAmount)}
                </span>
              </div>

              {/* 4. Trạng thái thanh toán */}
              <div className="flex justify-between items-center text-[9.5px] font-bold">
                <span className="text-slate-600">Trạng thái thanh toán:</span>
                <span
                  className={
                    ticket.differenceAmount > 0
                      ? "text-blue-700"
                      : ticket.differenceAmount < 0
                      ? "text-emerald-700"
                      : "text-slate-700"
                  }
                >
                  {ticket.differenceAmount > 0
                    ? "Khách cần trả thêm (Phụ thu)"
                    : ticket.differenceAmount < 0
                    ? "Cửa hàng hoàn tiền cho khách"
                    : "Đổi ngang giá (Không chênh lệch)"}
                </span>
              </div>

              {/* 5. Bằng chữ */}
              <div className="text-[9px] sm:text-[9.5px] italic text-slate-700 text-right pt-0.5 break-words">
                Bằng chữ: <strong>{convertNumberToWords(Math.abs(ticket.differenceAmount))}</strong>
              </div>

              {/* 6. Chi tiết hóa đơn bổ sung & phương thức thanh toán */}
              {(ticket.additionalInvoiceNumber || ticket.extraPaymentMethod) && (
                <div className="border-t border-dashed border-slate-300 pt-1.5 mt-1 flex flex-col gap-1 text-[9.5px]">
                  {ticket.additionalInvoiceNumber && (
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold">Hóa đơn bổ sung chênh lệch:</span>
                      <span className="font-bold font-mono text-slate-900">
                        {ticket.additionalInvoiceNumber}
                      </span>
                    </div>
                  )}
                  {ticket.extraPaymentMethod && (
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold">Phương thức TT chênh lệch:</span>
                      <span className="font-bold text-slate-900">
                        {getPaymentMethodLabel(ticket.extraPaymentMethod)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── QR CODE & STORE FOOTER ─── */}
            {showQr && (
              <div className="mt-3 sm:mt-4 flex flex-col items-center gap-1 text-center border-t border-dashed border-slate-300 pt-2.5">
                <QRCode type="svg" value={lookupUrl} size={90} bordered={false} />
                <span className="text-[9px] text-slate-600 font-semibold max-w-[260px]">
                  Quét mã QR để tra cứu phiếu đổi hàng
                </span>
              </div>
            )}

            {/* ─── SIGNATURES ─── */}
            <div className="grid grid-cols-2 text-center pt-4 pb-2 text-[10px] border-t border-dashed border-slate-300 mt-2">
              <div>
                <p className="font-bold uppercase text-slate-800">Khách Hàng</p>
                <p className="text-[9px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</p>
                <div className="h-10"></div>
                <p className="font-semibold text-slate-700">{ticket.customerName || "Khách hàng"}</p>
              </div>
              <div>
                <p className="font-bold uppercase text-slate-800">Người Lập Phiếu</p>
                <p className="text-[9px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</p>
                <div className="h-10"></div>
                <p className="font-semibold text-slate-700">{ticket.createdByName || "Thu ngân"}</p>
              </div>
            </div>

            {/* ─── STORE GREETING ─── */}
            <div className="mt-3 text-center text-[9px] text-slate-600 border-t border-slate-200 pt-2 space-y-0.5 break-words">
              <p className="font-bold text-slate-800 text-[10px]">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</p>
              <p>Vui lòng kiểm tra lại hàng hóa và chứng từ trước khi rời khỏi quầy.</p>
              <p className="text-[8.5px] text-slate-500 font-mono pt-1">
                Hotline hỗ trợ: {household?.phoneNumber || "024.1234.5678"} | Website: banhangviet.vn
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions (no-print) */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Mẫu in nhiệt K80 tiêu chuẩn Bán Hàng Việt</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-extrabold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>IN PHIẾU ĐỔI HÀNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductExchangePrintModal;
