import { useState, useCallback } from "react";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import {
  useLockTaxPeriodMutation,
  useUnlockTaxPeriodMutation,
} from "../services/taxDeclarationApi";
import type { ITaxDeclarationPeriodResponse } from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

interface IUsePeriodLockActionProps {
  period?: ITaxDeclarationPeriodResponse;
  onSuccess?: () => void;
}

export const usePeriodLockAction = ({
  period,
  onSuccess,
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

      if (!period) {
        showWarning("Không tìm thấy thông tin kỳ kê khai để chốt.");
        return;
      }

      try {
        await lockTaxPeriod(period.id).unwrap();

        const logMsg = `Chốt kỳ kê khai ${period.periodName} - Doanh thu: ${formatCurrency(period.totalRevenue)} - Thuế: ${formatCurrency(period.totalTaxAmount)}${notes ? ` (${notes})` : ""}`;
        addLogEntry("CHOT_KY_KE_KHAI", logMsg);

        showSuccess(`Chốt kỳ kê khai ${period.periodName} thành công! Số liệu đã được đóng băng an toàn.`);
        setIsLockModalOpen(false);
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        const errorMsg = err && typeof err === "object" && "data" in err && (err as { data: { message?: string } }).data?.message
          ? (err as { data: { message: string } }).data.message
          : "Chốt kỳ kê khai thất bại. Vui lòng thử lại!";
        showError(errorMsg);
      }
    },
    [isOwner, period, lockTaxPeriod, addLogEntry, onSuccess, showSuccess, showError, showWarning]
  );

  const handleUnlockPeriod = useCallback(
    async (reason: string) => {
      if (!isOwner) {
        showError("Bạn không có quyền mở lại kỳ kê khai thuế (Chỉ dành cho Chủ hộ kinh doanh).");
        return;
      }

      if (!period) {
        showWarning("Không tìm thấy thông tin kỳ kê khai để mở lại.");
        return;
      }

      if (!reason || reason.trim().length < 10) {
        showWarning("Vui lòng nhập lý do mở lại kỳ có ít nhất 10 ký tự.");
        return;
      }

      try {
        await unlockTaxPeriod({
          periodId: period.id,
          reason: reason.trim(),
        }).unwrap();

        const logMsg = `Mở lại kỳ kê khai ${period.periodName} - Lý do: ${reason.trim()}`;
        addLogEntry("MO_LAI_KY_KE_KHAI", logMsg);

        showSuccess(`Mở lại kỳ kê khai ${period.periodName} thành công! Kỳ chuyển về trạng thái sẵn sàng kê khai.`);
        setIsUnlockModalOpen(false);
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        const errorMsg = err && typeof err === "object" && "data" in err && (err as { data: { message?: string } }).data?.message
          ? (err as { data: { message: string } }).data.message
          : "Mở lại kỳ kê khai thất bại. Vui lòng thử lại!";
        showError(errorMsg);
      }
    },
    [isOwner, period, unlockTaxPeriod, addLogEntry, onSuccess, showSuccess, showError, showWarning]
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
