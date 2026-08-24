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
    window.print();
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 140));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 70));
  const handleResetZoom = () => setZoomLevel(100);

  const totalTaxAmount = revenueSummary?.totalTaxAmount ?? period.totalTaxAmount;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-modal-backdrop">
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

          {/* Controls: Zoom, Print, Actions */}
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

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs transition border border-slate-200 cursor-pointer select-none"
              title="In bản xem trước"
            >
              <Printer className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
              <span className="hidden sm:inline">In trang</span>
            </button>

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
          {activeTab === "FORM" ? (
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease",
              }}
              className="w-full flex justify-center"
            >
              <SimulatedTaxForm01
                period={period}
                revenueSummary={revenueSummary}
                householdData={householdData}
              />
            </div>
          ) : (
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
                  <span>Tải PDF A4</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => onExport("EXCEL")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-95 text-white font-bold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer select-none"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 stroke-[2.5]" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                  )}
                  <span>Tải Excel từ Máy chủ</span>
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
