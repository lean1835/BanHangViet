import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_ORDER_PAYMENT_METHOD_LABEL,
  ORDER_FILTER_OPTIONS,
  ORDER_FILTER_STATUS,
  ORDER_PAYMENT_METHOD,
  ORDER_PAYMENT_METHOD_LABELS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_UI,
} from "@/constants/order";
import { USER_ROLES } from "@/constants/roles";
import { SHIFT_MESSAGES } from "@/constants/shift";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import { useGetActiveShiftQuery } from "@/modules/shift/services/shiftApi";
import {
  useCreateOrderMutation,
  useAddOrderItemMutation,
  useUpdateOrderItemMutation,
  useDeleteOrderItemMutation,
  useApplyDiscountMutation,
  useSetPaymentMethodMutation,
  useCompleteOrderMutation,
  useLazyGetOrderQuery,
  useLazyGetOrdersHistoryQuery,
} from "@/modules/order/services/orderApi";
import type { IOrderResponse } from "@/modules/order/types/IOrder";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useAppSelector } from "@/hooks/useRedux";
import { HTTP_STATUS } from "@/constants/api";
import { isRecord } from "@/utils/typeGuards";

interface OrderHistoryTableProps {
  currentRole: string;
}

type TOrderFilterStatus =
  (typeof ORDER_FILTER_STATUS)[keyof typeof ORDER_FILTER_STATUS];
type TOrderPaymentMethod =
  (typeof ORDER_PAYMENT_METHOD)[keyof typeof ORDER_PAYMENT_METHOD];

interface ISelectedProductItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  taxRatePercentage?: number;
}

interface IPendingOrderDraft {
  orderId: string | null;
  createPhase: "PREPARED" | "SENT";
  createAttemptedAt: number | null;
  userId: string;
  householdId: string;
  shiftId: string;
  baselineOrderIds: string[];
  customerId: string;
  selectedItems: ISelectedProductItem[];
  discountType: "VALUE" | "PERCENT";
  discountValueInput: number;
  paidAmountInput: number;
  paymentMethod: TOrderPaymentMethod;
}

interface IPendingOrderIdentity {
  userId: string;
  householdId: string;
}

interface IPendingOrderFormData {
  customerId: string;
  selectedItems: ISelectedProductItem[];
  discountType: "VALUE" | "PERCENT";
  discountValueInput: number;
  paidAmountInput: number;
  paymentMethod: TOrderPaymentMethod;
}

interface IOrderCreationLease {
  name: string;
  owner: string;
  expiresAt: number;
}

const LEGACY_PENDING_ORDER_STORAGE_KEY = "sales.pending-order-draft";
const PENDING_ORDER_STORAGE_PREFIX = "sales.pending-order-draft.v2";
const ORDER_CREATION_LOCK_PREFIX = "sales-order-create";
const ORDER_CREATION_LOCK_DATABASE = "sales-order-locks";
const ORDER_CREATION_LOCK_STORE = "leases";
const ORDER_CREATION_LEASE_DURATION_MS = 10 * 60_000;
const ORDER_CREATION_MANUAL_REVIEW_DELAY_MS = 60_000;

const getPendingOrderStorageKey = ({
  userId,
  householdId,
}: IPendingOrderIdentity): string =>
  `${PENDING_ORDER_STORAGE_PREFIX}:${encodeURIComponent(householdId)}:${encodeURIComponent(userId)}`;

const isPaymentMethod = (value: unknown): value is TOrderPaymentMethod =>
  Object.values(ORDER_PAYMENT_METHOD).includes(value as TOrderPaymentMethod);

const getPendingOrderFormStorageKey = (storageKey: string): string =>
  `${storageKey}:form`;

const isSelectedProductItem = (
  value: unknown,
): value is ISelectedProductItem =>
  isRecord(value) &&
  typeof value.productId === "string" &&
  typeof value.productName === "string" &&
  typeof value.productSku === "string" &&
  typeof value.quantity === "number" &&
  typeof value.unitPrice === "number" &&
  (value.taxRatePercentage === undefined ||
    typeof value.taxRatePercentage === "number");

const isPendingOrderFormData = (
  value: unknown,
): value is IPendingOrderFormData =>
  isRecord(value) &&
  typeof value.customerId === "string" &&
  Array.isArray(value.selectedItems) &&
  value.selectedItems.every(isSelectedProductItem) &&
  (value.discountType === "VALUE" || value.discountType === "PERCENT") &&
  typeof value.discountValueInput === "number" &&
  typeof value.paidAmountInput === "number" &&
  isPaymentMethod(value.paymentMethod);

const readPendingOrderDraft = (
  storageKey: string | null,
  identity: IPendingOrderIdentity | null,
): IPendingOrderDraft | null => {
  try {
    localStorage.removeItem(LEGACY_PENDING_ORDER_STORAGE_KEY);
    if (!storageKey || !identity) return null;

    const rawDraft = localStorage.getItem(storageKey);
    if (!rawDraft) return null;
    const storedDraft = JSON.parse(rawDraft) as Partial<IPendingOrderDraft>;
    let parsedDraft: Partial<IPendingOrderDraft> = storedDraft;
    const formStorageKey = getPendingOrderFormStorageKey(storageKey);
    const rawForm = localStorage.getItem(formStorageKey);
    if (rawForm) {
      try {
        const storedForm = JSON.parse(rawForm) as unknown;
        if (isPendingOrderFormData(storedForm)) {
          parsedDraft = { ...storedDraft, ...storedForm };
        } else {
          localStorage.removeItem(formStorageKey);
        }
      } catch {
        localStorage.removeItem(formStorageKey);
      }
    }
    if (
      (parsedDraft.orderId !== null && typeof parsedDraft.orderId !== "string") ||
      (parsedDraft.createPhase !== "PREPARED" &&
        parsedDraft.createPhase !== "SENT") ||
      (parsedDraft.createAttemptedAt !== null &&
        typeof parsedDraft.createAttemptedAt !== "number") ||
      parsedDraft.userId !== identity.userId ||
      parsedDraft.householdId !== identity.householdId ||
      typeof parsedDraft.shiftId !== "string" ||
      typeof parsedDraft.customerId !== "string" ||
      !Array.isArray(parsedDraft.baselineOrderIds) ||
      !parsedDraft.baselineOrderIds.every((id) => typeof id === "string") ||
      !isPendingOrderFormData(parsedDraft)
    ) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(formStorageKey);
      return null;
    }
    return parsedDraft as IPendingOrderDraft;
  } catch {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(getPendingOrderFormStorageKey(storageKey));
      } catch {
        // Storage can be unavailable in privacy mode; callers will fail closed.
      }
    }
    return null;
  }
};

const persistPendingOrderDraft = (
  storageKey: string | null,
  draft: IPendingOrderDraft | null,
): boolean => {
  if (!storageKey) return draft === null;
  try {
    if (draft) {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } else {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(getPendingOrderFormStorageKey(storageKey));
    }
    return true;
  } catch {
    return false;
  }
};

const persistPendingOrderForm = (
  storageKey: string | null,
  formData: IPendingOrderFormData,
): boolean => {
  if (!storageKey) return false;
  try {
    localStorage.setItem(
      getPendingOrderFormStorageKey(storageKey),
      JSON.stringify(formData),
    );
    return true;
  } catch {
    return false;
  }
};

const isDraftUnavailableError = (error: unknown): boolean => {
  if (!isRecord(error)) return false;
  return (
    error.status === HTTP_STATUS.FORBIDDEN ||
    error.status === HTTP_STATUS.NOT_FOUND
  );
};

const findRecoverableDraftOrders = (
  orderHistory: IOrderResponse[],
  draft: IPendingOrderDraft,
): IOrderResponse[] => {
  const baselineOrderIds = new Set(draft.baselineOrderIds);
  return orderHistory.filter(
    (order) =>
      !baselineOrderIds.has(order.id) &&
      order.status === ORDER_STATUS.CREATING &&
      order.createdByUserId === draft.userId &&
      order.householdId === draft.householdId &&
      order.shiftId === draft.shiftId &&
      (order.customerId ?? "") === draft.customerId &&
      order.items.length === 0,
  );
};

const findCurrentServerDraftOrders = (
  orderHistory: IOrderResponse[],
  identity: IPendingOrderIdentity,
  shiftId: string,
): IOrderResponse[] =>
  orderHistory.filter(
    (order) =>
      order.status === ORDER_STATUS.CREATING &&
      order.createdByUserId === identity.userId &&
      order.householdId === identity.householdId &&
      order.shiftId === shiftId,
  );

const isDefinitiveRejectedCreateRequest = (error: unknown): boolean => {
  if (!isRecord(error) || typeof error.status !== "number") return false;
  return (
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 408
  );
};

const getOrderCreationLockName = (
  identity: IPendingOrderIdentity,
  shiftId: string,
): string =>
  `${ORDER_CREATION_LOCK_PREFIX}:${identity.householdId}:${identity.userId}:${shiftId}`;

const openOrderCreationLockDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(
        new Error(
          "Trình duyệt không hỗ trợ cơ chế khóa an toàn để tạo đơn hàng.",
        ),
      );
      return;
    }

    let wasBlocked = false;
    const request = indexedDB.open(ORDER_CREATION_LOCK_DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ORDER_CREATION_LOCK_STORE)) {
        database.createObjectStore(ORDER_CREATION_LOCK_STORE, {
          keyPath: "name",
        });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      if (wasBlocked) {
        database.close();
        return;
      }
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => {
      reject(
        request.error ??
          new Error("Không thể mở vùng lưu trữ khóa tạo đơn hàng."),
      );
    };
    request.onblocked = () => {
      wasBlocked = true;
      reject(
        new Error(
          "Vùng lưu trữ khóa tạo đơn đang được sử dụng ở cửa sổ khác.",
        ),
      );
    };
  });

const acquireIndexedDbLease = async (
  lockName: string,
  leaseOwner: string,
): Promise<boolean> => {
  const database = await openOrderCreationLockDatabase();
  return new Promise((resolve, reject) => {
    let acquired = false;
    const transaction = database.transaction(
      ORDER_CREATION_LOCK_STORE,
      "readwrite",
    );
    const store = transaction.objectStore(ORDER_CREATION_LOCK_STORE);
    const request = store.get(lockName);

    request.onsuccess = () => {
      const currentLease = request.result as IOrderCreationLease | undefined;
      if (
        currentLease?.owner &&
        typeof currentLease.expiresAt === "number" &&
        currentLease.expiresAt > Date.now()
      ) {
        return;
      }

      store.put({
        name: lockName,
        owner: leaseOwner,
        expiresAt: Date.now() + ORDER_CREATION_LEASE_DURATION_MS,
      } satisfies IOrderCreationLease);
      acquired = true;
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(acquired);
    };
    transaction.onerror = () => {
      database.close();
      reject(
        transaction.error ?? new Error("Không thể ghi khóa tạo đơn hàng."),
      );
    };
    transaction.onabort = () => {
      database.close();
      reject(
        transaction.error ?? new Error("Giao dịch khóa tạo đơn bị hủy."),
      );
    };
  });
};

const renewIndexedDbLease = async (
  lockName: string,
  leaseOwner: string,
): Promise<boolean> => {
  const database = await openOrderCreationLockDatabase();
  return new Promise((resolve, reject) => {
    let renewed = false;
    const transaction = database.transaction(
      ORDER_CREATION_LOCK_STORE,
      "readwrite",
    );
    const store = transaction.objectStore(ORDER_CREATION_LOCK_STORE);
    const request = store.get(lockName);

    request.onsuccess = () => {
      const currentLease = request.result as IOrderCreationLease | undefined;
      if (currentLease?.owner !== leaseOwner) return;
      store.put({
        name: lockName,
        owner: leaseOwner,
        expiresAt: Date.now() + ORDER_CREATION_LEASE_DURATION_MS,
      } satisfies IOrderCreationLease);
      renewed = true;
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(renewed);
    };
    transaction.onerror = () => {
      database.close();
      reject(
        transaction.error ?? new Error("Không thể gia hạn khóa tạo đơn."),
      );
    };
    transaction.onabort = () => {
      database.close();
      reject(
        transaction.error ?? new Error("Giao dịch gia hạn khóa bị hủy."),
      );
    };
  });
};

const releaseIndexedDbLease = async (
  lockName: string,
  leaseOwner: string,
): Promise<void> => {
  const database = await openOrderCreationLockDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      ORDER_CREATION_LOCK_STORE,
      "readwrite",
    );
    const store = transaction.objectStore(ORDER_CREATION_LOCK_STORE);
    const request = store.get(lockName);

    request.onsuccess = () => {
      const currentLease = request.result as IOrderCreationLease | undefined;
      if (currentLease?.owner === leaseOwner) store.delete(lockName);
    };
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(
        transaction.error ?? new Error("Không thể giải phóng khóa tạo đơn."),
      );
    };
    transaction.onabort = () => {
      database.close();
      reject(
        transaction.error ?? new Error("Giao dịch giải phóng khóa bị hủy."),
      );
    };
  });
};

const runWithIndexedDbLease = async (
  lockName: string,
  task: () => Promise<void>,
): Promise<void> => {
  const leaseOwner = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let leaseHeartbeatId: number | null = null;
  const acquired = await acquireIndexedDbLease(lockName, leaseOwner);
  if (!acquired) {
    throw new Error(
      "Một cửa sổ khác đang xử lý đơn hàng của ca này. Vui lòng chờ rồi thử lại.",
    );
  }

  try {
    leaseHeartbeatId = window.setInterval(() => {
      void renewIndexedDbLease(lockName, leaseOwner).catch(() => {
        // The persistent draft remains the fail-safe if the browser suspends this tab.
      });
    }, ORDER_CREATION_LEASE_DURATION_MS / 3);
    await task();
  } finally {
    if (leaseHeartbeatId !== null) window.clearInterval(leaseHeartbeatId);
    await releaseIndexedDbLease(lockName, leaseOwner).catch(() => {
      // The lease has a bounded expiry, so a failed cleanup cannot lock the UI forever.
    });
  }
};

const runWithOrderCreationLock = async (
  lockName: string,
  task: () => Promise<void>,
): Promise<void> => {
  if (navigator.locks) {
    const result = await navigator.locks.request(
      lockName,
      { ifAvailable: true },
      async (lock) => {
        if (!lock) return false;
        await task();
        return true;
      },
    );
    if (!result) {
      throw new Error(
        "Một cửa sổ khác đang xử lý đơn hàng của ca này. Vui lòng chờ rồi thử lại.",
      );
    }
    return;
  }

  try {
    await runWithIndexedDbLease(lockName, task);
  } catch (error: unknown) {
    if (error instanceof Error) throw error;
    throw new Error("Không thể khóa thao tác tạo đơn trong trình duyệt.");
  }
};

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({ currentRole }) => {
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const authenticatedUser = useAppSelector((state) => state.auth.user);
  const pendingOrderIdentity = useMemo<IPendingOrderIdentity | null>(
    () =>
      authenticatedUser?.household?.id
        ? {
            userId: authenticatedUser.id,
            householdId: authenticatedUser.household.id,
          }
        : null,
    [authenticatedUser?.household?.id, authenticatedUser?.id],
  );
  const pendingOrderStorageKey = pendingOrderIdentity
    ? getPendingOrderStorageKey(pendingOrderIdentity)
    : null;
  const {
    orders,
    setOrders,
    customers,
    addLogEntry,
    isOrdersLoading,
    isOrdersError,
    ordersError,
    refetchOrders,
  } = useDashboardDemo();
  const canMutateOrders =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.CASHIER;
  
  // Fetch available products from the real API endpoint
  const {
    data: productsPageData,
    error: productsError,
    isError: isProductsError,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useGetProductsQuery({ size: 100 });
  const availableProducts = productsPageData?.content || [];

  const {
    data: activeShiftData,
    error: activeShiftError,
    isError: isActiveShiftError,
    isFetching: isActiveShiftFetching,
    refetch: refetchActiveShift,
  } = useGetActiveShiftQuery(undefined, { skip: !canMutateOrders });
  const activeShift = activeShiftData?.result ?? null;

  const [createOrderApi] = useCreateOrderMutation();
  const [addOrderItemApi] = useAddOrderItemMutation();
  const [updateOrderItemApi] = useUpdateOrderItemMutation();
  const [deleteOrderItemApi] = useDeleteOrderItemMutation();
  const [applyDiscountApi] = useApplyDiscountMutation();
  const [setPaymentMethodApi] = useSetPaymentMethodMutation();
  const [completeOrderApi] = useCompleteOrderMutation();
  const [getOrderApi] = useLazyGetOrderQuery();
  const [getOrdersHistoryApi] = useLazyGetOrdersHistoryQuery();

  const [orderFilterStatus, setOrderFilterStatus] = useState<TOrderFilterStatus>(
    ORDER_FILTER_STATUS.ALL
  );

  const [pendingOrderDraft, setPendingOrderDraft] =
    useState<IPendingOrderDraft | null>(() =>
      readPendingOrderDraft(pendingOrderStorageKey, pendingOrderIdentity),
    );
  const hasDraftPersistenceWarningRef = useRef(false);
  const isApplyingRemoteDraftRef = useRef(false);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAbandonDraftConfirm, setShowAbandonDraftConfirm] = useState(false);
  const [hasAcknowledgedAbandonRisk, setHasAcknowledgedAbandonRisk] =
    useState(false);
  const [isAbandoningDraft, setIsAbandoningDraft] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrderResponse | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [customerId, setCustomerId] = useState(
    pendingOrderDraft?.customerId ?? "",
  );
  const [selectedItems, setSelectedItems] = useState<ISelectedProductItem[]>(
    pendingOrderDraft?.selectedItems ?? [],
  );
  const [discountType, setDiscountType] = useState<"VALUE" | "PERCENT">(
    pendingOrderDraft?.discountType ?? "VALUE",
  );
  const [discountValueInput, setDiscountValueInput] = useState<number>(
    pendingOrderDraft?.discountValueInput ?? 0,
  );
  const [paidAmountInput, setPaidAmountInput] = useState<number>(
    pendingOrderDraft?.paidAmountInput ?? 0,
  );
  const [paymentMethod, setPaymentMethod] = useState<TOrderPaymentMethod>(
    pendingOrderDraft?.paymentMethod ?? ORDER_PAYMENT_METHOD.CASH,
  );
  
  // Temp states for adding an item
  const [tempProductId, setTempProductId] = useState("");
  const [tempQuantity, setTempQuantity] = useState(1);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const translateStatus = (status: string) => {
    switch (status) {
      case ORDER_STATUS.CREATING:
        return ORDER_STATUS_LABELS[ORDER_STATUS.CREATING];
      case ORDER_STATUS.COMPLETED:
        return ORDER_STATUS_LABELS[ORDER_STATUS.COMPLETED];
      case ORDER_STATUS.CANCELED:
        return ORDER_STATUS_LABELS[ORDER_STATUS.CANCELED];
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case ORDER_STATUS.COMPLETED:
        return "bg-emerald-100 text-emerald-700";
      case ORDER_STATUS.CREATING:
        return "bg-slate-100 text-slate-600";
      case ORDER_STATUS.CANCELED:
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const totalPreTaxAmount = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalTaxAmount = selectedItems.reduce((sum, item) => sum + Math.round((item.unitPrice * item.quantity * (item.taxRatePercentage || 0)) / 100), 0);
  const totalAmount = totalPreTaxAmount + totalTaxAmount;
  
  const discountAmountInput = discountType === "VALUE"
    ? discountValueInput
    : Math.round((totalAmount * discountValueInput) / 100);

  const finalAmount = Math.max(0, totalAmount - discountAmountInput);
  const resumableServerOrders = orders.filter(
    (order) =>
      order.status === ORDER_STATUS.CREATING &&
      order.shiftId === activeShift?.id &&
      (currentRole === USER_ROLES.OWNER ||
        order.createdByUserId === pendingOrderIdentity?.userId),
  );
  const canOfferManualDraftReset =
    pendingOrderDraft?.orderId === null &&
    pendingOrderDraft.createPhase === "SENT" &&
    pendingOrderDraft.createAttemptedAt !== null &&
    Date.now() - pendingOrderDraft.createAttemptedAt >=
      ORDER_CREATION_MANUAL_REVIEW_DELAY_MS;

  const handleAddItem = () => {
    if (!tempProductId) return;
    const prod = availableProducts.find((p) => p.id === tempProductId);
    if (!prod) return;

    if (tempQuantity < 1) {
      showError("Số lượng sản phẩm phải tối thiểu là 1");
      return;
    }

    const existingIndex = selectedItems.findIndex((item) => item.productId === tempProductId);
    const updatedItems = [...selectedItems];

    if (existingIndex > -1) {
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + tempQuantity,
      };
    } else {
      updatedItems.push({
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        quantity: tempQuantity,
        unitPrice: prod.price,
        taxRatePercentage: prod.taxRatePercentage,
      });
    }

    setSelectedItems(updatedItems);
    
    // Auto-update total and customer paid amount
    const newTotal = updatedItems.reduce(
      (sum, item) =>
        sum +
        (item.unitPrice * item.quantity +
          Math.round((item.unitPrice * item.quantity * (item.taxRatePercentage || 0)) / 100)),
      0
    );
    const calculatedDiscount = discountType === "VALUE"
      ? discountValueInput
      : Math.round((newTotal * discountValueInput) / 100);
    const newFinal = Math.max(0, newTotal - calculatedDiscount);
    setPaidAmountInput(newFinal);

    // Reset temp inputs
    setTempProductId("");
    setTempQuantity(1);
    setErrors((prev) => {
      const { items: _, ...rest } = prev;
      return rest;
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);

    const newTotal = updatedItems.reduce(
      (sum, item) =>
        sum +
        (item.unitPrice * item.quantity +
          Math.round((item.unitPrice * item.quantity * (item.taxRatePercentage || 0)) / 100)),
      0
    );
    const calculatedDiscount = discountType === "VALUE"
      ? discountValueInput
      : Math.round((newTotal * discountValueInput) / 100);
    const newFinal = Math.max(0, newTotal - calculatedDiscount);
    setPaidAmountInput(newFinal);
  };

  const handleDiscountTypeChange = (type: "VALUE" | "PERCENT") => {
    setDiscountType(type);
    setDiscountValueInput(0);
    setPaidAmountInput(totalAmount);
  };

  const handleDiscountValueChange = (val: number) => {
    let checkedVal = val;
    if (discountType === "PERCENT") {
      checkedVal = Math.min(100, Math.max(0, val));
    } else {
      checkedVal = Math.min(totalAmount, Math.max(0, val));
    }
    setDiscountValueInput(checkedVal);

    const calculatedDiscount = discountType === "VALUE"
      ? checkedVal
      : Math.round((totalAmount * checkedVal) / 100);
    const newFinal = Math.max(0, totalAmount - calculatedDiscount);
    setPaidAmountInput(newFinal);
  };

  const handlePaymentMethodChange = (method: TOrderPaymentMethod) => {
    setPaymentMethod(method);
    if (method === "CASH" || method === "BANK_TRANSFER") {
      setPaidAmountInput(finalAmount);
    } else if (method === "DEBT") {
      setPaidAmountInput(0);
    }
  };

  const ensureOrderMutationAllowed = (noShiftMessage: string) => {
    if (!canMutateOrders) {
      showError("Vai trò hiện tại chỉ được xem lịch sử đơn hàng.");
      return false;
    }
    if (isActiveShiftFetching) {
      showInfo("Đang kiểm tra trạng thái ca bán hàng, vui lòng chờ.");
      return false;
    }
    if (isActiveShiftError) {
      showError(
        getApiErrorMessage(activeShiftError, SHIFT_MESSAGES.ACTIVE_SHIFT_LOAD_ERROR)
      );
      return false;
    }
    if (!activeShift) {
      showError(noShiftMessage);
      return false;
    }
    if (!pendingOrderDraft && resumableServerOrders.length > 0) {
      showWarning(
        "Ca hiện tại đang có đơn nháp. Vui lòng chọn “Tiếp tục” tại đơn đó trước khi tạo đơn mới.",
      );
      return false;
    }
    if (!pendingOrderDraft && isProductsLoading) {
      showInfo("Đang tải danh sách hàng hóa, vui lòng chờ.");
      return false;
    }
    if (!pendingOrderDraft && isProductsError) {
      showError(
        getApiErrorMessage(
          productsError,
          "Không thể tải danh sách hàng hóa. Vui lòng thử lại.",
        ),
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!pendingOrderDraft) return;
    if (isApplyingRemoteDraftRef.current) {
      isApplyingRemoteDraftRef.current = false;
      return;
    }
    const persisted = persistPendingOrderForm(pendingOrderStorageKey, {
      customerId,
      selectedItems,
      discountType,
      discountValueInput,
      paidAmountInput,
      paymentMethod,
    });
    if (!persisted && !hasDraftPersistenceWarningRef.current) {
      hasDraftPersistenceWarningRef.current = true;
      showError(
        "Không thể lưu thay đổi của đơn đang tạo trong trình duyệt. Vui lòng kiểm tra dung lượng lưu trữ trước khi tiếp tục.",
      );
    } else if (persisted) {
      hasDraftPersistenceWarningRef.current = false;
    }
  }, [
    customerId,
    discountType,
    discountValueInput,
    paidAmountInput,
    paymentMethod,
    pendingOrderDraft,
    pendingOrderStorageKey,
    selectedItems,
    showError,
  ]);

  const clearPendingOrderDraft = useCallback(() => {
    setPendingOrderDraft(null);
    setShowAbandonDraftConfirm(false);
    setHasAcknowledgedAbandonRisk(false);
    if (!persistPendingOrderDraft(pendingOrderStorageKey, null)) {
      showWarning(
        "Không thể xóa tiến trình đơn hàng khỏi bộ nhớ trình duyệt. Dữ liệu cũ có thể xuất hiện lại sau khi tải trang.",
      );
    }
  }, [pendingOrderStorageKey, showWarning]);

  useEffect(() => {
    if (!canMutateOrders || !pendingOrderStorageKey || !pendingOrderIdentity) {
      return;
    }

    const handlePendingDraftStorageChange = (event: StorageEvent) => {
      const formStorageKey = getPendingOrderFormStorageKey(
        pendingOrderStorageKey,
      );
      if (
        (event.key !== pendingOrderStorageKey &&
          event.key !== formStorageKey) ||
        (event.storageArea && event.storageArea !== localStorage)
      ) {
        return;
      }

      const sharedDraft = readPendingOrderDraft(
        pendingOrderStorageKey,
        pendingOrderIdentity,
      );
      if (!sharedDraft) {
        setPendingOrderDraft(null);
        setShowAbandonDraftConfirm(false);
        setHasAcknowledgedAbandonRisk(false);
        setShowCreateModal(false);
        return;
      }

      isApplyingRemoteDraftRef.current = true;
      setPendingOrderDraft(sharedDraft);
      setCustomerId(sharedDraft.customerId);
      setSelectedItems(sharedDraft.selectedItems);
      setDiscountType(sharedDraft.discountType);
      setDiscountValueInput(sharedDraft.discountValueInput);
      setPaidAmountInput(sharedDraft.paidAmountInput);
      setPaymentMethod(sharedDraft.paymentMethod);
      setErrors({});
      setShowCreateModal(true);
    };

    window.addEventListener("storage", handlePendingDraftStorageChange);
    return () => {
      window.removeEventListener("storage", handlePendingDraftStorageChange);
    };
  }, [
    canMutateOrders,
    pendingOrderIdentity,
    pendingOrderStorageKey,
  ]);

  useEffect(() => {
    if (
      !pendingOrderDraft ||
      !canMutateOrders ||
      isActiveShiftFetching ||
      isActiveShiftError
    ) {
      return;
    }

    const belongsToCurrentContext =
      pendingOrderIdentity !== null &&
      pendingOrderDraft.userId === pendingOrderIdentity.userId &&
      pendingOrderDraft.householdId === pendingOrderIdentity.householdId &&
      pendingOrderDraft.shiftId === activeShift?.id;

    if (belongsToCurrentContext) {
      setShowCreateModal(true);
      return;
    }

    clearPendingOrderDraft();
    setShowCreateModal(false);
    showWarning(
      "Đơn đang tạo dở không thuộc tài khoản hoặc ca hiện tại nên đã được loại khỏi phiên làm việc.",
    );
  }, [
    activeShift?.id,
    canMutateOrders,
    clearPendingOrderDraft,
    isActiveShiftError,
    isActiveShiftFetching,
    pendingOrderDraft,
    pendingOrderIdentity,
    showWarning,
  ]);

  const finishOrderWorkflow = (completedOrder: IOrderResponse) => {
    setOrders((currentOrders) => [
      completedOrder,
      ...currentOrders.filter((order) => order.id !== completedOrder.id),
    ]);

    const itemDetails = selectedItems
      .map((item) => `${item.productName} (x${item.quantity})`)
      .join(", ");
    const selectedCustomer = customers.find((customer) => customer.id === customerId);
    const logDetails = `Khách: ${
      selectedCustomer?.name || "Khách vãng lai"
    } - SP: [${itemDetails}] - Tổng tiền: ${completedOrder.finalAmount.toLocaleString(
      "vi-VN",
    )} đ`;
    addLogEntry(
      "TẠO_ĐƠN_HÀNG",
      `Mã đơn hàng: ${completedOrder.orderNumber} - ${logDetails}`,
    );

    clearPendingOrderDraft();
    setCustomerId("");
    setSelectedItems([]);
    setDiscountType("VALUE");
    setDiscountValueInput(0);
    setPaidAmountInput(0);
    setPaymentMethod("CASH");
    setErrors({});
    setShowCreateModal(false);
    showSuccess("Tạo đơn hàng thành công trên hệ thống!");
  };

  // Reconcile the server draft before every retry so lost responses cannot add items twice.
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrder) return;

    if (
      !ensureOrderMutationAllowed(
        "Bạn cần mở ca bán hàng trước khi tạo đơn hàng!"
      )
    ) {
      return;
    }

    const newErrors: { [key: string]: string } = {};
    if (selectedItems.length === 0) {
      newErrors.items = "Vui lòng chọn ít nhất 1 sản phẩm để tạo đơn hàng";
    }
    if (discountValueInput < 0) {
      newErrors.discount = "Giá trị giảm giá không được nhỏ hơn 0";
    }
    if (discountType === "PERCENT" && discountValueInput > 100) {
      newErrors.discount = "Giảm giá phần trăm không được vượt quá 100%";
    }
    if (discountType === "VALUE" && discountValueInput > totalAmount) {
      newErrors.discount = "Số tiền giảm giá không được vượt quá tổng tiền hàng";
    }
    if (paidAmountInput < 0) {
      newErrors.paidAmount = "Khách đã trả không được nhỏ hơn 0";
    }
    if ((paymentMethod === "CASH" || paymentMethod === "BANK_TRANSFER") && paidAmountInput < finalAmount) {
      newErrors.paidAmount = `Khách trả không đủ tiền thanh toán (tối thiểu ${finalAmount.toLocaleString("vi-VN")} đ)`;
    }
    if (paymentMethod === "DEBT" && !customerId) {
      newErrors.paidAmount = "Vui lòng chọn khách hàng cụ thể để ghi nợ";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let draft = pendingOrderDraft;
    setIsSubmittingOrder(true);

    try {
      if (!pendingOrderIdentity || !activeShift) {
        throw new Error("Không xác định được tài khoản hoặc ca bán hàng hiện tại.");
      }

      await runWithOrderCreationLock(
        getOrderCreationLockName(pendingOrderIdentity, activeShift.id),
        async () => {
      const saveDraft = (nextDraft: IPendingOrderDraft) => {
        if (!persistPendingOrderDraft(pendingOrderStorageKey, nextDraft)) {
          throw new Error(
            "Không thể lưu tiến trình đơn hàng trong trình duyệt. Hệ thống đã dừng trước khi gửi dữ liệu để tránh tạo trùng.",
          );
        }
        draft = nextDraft;
        setPendingOrderDraft(nextDraft);
      };
      const loadFreshOrderHistory = async () =>
        (await getOrdersHistoryApi(undefined, false).unwrap()).result;
      const restoreDraftForm = (restoredDraft: IPendingOrderDraft) => {
        setCustomerId(restoredDraft.customerId);
        setSelectedItems(restoredDraft.selectedItems);
        setDiscountType(restoredDraft.discountType);
        setDiscountValueInput(restoredDraft.discountValueInput);
        setPaidAmountInput(restoredDraft.paidAmountInput);
        setPaymentMethod(restoredDraft.paymentMethod);
        setErrors({});
      };

      const sharedDraft = readPendingOrderDraft(
        pendingOrderStorageKey,
        pendingOrderIdentity,
      );
      if (!draft && sharedDraft) {
        draft = sharedDraft;
        setPendingOrderDraft(sharedDraft);
        restoreDraftForm(sharedDraft);
        throw new Error(
          "Đã phát hiện tiến trình tạo đơn từ cửa sổ khác và đồng bộ vào màn hình này. Vui lòng kiểm tra rồi bấm đối soát lại.",
        );
      }
      if (draft && !sharedDraft) {
        draft = null;
        setPendingOrderDraft(null);
        setShowCreateModal(false);
        throw new Error(
          "Tiến trình đơn hàng đã được hoàn tất hoặc xóa ở cửa sổ khác. Vui lòng kiểm tra lại lịch sử đơn hàng.",
        );
      }
      if (
        draft &&
        sharedDraft &&
        (draft.orderId !== sharedDraft.orderId ||
          draft.createPhase !== sharedDraft.createPhase ||
          draft.createAttemptedAt !== sharedDraft.createAttemptedAt)
      ) {
        draft = sharedDraft;
        setPendingOrderDraft(sharedDraft);
        restoreDraftForm(sharedDraft);
        throw new Error(
          "Tiến trình đơn hàng đã thay đổi ở cửa sổ khác. Màn hình đã đồng bộ dữ liệu mới nhất; vui lòng kiểm tra rồi tiếp tục.",
        );
      }

      let historySnapshot: IOrderResponse[] | null = null;
      if (!draft) {
        historySnapshot = await loadFreshOrderHistory();
        const existingServerDrafts = findCurrentServerDraftOrders(
          historySnapshot,
          pendingOrderIdentity,
          activeShift.id,
        );
        if (existingServerDrafts.length > 0) {
          setOrders(historySnapshot);
          throw new Error(
            "Ca hiện tại đã có đơn nháp trên máy chủ. Vui lòng chọn “Tiếp tục” tại đơn đó thay vì tạo thêm đơn mới.",
          );
        }
        saveDraft({
          orderId: null,
          createPhase: "PREPARED",
          createAttemptedAt: null,
          userId: pendingOrderIdentity.userId,
          householdId: pendingOrderIdentity.householdId,
          shiftId: activeShift.id,
          baselineOrderIds: [],
          customerId,
          selectedItems,
          discountType,
          discountValueInput,
          paidAmountInput,
          paymentMethod,
        });
      } else {
        saveDraft({
          ...draft,
          selectedItems,
          discountType,
          discountValueInput,
          paidAmountInput,
          paymentMethod,
        });
      }

      if (!draft) {
        throw new Error("Không thể khởi tạo tiến trình tạo đơn hàng.");
      }

      if (!draft.orderId) {
        const recoveryHistory = historySnapshot ?? (await loadFreshOrderHistory());
        const recoverableOrders =
          draft.createPhase === "SENT"
            ? findRecoverableDraftOrders(recoveryHistory, draft)
            : findCurrentServerDraftOrders(
                recoveryHistory,
                pendingOrderIdentity,
                activeShift.id,
              );

        if (recoverableOrders.length > 1) {
          setOrders(recoveryHistory);
          throw new Error(
            "Phát hiện nhiều đơn nháp chưa xác định từ lần tạo trước. Vui lòng tải lại lịch sử và liên hệ quản trị viên để kiểm tra trước khi tiếp tục.",
          );
        }

        if (
          recoverableOrders.length === 1 &&
          draft.createPhase === "SENT"
        ) {
          saveDraft({
            ...draft,
            orderId: recoverableOrders[0].id,
            createPhase: "PREPARED",
            createAttemptedAt: null,
          });
          showInfo(
            "Đã khôi phục đơn nháp từ máy chủ. Hệ thống sẽ tiếp tục hoàn tất đơn này để tránh tạo trùng.",
          );
        } else if (recoverableOrders.length === 1) {
          setOrders(recoveryHistory);
          throw new Error(
            "Ca hiện tại đã có đơn nháp trên máy chủ. Vui lòng đóng cửa sổ này và chọn “Tiếp tục” tại đơn đó.",
          );
        } else {
          if (draft.createPhase === "SENT") {
            const manualReviewAvailableAt =
              (draft.createAttemptedAt ?? 0) +
              ORDER_CREATION_MANUAL_REVIEW_DELAY_MS;
            const remainingWaitMs = manualReviewAvailableAt - Date.now();
            if (draft.createAttemptedAt !== null && remainingWaitMs > 0) {
              throw new Error(
                `Máy chủ chưa xác nhận kết quả tạo đơn. Vui lòng chờ thêm ${Math.ceil(
                  remainingWaitMs / 1_000,
                )} giây rồi đối soát lại; FE chưa gửi lại để tránh tạo trùng.`,
              );
            }

            showWarning(
              "Lịch sử máy chủ chưa có đơn tương ứng. FE sẽ không tự gửi lại vì request cũ vẫn có thể được xử lý muộn; chỉ bỏ tiến trình sau khi bạn đã kiểm tra nghiệp vụ.",
            );
            throw new Error(
              "Chưa thể xác định kết quả tạo đơn. Hãy tiếp tục đối soát hoặc dùng chức năng bỏ tiến trình sau khi đã xác nhận không có đơn trên máy chủ.",
            );
          }

          saveDraft({
            ...draft,
            createPhase: "SENT",
            createAttemptedAt: Date.now(),
            baselineOrderIds: findCurrentServerDraftOrders(
              recoveryHistory,
              pendingOrderIdentity,
              activeShift.id,
            ).map((order) => order.id),
          });

          try {
            const createResponse = await createOrderApi({
              customerId: customerId || undefined,
            }).unwrap();
            saveDraft({
              ...draft,
              orderId: createResponse.result.id,
              createPhase: "PREPARED",
              createAttemptedAt: null,
            });
          } catch (createError: unknown) {
            if (isDefinitiveRejectedCreateRequest(createError)) {
              clearPendingOrderDraft();
              draft = null;
              throw createError;
            }

            let historyAfterCreate: IOrderResponse[] = [];
            let recoveredAfterCreate: IOrderResponse[] = [];
            const retryDelays = [0, 300, 900];
            for (const retryDelay of retryDelays) {
              if (retryDelay > 0) {
                await new Promise<void>((resolve) => {
                  window.setTimeout(resolve, retryDelay);
                });
              }
              try {
                historyAfterCreate = await loadFreshOrderHistory();
                recoveredAfterCreate = findRecoverableDraftOrders(
                  historyAfterCreate,
                  draft,
                );
              } catch {
                continue;
              }
              if (recoveredAfterCreate.length > 0) break;
            }

            if (recoveredAfterCreate.length === 1) {
              saveDraft({
                ...draft,
                orderId: recoveredAfterCreate[0].id,
                createPhase: "PREPARED",
                createAttemptedAt: null,
              });
              showInfo(
                "Phản hồi tạo đơn bị gián đoạn nhưng dữ liệu đã có trên máy chủ. Hệ thống đã khôi phục để tiếp tục.",
              );
            } else if (recoveredAfterCreate.length > 1) {
              setOrders(historyAfterCreate);
              throw new Error(
                "Không thể xác định duy nhất đơn vừa tạo. Hệ thống đã dừng để tránh tạo trùng đơn hàng.",
              );
            } else {
              throw new Error(
                "Chưa xác định được kết quả tạo đơn do kết nối gián đoạn. Tiến trình đã được giữ lại; FE chỉ cho phép thử lại sau thời gian đối soát an toàn.",
              );
            }
          }
        }
      }

      const draftOrderId = draft.orderId;
      if (!draftOrderId) {
        throw new Error("Chưa xác định được mã đơn nháp trên máy chủ.");
      }

      let serverOrder: IOrderResponse;
      try {
        serverOrder = (await getOrderApi(draftOrderId).unwrap()).result;
      } catch (lookupError: unknown) {
        if (isDraftUnavailableError(lookupError)) {
          clearPendingOrderDraft();
          draft = null;
        }
        throw lookupError;
      }
      if (serverOrder.status === ORDER_STATUS.COMPLETED) {
        finishOrderWorkflow(serverOrder);
        return;
      }
      if (serverOrder.status !== ORDER_STATUS.CREATING) {
        clearPendingOrderDraft();
        draft = null;
        throw new Error("Đơn hàng không còn ở trạng thái có thể hoàn tất.");
      }

      const desiredProductIds = new Set(
        selectedItems.map((item) => item.productId),
      );
      for (const serverItem of serverOrder.items) {
        if (!desiredProductIds.has(serverItem.productId)) {
          serverOrder = (
            await deleteOrderItemApi({
              orderId: draftOrderId,
              itemId: serverItem.id,
            }).unwrap()
          ).result;
        }
      }

      for (const desiredItem of selectedItems) {
        const serverItem = serverOrder.items.find(
          (item) => item.productId === desiredItem.productId,
        );
        if (!serverItem) {
          serverOrder = (
            await addOrderItemApi({
              orderId: draftOrderId,
              productId: desiredItem.productId,
              quantity: desiredItem.quantity,
            }).unwrap()
          ).result;
        } else if (serverItem.quantity < desiredItem.quantity) {
          serverOrder = (
            await addOrderItemApi({
              orderId: draftOrderId,
              productId: desiredItem.productId,
              quantity: desiredItem.quantity - serverItem.quantity,
            }).unwrap()
          ).result;
        } else if (serverItem.quantity > desiredItem.quantity) {
          serverOrder = (
            await updateOrderItemApi({
              orderId: draftOrderId,
              itemId: serverItem.id,
              quantity: desiredItem.quantity,
            }).unwrap()
          ).result;
        }
      }

      await applyDiscountApi({
        orderId: draftOrderId,
        discountType: discountType === "PERCENT" ? "PERCENTAGE" : "CASH",
        discountValue: discountValueInput,
      }).unwrap();
      await setPaymentMethodApi({
        orderId: draftOrderId,
        paymentMethod,
        amountGiven: paidAmountInput,
      }).unwrap();

      try {
        const completedOrder = (
          await completeOrderApi({
            orderId: draftOrderId,
            amountGiven: paidAmountInput,
          }).unwrap()
        ).result;
        finishOrderWorkflow(completedOrder);
      } catch (completionError: unknown) {
        const reconciledOrder = (await getOrderApi(draftOrderId).unwrap()).result;
        if (reconciledOrder.status === ORDER_STATUS.COMPLETED) {
          finishOrderWorkflow(reconciledOrder);
          return;
        }
        throw completionError;
      }
        },
      );
    } catch (error: unknown) {
      const retryHint = draft
        ? " Tiến trình đã được giữ lại; hãy bấm tiếp tục để hoàn tất đơn hiện tại."
        : "";
      showError(
        getApiErrorMessage(
          error,
          "Không thể hoàn tất đơn hàng trên hệ thống.",
        ) + retryHint,
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleOpenAbandonDraftConfirm = () => {
    setHasAcknowledgedAbandonRisk(false);
    setShowAbandonDraftConfirm(true);
  };

  const handleAbandonUnknownDraft = async () => {
    const draftToReview = pendingOrderDraft;
    if (
      !hasAcknowledgedAbandonRisk ||
      !draftToReview ||
      draftToReview.orderId ||
      draftToReview.createPhase !== "SENT" ||
      !pendingOrderIdentity ||
      !activeShift
    ) {
      return;
    }

    setIsAbandoningDraft(true);
    try {
      await runWithOrderCreationLock(
        getOrderCreationLockName(pendingOrderIdentity, activeShift.id),
        async () => {
          const latestSharedDraft = readPendingOrderDraft(
            pendingOrderStorageKey,
            pendingOrderIdentity,
          );
          if (
            !latestSharedDraft ||
            latestSharedDraft.orderId !== draftToReview.orderId ||
            latestSharedDraft.createPhase !== draftToReview.createPhase ||
            latestSharedDraft.createAttemptedAt !==
              draftToReview.createAttemptedAt
          ) {
            throw new Error(
              "Tiến trình đã thay đổi ở cửa sổ khác. Hãy đóng xác nhận và kiểm tra lại trạng thái mới nhất.",
            );
          }

          const freshHistory = (
            await getOrdersHistoryApi(undefined, false).unwrap()
          ).result;
          setOrders(freshHistory);
          const currentServerDrafts = findCurrentServerDraftOrders(
            freshHistory,
            pendingOrderIdentity,
            activeShift.id,
          );

          if (currentServerDrafts.length > 1) {
            throw new Error(
              "Phát hiện nhiều đơn nháp trên máy chủ. Không thể bỏ tiến trình tự động; vui lòng liên hệ quản trị viên để đối soát.",
            );
          }
          if (currentServerDrafts.length === 1) {
            const recoveredDraft: IPendingOrderDraft = {
              ...draftToReview,
              orderId: currentServerDrafts[0].id,
              createPhase: "PREPARED",
              createAttemptedAt: null,
            };
            if (
              !persistPendingOrderDraft(
                pendingOrderStorageKey,
                recoveredDraft,
              )
            ) {
              throw new Error(
                "Đã tìm thấy đơn nháp nhưng không thể lưu tiến trình khôi phục trong trình duyệt.",
              );
            }
            setPendingOrderDraft(recoveredDraft);
            setShowAbandonDraftConfirm(false);
            setHasAcknowledgedAbandonRisk(false);
            showInfo(
              "Đã tìm thấy đơn nháp trên máy chủ và khôi phục mã đơn. Hệ thống không bỏ tiến trình này.",
            );
            return;
          }

          clearPendingOrderDraft();
          setCustomerId("");
          setSelectedItems([]);
          setDiscountType("VALUE");
          setDiscountValueInput(0);
          setPaidAmountInput(0);
          setPaymentMethod(ORDER_PAYMENT_METHOD.CASH);
          setErrors({});
          setShowAbandonDraftConfirm(false);
          setHasAcknowledgedAbandonRisk(false);
          setShowCreateModal(false);
          showWarning(
            "Đã bỏ tiến trình chưa xác định sau lần đối soát cuối. Hãy kiểm tra lại lịch sử trước khi tạo đơn thay thế.",
          );
        },
      );
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(
          error,
          "Không thể đối soát để bỏ tiến trình tạo đơn.",
        ),
      );
    } finally {
      setIsAbandoningDraft(false);
    }
  };

  const handleCloseCreateModal = () => {
    if (isSubmittingOrder) return;
    if (pendingOrderDraft) {
      showWarning(
        "Đơn hàng đang tạo dở đã được lưu trong phiên này. Bạn có thể mở lại để tiếp tục hoàn tất.",
      );
      setShowCreateModal(false);
      return;
    }

    setCustomerId("");
    setSelectedItems([]);
    setDiscountType("VALUE");
    setDiscountValueInput(0);
    setPaidAmountInput(0);
    setPaymentMethod("CASH");
    setErrors({});
    setShowCreateModal(false);
  };

  const handleResumeServerOrder = async (order: IOrderResponse) => {
    if (
      !canMutateOrders ||
      !pendingOrderIdentity ||
      !activeShift ||
      order.status !== ORDER_STATUS.CREATING ||
      order.shiftId !== activeShift.id
    ) {
      showError("Đơn nháp không thuộc ca bán hàng hiện tại.");
      return;
    }

    const restoredItems: ISelectedProductItem[] = order.items.map((item) => {
      const product = availableProducts.find(
        (candidate) => candidate.id === item.productId,
      );
      return {
        productId: item.productId,
        productName: item.productName,
        productSku: product?.sku ?? item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRatePercentage: item.taxRatePercentage,
      };
    });
    const restoredPaymentMethod = isPaymentMethod(order.paymentMethod)
      ? order.paymentMethod
      : ORDER_PAYMENT_METHOD.CASH;
    const restoredPaidAmount =
      restoredPaymentMethod === ORDER_PAYMENT_METHOD.DEBT
        ? 0
        : order.finalAmount;
    const restoredDraft: IPendingOrderDraft = {
      orderId: order.id,
      createPhase: "PREPARED",
      createAttemptedAt: null,
      userId: pendingOrderIdentity.userId,
      householdId: pendingOrderIdentity.householdId,
      shiftId: activeShift.id,
      baselineOrderIds: [],
      customerId: order.customerId ?? "",
      selectedItems: restoredItems,
      discountType: "VALUE",
      discountValueInput: order.discountAmount,
      paidAmountInput: restoredPaidAmount,
      paymentMethod: restoredPaymentMethod,
    };

    try {
      await runWithOrderCreationLock(
        getOrderCreationLockName(pendingOrderIdentity, activeShift.id),
        async () => {
          const sharedDraft = readPendingOrderDraft(
            pendingOrderStorageKey,
            pendingOrderIdentity,
          );
          if (sharedDraft && sharedDraft.orderId !== order.id) {
            throw new Error(
              "Một cửa sổ khác đang xử lý tiến trình đơn hàng khác. Vui lòng hoàn tất hoặc đối soát tiến trình đó trước.",
            );
          }
          if (
            !persistPendingOrderDraft(pendingOrderStorageKey, restoredDraft)
          ) {
            throw new Error(
              "Không thể lưu tiến trình đơn nháp trong trình duyệt. Vui lòng kiểm tra dung lượng lưu trữ rồi thử lại.",
            );
          }
          setCustomerId(restoredDraft.customerId);
          setSelectedItems(restoredItems);
          setDiscountType(restoredDraft.discountType);
          setDiscountValueInput(restoredDraft.discountValueInput);
          setPaidAmountInput(restoredDraft.paidAmountInput);
          setPaymentMethod(restoredDraft.paymentMethod);
          setErrors({});
          setPendingOrderDraft(restoredDraft);
          setShowDetailModal(false);
          setShowCreateModal(true);
        },
      );
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error, "Không thể mở lại đơn nháp trên máy chủ."),
      );
    }
  };

  const createDialogRef = useAccessibleDialog({
    isOpen: showCreateModal,
    onClose: handleCloseCreateModal,
    canClose: !isSubmittingOrder,
  });
  const detailDialogRef = useAccessibleDialog({
    isOpen: showDetailModal && Boolean(selectedOrder),
    onClose: () => setShowDetailModal(false),
  });
  const abandonDraftDialogRef = useAccessibleDialog({
    isOpen: showAbandonDraftConfirm,
    onClose: () => {
      setShowAbandonDraftConfirm(false);
      setHasAcknowledgedAbandonRisk(false);
    },
    canClose: !isAbandoningDraft,
  });

  const filteredOrders = orders.filter(
    (order) =>
      orderFilterStatus === ORDER_FILTER_STATUS.ALL || order.status === orderFilterStatus
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-4 mb-2 flex-wrap gap-3">
        <span className="font-extrabold text-sm text-slate-800">
          {ORDER_UI.HISTORY.TITLE(filteredOrders.length)}
        </span>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <span className="font-bold text-slate-500">
              {ORDER_UI.HISTORY.STATUS_FILTER_LABEL}
            </span>
            <select
              value={orderFilterStatus}
              onChange={(e) => setOrderFilterStatus(e.target.value as TOrderFilterStatus)}
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-700 focus:border-kv-blue-primary focus:outline-none sm:flex-none lg:h-8"
            >
              {ORDER_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {canMutateOrders && (
            <button
              type="button"
              disabled={isActiveShiftFetching || isProductsLoading}
              onClick={() => {
                if (
                  ensureOrderMutationAllowed(
                    "Bạn cần mở ca bán hàng trước khi tạo đơn hàng!"
                  )
                ) {
                  setShowCreateModal(true);
                }
              }}
              className={`${
                activeShift && !isActiveShiftError
                  ? "bg-kv-green hover:bg-emerald-600 text-white"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              } flex min-h-11 items-center gap-1.5 rounded-lg px-4 text-xs font-bold shadow-sm transition-colors disabled:cursor-wait lg:min-h-8`}
            >
              <span>+ Tạo đơn hàng</span>
            </button>
          )}
        </div>
      </div>

      {canMutateOrders && isActiveShiftError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            {getApiErrorMessage(
              activeShiftError,
              SHIFT_MESSAGES.ACTIVE_SHIFT_LOAD_ERROR
            )}
          </span>
          <button
            type="button"
            onClick={() => void refetchActiveShift()}
            className="min-h-11 shrink-0 rounded-lg border border-rose-300 bg-white px-4 font-bold transition-colors hover:bg-rose-100 lg:min-h-8"
          >
            Thử lại
          </button>
        </div>
      )}

      {canMutateOrders && isProductsError && !pendingOrderDraft && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            {getApiErrorMessage(
              productsError,
              "Không thể tải danh sách hàng hóa. Vui lòng thử lại.",
            )}
          </span>
          <button
            type="button"
            onClick={() => void refetchProducts()}
            className="min-h-11 shrink-0 rounded-lg border border-rose-300 bg-white px-4 font-bold transition-colors hover:bg-rose-100 lg:min-h-8"
          >
            Thử lại
          </button>
        </div>
      )}

      {isOrdersError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            {getApiErrorMessage(
              ordersError,
              "Không thể tải lịch sử đơn hàng. Vui lòng thử lại.",
            )}
          </span>
          <button
            type="button"
            onClick={refetchOrders}
            className="min-h-11 shrink-0 rounded-lg border border-rose-300 bg-white px-4 font-bold transition-colors hover:bg-rose-100 lg:min-h-8"
          >
            Thử lại
          </button>
        </div>
      )}

      {isOrdersLoading && (
        <div
          role="status"
          className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-center text-sm font-semibold text-blue-700"
        >
          Đang tải lịch sử đơn hàng...
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.ORDER_NUMBER}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CASHIER}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CREATED_AT}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CUSTOMER}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.TOTAL_AMOUNT}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.DISCOUNT}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.PAID_AMOUNT}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.PAYMENT_METHOD}</th>
              <th className="p-3 text-center">{ORDER_UI.HISTORY.COLUMNS.STATUS}</th>
              <th className="p-3 text-center">{ORDER_UI.HISTORY.COLUMNS.ACTIONS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                  {ORDER_UI.HISTORY.EMPTY_MESSAGE}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-slate-800">{order.orderNumber}</td>
                  <td className="p-3 text-slate-700 font-semibold">{order.createdByUsername}</td>
                  <td className="p-3 text-slate-500">{formatDate(order.createdAt)}</td>
                  <td className="p-3 font-bold text-slate-700">
                    {order.customerName || ORDER_UI.HISTORY.WALK_IN_CUSTOMER_LABEL}
                  </td>
                  <td className="p-3 text-right">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-3 text-right text-rose-500 font-semibold">
                    -{formatCurrency(order.discountAmount)}
                  </td>
                  <td className="p-3 text-right font-bold text-kv-blue-primary">
                    {formatCurrency(order.finalAmount)}
                  </td>
                  <td className="p-3 text-slate-600 font-bold">
                    {order.paymentMethod === ORDER_PAYMENT_METHOD.CASH
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.CASH]
                      : order.paymentMethod === ORDER_PAYMENT_METHOD.BANK_TRANSFER
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.BANK_TRANSFER]
                      : order.paymentMethod === ORDER_PAYMENT_METHOD.DEBT
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.DEBT]
                      : DEFAULT_ORDER_PAYMENT_METHOD_LABEL}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {translateStatus(order.status)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const canResumeOrder =
                          canMutateOrders &&
                          order.status === ORDER_STATUS.CREATING &&
                          order.shiftId === activeShift?.id &&
                          (currentRole === USER_ROLES.OWNER ||
                            order.createdByUserId === pendingOrderIdentity?.userId);
                        if (canResumeOrder) {
                          handleResumeServerOrder(order);
                        } else {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }
                      }}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-slate-100 px-3 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/30 lg:min-h-8"
                      aria-label={
                        (canMutateOrders &&
                        order.status === ORDER_STATUS.CREATING &&
                        order.shiftId === activeShift?.id
                          ? "Tiếp tục"
                          : "Xem chi tiết") +
                        " đơn hàng " +
                        order.orderNumber
                      }
                    >
                      {canMutateOrders &&
                      order.status === ORDER_STATUS.CREATING &&
                      order.shiftId === activeShift?.id
                        ? "Tiếp tục"
                        : "Chi tiết"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Tạo đơn hàng mới */}
      {showCreateModal && createPortal(
        <div
          onClick={handleCloseCreateModal}
          className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 animate-backdrop-fade-in sm:items-center sm:p-4"
        >
          <div
            ref={createDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Tạo đơn hàng bán lẻ mới"
            className="app-modal-panel flex w-full max-w-[460px] flex-col overflow-hidden rounded-xl border border-slate-100 bg-white text-left text-xs font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in"
          >
            {/* Header */}
            <div className="app-modal-header flex items-center justify-between bg-kv-blue-primary px-4 py-2.5 text-white">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Tạo Đơn Hàng Bán Lẻ Mới
              </h2>
              <button
                onClick={handleCloseCreateModal}
                type="button"
                disabled={isSubmittingOrder}
                aria-label="Đóng biểu mẫu đơn hàng"
                className="flex min-h-11 min-w-11 items-center justify-center text-lg text-white/80 transition-colors hover:text-white disabled:cursor-wait disabled:opacity-60"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateOrder}
              aria-busy={isSubmittingOrder}
              className="flex min-h-0 flex-1 flex-col"
            >
              {pendingOrderDraft && (
                <div
                  role="status"
                  className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700"
                >
                  {pendingOrderDraft.orderId
                    ? `Đơn ${pendingOrderDraft.orderId} đang được hoàn tất.`
                    : pendingOrderDraft.createPhase === "SENT"
                      ? "Yêu cầu tạo đơn đã được gửi nhưng chưa có kết quả xác định."
                      : "Yêu cầu tạo đơn trước đó đang được chuẩn bị."} Hệ thống sẽ
                  kiểm tra dữ liệu máy chủ trước khi tiếp tục để tránh tạo trùng.
                </div>
              )}
              <fieldset
                disabled={isSubmittingOrder}
                className="app-modal-body m-0 flex min-w-0 flex-col gap-2.5 border-0 p-3"
              >
              {errors.items && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-2 rounded-lg text-[10px] font-bold">
                  ⚠️ {errors.items}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                {/* Khách hàng */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Khách hàng:
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    disabled={Boolean(pendingOrderDraft)}
                    className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs"
                  >
                    <option value="">-- Khách vãng lai --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn sản phẩm bán */}
                <div className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:col-span-2">
                  <span className="font-bold text-slate-700 text-[9px] uppercase block mb-0.5">
                    Chọn sản phẩm bán hàng:
                  </span>
                  
                  <div className="flex flex-col gap-1.5">
                    {/* Hàng 1: Dropdown chọn sản phẩm */}
                    <div className="flex flex-col gap-0.5 w-full">
                      <label className="text-slate-400 text-[8px] font-bold uppercase">Sản phẩm:</label>
                      <select
                        value={tempProductId}
                        onChange={(e) => setTempProductId(e.target.value)}
                        className="border border-slate-300 h-8 px-2 rounded-lg bg-white text-xs focus:outline-none w-full"
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - Giá: {formatCurrency(p.price)} (Tồn: {p.stockQuantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hàng 2: Nhập số lượng & Nút thêm */}
                    <div className="flex gap-2 items-end w-full">
                      <div className="flex-1 flex flex-col gap-0.5">
                        <label className="text-slate-400 text-[8px] font-bold uppercase">Số lượng:</label>
                        <input
                          type="number"
                          min="1"
                          value={tempQuantity}
                          onChange={(e) => setTempQuantity(Math.max(1, Number(e.target.value)))}
                          className="border border-slate-300 h-8 px-2 rounded-lg text-xs font-bold text-center w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold h-8 px-4 rounded-lg text-[11px] transition-colors shrink-0"
                      >
                        Thêm sản phẩm
                      </button>
                    </div>
                  </div>

                  {/* List of selected items */}
                  {selectedItems.length > 0 && (
                    <div className="mt-2 max-h-[85px] overflow-auto rounded-lg border bg-white">
                      <table className="responsive-data-table responsive-data-table--compact w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b text-[8px]">
                            <th className="p-1.5">Sản phẩm</th>
                            <th className="p-1.5 text-center">SL</th>
                            <th className="p-1.5 text-right">Đơn giá</th>
                            <th className="p-1.5 text-right">Thành tiền</th>
                            <th className="p-1.5 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                          {selectedItems.map((item, index) => (
                            <tr key={item.productId} className="hover:bg-slate-50/50">
                              <td className="p-1.5 max-w-[150px] truncate">
                                <div className="font-bold text-slate-800 truncate" title={item.productName}>{item.productName}</div>
                                <div className="text-[8px] text-slate-400 font-mono">{item.productSku}</div>
                              </td>
                              <td className="p-1.5 text-center font-bold">{item.quantity}</td>
                              <td className="p-1.5 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="p-1.5 text-right text-slate-800 font-bold">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </td>
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-rose-600 hover:text-rose-800 text-[10px] font-bold"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Tổng tiền hàng (Tự động tính) */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Tổng tiền hàng (đ):
                  </label>
                  <div className="border border-slate-200 bg-slate-50 h-8 px-2.5 rounded-lg flex items-center text-xs font-bold text-slate-500 w-full">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>

                {/* Loại giảm giá */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Loại giảm giá:
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => handleDiscountTypeChange(e.target.value as "VALUE" | "PERCENT")}
                    className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs w-full"
                  >
                    <option value="VALUE">Tiền mặt (đ)</option>
                    <option value="PERCENT">Phần trăm (%)</option>
                  </select>
                </div>

                {/* Giá trị giảm giá */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    {discountType === "VALUE" ? "Nhập số tiền giảm (đ):" : "Nhập phần trăm giảm (%):"}
                  </label>
                  <input
                    type="number"
                    value={discountValueInput}
                    min="0"
                    max={discountType === "PERCENT" ? 100 : totalAmount}
                    onChange={(e) => handleDiscountValueChange(Number(e.target.value))}
                    className={`border ${errors.discount ? "border-rose-500" : "border-slate-300"} h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold w-full`}
                  />
                  <span className="text-[8px] text-slate-400 font-semibold mt-0.5">
                    Trị giá giảm: {formatCurrency(discountAmountInput)}
                  </span>
                  {errors.discount && (
                    <span className="text-[8px] text-rose-500 font-bold">{errors.discount}</span>
                  )}
                </div>

                {/* Khách đã trả */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Khách thực tế đã trả (đ)*:
                  </label>
                  <input
                    type="number"
                    value={paidAmountInput}
                    min="0"
                    onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                    required
                    className={`border ${errors.paidAmount ? "border-rose-500" : "border-slate-300"} h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold w-full`}
                  />
                  <span className="text-[8px] text-slate-400 font-semibold mt-0.5">
                    Khách trả: {formatCurrency(paidAmountInput)}
                  </span>
                  {errors.paidAmount && (
                    <span className="text-[8px] text-rose-500 font-bold">{errors.paidAmount}</span>
                  )}
                </div>

                {/* Phải thanh toán (Final Amount) & Tiền thối lại banner */}
                <div className="flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs font-bold text-slate-700 sm:col-span-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <span>Tổng tiền (chưa thuế):</span>
                    <span>{formatCurrency(totalPreTaxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <span>Thuế VAT:</span>
                    <span className="text-slate-600">+{formatCurrency(totalTaxAmount)}</span>
                  </div>
                  {discountAmountInput > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-rose-500 font-semibold">
                      <span>Giảm giá:</span>
                      <span>-{formatCurrency(discountAmountInput)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-1.5 mt-0.5 text-slate-800">
                    <span>CẦN THANH TOÁN:</span>
                    <span className="text-xs font-extrabold text-kv-blue-primary">
                      {formatCurrency(finalAmount)}
                    </span>
                  </div>
                  {paidAmountInput > finalAmount && (
                    <div className="flex justify-between items-center text-[9px] font-bold text-emerald-600 border-t pt-1 mt-0.5">
                      <span>TIỀN THỐI LẠI:</span>
                      <span className="font-extrabold text-xs">
                        {formatCurrency(paidAmountInput - finalAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Phương thức thanh toán */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-slate-500 font-bold uppercase text-[9px]">
                    Phương thức thanh toán:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      handlePaymentMethodChange(
                        e.target.value as TOrderPaymentMethod,
                      )
                    }
                    className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs w-full"
                  >
                    <option value={ORDER_PAYMENT_METHOD.CASH}>
                      {ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.CASH]}
                    </option>
                    <option value={ORDER_PAYMENT_METHOD.BANK_TRANSFER}>
                      {ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.BANK_TRANSFER]}
                    </option>
                    <option value={ORDER_PAYMENT_METHOD.DEBT}>
                      {ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.DEBT]}
                    </option>
                  </select>
                </div>

              </div>
              </fieldset>

              {/* Footer actions */}
              <div className="app-modal-footer flex shrink-0 flex-col gap-2.5 border-t border-slate-200 bg-white p-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-kv-green px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmittingOrder && (
                    <span
                      aria-hidden="true"
                      className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                  )}
                  {pendingOrderDraft?.orderId
                    ? "TIẾP TỤC HOÀN TẤT ĐƠN"
                    : pendingOrderDraft?.createPhase === "SENT"
                      ? "ĐỐI SOÁT LẠI TRẠNG THÁI ĐƠN"
                      : "XÁC NHẬN TẠO ĐƠN"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={isSubmittingOrder}
                  className="min-h-11 flex-1 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
                >
                  {pendingOrderDraft ? "ĐÓNG VÀ TIẾP TỤC SAU" : "HỦY BỎ"}
                </button>
                {canOfferManualDraftReset && (
                  <button
                    type="button"
                    onClick={handleOpenAbandonDraftConfirm}
                    disabled={isSubmittingOrder}
                    className="min-h-11 flex-1 rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
                  >
                    BỎ TIẾN TRÌNH
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showAbandonDraftConfirm && createPortal(
        <div
          onClick={() => {
            if (isAbandoningDraft) return;
            setShowAbandonDraftConfirm(false);
            setHasAcknowledgedAbandonRisk(false);
          }}
          className="app-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 animate-backdrop-fade-in sm:p-4"
        >
          <div
            ref={abandonDraftDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="abandon-order-draft-title"
            aria-describedby="abandon-order-draft-description"
            className="app-modal-panel w-full max-w-md overflow-hidden rounded-xl border border-rose-100 bg-white shadow-2xl animate-modal-bounce-in"
          >
            <div className="flex items-center justify-between bg-rose-600 px-4 py-3 text-white">
              <h2
                id="abandon-order-draft-title"
                className="text-sm font-extrabold uppercase tracking-wide"
              >
                Xác nhận bỏ tiến trình
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowAbandonDraftConfirm(false);
                  setHasAcknowledgedAbandonRisk(false);
                }}
                disabled={isAbandoningDraft}
                aria-label="Đóng xác nhận bỏ tiến trình"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl text-white/90 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <p
                id="abandon-order-draft-description"
                className="text-sm leading-6 text-slate-700"
              >
                Request tạo đơn trước đó chưa có kết quả xác định. Bỏ tiến trình
                có thể dẫn đến trùng đơn nếu máy chủ xử lý muộn. FE sẽ đối soát
                lịch sử thêm một lần trước khi xóa dữ liệu cục bộ.
              </p>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
                <input
                  type="checkbox"
                  checked={hasAcknowledgedAbandonRisk}
                  onChange={(event) =>
                    setHasAcknowledgedAbandonRisk(event.target.checked)
                  }
                  disabled={isAbandoningDraft}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-rose-600"
                />
                <span>
                  Tôi đã kiểm tra lịch sử nghiệp vụ và xác nhận chưa có đơn
                  tương ứng trên máy chủ.
                </span>
              </label>
            </div>
            <div className="app-modal-footer flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAbandonDraftConfirm(false);
                  setHasAcknowledgedAbandonRisk(false);
                }}
                disabled={isAbandoningDraft}
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                QUAY LẠI
              </button>
              <button
                type="button"
                onClick={() => void handleAbandonUnknownDraft()}
                disabled={
                  !hasAcknowledgedAbandonRisk || isAbandoningDraft
                }
                className="flex min-h-11 items-center justify-center rounded-lg bg-rose-600 px-5 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isAbandoningDraft ? "ĐANG ĐỐI SOÁT..." : "XÁC NHẬN BỎ"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Modal: Chi tiết đơn hàng */}
      {showDetailModal && selectedOrder && createPortal(
        <div
          onClick={() => setShowDetailModal(false)}
          className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 animate-backdrop-fade-in sm:items-center sm:p-4"
        >
          <div
            ref={detailDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết đơn hàng ${selectedOrder.orderNumber}`}
            className="app-modal-panel flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-100 bg-white text-left text-xs font-semibold text-slate-700 shadow-2xl animate-modal-bounce-in"
          >
            {/* Header */}
            <div className="app-modal-header flex items-center justify-between bg-slate-800 px-5 py-3 text-white">
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>Chi Tiết Đơn Hàng: {selectedOrder.orderNumber}</span>
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                type="button"
                aria-label="Đóng chi tiết đơn hàng"
                className="flex min-h-11 min-w-11 items-center justify-center text-lg text-white/80 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="app-modal-body flex flex-col gap-4 p-4 sm:p-5">
              {/* Thông tin chung */}
              <div className="grid grid-cols-1 gap-3 rounded-lg border bg-slate-50 p-3 text-[11px] sm:grid-cols-2 sm:p-4">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Nhân viên chốt:</span>
                  <span className="font-extrabold text-slate-800">{selectedOrder.createdByUsername}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Thời gian tạo:</span>
                  <span className="font-extrabold text-slate-800">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Khách hàng:</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedOrder.customerName || "Khách vãng lai"}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 font-bold block uppercase text-[9px] mb-0.5">Trạng thái:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5 ${getStatusBadgeClass(
                      selectedOrder.status
                    )}`}
                  >
                    {translateStatus(selectedOrder.status)}
                  </span>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1.5">
                  Sản phẩm đã mua:
                </span>
                <div className="overflow-x-auto border rounded-lg bg-white">
                  <table className="responsive-data-table responsive-data-table--compact w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b">
                        <th className="p-2.5">Sản phẩm</th>
                        <th className="p-2.5 text-center">SL</th>
                        <th className="p-2.5 text-right">Đơn giá</th>
                        <th className="p-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-800">{item.productName}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                            <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2.5 text-right text-slate-800 font-bold">
                              {formatCurrency(
                                item.subtotal ?? item.unitPrice * item.quantity,
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 font-medium">
                            Không có chi tiết sản phẩm cho đơn hàng này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chi tiết thanh toán */}
              <div className="bg-slate-50 p-4 rounded-lg border flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tiền hàng:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>Giảm giá:</span>
                  <span className="font-bold">-{formatCurrency(selectedOrder.discountAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-slate-800 font-bold">
                  <span>Cần thanh toán:</span>
                  <span className="font-extrabold text-kv-blue-primary">
                    {formatCurrency(selectedOrder.finalAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-500">Khách đã trả:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedOrder.finalAmount + (selectedOrder.changeAmount || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiền thối lại:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedOrder.changeAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phương thức thanh toán:</span>
                  <span className="font-bold text-slate-800">
                    {selectedOrder.paymentMethod === ORDER_PAYMENT_METHOD.CASH
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.CASH]
                      : selectedOrder.paymentMethod === ORDER_PAYMENT_METHOD.BANK_TRANSFER
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.BANK_TRANSFER]
                      : selectedOrder.paymentMethod === ORDER_PAYMENT_METHOD.DEBT
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.DEBT]
                      : DEFAULT_ORDER_PAYMENT_METHOD_LABEL}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold h-9 px-6 rounded-lg transition-colors text-xs"
                >
                  ĐÓNG
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
