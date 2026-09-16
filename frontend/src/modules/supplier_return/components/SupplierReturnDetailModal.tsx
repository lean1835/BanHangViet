import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Printer, FileText } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { useGetSupplierReturnByIdQuery } from "../services/supplierReturnApi";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";
import { useGetSuppliersQuery } from "@/modules/supplier/services/supplierApi";
import { convertNumberToWords } from "@/modules/e_invoice/utils/eInvoiceHelpers";
import type { ISupplierReturnItem } from "../types/ISupplierReturn";

interface SupplierReturnDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnId: string | null;
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

export const SupplierReturnDetailModal: React.FC<
  SupplierReturnDetailModalProps
> = ({ isOpen, onClose, returnId }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: returnDetail, isLoading, error } = useGetSupplierReturnByIdQuery(
    returnId || "",
    { skip: !returnId || !isOpen }
  );

  const { data: householdResponse } = useGetMyHouseholdQuery(undefined, {
    skip: !isOpen,
  });
  const household = householdResponse?.result;

  const { data: suppliers = [] } = useGetSuppliersQuery(undefined, {
    skip: !isOpen,
  });

  const supplier = useMemo(() => {
    if (!returnDetail?.supplierId) return null;
    return suppliers.find((s) => s.id === returnDetail.supplierId) || null;
  }, [returnDetail?.supplierId, suppliers]);

  useEffect(() => {
    if (!isOpen) return;

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

  const items: ISupplierReturnItem[] = returnDetail?.items || [];
  const totalQuantity = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0),
    0
  );
  const totalAmount =
    returnDetail?.totalReturnAmount ??
    items.reduce(
      (sum, it) =>
        sum +
        (Number(it.subtotal) ||
          Number(it.quantity) * Number(it.purchasePrice)),
      0
    );

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      id="supplier-return-modal-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-return-modal-title"
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
          /* Completely hide app shell and backdrop */
          #root {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          body > *:not(#supplier-return-modal-portal) {
            display: none !important;
          }
          #supplier-return-modal-portal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #supplier-return-modal-panel {
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
          #supplier-return-scroll-container {
            position: static !important;
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #printable-supplier-return {
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
          #printable-supplier-return table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid #000000 !important;
            page-break-inside: avoid !important;
          }
          #printable-supplier-return tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          #printable-supplier-return th {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            background-color: #e5e5e5 !important;
            padding: 4px 6px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-supplier-return td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            padding: 4px 6px !important;
          }
        }
      `}</style>

      <div
        id="supplier-return-modal-panel"
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto flex flex-col h-[92vh] max-h-[92vh] animate-modal-bounce-in focus:outline-none"
      >
        {/* Header Action Bar (Hidden on print) */}
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white/10 text-white">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="supplier-return-modal-title"
                className="text-xs font-bold uppercase tracking-wider"
              >
                Mẫu Phiếu Xuất Trả Hàng Nhà Cung Cấp Chứng Từ
              </h2>
              <p className="text-[11px] text-slate-300 font-normal">
                {returnDetail?.returnNumber ? (
                  <>
                    Mã phiếu:{" "}
                    <span className="font-mono text-white">
                      {returnDetail.returnNumber}
                    </span>
                  </>
                ) : (
                  "Đang tải thông tin chi tiết..."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !returnDetail}
              className="h-8 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng phiếu xuất trả hàng"
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Container */}
        <div
          id="supplier-return-scroll-container"
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center items-start"
        >
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-3 border-rose-600 border-t-transparent" />
              <span className="font-semibold text-xs text-slate-600">
                Đang tải thông tin chi tiết phiếu trả hàng...
              </span>
            </div>
          ) : error || !returnDetail ? (
            <div className="py-12 px-6 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200 text-xs font-semibold max-w-md my-8">
              Không thể lấy thông tin chi tiết phiếu trả hàng. Vui lòng thử lại sau!
            </div>
          ) : (
            /* Printable Accounting Sheet Paper with solid black border matching GoodsReceiptDetailModal */
            <div
              id="printable-supplier-return"
              className="bg-white border border-black p-6 sm:p-8 w-full max-w-3xl text-black font-sans text-xs leading-normal shadow-sm"
            >
              {/* Header: Store / Household Info (Left) and Meta (Right) */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-1">
                {/* Left: Store / Household Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight text-black">
                    {household?.name || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
                  </h3>
                  <p className="text-[11px] text-black font-normal mt-0.5">
                    {household?.address ||
                      "123 Đường Giải Phóng, Quận Hai Bà Trưng, Hà Nội"}
                  </p>
                  <p className="text-[11px] text-black font-normal mt-0.5">
                    Tel: {household?.phoneNumber || "024 2239 7373"}
                    {household?.taxCode ? ` | MST: ${household.taxCode}` : ""}
                  </p>
                </div>

                {/* Right: Voucher Number & Date */}
                <div className="text-left sm:text-right shrink-0 text-xs text-black space-y-1">
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-black font-normal">Số phiếu:</span>
                    <span className="font-bold text-black font-mono">
                      {returnDetail.returnNumber?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-black font-normal">Ngày lập:</span>
                    <span className="font-normal text-black">
                      {formatDateDMY(
                        returnDetail.returnDate || returnDetail.createdAt
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title Center */}
              <div className="text-center my-4">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-black">
                  PHIẾU XUẤT TRẢ HÀNG NHÀ CUNG CẤP
                </h1>
                <p className="text-[11px] italic text-neutral-600 mt-0.5">
                  (Chứng từ hoàn trả hàng hóa và giảm trừ công nợ)
                </p>
              </div>

              {/* Supplier & Extra Info Block with clean dotted underlines */}
              <div className="flex flex-col gap-2 text-xs text-black mb-4 pb-1 font-normal">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <div className="flex items-baseline flex-1 min-w-0">
                    <span className="shrink-0 mr-2 text-black font-normal">
                      Nhà cung cấp:
                    </span>
                    <span className="font-bold text-black border-b border-dotted border-black flex-1 min-w-0 truncate pb-0.5">
                      {supplier?.name ||
                        returnDetail.supplierName ||
                        "— (Nhập lẻ / Không chọn NCC)"}
                    </span>
                  </div>
                  <div className="flex items-baseline sm:w-64 shrink-0">
                    <span className="shrink-0 mr-2 text-black font-normal">
                      SĐT:
                    </span>
                    <span className="font-normal text-black border-b border-dotted border-black flex-1 truncate pb-0.5">
                      {supplier?.phoneNumber ||
                        returnDetail.supplierPhone ||
                        "---"}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline">
                  <span className="shrink-0 mr-2 text-black font-normal">
                    Địa chỉ:
                  </span>
                  <span className="font-normal text-black border-b border-dotted border-black flex-1 min-w-0 truncate pb-0.5">
                    {supplier?.address || "---"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <div className="flex items-baseline flex-1 min-w-0">
                    <span className="shrink-0 mr-2 text-black font-normal">
                      Phiếu nhập gốc:
                    </span>
                    <span className="font-semibold text-black font-mono border-b border-dotted border-black flex-1 min-w-0 truncate pb-0.5">
                      {returnDetail.receiptNumber ||
                        returnDetail.receiptId ||
                        "---"}
                    </span>
                  </div>
                  <div className="flex items-baseline sm:w-64 shrink-0">
                    <span className="shrink-0 mr-2 text-black font-normal">
                      Lý do trả:
                    </span>
                    <span className="font-normal text-black border-b border-dotted border-black flex-1 truncate pb-0.5">
                      {returnDetail.reason || "Hàng hỏng / lỗi"}
                    </span>
                  </div>
                </div>

                {returnDetail.notes && (
                  <div className="flex items-baseline">
                    <span className="shrink-0 mr-2 text-black font-normal">
                      Ghi chú:
                    </span>
                    <span className="font-normal text-black border-b border-dotted border-black flex-1 italic truncate pb-0.5">
                      {returnDetail.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Items Table with monochrome solid black borders */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse border border-black text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-neutral-200 text-black font-bold border-b border-black text-center">
                      <th className="p-1.5 border-r border-black w-10 text-center">
                        STT
                      </th>
                      <th className="p-1.5 border-r border-black w-24 text-center">
                        Mã hàng
                      </th>
                      <th className="p-1.5 border-r border-black min-w-[160px] text-center">
                        Tên hàng
                      </th>
                      <th className="p-1.5 border-r border-black w-16 text-center">
                        ĐVT
                      </th>
                      <th className="p-1.5 border-r border-black w-20 text-center">
                        Số lượng
                      </th>
                      <th className="p-1.5 border-r border-black w-24 text-center">
                        Đơn giá nhập
                      </th>
                      <th className="p-1.5 border-r border-black w-28 text-center">
                        Thành tiền
                      </th>
                      <th className="p-1.5 w-24 text-center">Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="text-black font-normal">
                    {items.map((item, index) => {
                      const itemSubtotal =
                        Number(item.subtotal) ||
                        Number(item.quantity) * Number(item.purchasePrice);
                      const hasConversion =
                        item.conversionFactor && item.conversionFactor > 1;

                      return (
                        <tr
                          key={item.id || index}
                          className="border-b border-black"
                        >
                          <td className="p-1.5 border-r border-black text-center">
                            {index + 1}
                          </td>
                          <td className="p-1.5 border-r border-black text-center font-mono">
                            {item.productCode || "—"}
                          </td>
                          <td className="p-1.5 border-r border-black text-left">
                            <span className="font-semibold">
                              {item.productName}
                            </span>
                            {hasConversion && (
                              <div className="text-[10px] text-neutral-600 italic">
                                Quy đổi: 1 {item.unitName} ={" "}
                                {item.conversionFactor} đơn vị chuẩn
                              </div>
                            )}
                          </td>
                          <td className="p-1.5 border-r border-black text-center">
                            {item.unitName || "Chiếc"}
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-bold">
                            {formatNumber(Number(item.quantity))}
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-normal">
                            {formatCurrency(Number(item.purchasePrice))}
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-bold">
                            {formatCurrency(itemSubtotal)}
                          </td>
                          <td className="p-1.5 text-center text-[10px]">
                            {item.itemReason || returnDetail.reason || "—"}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Summary Row 1: Tổng cộng */}
                    <tr className="bg-white font-bold text-black border-b border-black">
                      <td
                        colSpan={4}
                        className="p-1.5 text-center border-r border-black font-bold"
                      >
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

                    {/* Summary Row 2: Khấu trừ công nợ */}
                    <tr className="border-b border-black text-black">
                      <td
                        colSpan={6}
                        className="p-1.5 text-right border-r border-black font-bold"
                      >
                        Giảm trừ vào công nợ nhà cung cấp (2)
                      </td>
                      <td className="p-1.5 border-r border-black text-right font-bold">
                        {formatCurrency(
                          returnDetail.supplierDebtReduced ?? totalAmount
                        )}
                      </td>
                      <td className="p-1.5"></td>
                    </tr>

                    {/* Summary Row 3: Số tiền thực nhận hoàn */}
                    <tr className="border-b border-black font-bold bg-white text-black">
                      <td
                        colSpan={6}
                        className="p-1.5 text-right border-r border-black font-bold"
                      >
                        Số tiền thu hoàn bằng tiền mặt / CK ngay (3)
                      </td>
                      <td className="p-1.5 border-r border-black text-right font-bold">
                        {formatCurrency(0)}
                      </td>
                      <td className="p-1.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total In Words */}
              <div className="border-t border-black mt-3.5 pt-2 text-xs text-black font-normal">
                <span>Số tiền bằng chữ: </span>
                <span className="font-normal italic">
                  {convertNumberToWords(totalAmount)}
                </span>
              </div>

              {/* Signatures Area */}
              <div className="mt-6">
                <div className="flex justify-end text-xs text-black italic mb-2">
                  <span>
                    {formatFullDateVietnamese(
                      returnDetail.returnDate || returnDetail.createdAt
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 text-center gap-4">
                  {/* 1. Người lập phiếu */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-xs uppercase text-black">
                      NGƯỜI LẬP PHIẾU
                    </span>
                    <span className="text-[11px] text-black italic mt-0.5">
                      (Ký, họ tên)
                    </span>
                    <div className="h-16 flex items-end justify-center font-normal text-black text-xs">
                      {returnDetail.createdByUserName || "Người lập"}
                    </div>
                  </div>

                  {/* 2. Người nhận hàng / NCC */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-xs uppercase text-black">
                      NGƯỜI NHẬN HÀNG (NCC)
                    </span>
                    <span className="text-[11px] text-black italic mt-0.5">
                      (Ký, họ tên)
                    </span>
                    <div className="h-16 flex items-end justify-center font-normal text-black text-xs">
                      {supplier?.name || returnDetail.supplierName || ""}
                    </div>
                  </div>

                  {/* 3. Thủ kho */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-xs uppercase text-black">
                      THỦ KHO
                    </span>
                    <span className="text-[11px] text-black italic mt-0.5">
                      (Ký, họ tên)
                    </span>
                    <div className="h-16 flex items-end justify-center font-normal text-black text-xs">
                      Thủ kho
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SupplierReturnDetailModal;
