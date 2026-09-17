import React from "react";
import { X, Printer } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { getExchangeTypeLabel } from "../utils/productExchangeHelpers";
import type { IProductExchangeTicket } from "../types/IProductExchange";

interface ProductExchangePrintModalProps {
  ticket: IProductExchangeTicket | null;
  onClose: () => void;
}

export const ProductExchangePrintModal: React.FC<ProductExchangePrintModalProps> = ({
  ticket,
  onClose,
}) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const returnItems = ticket.items?.filter((i) => i.itemType === "RETURN_ITEM") || [];
  const exchangeItems = ticket.items?.filter((i) => i.itemType === "EXCHANGE_ITEM") || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Actions Bar (hidden on print) */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <span className="font-bold text-sm text-slate-700">Xem Trước Bản In Phiếu Đổi Hàng</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div id="printable-exchange-ticket" className="p-8 overflow-y-auto flex-1 font-mono text-xs leading-relaxed">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-base font-black tracking-wider uppercase">CỬA HÀNG BÁN LẺ BÁNH HÀNG VIỆT</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Hệ thống quản lý bán hàng chuẩn Thông tư 78</p>
            <h1 className="text-lg font-black mt-3 uppercase tracking-wide">PHIẾU ĐỔI HÀNG</h1>
            <p className="font-bold text-xs mt-0.5">Số phiếu: {ticket.ticketNumber}</p>
            <p className="text-[11px] text-slate-500">Ngày lập: {formatDate(ticket.createdAt)}</p>
          </div>

          {/* Ticket Information */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Hóa đơn gốc:</span>
              <span className="font-bold">{ticket.originalInvoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span>{ticket.customerName || "Khách lẻ"}</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>{ticket.createdByName || "Nhân viên"}</span>
            </div>
            <div className="flex justify-between">
              <span>Hình thức:</span>
              <span className="font-bold">{getExchangeTypeLabel(ticket.exchangeType)}</span>
            </div>
            {ticket.reason && (
              <div className="flex justify-between">
                <span>Lý do:</span>
                <span className="italic">{ticket.reason}</span>
              </div>
            )}
          </div>

          {/* Table Return Items */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <p className="font-bold uppercase text-[11px] mb-1.5">[1] HÀNG TRẢ LẠI (HOÀN KHO):</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] text-slate-500">
                  <th className="pb-1">Mặt hàng</th>
                  <th className="pb-1 text-center">SL</th>
                  <th className="pb-1 text-right">Đơn giá</th>
                  <th className="pb-1 text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnItems.map((item) => (
                  <tr key={item.id} className="text-[11px]">
                    <td className="py-1 pr-1">{item.productName}</td>
                    <td className="py-1 text-center font-bold">{item.quantity}</td>
                    <td className="py-1 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between font-bold text-xs mt-1.5 pt-1 border-t border-slate-100">
              <span>Tổng tiền hàng trả (A):</span>
              <span>{formatCurrency(ticket.totalReturnAmount)}</span>
            </div>
          </div>

          {/* Table Exchange Items */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <p className="font-bold uppercase text-[11px] mb-1.5">[2] HÀNG ĐỔI SANG (TRỪ KHO):</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] text-slate-500">
                  <th className="pb-1">Mặt hàng</th>
                  <th className="pb-1 text-center">SL</th>
                  <th className="pb-1 text-right">Đơn giá</th>
                  <th className="pb-1 text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exchangeItems.map((item) => (
                  <tr key={item.id} className="text-[11px]">
                    <td className="py-1 pr-1">{item.productName}</td>
                    <td className="py-1 text-center font-bold">{item.quantity}</td>
                    <td className="py-1 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between font-bold text-xs mt-1.5 pt-1 border-t border-slate-100">
              <span>Tổng tiền hàng đổi (B):</span>
              <span>{formatCurrency(ticket.totalExchangeAmount)}</span>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between font-black text-sm">
              <span>CHÊNH LỆCH THANH TOÁN (B - A):</span>
              <span>
                {ticket.differenceAmount > 0
                  ? `+${formatCurrency(ticket.differenceAmount)}`
                  : formatCurrency(ticket.differenceAmount)}
              </span>
            </div>
            {ticket.additionalInvoiceNumber && (
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Hóa đơn bổ sung chênh lệch:</span>
                <span className="font-bold">{ticket.additionalInvoiceNumber}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 italic mt-1">
              * Hóa đơn gốc {ticket.originalInvoiceNumber} đã được ghi nhận thay đổi cơ cấu hàng theo quy định.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 text-center pt-6 pb-2 text-[11px]">
            <div>
              <p className="font-bold uppercase">Khách Hàng</p>
              <p className="text-[10px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</p>
              <div className="h-14"></div>
            </div>
            <div>
              <p className="font-bold uppercase">Người Lập Phiếu</p>
              <p className="text-[10px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</p>
              <div className="h-14"></div>
              <p className="font-bold text-xs">{ticket.createdByName || ""}</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-dotted border-slate-200">
            Cảm ơn quý khách đã tin dùng sản phẩm của cửa hàng!
          </div>
        </div>
      </div>
    </div>
  );
};
