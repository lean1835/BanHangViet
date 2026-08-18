import React, { useState } from "react";
import type { ITaxPeriodQueryParams } from "../types/salesInvoiceListing.types";

interface IExportSalesInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (format: "excel" | "pdf") => void;
  filters: ITaxPeriodQueryParams;
  isExporting?: boolean;
}

export const ExportSalesInvoiceModal: React.FC<IExportSalesInvoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  filters,
  isExporting = false,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<"excel" | "pdf">("excel");

  if (!isOpen) return null;

  const getPeriodText = () => {
    if (filters.periodType === "MONTHLY") {
      return `Tháng ${filters.periodNumber}/${filters.year}`;
    }
    if (filters.periodType === "QUARTERLY") {
      return `Quý ${filters.periodNumber} - Năm ${filters.year}`;
    }
    return `Năm ${filters.year}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Xuất Bảng kê & Tờ khai thuế
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl text-xs text-blue-900">
            <p className="font-semibold">Kỳ kê khai đã chọn: <strong>{getPeriodText()}</strong></p>
            <p className="mt-1 text-slate-600">
              Tệp bao gồm Tờ khai thuế 01/CNKD và Bảng kê hóa đơn bán ra phụ lục BK01/CNKD theo mẫu quy định.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Chọn định dạng tệp:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-between p-3.5 border-2 rounded-2xl cursor-pointer transition ${
                  selectedFormat === "excel"
                    ? "border-emerald-500 bg-emerald-50/40 text-emerald-900"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <div>
                    <div className="font-bold text-xs">Excel (.xlsx)</div>
                    <div className="text-[10px] text-slate-500">Mẫu kê khai tiêu chuẩn</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={selectedFormat === "excel"}
                  onChange={() => setSelectedFormat("excel")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label
                className={`flex items-center justify-between p-3.5 border-2 rounded-2xl cursor-pointer transition ${
                  selectedFormat === "pdf"
                    ? "border-rose-500 bg-rose-50/40 text-rose-900"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <div>
                    <div className="font-bold text-xs">PDF (.pdf)</div>
                    <div className="text-[10px] text-slate-500">Bản in lưu trữ</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={selectedFormat === "pdf"}
                  onChange={() => setSelectedFormat("pdf")}
                  className="text-rose-600 focus:ring-rose-500"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(selectedFormat)}
            disabled={isExporting}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang khởi tạo tệp...
              </>
            ) : (
              <>Tải tệp kê khai</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
