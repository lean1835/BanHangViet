import React, { useState } from "react";
import { createPortal } from "react-dom";
import { QRCode } from "antd";
import { Printer, X, Receipt, ShieldCheck } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { formatCurrency } from "@/utils/formatCurrency";
import { convertNumberToWords } from "../utils/eInvoiceHelpers";
import type { IInvoice } from "../types/IInvoice";
import type { IInvoicePrintConfig } from "../types/IInvoiceDelivery";

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: IInvoice;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const [config, setConfig] = useState<IInvoicePrintConfig>({
    paperSize: "K80",
    docType: "TEMP_RECEIPT",
    showQr: true,
    copyCount: 1,
  });

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const lookupUrl = `${window.location.origin}/lookup-invoice?code=${invoice.lookupCode}`;

  // Robust calculations
  const itemsList = invoice.items && invoice.items.length > 0 ? invoice.items : null;
  const itemsSum = itemsList
    ? itemsList.reduce((sum, item) => sum + (item.subtotal || item.unitPrice * item.quantity), 0)
    : (invoice.totalAmountBeforeTax || invoice.amount || (invoice.finalAmount ? invoice.finalAmount - (invoice.taxAmount || 0) : 0));

  const preTaxAmount = itemsSum > 0 ? itemsSum : (invoice.finalAmount - (invoice.taxAmount || 0));
  const taxAmount = invoice.taxAmount ?? Math.round(preTaxAmount * 0.08);
  const finalTotal = invoice.finalAmount || (preTaxAmount + taxAmount);
  
  const createdDateStr = invoice.time || new Date().toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Printable Area Wrapper with print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-container, #printable-invoice-container * {
            visibility: visible !important;
          }
          #printable-invoice-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8px !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        ref={dialogRef}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-kv-blue-primary/10 text-kv-blue-primary flex items-center justify-center font-bold shrink-0">
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-800 truncate">
                In Phiếu / Hóa Đơn Cho Khách Hàng
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                Mã phiếu: <strong className="text-slate-700 font-mono">{invoice.lookupCode}</strong>
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
          {/* Document Type Label */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Phiếu Thanh Toán Cửa Hàng</span>
            </span>
          </div>

          {/* Paper Size & Options */}
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
                checked={config.showQr}
                onChange={(e) => setConfig({ ...config, showQr: e.target.checked })}
                className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary"
              />
              <span>In QR</span>
            </label>
          </div>
        </div>

        {/* Printable Section Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-200/40 flex justify-center items-start">
          <div
            id="printable-invoice-container"
            className="bg-white shadow-md border border-slate-300 text-slate-900 font-sans transition-all w-[340px] p-4 text-[11px] leading-tight"
          >
            {/* ─── STORE HEADER ─── */}
            <div className="text-center pb-2.5 border-b-2 border-slate-900 break-words">
              <h3 className="font-black text-base sm:text-lg uppercase text-slate-900 tracking-tight">
                BÁN HÀNG VIỆT
              </h3>
              <p className="text-[10px] text-slate-700 font-medium mt-0.5">
                ĐC: Số 123 Nguyễn Trãi, Thanh Xuân, Hà Nội
              </p>
              <p className="text-[10px] text-slate-700 font-medium">
                MST: 0102030405 &nbsp;|&nbsp; Điện thoại: 024.1234.5678
              </p>
            </div>

            {/* ─── DOCUMENT TITLE ─── */}
            <div className="text-center my-3">
              <h2 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-900">
                PHIẾU THANH TOÁN
              </h2>
              <p className="text-[9px] text-slate-600 italic mt-0.5">
                (Phiếu kiểm tra tiền trước khi thanh toán / Chưa có giá trị thuế)
              </p>
              <div className="mt-2 text-[10px] text-slate-800 flex flex-wrap justify-center items-center gap-3 border-y border-slate-200 py-1 bg-slate-50/80 font-mono font-semibold">
                <span>Mã phiếu: <strong>{invoice.lookupCode}</strong></span>
                {invoice.orderNumber && (
                  <span>Số đơn: <strong>{invoice.orderNumber}</strong></span>
                )}
              </div>
            </div>

            {/* ─── TRANSACTION META INFO ─── */}
            <div className="py-2 text-[10px] space-y-1 text-slate-800 border-b border-dashed border-slate-300 break-words">
              <div className="flex flex-wrap justify-between gap-1">
                <span><strong>Khách hàng:</strong> {invoice.buyerName || invoice.customer || "Khách mua lẻ"}</span>
                <span><strong>Ngày lập:</strong> {createdDateStr}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-1">
                <span><strong>Thu ngân:</strong> {invoice.createdByUsername || "Thu ngân 01"}</span>
                <span><strong>Hình thức TT:</strong> Tiền mặt / CK</span>
              </div>
              {invoice.buyerPhone && (
                <div><strong>Điện thoại:</strong> {invoice.buyerPhone}</div>
              )}
            </div>

            {/* ─── ITEMS TABLE ─── */}
            <div className="my-3 overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] min-w-full">
                <thead>
                  <tr className="border-b-2 border-slate-900 font-extrabold text-slate-900 bg-slate-100">
                    <th className="p-1 sm:p-1.5 w-6 text-center">STT</th>
                    <th className="p-1 sm:p-1.5">Tên hàng hóa, dịch vụ</th>
                    <th className="p-1 sm:p-1.5 text-center w-7">SL</th>
                    <th className="p-1 sm:p-1.5 text-right w-14 sm:w-16">Đ.Giá</th>
                    <th className="p-1 sm:p-1.5 text-right w-16 sm:w-20">T.Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {itemsList ? (
                    itemsList.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="p-1 sm:p-1.5 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="p-1 sm:p-1.5 font-semibold text-slate-900 break-words">{item.productName}</td>
                        <td className="p-1 sm:p-1.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-1 sm:p-1.5 text-right whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-1 sm:p-1.5 text-right font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(item.subtotal || item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="align-top">
                      <td className="p-1 sm:p-1.5 text-center font-bold text-slate-600">1</td>
                      <td className="p-1 sm:p-1.5 font-semibold text-slate-900 break-words">Mì ăn liền Hảo Hảo Tôm Chua Cay</td>
                      <td className="p-1 sm:p-1.5 text-center font-bold">19</td>
                      <td className="p-1 sm:p-1.5 text-right whitespace-nowrap">4.500 đ</td>
                      <td className="p-1 sm:p-1.5 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(preTaxAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── SUMMARY BLOCK ─── */}
            <div className="border-t-2 border-slate-900 pt-2 space-y-1.5 text-[10px]">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Cộng tiền hàng:</span>
                <span className="font-bold text-slate-900">{formatCurrency(preTaxAmount)}</span>
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Thuế suất GTGT (8%):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(taxAmount)}</span>
                </div>
              )}

              {invoice.discountAmount && invoice.discountAmount > 0 ? (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Chiết khấu / Giảm giá:</span>
                  <span className="font-bold">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between items-center font-black text-xs sm:text-sm pt-1.5 border-t border-slate-900 text-slate-900 bg-slate-50 px-2 py-1 rounded">
                <span>TỔNG THANH TOÁN:</span>
                <span className="text-sm sm:text-base text-slate-900">{formatCurrency(finalTotal)}</span>
              </div>

              <div className="text-[9px] sm:text-[9.5px] italic text-slate-700 text-right pt-0.5 break-words">
                Bằng chữ: <strong>{convertNumberToWords(finalTotal)}</strong>
              </div>
            </div>

            {/* ─── QR CODE & STORE FOOTER ─── */}
            {config.showQr && (
              <div className="mt-3 sm:mt-4 flex flex-col items-center gap-1 text-center border-t border-dashed border-slate-300 pt-2.5">
                <QRCode value={lookupUrl} size={100} bordered={false} />
                <span className="text-[9px] text-slate-600 font-semibold max-w-[260px]">
                  Quét mã QR để chuyển khoản hoặc tra cứu hóa đơn
                </span>
              </div>
            )}

            <div className="mt-3 text-center text-[9px] text-slate-600 border-t border-slate-200 pt-2 space-y-0.5 break-words">
              <p className="font-bold text-slate-800 text-[10px]">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</p>
              <p>Vui lòng kiểm tra lại hàng hóa và số tiền trước khi rời khỏi quầy.</p>
              <p className="text-[8.5px] text-slate-500 font-mono pt-1">
                Hotline hỗ trợ: 024.1234.5678 | Website: banhangviet.vn
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Mẫu in tiêu chuẩn cửa hàng Bán Hàng Việt</span>
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
              <span>IN PHIẾU THANH TOÁN</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PrintInvoiceModal;
