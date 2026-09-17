import React from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useExportReportMutation } from "../services/reportApi";
import { downloadBlobFile, generateReportFileName } from "../utils/reportExportHelper";
import { useNotification } from "@/hooks/useNotification";

interface ReportExportButtonProps {
  reportType: "GROSS_PROFIT" | "EMPLOYEE_SHIFT" | "PAYMENT_METHOD" | "PRODUCT_GROUP" | "DAILY" | "PRODUCTS" | "RECONCILIATION";
  fromDate?: string;
  toDate?: string;
  filter1?: string;
  filter2?: string;
  buttonLabel?: string;
  className?: string;
  disabled?: boolean;
}

export const ReportExportButton: React.FC<ReportExportButtonProps> = ({
  reportType,
  fromDate,
  toDate,
  filter1,
  filter2,
  buttonLabel = "Xuất Excel",
  className = "",
  disabled = false,
}) => {
  const [exportReport, { isLoading }] = useExportReportMutation();
  const { showSuccess, showError } = useNotification();

  const handleExport = async () => {
    try {
      const blob = await exportReport({
        reportType,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        filter1: filter1 || undefined,
        filter2: filter2 || undefined,
      }).unwrap();

      const fileName = generateReportFileName(reportType);
      downloadBlobFile(blob, fileName);
      showSuccess(`Xuất báo cáo Excel thành công! (Tệp: ${fileName})`);
    } catch {
      showError("Không thể xuất báo cáo ra Excel. Vui lòng thử lại sau.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || isLoading}
      className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      title="Tải về tệp bảng tính Microsoft Excel (.xlsx)"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
      )}
      <span>{isLoading ? "Đang xuất file..." : buttonLabel}</span>
    </button>
  );
};
