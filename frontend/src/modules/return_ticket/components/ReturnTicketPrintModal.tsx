import React, { useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import { useGetCustomerByIdQuery } from "@/modules/customer/services/customerApi";
import { convertNumberToWords } from "@/modules/e_invoice/utils/eInvoiceHelpers";
import { getRefundPaymentMethodLabel } from "../utils/returnTicketHelpers";
import type { IReturnTicket } from "../types/IReturnTicket";

interface ReturnTicketPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: IReturnTicket;
}

export const ReturnTicketPrintModal: React.FC<ReturnTicketPrintModalProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  // Queries for store/household, products for SKU, and customer details
  const { data: householdResponse } = useGetMyHouseholdQuery(undefined, {
    skip: !isOpen,
  });
  const household = householdResponse?.result;

  const { data: productsData } = useGetProductsQuery(
    { size: 300 },
    { skip: !isOpen }
  );

  const { data: customerResponse } = useGetCustomerByIdQuery(ticket?.customerId || "", {
    skip: !isOpen || !ticket?.customerId,
  });
  const customer = (customerResponse as any)?.result || customerResponse;

  // Build product SKU map
  const productSkuMap = useMemo(() => {
    const map = new Map<string, string>();
    if (productsData?.content) {
      for (const p of productsData.content) {
        if (p.id) {
          map.set(p.id, p.sku || p.id.slice(-6).toUpperCase());
        }
      }
    }
    return map;
  }, [productsData]);

  // Helpers for full Vietnamese date formatting: "Ngày DD tháng MM năm YYYY"
  const formatFullVietnameseDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `Ngày ${day} tháng ${month} năm ${year}`;
  };

  const formatShortDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calculations
  const totalQuantity = useMemo(() => {
    return (ticket.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [ticket.items]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-backdrop-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-ticket-title"
        className="w-full max-w-4xl max-h-[95vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-modal-smooth-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-kv-blue-primary/10 text-kv-blue-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </div>
            <div>
              <h2 id="print-ticket-title" className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Mẫu In Phiếu Hàng Bán Trả Lại
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Mẫu chứng từ chuẩn quy định kế toán</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-kv-blue-dark active:scale-95 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              In phiếu (Print)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible">
          <div
            ref={printRef}
            className="mx-auto max-w-[800px] bg-white p-8 sm:p-10 shadow-sm border border-slate-300 rounded-sm font-sans text-slate-900 print:border-none print:shadow-none print:p-0 print:max-w-none"
          >
            {/* Header: Store Info & Release Date */}
            <div className="flex items-start justify-between pb-3 border-b border-dashed border-slate-400 gap-4">
              <div className="flex items-start gap-3">
                {/* Store Icon / Web Brand Logo */}
                <img
                  src="/favicon.jpg"
                  alt="Logo"
                  className="h-12 w-12 shrink-0 rounded-xl object-contain border border-slate-200 shadow-sm"
                  onError={(e) => {
                    // Fallback to text badge if image fails
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
                <div className="flex flex-col text-[11px] leading-relaxed">
                  <h3 className="font-extrabold text-xs uppercase text-slate-900 tracking-wide">
                    {household?.name || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
                  </h3>
                  <p className="text-slate-700 font-medium">
                    {household?.address || "123 Nguyễn Trãi, Thanh Xuân, Hà Nội"}
                  </p>
                  <p className="text-slate-700">
                    Tel. <span className="font-semibold">{household?.phoneNumber || "024.1234.5678"}</span>
                    {household?.taxCode && (
                      <span> - MST: <strong className="font-mono">{household.taxCode}</strong></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600 font-medium shrink-0">
                <span>Ban hành : {formatShortDate(ticket.createdAt || new Date())}</span>
              </div>
            </div>

            {/* Document Title Section */}
            <div className="py-4 text-center relative">
              <h1 className="text-xl sm:text-2xl font-black text-rose-600 uppercase tracking-widest">
                HÀNG BÁN TRẢ LẠI
              </h1>
              <p className="text-xs italic text-slate-800 font-medium mt-1">
                {formatFullVietnameseDate(ticket.createdAt)}
              </p>

              <div className="text-right mt-1 sm:mt-0 sm:absolute sm:right-0 sm:bottom-4 text-xs">
                <span className="text-slate-700 font-medium">Số phiếu: </span>
                <strong className="font-mono font-bold text-slate-950 text-sm">{ticket.ticketNumber}</strong>
              </div>
            </div>

            {/* Customer & Document Information Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs py-2 leading-relaxed">
              <div className="flex items-baseline">
                <span className="w-28 shrink-0 text-slate-700 font-semibold">Tên khách hàng :</span>
                <span className="font-bold text-slate-900 uppercase">
                  {customer?.name || ticket.customerName || "Khách mua lẻ"}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="w-24 shrink-0 text-slate-700 font-semibold">Điện thoại :</span>
                <span className="font-medium text-slate-900">
                  {customer?.phone || "—"}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="w-28 shrink-0 text-slate-700 font-semibold">Địa chỉ :</span>
                <span className="font-medium text-slate-900">
                  {customer?.address || "—"}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="w-24 shrink-0 text-slate-700 font-semibold">Chứng từ :</span>
                <span className="font-mono font-bold text-slate-900">
                  {ticket.originalInvoiceLookupCode || ticket.originalInvoiceNumber || ticket.originalInvoiceId || "—"}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="w-28 shrink-0 text-slate-700 font-semibold">Lý do trả hàng :</span>
                <span className="font-medium text-slate-900">
                  {ticket.reason ? ticket.reason : "Khách trả lại hàng theo hóa đơn gốc"}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="w-24 shrink-0 text-slate-700 font-semibold">Hình thức hoàn :</span>
                <span className="font-bold text-slate-900">
                  {getRefundPaymentMethodLabel(ticket.refundPaymentMethod)}
                </span>
              </div>
            </div>

            {/* Intro text */}
            <div className="pt-2 pb-1 text-xs italic text-slate-700 font-medium">
              Chi tiết hàng hoá như sau :
            </div>

            {/* Line Items Table (Crystal Report Style Borders) */}
            <div className="overflow-x-auto my-2">
              <table className="w-full text-xs border-collapse border-2 border-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-extrabold text-slate-900 text-[11px] text-center border-b-2 border-slate-900">
                    <th className="border border-slate-900 py-1.5 px-2 w-10">STT</th>
                    <th className="border border-slate-900 py-1.5 px-2 w-24">Mã hàng</th>
                    <th className="border border-slate-900 py-1.5 px-3 text-left">Tên hàng</th>
                    <th className="border border-slate-900 py-1.5 px-2 w-16">ĐVT</th>
                    <th className="border border-slate-900 py-1.5 px-2 w-20 text-right">Số lượng</th>
                    <th className="border border-slate-900 py-1.5 px-2 w-24 text-right">Đơn giá</th>
                    <th className="border border-slate-900 py-1.5 px-2 w-20 text-right">Chiết khấu</th>
                    <th className="border border-slate-900 py-1.5 px-2 w-28 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium text-slate-900">
                  {ticket.items && ticket.items.length > 0 ? (
                    ticket.items.map((item, idx) => {
                      const itemSku =
                        (item as any).sku ||
                        (item.productId ? productSkuMap.get(item.productId) : null) ||
                        (item.productId ? item.productId.slice(-6).toUpperCase() : "-");

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="border border-slate-900 py-1.5 px-2 text-center text-slate-600 font-mono">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-900 py-1.5 px-2 text-center font-mono font-bold text-slate-800">
                            {itemSku}
                          </td>
                          <td className="border border-slate-900 py-1.5 px-3 font-semibold text-slate-900">
                            {item.productName}
                          </td>
                          <td className="border border-slate-900 py-1.5 px-2 text-center text-slate-700">
                            {item.unit || "Cái"}
                          </td>
                          <td className="border border-slate-900 py-1.5 px-2 text-right font-mono font-bold">
                            {formatNumber(item.quantity)}
                          </td>
                          <td className="border border-slate-900 py-1.5 px-2 text-right font-mono">
                            {formatCurrency(item.unitPrice).replace(" ₫", "").replace(" đ", "")}
                          </td>
                          <td className="border border-slate-900 py-1.5 px-2 text-right font-mono text-slate-600">
                            0
                          </td>
                          <td className="border border-slate-900 py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                            {formatCurrency(item.subtotal).replace(" ₫", "").replace(" đ", "")}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="border border-slate-900 py-4 text-center text-slate-400 italic">
                        Không có chi tiết mặt hàng.
                      </td>
                    </tr>
                  )}

                  {/* Summary Row */}
                  <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-900">
                    <td colSpan={4} className="border border-slate-900 py-2 px-3 text-center font-black text-rose-600 text-xs">
                      Cộng tiền hàng
                    </td>
                    <td className="border border-slate-900 py-2 px-2 text-right font-mono font-black text-slate-950">
                      {formatNumber(totalQuantity)}
                    </td>
                    <td className="border border-slate-900 py-2 px-2 text-right font-mono">
                      —
                    </td>
                    <td className="border border-slate-900 py-2 px-2 text-right font-mono text-slate-600">
                      0
                    </td>
                    <td className="border border-slate-900 py-2 px-2 text-right font-mono font-black text-rose-600 text-sm">
                      {formatCurrency(ticket.totalReturnAmount).replace(" ₫", "").replace(" đ", "")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note & Amount in words */}
            <div className="flex flex-col gap-1 pt-2 text-xs leading-relaxed">
              <div className="flex items-baseline">
                <span className="font-extrabold underline text-slate-800 mr-2">Ghi chú :</span>
                <span className="italic text-slate-700">
                  {ticket.reason ? ticket.reason : "Không xuất trả hóa đơn - Hàng trả lại theo quy định cửa hàng"}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-semibold text-slate-800 mr-2">Số tiền viết bằng chữ :</span>
                <span className="font-bold italic text-slate-900">
                  {convertNumberToWords(ticket.totalReturnAmount)} đồng
                </span>
              </div>
            </div>

            {/* Signatures Section */}
            <div className="pt-6 pb-2">
              <div className="text-right text-xs italic text-slate-800 font-medium mb-3 pr-4">
                {formatFullVietnameseDate(ticket.createdAt)}
              </div>

              <div className="grid grid-cols-2 text-center text-xs">
                {/* Column 1: Customer */}
                <div className="flex flex-col items-center">
                  <span className="font-bold text-slate-900 text-xs uppercase">Khách hàng</span>
                  <span className="text-[11px] text-slate-500 italic mt-0.5">(Ký, họ tên)</span>
                  <div className="h-16" />
                  <span className="font-bold text-slate-900 text-xs">
                    {customer?.name || ticket.customerName || ""}
                  </span>
                </div>

                {/* Column 2: Creator / Cashier */}
                <div className="flex flex-col items-center">
                  <span className="font-bold text-slate-900 text-xs uppercase">Người lập phiếu</span>
                  <span className="text-[11px] text-slate-500 italic mt-0.5">(Ký, họ tên)</span>
                  <div className="h-16" />
                  <span className="font-bold text-slate-900 text-xs">
                    {ticket.createdByUserName || "Nhân viên bán hàng"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
