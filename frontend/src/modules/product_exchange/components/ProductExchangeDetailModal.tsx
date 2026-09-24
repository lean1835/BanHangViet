import React from "react";
import { X, Printer, ArrowRightLeft } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import {
  getExchangeTypeLabel,
  getExchangeTypeBadge,
  getExchangeStatusLabel,
  getExchangeStatusBadge,
  getPaymentMethodLabel,
} from "../utils/productExchangeHelpers";
import type { IProductExchangeTicket } from "../types/IProductExchange";

interface ProductExchangeDetailModalProps {
  ticket: IProductExchangeTicket | null;
  onClose: () => void;
  onPrint: (ticket: IProductExchangeTicket) => void;
}

export const ProductExchangeDetailModal: React.FC<ProductExchangeDetailModalProps> = ({
  ticket,
  onClose,
  onPrint,
}) => {
  if (!ticket) return null;

  const typeBadge = getExchangeTypeBadge(ticket.exchangeType);
  const statusBadge = getExchangeStatusBadge(ticket.status);

  const returnItems = ticket.items?.filter((i) => i.itemType === "RETURN_ITEM") || [];
  const exchangeItems = ticket.items?.filter((i) => i.itemType === "EXCHANGE_ITEM") || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  Phiếu Đổi Hàng: {ticket.ticketNumber}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg} ${statusBadge.border}`}
                >
                  {getExchangeStatusLabel(ticket.status)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ngày lập: {formatDate(ticket.createdAt)} • Người lập: {ticket.createdByName || "Nhân viên"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Thông Tin Hóa Đơn Gốc
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Số hóa đơn:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {ticket.originalInvoiceNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {ticket.customerName || "Khách lẻ tại quầy"}
                </span>
              </div>
              {ticket.reason && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Lý do đổi:</span>
                  <span className="text-slate-700 dark:text-slate-300 italic">{ticket.reason}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Phân Loại Nghiệp Vụ
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Loại đổi hàng:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeBadge.bg}`}>
                  {getExchangeTypeLabel(ticket.exchangeType)}
                </span>
              </div>
              {ticket.extraPaymentMethod && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Thu chênh lệch qua:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {getPaymentMethodLabel(ticket.extraPaymentMethod)}
                  </span>
                </div>
              )}
              {ticket.additionalInvoiceNumber && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Hóa đơn bổ sung:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {ticket.additionalInvoiceNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table: Return Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Món Khách Trả Lại (Hoàn Tồn Kho)</span>
              <span className="text-slate-400">({returnItems.length})</span>
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-3 text-center">ĐVT</th>
                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {returnItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{item.unit}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Exchange Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Món Khách Đổi Sang (Trừ Tồn Kho)</span>
              <span className="text-slate-400">({exchangeItems.length})</span>
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-3 text-center">ĐVT</th>
                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {exchangeItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{item.unit}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1 text-xs">
              <span className="text-slate-500">Tổng tiền trả: <strong>{formatCurrency(ticket.totalReturnAmount)}</strong></span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-slate-500">Tổng tiền đổi: <strong>{formatCurrency(ticket.totalExchangeAmount)}</strong></span>
            </div>

            <div className="text-right">
              <span className="block text-xs text-slate-500">Chênh lệch thanh toán</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-50">
                {ticket.differenceAmount > 0
                  ? `+${formatCurrency(ticket.differenceAmount)}`
                  : formatCurrency(ticket.differenceAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={() => onPrint(ticket)}
            className="px-4 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-2 shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu Đổi Hàng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
