import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  FileText,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
} from "lucide-react";
import type {
  ITaxDeclarationPeriodResponse,
  ITaxRevenueSummaryResponse,
  ITaxSalesRegisterItemResponse,
  TTaxExportFormat,
} from "../types/ITaxDeclaration";
import { SimulatedTaxForm01 } from "./SimulatedTaxForm01";
import { TaxInvoiceAnnexTable } from "./TaxInvoiceAnnexTable";
import { formatCurrency } from "@/utils/formatCurrency";

interface ITaxDeclarationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  period?: ITaxDeclarationPeriodResponse;
  revenueSummary?: ITaxRevenueSummaryResponse;
  registerItems?: ITaxSalesRegisterItemResponse[];
  householdData?: {
    name: string;
    taxCode: string;
    representativeName?: string;
    address: string;
    phoneNumber: string;
  };
  onExport: (format: TTaxExportFormat) => void;
  isExporting: boolean;
  canExport: boolean;
}

export const TaxDeclarationPreviewModal: React.FC<
  ITaxDeclarationPreviewModalProps
> = ({
  isOpen,
  onClose,
  period,
  revenueSummary,
  registerItems = [],
  householdData,
  onExport,
  isExporting,
  canExport,
}) => {
  const [activeTab, setActiveTab] = useState<"FORM" | "ANNEX">("FORM");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen || !period) return null;

  const handlePrint = () => {
    const formElement = document.getElementById("tax-declaration-form-simulation");
    if (!formElement) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const styleTags = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style")
    )
      .map((el) => el.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>ToKhaiThue_01_CNKD_${period.periodName}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-wrapper {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            #tax-declaration-form-simulation {
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              min-height: auto !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${formElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 250);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 140));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 70));
  const handleResetZoom = () => setZoomLevel(100);

  const totalTaxAmount = revenueSummary?.totalTaxAmount ?? period.totalTaxAmount;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-modal-backdrop">
      {/* Fallback print stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #tax-declaration-form-simulation, #tax-declaration-form-simulation * {
            visibility: visible !important;
          }
          #tax-declaration-form-simulation {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            min-height: auto !important;
            background: white !important;
            color: black !important;
            transform: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="bg-slate-100 rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full h-[92vh] flex flex-col overflow-hidden animate-modal-scale">
        {/* Modal Top Header */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4 shrink-0 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">
                Xem trước Tờ khai thuế & Sổ sách ({period.periodName})
              </h2>
              <p className="text-[11px] text-slate-500">
                Mẫu mô phỏng chuẩn Thông tư 40/2021/TT-BTC dành cho Hộ kinh doanh
              </p>
            </div>
          </div>

          {/* Controls: Zoom, Actions */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {activeTab === "FORM" && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1 mr-2 text-xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 text-slate-600 hover:bg-slate-200 active:scale-95 rounded transition cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
                <span className="px-1 font-mono font-bold text-[11px] text-slate-700">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 text-slate-600 hover:bg-slate-200 active:scale-95 rounded transition cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 text-slate-600 hover:bg-slate-200 active:scale-95 rounded ml-0.5 transition cursor-pointer"
                  title="Đặt lại 100%"
                >
                  <RotateCcw className="w-3 h-3 stroke-[2.2]" />
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white px-5 border-b border-slate-200 flex items-center gap-4 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("FORM")}
            className={`py-3 font-bold border-b-2 transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 select-none ${
              activeTab === "FORM"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            <span>Mẫu 01/CNKD (Tờ khai)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ANNEX")}
            className={`py-3 font-bold border-b-2 transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 select-none ${
              activeTab === "ANNEX"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            <span>
              Phụ lục 01-2/BK ({registerItems.length} hóa đơn)
            </span>
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center items-start">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease",
            }}
            className={`w-full justify-center ${
              activeTab === "FORM" ? "flex" : "hidden"
            }`}
          >
            <SimulatedTaxForm01
              period={period}
              revenueSummary={revenueSummary}
              householdData={householdData}
            />
          </div>

          {activeTab === "ANNEX" && (
            <div className="w-full max-w-5xl">
              <TaxInvoiceAnnexTable
                invoices={registerItems}
                periodLabel={period.periodName}
              />
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Tổng thuế phải nộp:{" "}
            <strong className="text-rose-600 font-bold">
              {formatCurrency(totalTaxAmount)}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Đóng
            </button>

            {canExport && (
              <>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => onExport("PDF")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer select-none"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 stroke-[2.5]" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                  )}
                  <span>Tải tờ khai</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-500 hover:bg-gray-600 active:bg-gray-700 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer select-none"
                  title="In tờ khai thuế"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                  <span>In tờ khai</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
