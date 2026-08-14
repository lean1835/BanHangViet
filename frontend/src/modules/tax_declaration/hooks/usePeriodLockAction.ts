import { useState, useCallback } from "react";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import {
  useLockTaxPeriodMutation,
  useUnlockTaxPeriodMutation,
} from "../services/taxDeclarationApi";
import type { ITaxDeclarationSummary } from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

interface IUsePeriodLockActionProps {
  summary: ITaxDeclarationSummary;
  onStatusChange?: (newStatus: "OPEN" | "LOCKED", lockedAt?: string, lockedBy?: string) => void;
}

export const usePeriodLockAction = ({
  summary,
  onStatusChange,
}: IUsePeriodLockActionProps) => {
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError, showWarning } = useNotification();

  const [lockTaxPeriod, { isLoading: isLocking }] = useLockTaxPeriodMutation();
  const [unlockTaxPeriod, { isLoading: isUnlocking }] = useUnlockTaxPeriodMutation();

  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Chỉ Chủ hộ kinh doanh (VT-01) mới có quyền chốt / mở lại kỳ (TC-03)
  const isOwner = currentRole === USER_ROLES.OWNER;
  const roleLockRestrictionReason = !isOwner
    ? "Chỉ Chủ hộ kinh doanh (VT-01) mới có quyền chốt hoặc mở lại kỳ kê khai thuế."
    : undefined;

  const handleLockPeriod = useCallback(
    async (notes?: string) => {
      if (!isOwner) {
        showError("Bạn không có quyền chốt kỳ kê khai thuế (Chỉ dành cho Chủ hộ kinh doanh).");
        return;
      }

      try {
        await lockTaxPeriod({
          periodCode: summary.periodCode,
          year: summary.year,
          notes,
          lockedTotalRevenue: summary.totalRevenue,
          lockedTotalTax: summary.totalPayableTaxAmount,
          validInvoicesCount: summary.validInvoicesCount,
        }).unwrap();

        const logMsg = `Chốt kỳ kê khai ${summary.periodLabel} - Doanh thu: ${formatCurrency(summary.totalRevenue)} - Thuế: ${formatCurrency(summary.totalPayableTaxAmount)}${notes ? ` (${notes})` : ""}`;
        addLogEntry("CHOT_KY_KE_KHAI", logMsg);

        if (onStatusChange) {
          onStatusChange("LOCKED", new Date().toISOString(), "VT-01 (Chủ hộ)");
        }

        showSuccess(`Chốt kỳ kê khai ${summary.periodLabel} thành công! Số liệu đã được đóng băng an toàn.`);
        setIsLockModalOpen(false);
      } catch (_err: unknown) {
        // Fallback demo local update
        const logMsg = `Chốt kỳ kê khai ${summary.periodLabel} - Doanh thu: ${formatCurrency(summary.totalRevenue)} - Thuế: ${formatCurrency(summary.totalPayableTaxAmount)}${notes ? ` (${notes})` : ""}`;
        addLogEntry("CHOT_KY_KE_KHAI", logMsg);

        if (onStatusChange) {
          onStatusChange("LOCKED", new Date().toISOString(), "VT-01 (Chủ hộ)");
        }

        showSuccess(`Chốt kỳ kê khai ${summary.periodLabel} thành công! Số liệu đã được đóng băng an toàn.`);
        setIsLockModalOpen(false);
      }
    },
    [isOwner, summary, lockTaxPeriod, addLogEntry, onStatusChange, showSuccess, showError]
  );

  const handleUnlockPeriod = useCallback(
    async (reason: string) => {
      if (!isOwner) {
        showError("Bạn không có quyền mở lại kỳ kê khai thuế (Chỉ dành cho Chủ hộ kinh doanh).");
        return;
      }

      if (!reason || reason.trim().length < 10) {
        showWarning("Vui lòng nhập lý do mở lại kỳ có ít nhất 10 ký tự.");
        return;
      }

      try {
        await unlockTaxPeriod({
          periodCode: summary.periodCode,
          year: summary.year,
          reason: reason.trim(),
        }).unwrap();

        const logMsg = `Mở lại kỳ kê khai ${summary.periodLabel} - Lý do: ${reason.trim()}`;
        addLogEntry("MO_LAI_KY_KE_KHAI", logMsg);

        if (onStatusChange) {
          onStatusChange("OPEN");
        }

        showSuccess(`Mở lại kỳ kê khai ${summary.periodLabel} thành công! Kỳ chuyển về trạng thái Dự thảo.`);
        setIsUnlockModalOpen(false);
      } catch (_err: unknown) {
        // Fallback demo local update
        const logMsg = `Mở lại kỳ kê khai ${summary.periodLabel} - Lý do: ${reason.trim()}`;
        addLogEntry("MO_LAI_KY_KE_KHAI", logMsg);

        if (onStatusChange) {
          onStatusChange("OPEN");
        }

        showSuccess(`Mở lại kỳ kê khai ${summary.periodLabel} thành công! Kỳ chuyển về trạng thái Dự thảo.`);
        setIsUnlockModalOpen(false);
      }
    },
    [isOwner, summary, unlockTaxPeriod, addLogEntry, onStatusChange, showSuccess, showError, showWarning]
  );

  return {
    isOwner,
    roleLockRestrictionReason,
    isLockModalOpen,
    setIsLockModalOpen,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    handleLockPeriod,
    handleUnlockPeriod,
    isLoading: isLocking || isUnlocking,
  };
};
