import { useState, useCallback } from "react";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import {
  exportTaxDeclarationToPdf,
  exportTaxDeclarationToExcel,
  exportTaxDeclarationToXml,
} from "../utils/taxExportHelper";
import { useLogTaxExportAuditMutation } from "../services/taxDeclarationApi";
import type {
  ITaxDeclarationSummary,
  ITaxAnnexInvoice,
  TTaxExportFormat,
} from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

interface IUseTaxDeclarationExportProps {
  summary: ITaxDeclarationSummary;
  annexInvoices: ITaxAnnexInvoice[];
  previewElementId?: string;
  onMissingInfoAlert?: () => void;
  isMissingInfo: boolean;
  roleAllowed: boolean;
}

export const useTaxDeclarationExport = ({
  summary,
  annexInvoices,
  previewElementId = "tax-declaration-form-simulation",
  onMissingInfoAlert,
  isMissingInfo,
  roleAllowed,
}: IUseTaxDeclarationExportProps) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const { addLogEntry } = useDashboardDemo();
  const [logTaxExportAudit] = useLogTaxExportAuditMutation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(
    async (format: TTaxExportFormat) => {
      // 1. Kiểm tra quyền (TC-03)
      if (!roleAllowed) {
        showError("Bạn không có quyền thực hiện chức năng này (Chỉ Kế toán và Chủ hộ).");
        return;
      }

      // 2. Kiểm tra thiếu thông tin hộ (TC-02)
      if (isMissingInfo) {
        if (onMissingInfoAlert) {
          onMissingInfoAlert();
        } else {
          showWarning("Thông tin hộ kinh doanh còn thiếu. Vui lòng bổ sung Mã số thuế hoặc Người đại diện.");
        }
        return;
      }

      setIsExporting(true);
      try {
        let success = false;
        if (format === "PDF") {
          success = await exportTaxDeclarationToPdf(previewElementId, summary);
        } else if (format === "EXCEL") {
          success = exportTaxDeclarationToExcel(summary, annexInvoices);
        } else if (format === "XML") {
          success = exportTaxDeclarationToXml(summary, annexInvoices);
        }

        if (success) {
          // 3. Ghi nhận nhật ký kiểm toán hệ thống (TC-04)
          const formatLabels: Record<TTaxExportFormat, string> = {
            PDF: "PDF (Mẫu 01/CNKD A4)",
            EXCEL: "Excel (Tờ khai + Bảng kê)",
            XML: "XML (eTax mô phỏng)",
          };

          const logDesc = `Xuất tờ khai thuế ${summary.periodLabel} (${formatLabels[format]}) - Tổng thuế: ${formatCurrency(summary.totalPayableTaxAmount)}`;
          
          addLogEntry("XUAT_TO_KHAI_THUE", logDesc);

          try {
            await logTaxExportAudit({
              periodCode: summary.periodCode,
              exportFormat: format,
              exportedAt: new Date().toISOString(),
              totalTaxAmount: summary.totalPayableTaxAmount,
              householdTaxCode: summary.taxCode,
              representativeName: summary.representativeName,
            }).unwrap();
          } catch {
            // Logged locally in dashboard demo state even if server is offline
          }

          showSuccess(
            `Xuất tờ khai thuế ${summary.periodLabel} (${format}) thành công! Đã ghi nhận lịch sử kiểm toán.`
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Xuất tờ khai thuế thất bại. Vui lòng thử lại!";
        showError(errorMsg);
      } finally {
        setIsExporting(false);
      }
    },
    [
      roleAllowed,
      isMissingInfo,
      onMissingInfoAlert,
      previewElementId,
      summary,
      annexInvoices,
      showError,
      showWarning,
      showSuccess,
      addLogEntry,
      logTaxExportAudit,
    ]
  );

  return {
    handleExport,
    isExporting,
  };
};
