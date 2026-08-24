import { useState, useCallback } from "react";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import {
  exportTaxDeclarationToPdf,
  exportTaxDeclarationToXml,
} from "../utils/taxExportHelper";
import { downloadTaxDeclarationExcel } from "../services/taxDeclarationApi";
import type {
  ITaxDeclarationPeriodResponse,
  ITaxRevenueSummaryResponse,
  ITaxSalesRegisterItemResponse,
  TTaxExportFormat,
} from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

interface IUseTaxDeclarationExportProps {
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
  previewElementId?: string;
  onMissingInfoAlert?: () => void;
  isMissingInfo: boolean;
  roleAllowed: boolean;
}

export const useTaxDeclarationExport = ({
  period,
  revenueSummary,
  registerItems = [],
  householdData,
  previewElementId = "tax-declaration-form-simulation",
  onMissingInfoAlert,
  isMissingInfo,
  roleAllowed,
}: IUseTaxDeclarationExportProps) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const { addLogEntry } = useDashboardDemo();
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

      if (!period) {
        showWarning("Vui lòng chọn hoặc lập bảng kê kỳ kê khai trước khi xuất tờ khai.");
        return;
      }

      setIsExporting(true);
      try {
        if (format === "EXCEL") {
          // Gọi trực tiếp API tải tệp Excel 2 sheet từ Backend (Apache POI engine)
          const fileName = `To_khai_thue_${period.periodType}_${period.year}_${period.periodNumber}.xlsx`;
          await downloadTaxDeclarationExcel(period.id, fileName);
        } else if (format === "PDF") {
          await exportTaxDeclarationToPdf(previewElementId, period.periodName, period.year);
        } else if (format === "XML") {
          exportTaxDeclarationToXml(period, revenueSummary, registerItems, householdData);
        }

        const formatLabels: Record<TTaxExportFormat, string> = {
          PDF: "PDF (Mẫu 01/CNKD A4)",
          EXCEL: "Excel từ Máy chủ (Tờ khai 01 + Bảng kê 01-2)",
          XML: "XML (eTax mô phỏng)",
        };

        const logDesc = `Xuất tờ khai thuế ${period.periodName} (${formatLabels[format]}) - Tổng thuế: ${formatCurrency(period.totalTaxAmount)}`;
        addLogEntry("XUAT_TO_KHAI_THUE", logDesc);

        showSuccess(
          `Xuất tờ khai thuế ${period.periodName} (${format}) thành công! Đã ghi nhận lịch sử kiểm toán.`
        );
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
      period,
      previewElementId,
      revenueSummary,
      registerItems,
      householdData,
      showError,
      showWarning,
      showSuccess,
      addLogEntry,
    ]
  );

  return {
    handleExport,
    isExporting,
  };
};
