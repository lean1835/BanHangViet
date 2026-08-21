import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useGetInventoryAuditByIdQuery } from "../services/inventoryAuditApi";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";
import { formatNumber } from "@/utils/formatCurrency";
import type { IInventoryAuditDetail } from "../types/IInventoryAudit";

interface InventoryAuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditId: string | null;
}

const formatDateDMY = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString || "";
  }
};

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

export const InventoryAuditDetailModal: React.FC<InventoryAuditDetailModalProps> = ({
  isOpen,
  onClose,
  auditId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: auditDetail, isLoading, error } = useGetInventoryAuditByIdQuery(
    auditId || "",
    { skip: !auditId || !isOpen }
  );

  const { data: householdResponse } = useGetMyHouseholdQuery(undefined, {
    skip: !isOpen,
  });
  const household = householdResponse?.result;

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

  const details: IInventoryAuditDetail[] = auditDetail?.details || [];
  const totalIncrease = details
    .filter((d) => d.differenceQuantity > 0)
    .reduce((sum, d) => sum + d.differenceQuantity, 0);
  const totalDecrease = details
    .filter((d) => d.differenceQuantity < 0)
    .reduce((sum, d) => sum + Math.abs(d.differenceQuantity), 0);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      id="inventory-audit-modal-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-audit-detail-modal-title"
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
          #root {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          body > *:not(#inventory-audit-modal-portal) {
            display: none !important;
          }
          #inventory-audit-modal-portal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #inventory-audit-modal-panel {
            position: static !important;
            left: auto !important;
            top: auto !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            max-height: none !important;
            height: auto !important;
          }
          #printable-inventory-audit {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 16px !important;
            border: 1.5px solid #000000 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            font-size: 10pt !important;
            line-height: 1.3 !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
          }
          #printable-inventory-audit table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid #000000 !important;
            page-break-inside: avoid !important;
          }
          #printable-inventory-audit th {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            background-color: #f0f0f0 !important;
            padding: 4px 6px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-inventory-audit td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            padding: 4px 6px !important;
          }
        }
      `}</style>

      <div
        id="inventory-audit-modal-panel"
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto flex flex-col h-[92vh] max-h-[92vh] focus:outline-none animate-modal-bounce-in"
      >
        {/* Modal Action Header */}
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white/10 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <path d="m9 14 2 2 4-4" />
              </svg>
            </span>
            <div>
              <h2 id="inventory-audit-detail-modal-title" className="text-xs font-bold uppercase tracking-wider">
                Phiếu Kiểm Kê Kho & Điều Chỉnh Tồn
              </h2>
              <p className="text-[11px] text-slate-300 font-normal">
                {auditDetail?.auditNumber ? `Mã phiếu: ${auditDetail.auditNumber}` : "Đang tải thông tin..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !auditDetail}
              className="h-8 px-3.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              In chứng từ
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng chi tiết phiếu kiểm kê"
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center items-start">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <svg className="animate-spin h-7 w-7 text-kv-blue-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="font-semibold text-xs text-slate-600">Đang tải thông tin chi tiết phiếu kiểm kê...</span>
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200 text-xs font-semibold max-w-md my-8">
              Lỗi: Không thể lấy thông tin phiếu kiểm kê. Vui lòng thử lại sau!
            </div>
          ) : !auditDetail ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Không tìm thấy thông tin phiếu kiểm kê.
            </div>
          ) : (
            /* Printable Accounting Sheet Paper */
            <div
              id="printable-inventory-audit"
              className="bg-white border border-black p-6 sm:p-8 w-full max-w-3xl text-black font-sans text-xs leading-normal shadow-sm"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-2 border-b border-black">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base uppercase tracking-tight text-black">
                    {household?.name || "HỘ KINH DOANH BÁN HÀNG VIỆT"}
                  </h3>
                  <p className="text-[11px] text-black font-normal mt-0.5">
                    {household?.address || "Địa chỉ cửa hàng kinh doanh"}
                  </p>
                  <p className="text-[11px] text-black font-normal mt-0.5">
                    Tel: {household?.phoneNumber || "---"}
                    {household?.taxCode ? ` | MST: ${household.taxCode}` : ""}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 text-xs text-black space-y-1">
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-black font-normal">Mã phiếu:</span>
                    <span className="font-bold text-black">{auditDetail.auditNumber}</span>
                  </div>
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-black font-normal">Ngày kiểm kê:</span>
                    <span className="font-normal text-black">{formatDateDMY(auditDetail.auditDate || auditDetail.createdAt)}</span>
                  </div>
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-black font-normal">Trạng thái:</span>
                    <span className="font-bold text-emerald-700">Đã điều chỉnh tồn</span>
                  </div>
                </div>
              </div>

              {/* Title Center */}
              <div className="text-center my-4">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-black">
                  BIÊN BẢN KIỂM KÊ KHO HÀNG HÓA
                </h1>
                <p className="text-[11px] text-black italic mt-1">
                  (Kèm điều chỉnh số liệu tồn kho)
                </p>
              </div>

              {/* Meta information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-black mb-4 font-normal">
                <div>
                  <span className="font-semibold">Người thực hiện kiểm kê: </span>
                  <span>{auditDetail.createdByUserName || "Chủ hộ kinh doanh"}</span>
                </div>
                <div>
                  <span className="font-semibold">Tổng số mặt hàng kiểm kê: </span>
                  <span>{auditDetail.totalItems} mặt hàng</span>
                </div>
                {auditDetail.notes && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold">Ghi chú đợt kiểm kê: </span>
                    <span className="italic">{auditDetail.notes}</span>
                  </div>
                )}
              </div>

              {/* Details Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse border border-black text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-neutral-200 text-black font-bold border-b border-black text-center">
                      <th className="p-1.5 border-r border-black w-10 text-center">STT</th>
                      <th className="p-1.5 border-r border-black w-24 text-center">Mã SKU</th>
                      <th className="p-1.5 border-r border-black min-w-[160px] text-center">Tên hàng hóa</th>
                      <th className="p-1.5 border-r border-black w-16 text-center">ĐVT</th>
                      <th className="p-1.5 border-r border-black w-20 text-center">Tồn máy</th>
                      <th className="p-1.5 border-r border-black w-20 text-center">Thực tế</th>
                      <th className="p-1.5 border-r border-black w-20 text-center">Chênh lệch</th>
                      <th className="p-1.5 min-w-[140px] text-center">Lý do điều chỉnh</th>
                    </tr>
                  </thead>
                  <tbody className="text-black font-normal">
                    {details.map((item, index) => {
                      const diff = Number(item.differenceQuantity) || 0;
                      return (
                        <tr key={item.id || item.productId} className="border-b border-black">
                          <td className="p-1.5 border-r border-black text-center">{index + 1}</td>
                          <td className="p-1.5 border-r border-black text-center font-mono text-[11px]">
                            {item.productSku}
                          </td>
                          <td className="p-1.5 border-r border-black text-left">{item.productName}</td>
                          <td className="p-1.5 border-r border-black text-center">{item.unit}</td>
                          <td className="p-1.5 border-r border-black text-right font-normal">
                            {formatNumber(Number(item.systemQuantity))}
                          </td>
                          <td className="p-1.5 border-r border-black text-right font-bold">
                            {formatNumber(Number(item.actualQuantity))}
                          </td>
                          <td className={`p-1.5 border-r border-black text-right font-bold ${
                            diff > 0 ? "text-emerald-700" : diff < 0 ? "text-rose-700" : "text-black"
                          }`}>
                            {diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)}
                          </td>
                          <td className="p-1.5 text-left italic">
                            {item.reason || (diff === 0 ? "— (Khớp tồn)" : "Chưa có")}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Summary Row */}
                    <tr className="bg-neutral-100 font-bold text-black border-t-2 border-black">
                      <td colSpan={4} className="p-1.5 text-center border-r border-black font-bold">
                        Tổng hợp đợt kiểm kê
                      </td>
                      <td colSpan={2} className="p-1.5 text-left border-r border-black text-[11px]">
                        {details.length} mặt hàng
                      </td>
                      <td className={`p-1.5 border-r border-black text-right font-bold ${
                        auditDetail.totalDifferenceQty > 0
                          ? "text-emerald-700"
                          : auditDetail.totalDifferenceQty < 0
                          ? "text-rose-700"
                          : "text-black"
                      }`}>
                        {auditDetail.totalDifferenceQty > 0
                          ? `+${formatNumber(auditDetail.totalDifferenceQty)}`
                          : formatNumber(auditDetail.totalDifferenceQty)}
                      </td>
                      <td className="p-1.5 text-xs font-normal">
                        Tăng: <strong className="text-emerald-700">+{formatNumber(totalIncrease)}</strong> | Giảm: <strong className="text-rose-700">-{formatNumber(totalDecrease)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures Area */}
              <div className="mt-8">
                <div className="flex justify-end text-xs text-black italic mb-3">
                  <span>{formatFullDateVietnamese(auditDetail.auditDate || auditDetail.createdAt)}</span>
                </div>

                <div className="grid grid-cols-2 text-center gap-8">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-xs uppercase text-black">
                      NGƯỜI LẬP BIÊN BẢN
                    </span>
                    <span className="text-[11px] text-black italic mt-0.5">
                      (Ký, họ tên)
                    </span>
                    <div className="h-16 flex items-end justify-center font-normal text-black text-xs">
                      {auditDetail.createdByUserName || ""}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="font-bold text-xs uppercase text-black">
                      CHỦ HỘ KINH DOANH DUYỆT
                    </span>
                    <span className="text-[11px] text-black italic mt-0.5">
                      (Ký, ghi rõ họ tên)
                    </span>
                    <div className="h-16 flex items-end justify-center font-normal text-black text-xs">
                      {household?.representativeName || auditDetail.createdByUserName || ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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

export default InventoryAuditDetailModal;
