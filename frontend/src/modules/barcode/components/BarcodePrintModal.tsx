import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X, Tag } from "lucide-react";
import {
  BARCODE_PAPER_SIZE_OPTIONS,
  BARCODE_PAPER_SIZES,
  type TBarcodePaperSize,
} from "@/constants/barcode";
import { useGetBarcodePrintDataQuery } from "../services/barcodeApi";
import { formatCurrency } from "@/utils/formatCurrency";

interface IBarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export const BarcodePrintModal: React.FC<IBarcodePrintModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
}) => {
  const [paperSize, setPaperSize] = useState<TBarcodePaperSize>(
    BARCODE_PAPER_SIZES.SIZE_58MM
  );
  const [quantity, setQuantity] = useState<number>(1);

  const { data: printData, isLoading, isError } = useGetBarcodePrintDataQuery(
    { productId, params: { paperSize, quantity } },
    { skip: !isOpen || !productId }
  );

  const handlePrint = () => {
    if (!printData) return;

    const widthMm =
      paperSize === BARCODE_PAPER_SIZES.SIZE_58MM
        ? "58mm"
        : paperSize === BARCODE_PAPER_SIZES.SIZE_80MM
        ? "80mm"
        : "75mm";

    // Create a hidden iframe on the SAME tab to avoid opening a new tab
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.zIndex = "-999";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const labelsHtml = Array.from({ length: quantity })
      .map(
        () => `
      <div class="barcode-label">
        <div class="store-name">${printData.householdName || "Bán Hàng Việt"}</div>
        <div class="product-name">${printData.productName}</div>
        ${
          printData.barcodeBase64Image
            ? `<img class="barcode-img" src="${printData.barcodeBase64Image}" alt="${printData.barcode}" />`
            : `<div class="barcode-text-fallback">${printData.barcode}</div>`
        }
        <div class="barcode-text">${printData.barcode}</div>
        <div class="product-price">Giá: ${formatCurrency(printData.price)} / ${printData.unit || "Cái"}</div>
      </div>
    `
      )
      .join("");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>In Tem Mã Vạch - ${printData.productName}</title>
          <style>
            @page {
              size: ${widthMm} auto;
              margin: 1mm;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .barcode-label {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 2mm 0;
              background: #ffffff;
              color: #000000;
              display: flex;
              flex-direction: column;
              align-items: center;
              box-sizing: border-box;
            }
            .barcode-label {
              width: ${widthMm};
              max-width: 100%;
              box-sizing: border-box;
              padding: 2mm 1.5mm;
              margin-bottom: 3mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              border-bottom: 1px dashed #ccc;
            }
            @media print {
              .barcode-label {
                border-bottom: none;
                margin-bottom: 4mm;
              }
            }
            .store-name {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 1px;
              color: #333;
            }
            .product-name {
              font-size: 12px;
              font-weight: 800;
              line-height: 1.2;
              max-width: 95%;
              margin-bottom: 2px;
              word-break: break-word;
            }
            .barcode-img {
              width: 92%;
              max-height: 55px;
              object-fit: contain;
              margin: 1px 0;
            }
            .barcode-text {
              font-family: Consolas, Monaco, "Courier New", monospace;
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 1.5px;
              margin-top: 1px;
            }
            .barcode-text-fallback {
              font-family: monospace;
              font-size: 14px;
              font-weight: bold;
              margin: 10px 0;
            }
            .product-price {
              font-size: 11px;
              font-weight: 800;
              margin-top: 2px;
              color: #000;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
        </body>
      </html>
    `);
    doc.close();

    // Trigger print directly inside the hidden iframe on the SAME tab
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 250);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static"
    >
      {/* Scoped Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #barcode-print-container, #barcode-print-container * {
            visibility: visible !important;
          }
          #barcode-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .barcode-label-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 8mm !important;
          }
          @page {
            margin: 2mm;
            size: auto;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col print:border-none print:shadow-none print:max-w-none"
      >
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0070f4] text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Printer size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight flex items-center gap-2">
                <span>In Tem Mã Vạch Sản Phẩm</span>
              </h3>
              <p className="text-[11px] text-blue-100 font-normal truncate max-w-xs">
                {productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls - Hidden on Print */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-600 flex items-center gap-1">
              <Tag size={13} className="text-[#0070f4]" />
              <span>Khổ tem in:</span>
            </label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as TBarcodePaperSize)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-400"
            >
              {BARCODE_PAPER_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-600">Số lượng tem:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
              }
              className="w-16 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-center focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Print Label Preview Container */}
        <div className="p-6 bg-slate-100/60 overflow-y-auto max-h-[60vh] flex flex-col items-center justify-center min-h-[220px] print:bg-white print:p-0 print:max-h-none">
          {isLoading ? (
            <div className="text-center text-slate-400 text-xs font-bold py-8">
              Đang tạo tem mã vạch nội bộ...
            </div>
          ) : isError || !printData ? (
            <div className="text-center text-rose-500 text-xs font-bold py-8">
              Không thể tải thông tin tem mã vạch.
            </div>
          ) : (
            <div
              id="barcode-print-container"
              className="flex flex-wrap gap-4 justify-center items-center print:block print:w-full"
            >
              {Array.from({ length: quantity }).map((_, index) => (
                <div
                  key={index}
                  className={`barcode-label-item bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 shadow-sm flex flex-col items-center text-center select-none ${
                    paperSize === BARCODE_PAPER_SIZES.SIZE_58MM
                      ? "w-56 max-w-[58mm]"
                      : paperSize === BARCODE_PAPER_SIZES.SIZE_80MM
                      ? "w-72 max-w-[80mm]"
                      : "w-80"
                  } print:border-none print:shadow-none print:mx-auto`}
                >
                  <div className="text-[11px] font-bold text-slate-500 truncate w-full uppercase tracking-wider mb-1">
                    {printData.householdName || "Bán Hàng Việt"}
                  </div>
                  <div className="text-xs font-extrabold text-slate-800 line-clamp-2 leading-tight mb-1.5 px-1">
                    {printData.productName}
                  </div>

                  {/* 1D Barcode Image - Wide & Sharp */}
                  {printData.barcodeBase64Image ? (
                    <img
                      src={printData.barcodeBase64Image}
                      alt={printData.barcode}
                      className="h-16 sm:h-20 w-full max-w-[95%] object-contain my-1.5 filter contrast-125"
                    />
                  ) : (
                    <div className="h-14 flex items-center justify-center font-mono font-bold text-slate-400">
                      Mã: {printData.barcode}
                    </div>
                  )}

                  <div className="font-mono font-black text-xs text-slate-800 tracking-widest mt-0.5">
                    {printData.barcode}
                  </div>

                  <div className="text-xs font-black text-[#0070f4] mt-1.5">
                    Giá: {formatCurrency(printData.price)} / {printData.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Hidden on Print */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 print:hidden">
          <div className="text-[11px] text-slate-400 font-semibold">
            {printData?.barcode ? `Mã vạch: ${printData.barcode}` : ""}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors text-xs"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={isLoading || isError || !printData}
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#0070f4] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold px-5 py-2 rounded-xl shadow-md transition-all text-xs"
            >
              <Printer size={15} />
              <span>In Tem Mã Vạch</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
