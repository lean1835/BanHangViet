import { useState, useCallback, useEffect } from "react";
import { useCheckConflictsMutation, useBulkUploadMutation, useResolveConflictMutation } from "../services/syncApi";
import {
  getPendingOfflineOrders,
  clearSyncedOrders,
  removeOfflineOrder,
  updateOfflineOrderStatus,
} from "../utils/offlineSyncStorage";
import type { ILocalOfflineOrder, TConflictResolutionStrategy } from "../types/ISync";

import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface UseOfflineSyncOptions {
  isOnline: boolean;
  simConflict?: boolean;
  userRole?: string;
  onSyncSuccess?: (syncedOrderNumbers?: string[]) => void;
}

export const useOfflineSync = ({
  isOnline,
  simConflict = false,
  userRole = "VT-01",
  onSyncSuccess,
}: UseOfflineSyncOptions) => {
  const [pendingOrders, setPendingOrders] = useState<ILocalOfflineOrder[]>([]);
  const [conflictingOrders, setConflictingOrders] = useState<ILocalOfflineOrder[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);

  const [checkConflicts] = useCheckConflictsMutation();
  const [bulkUpload] = useBulkUploadMutation();
  const [resolveConflictMutation] = useResolveConflictMutation();

  const refreshPendingOrders = useCallback(() => {
    const list = getPendingOfflineOrders();
    setPendingOrders(list);
  }, []);

  useEffect(() => {
    refreshPendingOrders();
  }, [refreshPendingOrders]);

  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      setWarnings(["Hệ thống đang ở chế độ Mất mạng (Offline). Không thể thực hiện đồng bộ."]);
      return;
    }

    const currentList = getPendingOfflineOrders();
    if (currentList.length === 0) {
      setWarnings([]);
      return;
    }

    setIsSyncing(true);
    setWarnings([]);

    try {
      const orderNumbers = currentList.map((o) => o.orderNumber);

      // Bước 1: Gọi checkConflicts API từ Backend
      const checkRes = await checkConflicts({ offlineOrderNumbers: orderNumbers }).unwrap();
      const { duplicates = [], conflicts = [] } = checkRes.result || {};

      let effectiveConflicts = [...conflicts];
      let effectiveDuplicates = [...duplicates];

      // Nếu bật simConflict (giả lập xung đột), chọn đơn đầu tiên chưa bị trùng làm đơn xung đột
      if (simConflict && currentList.length > 0 && effectiveConflicts.length === 0) {
        const candidate = currentList.find((o) => !effectiveDuplicates.includes(o.orderNumber));
        if (candidate) {
          effectiveConflicts.push(candidate.orderNumber);
        }
      }

      // Xử lý đơn bị trùng (Đã có sẵn ở máy chủ với trạng thái offline)
      if (effectiveDuplicates.length > 0) {
        clearSyncedOrders(effectiveDuplicates);
      }

      // Xử lý các đơn bị xung đột
      if (effectiveConflicts.length > 0) {
        const conflictItems = currentList.filter((o) => effectiveConflicts.includes(o.orderNumber));
        conflictItems.forEach((item) => updateOfflineOrderStatus(item.orderNumber, "CONFLICT"));
        setConflictingOrders(conflictItems);
      } else {
        setConflictingOrders([]);
      }

      // Lọc các đơn sạch (không trùng và không xung đột) để đẩy lên server
      const cleanOrders = currentList.filter(
        (o) => !effectiveDuplicates.includes(o.orderNumber) && !effectiveConflicts.includes(o.orderNumber)
      );

      let syncedOrderNumbers: string[] = [];

      if (cleanOrders.length > 0) {
        // Bước 2: Tải danh sách đơn hàng hợp lệ lên máy chủ
        const payload = cleanOrders.map(({ localId, syncStatus, errorMessage, ...rest }) => rest);
        const uploadRes = await bulkUpload(payload).unwrap();

        syncedOrderNumbers = uploadRes.result?.map((r) => r.orderNumber) || [];
        clearSyncedOrders(syncedOrderNumbers);

        // Gom các thông điệp cảnh báo (như cảnh báo quá 24h, sản phẩm vượt tồn kho)
        const collectedWarnings: string[] = [];
        uploadRes.result?.forEach((r) => {
          if (r.warningMessages && r.warningMessages.length > 0) {
            collectedWarnings.push(...r.warningMessages);
          }
        });

        setWarnings(collectedWarnings);
      }

      setLastSyncedTime(new Date());
      refreshPendingOrders();
      if (onSyncSuccess) onSyncSuccess(syncedOrderNumbers);
    } catch (err: unknown) {
      console.error("Đồng bộ đơn hàng ngoại tuyến thất bại:", err);
      const errMsg = getApiErrorMessage(err, "Đồng bộ đơn hàng thất bại. Vui lòng kiểm tra lại.");
      setWarnings([errMsg]);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, simConflict, checkConflicts, bulkUpload, refreshPendingOrders, onSyncSuccess]);

  // Tự động kích hoạt đồng bộ khi có kết nối mạng trở lại
  useEffect(() => {
    if (isOnline) {
      const pending = getPendingOfflineOrders();
      if (pending.length > 0 && !isSyncing) {
        triggerSync();
      }
    }
  }, [isOnline, triggerSync, isSyncing]);

  const resolveOrderConflict = useCallback(
    async (orderNumber: string, strategy: TConflictResolutionStrategy) => {
      const target = conflictingOrders.find((o) => o.orderNumber === orderNumber);
      if (!target) return;

      if (userRole !== "VT-01" && userRole !== "owner") {
        setWarnings(["Chỉ tài khoản Chủ hộ kinh doanh (VT-01) mới có quyền giải quyết xung đột đơn hàng."]);
        return;
      }

      setIsSyncing(true);
      try {
        const { localId, syncStatus, errorMessage, ...clientData } = target;
        await resolveConflictMutation({
          orderNumber,
          resolutionStrategy: strategy,
          clientOrderData: strategy === "OVERWRITE_SERVER" ? clientData : null,
        }).unwrap();

        // Xóa đơn đã giải quyết khỏi local storage và danh sách xung đột
        removeOfflineOrder(orderNumber);
        setConflictingOrders((prev) => prev.filter((o) => o.orderNumber !== orderNumber));
        setWarnings([`Đã giải quyết xung đột cho đơn hàng ${orderNumber} thành công.`]);

        refreshPendingOrders();
        if (onSyncSuccess) onSyncSuccess([orderNumber]);
      } catch (err: unknown) {
        console.error("Giải quyết xung đột thất bại:", err);
        const errMsg = getApiErrorMessage(err, "Giải quyết xung đột thất bại.");
        setWarnings([errMsg]);
      } finally {
        setIsSyncing(false);
      }
    },
    [conflictingOrders, userRole, resolveConflictMutation, refreshPendingOrders, onSyncSuccess]
  );

  return {
    pendingOrders,
    pendingCount: pendingOrders.length,
    conflictingOrders,
    warnings,
    isSyncing,
    lastSyncedTime,
    triggerSync,
    resolveOrderConflict,
    refreshPendingOrders,
  };
};
