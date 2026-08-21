import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useGetGoodsReceiptByIdQuery, useGetProductsQuery } from "../services/productApi";
import { useGetSuppliersQuery } from "@/modules/supplier/services/supplierApi";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { convertNumberToWords } from "@/modules/e_invoice/utils/eInvoiceHelpers";
import type { IGoodsReceiptDetail } from "../types/IGoodsReceipt";

interface GoodsReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: string | null;
}

const formatFullDateVietnamese = (dateString?: string): string => {
  if (!dateString) {
    const now = new Date();
    return `Ngày ${String(now.getDate()).padStart(2, "0")} Tháng ${String(now.getMonth() + 1).padStart(2, "0")} Năm ${now.getFullYear()}`;
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `Ngày ${day} Tháng ${month} Năm ${year}`;
  } catch {
    return "";
  }
};

const formatDateDMY = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString || "";
  }
};

export const GoodsReceiptDetailModal: React.FC<GoodsReceiptDetailModalProps> = ({
  isOpen,
  onClose,
  receiptId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Queries for receipt detail, household info, suppliers, and products
  const { data: detailInfo, isLoading, error } = useGetGoodsReceiptByIdQuery(receiptId || "", {
    skip: !receiptId || !isOpen,
  });

  const { data: householdResponse } = useGetMyHouseholdQuery(undefined, {
    skip: !isOpen,
  });
  const household = householdResponse?.result;

  const { data: suppliers = [] } = useGetSuppliersQuery(undefined, {
    skip: !isOpen,
  });

  const { data: productsData } = useGetProductsQuery(
    { size: 200 },
    { skip: !isOpen }
  );

  // Map product units
  const productUnitMap = useMemo(() => {
    const map = new Map<string, string>();
    if (productsData?.content) {
      for (const prod of productsData.content) {
        if (prod.id && prod.unit) {
          map.set(prod.id, prod.unit);
        }
      }
    }
    return map;
  }, [productsData]);

  // Find supplier details
  const supplier = useMemo(() => {
    if (!detailInfo?.supplierId) return null;
    return suppliers.find((s) => s.id === detailInfo.supplierId) || null;
  }, [detailInfo?.supplierId, suppliers]);

  useEffect(() => {
    if (!isOpen) return;

    // Accessibility: Lock background scrolling
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    modalRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const details: IGoodsReceiptDetail[] = detailInfo?.details || [];
  const totalQuantity = details.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  const totalAmount =
    detailInfo?.totalAmount ??
    details.reduce(
      (sum, d) => sum + (Number(d.quantity) || 0) * (Number(d.purchasePrice) || 0),
      0
    );

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      id="goods-receipt-modal-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goods-receipt-detail-modal-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Completely remove background app from print layout to eliminate blank pages */
          #root {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          body > *:not(#goods-receipt-modal-portal) {
            display: none !important;
          }
          /* Unwrap modal container so it starts at page 1 top */
          #goods-receipt-modal-portal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #goods-receipt-modal-panel {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
          }
          #goods-receipt-scroll-container {
            position: static !important;
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #printable-goods-receipt {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 18px !important;
            border: 1.5px solid #000000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            font-size: 10.5pt !important;
            line-height: 1.35 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            break-before: avoid !important;
            break-after: avoid !important;
          }
          #printable-goods-receipt table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid #000000 !important;
            page-break-inside: avoid !important;
          }
          #printable-goods-receipt tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          #printable-goods-receipt th {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            background-color: #e5e5e5 !important;
            padding: 4px 6px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-goods-receipt td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            padding: 4px 6px !important;
          }
        }
      `}</style>

      <div
        id="goods-receipt-modal-panel"
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto flex flex-col h-[92vh] max-h-[92vh] animate-modal-bounce-in focus:outline-none"
      >
        {/* Header Action Bar */}
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white/10 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <div>
              <h2 id="goods-receipt-detail-modal-title" className="text-xs font-bold uppercase tracking-wider">
                Mẫu Phiếu Nhập Kho Chứng Từ
              </h2>
              <p className="text-[11px] text-slate-300 font-normal">
                {detailInfo?.receiptNumber ? `Mã phiếu: ${detailInfo.receiptNumber}` : "Đang tải thông tin..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !detailInfo}
              className="h-8 px-3.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              In phiếu
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng phiếu nhập kho"
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Container with flex-1 min-h-0 */}
        <div id="goods-receipt-scroll-container" className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center items-start">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <svg className="animate-spin h-7 w-7 text-kv-blue-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="font-semibold text-xs text-slate-600">Đang tải thông tin chi tiết phiếu nhập kho...</span>
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200 text-xs font-semibold max-w-md my-8">
              Lỗi: Không thể lấy thông tin chi tiết phiếu nhập kho. Vui lòng thử lại sau!
            </div>
          ) : !detailInfo ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Không tìm thấy thông tin phiếu nhập kho.
            </div>
          ) : (
            /* Printable Accounting Sheet Paper with solid black outer border matching the image */
            <div
              id="printable-goods-receipt"
              className="bg-white border border-black p-6 sm:p-8 w-full max-w-3xl text-black font-sans text-xs leading-normal shadow-sm"
            >
              {/* Header: Company info (Left) and Receipt Meta (Right) */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-1">
                {/* Left: Store / Household Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight text-black">
                    {household?.name || "CÔNG TY WEBKYNANG"}
                  </h3>
                  <p className="text-[11px] text-black font-normal mt-0.5">
                    {household?.address || "Tầng 6, Tòa Nhà Sannam, 78 Duy Tân, Cầu Giấy, Hà Nội"}
                  </p>
                  <p className="text-[11px] text-black font-normal mt-0.5">
                    Tel: {household?.phoneNumber || "024 2239 7373"}
                    {household?.taxCode ? ` | MST: ${household.taxCode}` : "; Hotline: 038 997 8430"}
                  </p>
                </div>

                {/* Right: Receipt Number & Date */}
                <div className="text-left sm:text-right shrink-0 text-xs text-black space-y-1">
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-black font-normal">Số phiếu:</span>
                    <span className="font-bold text-black">
                      {detailInfo.receiptNumber?.toUpperCase() || "NH0001"}
                    </span>
                  </div>
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-black font-normal">Ngày:</span>
                    <span className="font-normal text-black">
                      {formatDateDMY(detailInfo.receivedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title Center */}
              <div className="text-center my-4">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-black">
                  PHIẾU NHẬP KHO
                </h1>
              </div>

              {/* Supplier and Extra Info Block with clean dotted underlines */}
              <div className="flex flex-col gap-2 text-xs text-black mb-4 pb-1 font-normal">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <div className="flex items-baseline flex-1 min-w-0">
                    <span className="shrink-0 mr-2 text-black font-normal">Nhà cung cấp:</span>
                    <span className="font-normal text-black border-b border-dotted border-black flex-1 min-w-0 truncate pb-0.5">
                      {supplier?.name || detailInfo.supplierName || "— (Nhập lẻ / Không chọn NCC)"}
                    </span>
                  </div>
                  <div className="flex items-baseline sm:w-64 shrink-0">
                    <span className="shrink-0 mr-2 text-black font-normal">SĐT:</span>
                    <span className="font-normal text-black border-b border-dotted border-black flex-1 truncate pb-0.5">
                      {supplier?.phoneNumber || "---"}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline">
                  <span className="shrink-0 mr-2 text-black font-normal">Địa chỉ:</span>
                  <span className="font-normal text-black border-b border-dotted border-black flex-1 min-w-0 truncate pb-0.5">
                    {supplier?.address || "---"}
                  </span>
                </div>

                {detailInfo.notes && (
                  <div className="flex items-baseline">
                    <span className="shrink-0 mr-2 text-black font-normal">Ghi chú:</span>
                    <span className="font-normal text-black border-b border-dotted border-black flex-1 italic truncate pb-0.5">
                      {detailInfo.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Items Table with monochrome solid black borders */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse border border-black text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-neutral-200 text-black font-bold border-b border-black text-center">
                      <th className="p-1.5 border-r border-black w-10 text-center">STT</th>
                      <th className="p-1.5 border-r border-black w-24 text-center">Mã hàng</th>
                      <th className="p-1.5 border-r border-black min-w-[160px] text-center">Tên hàng</th>
                      <th className="p-1.5 border-r border-black w-16 text-center">ĐVT</th>
                      <th className="p-1.5 border-r border-black w-20 text-center">Số lượng</th>
                      <th className="p-1.5 border-r border-black w-24 text-center">Đơn giá</th>
                      <th className="p-1.5 border-r border-black w-28 text-center">Thành tiền</th>
                      <th className="p-1.5 w-20 text-center">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="text-black font-normal">
                    {details.map((item, index) => {
                      const unitName = productUnitMap.get(item.productId) || "Chiếc";
                      const itemSubtotal = Number(item.quantity) * Number(item.purchasePrice);

                      return (
                        <tr key={item.id || item.productId} className="border-b border-black">
                          <td className="p-1.5 border-r border-black text-center">{index + 1}</td>
                          <td className="p-1.5 border-r border-black text-center">
                            {item.productSku}
                          </td>
                          <td className="p-1.5 border-r border-black text-left">{item.productName}</td>
                          <td className="p-1.5 border-r border-black text-center">{unitName}</td>
                          <td className="p-1.5 border-r border-black text-right font-normal">
                            {formatNumber(Number(item.quantity))}
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-normal">
                            {formatCurrency(Number(item.purchasePrice))}
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-normal">
                            {formatCurrency(itemSubtotal)}
                          </td>
                          <td className="p-1.5 text-center"></td>
                        </tr>
                      );
                    })}

                    {/* Summary Row 1: Tổng cộng */}
                    <tr className="bg-white font-bold text-black border-b border-black">
                      <td colSpan={4} className="p-1.5 text-center border-r border-black font-bold">
                        Tổng cộng (1)
                      </td>
                      <td className="p-1.5 text-right border-r border-black font-bold">
                        {formatNumber(totalQuantity)}
                      </td>
                      <td className="p-1.5 border-r border-black text-right"></td>
                      <td className="p-1.5 border-r border-black text-right font-bold">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td className="p-1.5 text-center"></td>
                    </tr>

                    {/* Summary Row 2 & 3 & 4 (Nếu có thông tin công nợ NCC) */}
                    {supplier && (
                      <>
                        <tr className="border-b border-black text-black">
                          <td colSpan={6} className="p-1.5 text-right border-r border-black font-bold">
                            Nợ cũ (2)
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-bold">
                            {formatCurrency(supplier.currentDebt || 0)}
                          </td>
                          <td className="p-1.5"></td>
                        </tr>
                        <tr className="border-b border-black text-black">
                          <td colSpan={6} className="p-1.5 text-right border-r border-black font-bold">
                            Số tiền thanh toán (3)
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-bold">
                            {formatCurrency(0)}
                          </td>
                          <td className="p-1.5"></td>
                        </tr>
                        <tr className="border-b border-black font-bold bg-white text-black">
                          <td colSpan={6} className="p-1.5 text-right border-r border-black font-bold">
                            Còn nợ (1 + 2 - 3)
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-bold">
                            {formatCurrency(totalAmount + (supplier.currentDebt || 0))}
                          </td>
                          <td className="p-1.5"></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Solid horizontal border line separating table from bottom section */}
              <div className="border-t border-black mt-3.5 pt-2 text-xs text-black font-normal">
                <span>Số tiền bằng chữ: </span>
                <span className="font-normal italic">{convertNumberToWords(totalAmount)}</span>
              </div>

              {/* Signatures Area */}
              <div className="mt-6">
                <div className="flex justify-end text-xs text-black italic mb-2">
                  <span>{formatFullDateVietnamese(detailInfo.receivedAt)}</span>
                </div>

                <div className="grid grid-cols-2 text-center gap-8">
                  {/* Left: Thủ kho */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-xs uppercase text-black">
                      THỦ KHO
                    </span>
                    <span className="text-[11px] text-black italic mt-0.5">
                      (Ký, họ tên)
                    </span>
                    <div className="h-16 flex items-end justify-center font-normal text-black text-xs">
                      {detailInfo.createdByUserName || ""}
                    </div>
                  </div>

                  {/* Right: Người giao hàng */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-xs uppercase text-black">
                      NGƯỜI GIAO HÀNG
                    </span>
                    <span className="text-[11px] text-black italic mt-0.5">
                      (Ký, họ tên)
                    </span>
                    <div className="h-16 flex items-end justify-center font-normal text-black text-xs">
                      {supplier?.name || ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="flex justify-end gap-3 p-3.5 bg-white border-t border-slate-200 shrink-0 no-print">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GoodsReceiptDetailModal;
