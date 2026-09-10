import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CalendarCheck } from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
import {
  useGetProductsQuery,
  useResolveTierPriceMutation,
} from "@/modules/product/services/productApi";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
} from "@/modules/customer/services/customerApi";
import {
  useCreateOrderMutation,
  useAddOrderItemMutation,
  useApplyDiscountMutation,
  useSetPaymentMethodMutation,
  useCompleteOrderMutation,
  useGetHeldOrdersQuery,
  useLazyGetOrderQuery,
} from "@/modules/order/services/orderApi";
import { useGetActiveShiftQuery } from "@/modules/shift/services/shiftApi";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";
import { useAutoApplyPromotionsMutation } from "@/modules/promotion/services/promotionApi";
import { useScanBarcodeMutation } from "@/modules/barcode/services/barcodeApi";
import { useBarcodeScanner } from "@/modules/barcode/hooks/useBarcodeScanner";
import { BarcodeScannerModal } from "@/modules/barcode/components/BarcodeScannerModal";
import { UnrecognizedBarcodeModal } from "@/modules/barcode/components/UnrecognizedBarcodeModal";
import { VoiceSearchModal } from "@/modules/product/components/VoiceSearchModal";
import { playBarcodeBeepSound } from "@/modules/barcode/utils/barcodeAudio";
import { BARCODE_MESSAGES } from "@/constants/barcode";
import { USER_ROLES } from "@/constants/roles";

import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { saveOfflineOrder, checkOfflineLimitStatus, saveOfflineConfig } from "@/modules/sync/utils/offlineSyncStorage";
import type { IOfflineOrderRequest } from "@/modules/sync/types/ISync";
import type { IOrderResponse, IHeldOrderSummaryResponse } from "@/modules/order/types/IOrder";
import { getLocalDateTimeISOString } from "@/utils/dateFormatter";
import { useAppSelector } from "@/hooks/useRedux";

import type { IProduct } from "@/modules/product/types/IProduct";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import type { IPosCartItem, IPosTab } from "../types/IPos";
import {
  DISCOUNT_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  SALE_MODES,
} from "../types/IPos";

import { PosHeader } from "../components/PosHeader";
import { PosCartTable } from "../components/PosCartTable";
import { PosPaymentSidebar } from "../components/PosPaymentSidebar";
import { WeightScaleModal } from "../components/WeightScaleModal";
import { CustomerFormModal } from "@/modules/customer/components/CustomerFormModal";
import { DiningTableManagementModal } from "@/modules/dining_table/components/DiningTableManagementModal";
import { OrderSuccessModal } from "../components/OrderSuccessModal";
import { CombinedPaymentModal } from "../components/CombinedPaymentModal";
import { BankTransferModal } from "../components/BankTransferModal";
import { CancelOrderModal } from "@/modules/order/components/CancelOrderModal";
import { HoldOrderModal } from "../components/HoldOrderModal";
import { HeldOrdersDrawer } from "../components/HeldOrdersDrawer";
import { ShiftHandoverModal } from "@/modules/shift/components/ShiftHandoverModal";
import { CreateCashTransactionModal } from "@/modules/shift/components/CreateCashTransactionModal";
import { useGetShiftCashSummaryQuery } from "@/modules/shift/services/cashTransactionApi";
import { recordOrderDiscount } from "@/modules/anomaly_alert/utils/anomalyStorage";
import { calculatePosTotals } from "../utils/posCalculations";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IOrderPaymentRequest, ICompleteOrderRequest } from "@/modules/order/types/IOrder";
import {
  notifyOrderCompleted,
  notifyOrderCanceled,
  useOnOrderCanceled,
  useOnOrderCompleted,
  type IOrderCompletedEventDetail,
} from "@/utils/orderEvents";

const POS_TABS_STORAGE_KEY = "pos_tabs_state_v1";

const createInitialTab = (index: number): IPosTab => ({
  id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  orderNumber: `Hóa đơn ${index}`,
  status: ORDER_STATUSES.PENDING,
  saleMode: SALE_MODES.FAST,
  items: [],
  discountType: DISCOUNT_TYPES.PERCENTAGE,
  discountValue: 0,
  paymentMethod: PAYMENT_METHODS.CASH,
  amountGiven: 0,
  isSaved: false,
});

export const PosPage = () => {
  const navigate = useNavigate();
  const authenticatedUser = useAppSelector((state) => state.auth.user);
  const { isOnline, setOrders, addLogEntry, setCustomers, currentRole } = useDashboardDemo();

  const canManage =
    currentRole === USER_ROLES.OWNER ||
    currentRole === USER_ROLES.PLATFORM_ADMIN ||
    authenticatedUser?.roleId === USER_ROLES.OWNER ||
    authenticatedUser?.roleId === USER_ROLES.PLATFORM_ADMIN;

  // 1. Fetch products, customers & active shift
  const { data: productsData } = useGetProductsQuery({ page: 0, size: 200 });
  const { data: customersData } = useGetCustomersQuery();
  const { data: activeShiftData, isLoading: isShiftLoading } = useGetActiveShiftQuery();
  const { data: householdData } = useGetMyHouseholdQuery(undefined, { skip: isOnline === false });

  // Tự động đồng bộ cấu hình bán offline vào localStorage khi online
  useEffect(() => {
    if (householdData?.result) {
      const h = householdData.result;
      if (typeof h.offlineMaxOrders === "number" && typeof h.offlineMaxHours === "number") {
        saveOfflineConfig({ maxOrders: h.offlineMaxOrders, maxHours: h.offlineMaxHours });
      }
    }
  }, [householdData]);

  const activeShift = activeShiftData?.result;
  const isShiftOpen = Boolean(activeShift);

  // Query Held Orders for active shift (NCL-03-CN-010)
  const { data: heldOrdersData } = useGetHeldOrdersQuery(undefined, {
    skip: !isShiftOpen || isOnline === false,
  });
  const [getOrderLazy] = useLazyGetOrderQuery();

  const heldOrdersList: IHeldOrderSummaryResponse[] = heldOrdersData?.result || [];
  const heldOrdersCount = heldOrdersList.length;
  const overdueHeldOrdersCount = heldOrdersList.filter((o) => o.isOverdue).length;

  // Query Cash Summary for active shift (NCL-03-CN-014)
  const { data: cashSummaryData } = useGetShiftCashSummaryQuery(activeShift?.id || "", {
    skip: !isShiftOpen || isOnline === false,
    pollingInterval: 30000,
  });
  const pendingExpenseCount = cashSummaryData?.result?.pendingExpenseCount || 0;

  const productsList: IProduct[] = useMemo(() => productsData?.content || [], [productsData?.content]);
  const customersList: ICustomer[] = useMemo(() => {
    return Array.isArray(customersData)
      ? customersData
      : (customersData as any)?.result || [];
  }, [customersData]);

  // 2. RTK Query Mutations
  const [createOrder] = useCreateOrderMutation();
  const [addOrderItem] = useAddOrderItemMutation();
  const [applyDiscount] = useApplyDiscountMutation();
  const [setPaymentMethod] = useSetPaymentMethodMutation();
  const [completeOrder] = useCompleteOrderMutation();
  const [createCustomer] = useCreateCustomerMutation();
  const [autoApplyPromotions] = useAutoApplyPromotionsMutation();
  const [scanBarcode] = useScanBarcodeMutation();
  const [resolveTierPrice] = useResolveTierPriceMutation();

  // Helper: Đồng bộ bậc giá sỉ & lẻ tự động từ server (NCL-02-CN-010, TC-01, TC-02)
  const resolveTiersForItems = async (
    items: IPosCartItem[]
  ): Promise<IPosCartItem[]> => {
    if (items.length === 0) return [];
    if (isOnline === false) return items;

    try {
      const resolvedList = await Promise.all(
        items.map(async (item) => {
          try {
            const res = await resolveTierPrice({
              productId: item.product.id,
              data: {
                quantity: item.quantity,
                unitConversionId: item.unitConversionId || null,
              },
            }).unwrap();

            if (res) {
              const appliedUnitPrice = res.appliedUnitPrice;
              const matchedTierId = res.matchedTierId;
              const matchedTierName = res.matchedTierName;
              const baseRetailPrice = res.baseRetailPrice;

              return {
                ...item,
                price: appliedUnitPrice,
                priceTierId: matchedTierId,
                priceTierName: matchedTierName,
                baseRetailPrice,
                lineTotal:
                  item.quantity * appliedUnitPrice - (item.lineDiscount || 0),
              };
            }
          } catch {
            // Product has no price tiers or error, keep item as-is
          }
          return item;
        })
      );
      return resolvedList;
    } catch {
      return items;
    }
  };

  // Helper: Đồng bộ khuyến mại tự động từ server (QTN-26, NCL-15-CN-002)
  const syncPromotionsForItems = async (
    items: IPosCartItem[]
  ): Promise<IPosCartItem[]> => {
    if (items.length === 0) return [];
    if (isOnline === false) {
      return items.map((item) => ({
        ...item,
        lineTotal: item.quantity * item.price - (item.lineDiscount || 0),
      }));
    }
    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.price,
          bypassPromotion: Boolean(item.bypassPromotion),
        })),
      };
      const res = await autoApplyPromotions(payload).unwrap();
      if (res?.items && Array.isArray(res.items)) {
        return items.map((item) => {
          const promoRes = res.items.find((r) => r.productId === item.product.id);
          if (promoRes) {
            const promoDiscount = promoRes.discountAmount ?? 0;
            const basePrice = item.baseRetailPrice ?? item.price;
            const tierSaving = (basePrice - item.price) * item.quantity;

            // QTN-26: So sánh ưu đãi có lợi nhất cho khách giữa bậc giá và khuyến mại
            if (item.priceTierName && tierSaving >= promoDiscount) {
              return {
                ...item,
                lineDiscount: 0,
                lineTotal: item.quantity * item.price,
                promotionId: null,
                promotionName: null,
                hasPromotion: false,
                bypassPromotion: item.bypassPromotion,
              };
            }

            return {
              ...item,
              price: item.priceTierName ? basePrice : item.price,
              priceTierId: null,
              priceTierName: null,
              lineDiscount: promoDiscount,
              lineTotal:
                promoRes.finalSubtotal ?? item.quantity * item.price - promoDiscount,
              promotionId: promoRes.promotionId,
              promotionName: promoRes.promotionName,
              hasPromotion: promoRes.hasPromotion,
              bypassPromotion: promoRes.bypassPromotion,
              originalSubtotal: promoRes.originalSubtotal,
            };
          }
          return item;
        });
      }
    } catch (err) {
      console.warn("Failed to auto apply promotions from server", err);
    }
    return items;
  };

  // 3. Multi-order Tabs State with localStorage persistence
  const [tabs, setTabs] = useState<IPosTab[]>(() => {
    try {
      const saved = localStorage.getItem(POS_TABS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.tabs) && parsed.tabs.length > 0) {
          const activeTabs = parsed.tabs.filter(
            (t: IPosTab) =>
              t.status !== "COMPLETED" && (t.status as string) !== "CANCELED"
          );
          if (activeTabs.length > 0) {
            return activeTabs;
          }
        }
      }
    } catch (e) {
      console.error("Failed to load POS tabs state from localStorage", e);
    }
    return [createInitialTab(1)];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(POS_TABS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.activeTabId &&
          parsed.tabs?.some((t: IPosTab) => t.id === parsed.activeTabId)
        ) {
          return parsed.activeTabId;
        }
      }
    } catch {
      /* ignore storage parse error */
    }
    return tabs[0]?.id || "";
  });

  const [tabCounter, setTabCounter] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(POS_TABS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.tabCounter === "number" && parsed.tabCounter >= 1) {
          return parsed.tabCounter;
        }
      }
    } catch {
      /* ignore storage parse error */
    }
    return 1;
  });

  // Sync tabs state to localStorage whenever tabs, activeTabId, or tabCounter change
  useEffect(() => {
    try {
      localStorage.setItem(
        POS_TABS_STORAGE_KEY,
        JSON.stringify({
          tabs,
          activeTabId,
          tabCounter,
        })
      );
    } catch (e) {
      console.error("Failed to save POS tabs state to localStorage", e);
    }
  }, [tabs, activeTabId, tabCounter]);

  // Modals state
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] =
    useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [unrecognizedBarcode, setUnrecognizedBarcode] = useState<string | null>(null);
  const [weightModalProduct, setWeightModalProduct] = useState<IProduct | null>(null);
  const [weightModalItem, setWeightModalItem] = useState<IPosCartItem | null>(null);
  const [completedOrderData, setCompletedOrderData] = useState<{
    tab: IPosTab;
    changeAmount: number;
    finalTotal: number;
  } | null>(null);

  // Cancel order modal state (NCL-03-CN-009)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [orderToCancel, setOrderToCancel] = useState<IOrderResponse | null>(null);

  // Hold order & Table management modals state (NCL-03-CN-010)
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isHeldOrdersDrawerOpen, setIsHeldOrdersDrawerOpen] = useState<boolean>(false);
  const [isTableManagementModalOpen, setIsTableManagementModalOpen] = useState<boolean>(false);
  const [holdModalOrderId, setHoldModalOrderId] = useState<string | null>(null);
  const [holdModalOrderNumber, setHoldModalOrderNumber] = useState<string>("");
  const [holdModalCurrentLabel, setHoldModalCurrentLabel] = useState<string | null>(null);
  const [holdModalCurrentTableId, setHoldModalCurrentTableId] = useState<string | null>(null);
  const [holdModalCurrentTableName, setHoldModalCurrentTableName] = useState<string | null>(null);

  // Combined payment modal state (NCL-03-CN-011)
  const [isCombinedPaymentModalOpen, setIsCombinedPaymentModalOpen] = useState<boolean>(false);

  // Bank transfer confirmation modal state (NCL-03-CN-012)
  const [isBankTransferModalOpen, setIsBankTransferModalOpen] = useState<boolean>(false);
  const [bankTransferOrderId, setBankTransferOrderId] = useState<string>("");
  const [bankTransferQrUrl, setBankTransferQrUrl] = useState<string | null>(null);
  const [bankTransferAmount, setBankTransferAmount] = useState<number>(0);

  // Shift handover modal state (NCL-03-CN-013)
  const [isShiftHandoverModalOpen, setIsShiftHandoverModalOpen] = useState<boolean>(false);

  // Cash transaction modal state (NCL-03-CN-014)
  const [isCashTransactionModalOpen, setIsCashTransactionModalOpen] = useState<boolean>(false);

  // Loading states
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState<boolean>(false);
  const isSavingDraftRef = useRef<boolean>(false);
  const isCompletingOrderRef = useRef<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active tab getter
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Helper to show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Helper to update active tab
  const updateActiveTab = (updatedFields: Partial<IPosTab>) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId ? { ...t, ...updatedFields } : t
      )
    );
  };

  // Auto-restore / synchronize held orders in POS tabs (NCL-03-CN-010 - TC-02)
  const hasAutoRestoredRef = useRef<boolean>(false);
  useEffect(() => {
    const list = heldOrdersData?.result;
    if (!isShiftOpen || !list || list.length === 0) return;
    if (hasAutoRestoredRef.current) return;
    hasAutoRestoredRef.current = true;

    setTabs((prevTabs) => {
      let updated = [...prevTabs];

      list.forEach((held: IHeldOrderSummaryResponse) => {
        const orderId = held.id || (held.orderId as string);
        const existingTabIndex = updated.findIndex(
          (t) => t.backendOrderId === orderId
        );

        if (existingTabIndex >= 0) {
          // If tab was already completed or canceled, do not re-sync or restore
          if (
            updated[existingTabIndex].status === "COMPLETED" ||
            (updated[existingTabIndex].status as string) === "CANCELED"
          ) {
            return;
          }
          // Tab exists, sync its held metadata
          updated[existingTabIndex] = {
            ...updated[existingTabIndex],
            orderLabel: held.orderLabel || undefined,
            diningTableId: held.diningTableId || undefined,
            diningTableName: held.diningTableName || undefined,
            diningTableArea: held.diningTableArea || undefined,
            isOverdue: held.isOverdue,
            holdingDurationMinutes: held.holdingDurationMinutes,
          };
        } else {
          // Tab not in local state, restore it as a held tab
          const isVirginTab =
            updated.length === 1 &&
            updated[0].items.length === 0 &&
            !updated[0].backendOrderId;

          const newTab: IPosTab = {
            id: `tab-held-${orderId}`,
            orderNumber: held.orderNumber,
            orderLabel: held.orderLabel || undefined,
            diningTableId: held.diningTableId || undefined,
            diningTableName: held.diningTableName || undefined,
            diningTableArea: held.diningTableArea || undefined,
            isOverdue: held.isOverdue,
            holdingDurationMinutes: held.holdingDurationMinutes,
            status: "DRAFT",
            saleMode: held.customerId ? SALE_MODES.NORMAL : SALE_MODES.FAST,
            customerId: held.customerId || undefined,
            customer: held.customerId
              ? customersList.find((c) => c.id === held.customerId) || null
              : null,
            items: [], // Lazy loaded when tab is focused
            discountType: DISCOUNT_TYPES.PERCENTAGE,
            discountValue: 0,
            paymentMethod: PAYMENT_METHODS.CASH,
            amountGiven: held.totalAmount,
            isSaved: true,
            backendOrderId: orderId,
          };

          if (isVirginTab) {
            updated = [newTab];
          } else {
            updated.push(newTab);
          }
        }
      });

      return updated;
    });
  }, [isShiftOpen, heldOrdersData, customersList]);

  // Lazy load full order items when switching to a held tab that has no items in memory
  const activeTabId = activeTab?.id;
  const activeBackendOrderId = activeTab?.backendOrderId;
  const activeItemsCount = activeTab?.items.length ?? 0;

  useEffect(() => {
    if (!activeTabId || !activeBackendOrderId || activeItemsCount > 0) return;

    let isMounted = true;
    getOrderLazy(activeBackendOrderId)
      .unwrap()
      .then((res) => {
        if (!isMounted || !res?.result) return;
        const order = res.result;
        const cartItems: IPosCartItem[] = (order.items || []).map((it) => {
          const matchedProd = productsList.find((p) => p.id === it.productId) || ({
            id: it.productId,
            sku: it.productId,
            name: it.productName,
            unit: it.unitName || "Cái",
            price: it.unitPrice,
            stockQuantity: 999,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as IProduct);

          return {
            id: it.id,
            product: matchedProd,
            quantity: it.quantity,
            price: it.unitPrice,
            baseRetailPrice: matchedProd.price,
            unitConversionId: it.unitConversionId || undefined,
            unitName: it.unitName,
            conversionFactor: it.conversionFactor,
            lineDiscount: it.discountAmount || 0,
            lineTotal: it.subtotal || it.quantity * it.unitPrice - (it.discountAmount || 0),
          };
        });

        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId
              ? {
                  ...t,
                  items: cartItems,
                  customer: order.customerId
                    ? customersList.find((c) => c.id === order.customerId) || null
                    : null,
                  customerId: order.customerId || undefined,
                  discountValue: order.discountAmount || 0,
                  orderLabel: order.orderLabel || undefined,
                  diningTableId: order.diningTableId || undefined,
                  diningTableName: order.diningTableName || undefined,
                  diningTableArea: order.diningTableArea || undefined,
                  isOverdue: order.isOverdue || false,
                  holdingDurationMinutes: order.holdingDurationMinutes || 0,
                }
              : t
          )
        );
      })
      .catch((err) => {
        console.warn("Failed to load held order details", err);
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeTabId,
    activeBackendOrderId,
    activeItemsCount,
    getOrderLazy,
    productsList,
    customersList,
  ]);

  // Tab management handlers
  const handleAddTab = () => {
    if (isOnline === false) {
      const limitStatus = checkOfflineLimitStatus();
      if (limitStatus.isExceeded) {
        showToast(
          limitStatus.errorMessage ||
            `Không thể tạo thêm hóa đơn mới! Đã vượt quá giới hạn bán khi mất mạng (${limitStatus.maxOrders} đơn / ${limitStatus.maxHours}h). Vui lòng kết nối mạng để đồng bộ!`
        );
        return;
      }
    }
    const nextIndex = tabCounter + 1;
    const newTab = createInitialTab(nextIndex);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setTabCounter(nextIndex);
  };

  const handleCloseTab = (tabIdToClose: string) => {
    if (tabs.length <= 1) return;
    const remainingTabs = tabs.filter((t) => t.id !== tabIdToClose);
    setTabs(remainingTabs);
    if (activeTabId === tabIdToClose) {
      setActiveTabId(remainingTabs[remainingTabs.length - 1].id);
    }
  };

  const handleReorderTabs = (fromIndex: number, toIndex: number) => {
    setTabs((prevTabs) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prevTabs.length ||
        toIndex < 0 ||
        toIndex >= prevTabs.length ||
        fromIndex === toIndex
      ) {
        return prevTabs;
      }
      const reordered = [...prevTabs];
      const [movedTab] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movedTab);
      return reordered;
    });
  };

  // Product selection & cart manipulation with auto promotion sync
  const handleSelectProduct = async (product: IProduct) => {
    if (isOnline === false) {
      const limitStatus = checkOfflineLimitStatus();
      if (limitStatus.isExceeded) {
        showToast(
          limitStatus.errorMessage ||
            `Không thể chọn thêm hàng! Đã vượt quá giới hạn bán khi mất mạng (${limitStatus.maxOrders} đơn / ${limitStatus.maxHours}h). Vui lòng kết nối mạng để đồng bộ!`
        );
        return;
      }
    }

    const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    const existingItem = currentTab.items.find(
      (item) => item.product.id === product.id
    );

    // If product is sold by weight, open WeightScaleModal for precise weighing or money purchase
    if (product.isSoldByWeight) {
      setWeightModalProduct(product);
      setWeightModalItem(existingItem || null);
      return;
    }

    const existingItemIndex = currentTab.items.findIndex(
      (item) => item.product.id === product.id
    );

    let newItems: IPosCartItem[];

    if (existingItemIndex > -1) {
      newItems = [...currentTab.items];
      const foundItem = newItems[existingItemIndex];
      const updatedQty = foundItem.quantity + 1;
      newItems[existingItemIndex] = {
        ...foundItem,
        quantity: updatedQty,
        lineTotal:
          updatedQty * foundItem.price - (foundItem.lineDiscount || 0),
      };
    } else {
      const defaultSale = product.unitConversions?.find((c) => c.isDefaultSale);
      const initialPrice = defaultSale?.price ?? (defaultSale ? product.price * defaultSale.conversionFactor : product.price);
      const initialUnitName = defaultSale ? defaultSale.unitName : (product.unit || "Cái");
      const initialConvId = defaultSale ? defaultSale.id : undefined;
      const initialFactor = defaultSale ? defaultSale.conversionFactor : 1;

      newItems = [
        ...currentTab.items,
        {
          id: product.id,
          product,
          quantity: 1,
          price: initialPrice,
          unitConversionId: initialConvId,
          unitName: initialUnitName,
          conversionFactor: initialFactor,
          lineDiscount: 0,
          lineTotal: initialPrice,
        },
      ];
    }

    // Immediate optimistic UI update
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: newItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );

    // Automatic price tier resolution followed by promotion sync (NCL-02-CN-010)
    const itemsWithTiers = await resolveTiersForItems(newItems);
    const syncedItems = await syncPromotionsForItems(itemsWithTiers);
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: syncedItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );
  };

  // Handle Barcode Scan from Hardware Scanner, Camera, or Quick Search
  const handleBarcodeScanned = async (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    if (isOnline === false) {
      const limitStatus = checkOfflineLimitStatus();
      if (limitStatus.isExceeded) {
        showToast(
          limitStatus.errorMessage ||
            `Không thể quét thêm hàng! Đã vượt quá giới hạn bán khi mất mạng.`
        );
        return;
      }
    }

    try {
      const response = await scanBarcode({
        barcode: cleanCode,
        orderId: activeTab.backendOrderId,
        quantity: 1,
      }).unwrap();

      if (response.found) {
        playBarcodeBeepSound("success");

        let targetProduct = productsList.find(
          (p) =>
            p.id === response.productId ||
            p.sku === response.productSku ||
            (response.barcode && p.barcode === response.barcode)
        );

        if (!targetProduct && response.productId) {
          targetProduct = {
            id: response.productId,
            sku: response.productSku || cleanCode,
            barcode: response.barcode,
            name: response.productName || "Sản phẩm",
            unit: response.unit || "Cái",
            price: response.unitPrice ?? 0,
            stockQuantity: response.stockQuantity ?? 999,
            status: "ACTIVE",
            groupId: null,
            groupName: null,
            taxRateId: "",
            taxRateName: "",
            taxRatePercentage: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        if (targetProduct) {
          await handleSelectProduct(targetProduct);
          showToast(`Đã quét: ${response.productName || targetProduct.name} (+1)`);
        }
      } else {
        // TC-02: Unrecognized barcode -> trigger resolution modal
        playBarcodeBeepSound("error");
        setUnrecognizedBarcode(response.suggestedBarcode || cleanCode);
      }
    } catch (err: any) {
      playBarcodeBeepSound("error");
      const errorMsg =
        err?.data?.message || err?.message || BARCODE_MESSAGES.SCAN_ERROR;
      showToast(errorMsg);
    }
  };

  // Global Hardware USB/Bluetooth Barcode Scanner listener
  useBarcodeScanner({
    onScan: handleBarcodeScanned,
    enabled: isShiftOpen && !isScannerModalOpen && !unrecognizedBarcode,
  });

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    const newItems = currentTab.items.map((item) => {
      if (item.id !== itemId && item.product.id !== itemId) return item;
      return {
        ...item,
        quantity: newQuantity,
        lineTotal: newQuantity * item.price - (item.lineDiscount || 0),
      };
    });

    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: newItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );

    const itemsWithTiers = await resolveTiersForItems(newItems);
    const syncedItems = await syncPromotionsForItems(itemsWithTiers);
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: syncedItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );
  };

  const handleRemoveItem = async (itemId: string) => {
    const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    const newItems = currentTab.items.filter(
      (item) => item.id !== itemId && item.product.id !== itemId
    );

    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: newItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );

    if (newItems.length > 0) {
      const syncedItems = await syncPromotionsForItems(newItems);
      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === activeTabId
            ? { ...t, items: syncedItems, isSaved: false, backendOrderId: undefined }
            : t
        )
      );
    }
  };

  // Toggle bypass promotion (TC-04: Owner permission check)
  const handleToggleBypassPromotion = async (itemId: string) => {
    if (!canManage) {
      showToast(
        "Nhân viên không có quyền bỏ khuyến mại tự động. Cần có sự đồng ý của chủ hộ kinh doanh."
      );
      return;
    }

    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (!currentTab) return;

    const targetItem = currentTab.items.find(
      (i) => i.id === itemId || i.product.id === itemId
    );
    if (!targetItem) return;

    const newBypass = !targetItem.bypassPromotion;
    const updatedItems = currentTab.items.map((i) =>
      i.id === itemId || i.product.id === itemId
        ? { ...i, bypassPromotion: newBypass }
        : i
    );

    const finalItems = await syncPromotionsForItems(updatedItems);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, items: finalItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );
  };

  const handleClearCart = () => {
    updateActiveTab({ items: [], isSaved: false, backendOrderId: undefined });
  };

  const handleOpenWeightModal = (item: IPosCartItem) => {
    setWeightModalItem(item);
    setWeightModalProduct(item.product);
  };

  const handleConfirmWeightModal = async ({
    quantity,
    buyAmount,
    unitConversionId,
    roundingDifference,
    priceTierId,
    priceTierName,
    appliedUnitPrice,
  }: {
    quantity: number;
    buyAmount?: number;
    unitConversionId?: string;
    roundingDifference?: number;
    priceTierId?: string | null;
    priceTierName?: string | null;
    appliedUnitPrice?: number;
  }) => {
    if (!weightModalProduct) return;
    const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

    let effectiveUnitPrice = weightModalProduct.price;
    let effectiveUnitName = weightModalProduct.unit || "Kg";
    let effectiveFactor = 1;
    let effectiveConvId: string | undefined = unitConversionId;

    if (unitConversionId) {
      const conv = weightModalProduct.unitConversions?.find(
        (c) => c.id === unitConversionId
      );
      if (conv) {
        effectiveUnitPrice =
          conv.price != null && conv.price > 0
            ? conv.price
            : weightModalProduct.price * conv.conversionFactor;
        effectiveUnitName = conv.unitName;
        effectiveFactor = conv.conversionFactor;
        effectiveConvId = conv.id;
      }
    }

    const initialPrice = appliedUnitPrice ?? effectiveUnitPrice;

    const existingItemIndex = currentTab.items.findIndex(
      (item) =>
        (weightModalItem && (item.id === weightModalItem.id || item.product.id === weightModalItem.product.id)) ||
        item.product.id === weightModalProduct.id
    );

    let newItems: IPosCartItem[];
    const lineTotal = quantity * initialPrice;

    if (existingItemIndex > -1) {
      newItems = [...currentTab.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity,
        price: initialPrice,
        baseRetailPrice: effectiveUnitPrice,
        priceTierId,
        priceTierName,
        unitConversionId: effectiveConvId,
        unitName: effectiveUnitName,
        conversionFactor: effectiveFactor,
        buyAmount,
        roundingDifference,
        lineTotal: lineTotal - (newItems[existingItemIndex].lineDiscount || 0),
      };
    } else {
      newItems = [
        ...currentTab.items,
        {
          id: weightModalProduct.id,
          product: weightModalProduct,
          quantity,
          price: initialPrice,
          baseRetailPrice: effectiveUnitPrice,
          priceTierId,
          priceTierName,
          unitConversionId: effectiveConvId,
          unitName: effectiveUnitName,
          conversionFactor: effectiveFactor,
          buyAmount,
          roundingDifference,
          lineDiscount: 0,
          lineTotal,
        },
      ];
    }

    setWeightModalProduct(null);
    setWeightModalItem(null);

    // Immediate optimistic UI update
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: newItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );

    // Automatic price tier resolution followed by promotion sync (NCL-02-CN-010)
    const itemsWithTiers = await resolveTiersForItems(newItems);
    const syncedItems = await syncPromotionsForItems(itemsWithTiers);
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: syncedItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );
  };

  // TC-02: Đổi đơn vị tính bán hàng trong giỏ hàng POS
  const handleChangeUnit = async (itemId: string, unitConversionId: string) => {
    const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    const targetItem = currentTab.items.find(
      (i) => i.id === itemId || i.product.id === itemId
    );
    if (!targetItem) return;

    let newUnitName = targetItem.product.unit || "Cái";
    let newPrice = targetItem.product.price;
    let newFactor = 1;
    let newConversionId: string | undefined = undefined;

    if (unitConversionId) {
      const conv = targetItem.product.unitConversions?.find(
        (c) => c.id === unitConversionId
      );
      if (conv) {
        newUnitName = conv.unitName;
        newPrice =
          conv.price != null && conv.price > 0
            ? conv.price
            : targetItem.product.price * conv.conversionFactor;
        newFactor = conv.conversionFactor;
        newConversionId = conv.id;
      }
    }

    const updatedItems = currentTab.items.map((item) => {
      if (item.id !== itemId && item.product.id !== itemId) return item;
      const lineTotal = item.quantity * newPrice - (item.lineDiscount || 0);
      return {
        ...item,
        unitConversionId: newConversionId,
        unitName: newUnitName,
        conversionFactor: newFactor,
        price: newPrice,
        lineTotal,
      };
    });

    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: updatedItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );

    const itemsWithTiers = await resolveTiersForItems(updatedItems);
    const syncedItems = await syncPromotionsForItems(itemsWithTiers);
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, items: syncedItems, isSaved: false, backendOrderId: undefined }
          : t
      )
    );
  };

  // Add customer callback
  const handleSaveCustomer = async (
    customerData: Omit<ICustomer, "id" | "debt"> & { id?: string; debt?: number }
  ) => {
    try {
      const res = await createCustomer(customerData as any).unwrap();
      const newCust = res;
      updateActiveTab({
        customer: newCust,
        customerId: newCust.id,
        backendOrderId: undefined,
        isSaved: false,
      });
      setIsAddCustomerModalOpen(false);
      showToast(`Đã thêm khách hàng ${newCust.name} và gán vào hóa đơn!`);
    } catch (err: any) {
      showToast(err?.data?.message || "Thêm mới khách hàng thất bại!");
    }
  };

  // Save Draft (Lưu nháp đơn hàng xuống DB)
  const handleSaveDraft = async () => {
    if (activeTab.items.length === 0 || isSavingDraftRef.current) return;
    isSavingDraftRef.current = true;
    setIsSavingDraft(true);

    try {
      let orderId = activeTab.backendOrderId;

      // 1. Create Order Draft, add items & apply discount if not existing or modified
      if (!orderId || !activeTab.isSaved) {
        const createRes = await createOrder({
          customerId: activeTab.customerId,
        }).unwrap();
        orderId = createRes.result.id;

        // Persist backendOrderId immediately to prevent duplicate order creation on retry
        updateActiveTab({ backendOrderId: orderId });

        // 2. Add Items
        for (const item of activeTab.items) {
          await addOrderItem({
            orderId,
            productId: item.product.id,
            quantity: item.quantity,
            bypassPromotion: item.bypassPromotion,
            unitConversionId: item.unitConversionId || undefined,
          }).unwrap();
        }

        // 3. Apply Discount
        if (activeTab.discountValue > 0) {
          await applyDiscount({
            orderId,
            discountType: activeTab.discountType,
            discountValue: activeTab.discountValue,
          }).unwrap();
        }
      }

      updateActiveTab({
        backendOrderId: orderId,
        status: "DRAFT",
        isSaved: true,
      });

      showToast(`Đã lưu nháp ${activeTab.orderNumber} thành công!`);
    } catch (err: any) {
      updateActiveTab({ backendOrderId: undefined, isSaved: false });
      showToast(
        err?.data?.message || "Lưu đơn nháp thất bại. Vui lòng thử lại!"
      );
    } finally {
      setIsSavingDraft(false);
      isSavingDraftRef.current = false;
    }
  };

  // Open Cancel Order Modal (NCL-03-CN-009)
  const handleOpenCancelOrder = async () => {
    if (activeTab.items.length === 0 && !activeTab.backendOrderId) {
      showToast("Đơn hàng chưa có sản phẩm nào để hủy.");
      return;
    }

    try {
      let orderId = activeTab.backendOrderId;

      // Nếu đơn chưa lưu nháp trên server, tạo đơn nháp trước để có ID hủy hợp lệ
      if (!orderId) {
        setIsSavingDraft(true);
        const createRes = await createOrder({
          customerId: activeTab.customerId,
        }).unwrap();
        orderId = createRes.result.id;
        updateActiveTab({ backendOrderId: orderId });

        for (const item of activeTab.items) {
          await addOrderItem({
            orderId,
            productId: item.product.id,
            quantity: item.quantity,
            bypassPromotion: item.bypassPromotion,
            unitConversionId: item.unitConversionId || undefined,
          }).unwrap();
        }
        setIsSavingDraft(false);
      }

      const { finalTotal } = calculatePosTotals(activeTab);
      const orderPayload: IOrderResponse = {
        id: orderId,
        orderNumber: activeTab.orderNumber,
        householdId: "",
        shiftId: activeShift?.id || "",
        createdByUserId: authenticatedUser?.id || "",
        createdByUsername: authenticatedUser?.username || "",
        customerId: activeTab.customerId || null,
        customerName: activeTab.customer?.name || null,
        totalAmount: finalTotal,
        discountAmount: activeTab.discountValue,
        finalAmount: finalTotal,
        paymentMethod: null,
        paymentStatus: "PENDING",
        status: "CREATING",
        syncStatus: "SYNCED",
        isOffline: false,
        syncedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        warningMessages: [],
        qrCodeUrl: null,
        changeAmount: 0,
      };

      setOrderToCancel(orderPayload);
      setIsCancelModalOpen(true);
    } catch (err: any) {
      setIsSavingDraft(false);
      showToast(err?.data?.message || "Không thể chuẩn bị hủy đơn hàng. Vui lòng thử lại!");
    }
  };

  // Native Order Cancellation Sync (NCL-03-CN-009)
  // Khi hủy đơn (tại POS, tại màn Quản lý, hoặc từ thiết bị/tab khác),
  // màn bán hàng tự động native xóa đơn/dọn sạch giỏ hàng ngay lập tức.
  const handleRemoveCanceledOrderTab = useCallback(
    ({ orderId, orderNumber }: { orderId: string; orderNumber?: string }) => {
      setTabs((prevTabs) => {
        const matchingTabIndex = prevTabs.findIndex(
          (t) =>
            t.backendOrderId === orderId ||
            (orderNumber && (t.orderNumber === orderNumber || t.orderNumber.includes(orderNumber)))
        );

        if (matchingTabIndex === -1) {
          return prevTabs;
        }

        const tabToRemove = prevTabs[matchingTabIndex];
        const remainingTabs = prevTabs.filter((t) => t.id !== tabToRemove.id);

        if (remainingTabs.length === 0) {
          const nextIndex = tabCounter + 1;
          const freshTab = createInitialTab(nextIndex);
          setActiveTabId(freshTab.id);
          setTabCounter(nextIndex);
          return [freshTab];
        }

        if (activeTabId === tabToRemove.id) {
          const nextActive =
            remainingTabs[Math.max(0, matchingTabIndex - 1)] || remainingTabs[0];
          setActiveTabId(nextActive.id);
        }

        return remainingTabs;
      });
    },
    [activeTabId, tabCounter]
  );

  useOnOrderCanceled(handleRemoveCanceledOrderTab);

  // Native listener: Khi một đơn hàng hoàn tất thanh toán (cross-tab hoặc background)
  const handleRemoveCompletedOrderTab = useCallback(
    (detail?: IOrderCompletedEventDetail) => {
      const orderId = detail?.orderId;
      const orderNumber = detail?.orderNumber;
      if (!orderId && !orderNumber) return;

      setTabs((prevTabs) => {
        const matchingTabIndex = prevTabs.findIndex(
          (t) =>
            (orderId && t.backendOrderId === orderId) ||
            (orderNumber && (t.orderNumber === orderNumber || t.orderNumber.includes(orderNumber)))
        );

        if (matchingTabIndex === -1) {
          return prevTabs;
        }

        const tabToRemove = prevTabs[matchingTabIndex];
        const remainingTabs = prevTabs.filter((t) => t.id !== tabToRemove.id);

        if (remainingTabs.length === 0) {
          const nextIndex = tabCounter + 1;
          const freshTab = createInitialTab(nextIndex);
          setActiveTabId(freshTab.id);
          setTabCounter(nextIndex);
          return [freshTab];
        }

        if (activeTabId === tabToRemove.id) {
          const nextActive =
            remainingTabs[Math.max(0, matchingTabIndex - 1)] || remainingTabs[0];
          setActiveTabId(nextActive.id);
        }

        return remainingTabs;
      });
    },
    [activeTabId, tabCounter]
  );

  useOnOrderCompleted(handleRemoveCompletedOrderTab);

  const handleCancelOrderSuccess = (canceledOrder: IOrderResponse) => {
    showToast(`Đã hủy đơn hàng ${canceledOrder.orderNumber} thành công.`);
    notifyOrderCanceled(canceledOrder.id, canceledOrder.orderNumber);

    // Native dọn dẹp ngay lập tức đơn hàng bị hủy trên màn hình POS
    setTabs((prevTabs) => {
      const remainingTabs = prevTabs.filter(
        (t) =>
          t.id !== activeTab.id &&
          t.backendOrderId !== canceledOrder.id &&
          t.orderNumber !== canceledOrder.orderNumber
      );

      if (remainingTabs.length === 0) {
        const nextIndex = tabCounter + 1;
        const freshTab = createInitialTab(nextIndex);
        setActiveTabId(freshTab.id);
        setTabCounter(nextIndex);
        return [freshTab];
      }

      setActiveTabId(remainingTabs[remainingTabs.length - 1].id);
      return remainingTabs;
    });

    setIsCancelModalOpen(false);
    setOrderToCancel(null);
  };

  // Open Hold Order Modal (NCL-03-CN-010)
  const handleOpenHoldOrderModal = async () => {
    if (activeTab.items.length === 0 && !activeTab.backendOrderId) {
      showToast("Đơn hàng chưa có sản phẩm nào để đặt bàn hoặc treo đơn.");
      return;
    }

    try {
      let orderId = activeTab.backendOrderId;

      // Nếu đơn chưa lưu nháp trên server, tạo đơn nháp trước để có ID hợp lệ
      if (!orderId || !activeTab.isSaved) {
        setIsSavingDraft(true);
        if (!orderId) {
          const createRes = await createOrder({
            customerId: activeTab.customerId,
          }).unwrap();
          orderId = createRes.result.id;
          updateActiveTab({ backendOrderId: orderId });

          for (const item of activeTab.items) {
            await addOrderItem({
              orderId,
              productId: item.product.id,
              quantity: item.quantity,
              bypassPromotion: item.bypassPromotion,
              unitConversionId: item.unitConversionId || undefined,
            }).unwrap();
          }

          if (activeTab.discountValue > 0) {
            await applyDiscount({
              orderId,
              discountType: activeTab.discountType,
              discountValue: activeTab.discountValue,
            }).unwrap();
          }
        }
        updateActiveTab({ backendOrderId: orderId, isSaved: true, status: "DRAFT" });
        setIsSavingDraft(false);
      }

      setHoldModalOrderId(orderId);
      setHoldModalOrderNumber(activeTab.orderNumber);
      setHoldModalCurrentLabel(activeTab.orderLabel || null);
      setHoldModalCurrentTableId(activeTab.diningTableId || null);
      setHoldModalCurrentTableName(activeTab.diningTableName || null);
      setIsHoldModalOpen(true);
    } catch (err: any) {
      setIsSavingDraft(false);
      showToast(
        err?.data?.message || "Không thể khởi tạo đơn để đặt bàn/treo đơn. Vui lòng thử lại!"
      );
    }
  };

  const handleHoldOrderSuccess = (updatedOrder: IOrderResponse) => {
    updateActiveTab({
      orderLabel: updatedOrder.orderLabel || undefined,
      diningTableId: updatedOrder.diningTableId || undefined,
      diningTableName: updatedOrder.diningTableName || undefined,
      diningTableArea: updatedOrder.diningTableArea || undefined,
      isOverdue: updatedOrder.isOverdue || false,
      holdingDurationMinutes: updatedOrder.holdingDurationMinutes || 0,
    });
    setIsHoldModalOpen(false);
    showToast(
      `Đã cập nhật thông tin nhận diện/bàn cho ${activeTab.orderNumber}!`
    );
  };

  const handleSelectHeldOrder = async (heldOrder: IHeldOrderSummaryResponse) => {
    setIsHeldOrdersDrawerOpen(false);
    const orderId = heldOrder.id || (heldOrder.orderId as string);
    const existingTab = tabs.find((t) => t.backendOrderId === orderId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const newTab: IPosTab = {
        id: `tab-held-${orderId}`,
        orderNumber: heldOrder.orderNumber,
        orderLabel: heldOrder.orderLabel || undefined,
        diningTableId: heldOrder.diningTableId || undefined,
        diningTableName: heldOrder.diningTableName || undefined,
        diningTableArea: heldOrder.diningTableArea || undefined,
        isOverdue: heldOrder.isOverdue,
        holdingDurationMinutes: heldOrder.holdingDurationMinutes,
        status: "DRAFT",
        saleMode: heldOrder.customerId ? SALE_MODES.NORMAL : SALE_MODES.FAST,
        customerId: heldOrder.customerId || undefined,
        customer: heldOrder.customerId
          ? customersList.find((c) => c.id === heldOrder.customerId) || null
          : null,
        items: [],
        discountType: DISCOUNT_TYPES.PERCENTAGE,
        discountValue: 0,
        paymentMethod: PAYMENT_METHODS.CASH,
        amountGiven: heldOrder.totalAmount,
        isSaved: true,
        backendOrderId: orderId,
      };

      const isVirginTab =
        tabs.length === 1 && tabs[0].items.length === 0 && !tabs[0].backendOrderId;
      if (isVirginTab) {
        setTabs([newTab]);
      } else {
        setTabs((prev) => [...prev, newTab]);
      }
      setActiveTabId(newTab.id);
      showToast(`Đã mở đơn treo ${heldOrder.orderNumber}`);
    }
  };

  const handleEditHeldOrder = (heldOrder: IHeldOrderSummaryResponse) => {
    setIsHeldOrdersDrawerOpen(false);
    const orderId = heldOrder.id || (heldOrder.orderId as string);
    setHoldModalOrderId(orderId);
    setHoldModalOrderNumber(heldOrder.orderNumber);
    setHoldModalCurrentLabel(heldOrder.orderLabel || null);
    setHoldModalCurrentTableId(heldOrder.diningTableId || null);
    setHoldModalCurrentTableName(heldOrder.diningTableName || null);
    setIsHoldModalOpen(true);
  };

  const handleCancelHeldOrderFromDrawer = (heldOrder: IHeldOrderSummaryResponse) => {
    setIsHeldOrdersDrawerOpen(false);
    const orderId = heldOrder.id || (heldOrder.orderId as string);
    const orderPayload: IOrderResponse = {
      id: orderId,
      orderNumber: heldOrder.orderNumber,
      householdId: "",
      shiftId: activeShift?.id || "",
      createdByUserId: authenticatedUser?.id || "",
      createdByUsername: authenticatedUser?.username || "",
      customerId: heldOrder.customerId || null,
      customerName: heldOrder.customerName || null,
      totalAmount: heldOrder.totalAmount,
      discountAmount: 0,
      finalAmount: heldOrder.totalAmount,
      paymentMethod: null,
      paymentStatus: "PENDING",
      status: "CREATING",
      syncStatus: "SYNCED",
      isOffline: false,
      syncedAt: null,
      createdAt: heldOrder.createdAt,
      updatedAt: heldOrder.createdAt,
      items: [],
      warningMessages: [],
      qrCodeUrl: null,
      changeAmount: 0,
      orderLabel: heldOrder.orderLabel,
      diningTableId: heldOrder.diningTableId,
      diningTableName: heldOrder.diningTableName,
    };
    setOrderToCancel(orderPayload);
    setIsCancelModalOpen(true);
  };

  // Helper to handle offline order completion
  const completeOrderOffline = (
    itemsSum: number,
    discountCash: number,
    finalTotal: number,
    effectiveAmountGiven: number,
    changeAmount: number
  ) => {
    const offlineOrderNumber = `HD-OFF-${Date.now()}`;
    const offlineOrderPayload: IOfflineOrderRequest = {
      orderNumber: offlineOrderNumber,
      shiftId: activeShift?.id || null,
      customerId: activeTab.customerId || null,
      totalAmount: itemsSum,
      discountAmount: discountCash,
      finalAmount: finalTotal,
      paymentMethod: activeTab.paymentMethod,
      paymentStatus: activeTab.paymentMethod === "DEBT" ? "UNPAID" : "PAID",
      createdAt: getLocalDateTimeISOString(),
      discountType: activeTab.discountType,
      discountRateOrValue: activeTab.discountValue || 0,
      items: activeTab.items.map((item) => {
        const itemSubtotal = item.price * item.quantity;
        const taxRate = item.product?.taxRatePercentage || 0;
        const itemTax = Math.round((itemSubtotal * taxRate) / 100);
        return {
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.price,
          discountAmount: item.lineDiscount || 0,
          taxRatePercentage: taxRate,
          taxAmount: itemTax,
          subtotal: itemSubtotal + itemTax,
        };
      }),
    };

    saveOfflineOrder(offlineOrderPayload);

    const mockResponseOrder: IOrderResponse = {
      id: `local_${offlineOrderNumber}`,
      orderNumber: offlineOrderNumber,
      householdId: authenticatedUser?.household?.id || "",
      shiftId: activeShift?.id || "",
      createdByUserId: authenticatedUser?.id || "",
      createdByUsername: authenticatedUser?.username || "",
      customerId: activeTab.customerId || null,
      customerName: activeTab.customer?.name || "Khách vãng lai",
      totalAmount: itemsSum,
      discountAmount: discountCash,
      finalAmount: finalTotal,
      paymentMethod: activeTab.paymentMethod,
      paymentStatus: activeTab.paymentMethod === "DEBT" ? "UNPAID" : "PAID",
      status: "COMPLETED",
      syncStatus: "PENDING",
      isOffline: true,
      createdAt: getLocalDateTimeISOString(),
      updatedAt: getLocalDateTimeISOString(),
      items: activeTab.items.map((item, idx) => ({
        id: `item_off_${idx}`,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.price,
        discountAmount: item.lineDiscount || 0,
        taxRatePercentage: item.product?.taxRatePercentage || 0,
        taxAmount: Math.round(((item.price * item.quantity) * (item.product?.taxRatePercentage || 0)) / 100),
        subtotal: item.price * item.quantity,
      })),
      syncedAt: null,
      qrCodeUrl: null,
      changeAmount: changeAmount,
      warningMessages: [],
    };

    if (typeof setOrders === "function") {
      setOrders((prev) => [mockResponseOrder, ...prev.filter((o) => o.id !== mockResponseOrder.id)]);
    }

    const itemDetails = activeTab.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ");
    if (typeof addLogEntry === "function") {
      addLogEntry(
        "TẠO_ĐƠN_HÀNG",
        `Mã đơn hàng: ${offlineOrderNumber} (Ngoại tuyến) - Khách: ${activeTab.customer?.name || "Khách vãng lai"} - SP: [${itemDetails}] - Tổng tiền: ${finalTotal.toLocaleString("vi-VN")} đ`
      );
    }

    // Update customer debt if paymentMethod is DEBT
    if (activeTab.customerId && activeTab.paymentMethod === "DEBT") {
      const unpaidBalance = Math.max(0, finalTotal - (effectiveAmountGiven || 0));
      if (unpaidBalance > 0 && typeof setCustomers === "function") {
        setCustomers((prevCustomers) =>
          prevCustomers.map((cust) =>
            cust.id === activeTab.customerId
              ? { ...cust, debt: (cust.debt || 0) + unpaidBalance }
              : cust
          )
        );
      }
    }

    setCompletedOrderData({
      tab: {
        ...activeTab,
        backendOrderId: `local_${offlineOrderNumber}`,
        orderNumber: offlineOrderNumber,
        amountGiven: effectiveAmountGiven,
      },
      changeAmount,
      finalTotal,
    });

    updateActiveTab({ backendOrderId: `local_${offlineOrderNumber}`, status: "COMPLETED", isSaved: true });
    notifyOrderCompleted(`local_${offlineOrderNumber}`, offlineOrderNumber);
    const limitStatus = checkOfflineLimitStatus();
    const countInfo = limitStatus.maxOrders > 0
      ? `${limitStatus.currentOrdersCount}/${limitStatus.maxOrders}`
      : `${limitStatus.currentOrdersCount} (Không giới hạn)`;
    showToast(
      `Đã lưu đơn hàng ở chế độ Ngoại tuyến (Đã lưu ${countInfo} đơn). Đơn hàng sẽ tự động đồng bộ khi có kết nối mạng.`
    );
  };

  // Helper to ensure an active POS tab is saved on backend and returns its orderId
  const ensureBackendOrderSaved = async (): Promise<string> => {
    let orderId = activeTab.backendOrderId;
    if (!orderId || !activeTab.isSaved) {
      const createRes = await createOrder({
        customerId: activeTab.customerId,
      }).unwrap();
      orderId = createRes.result.id;
      updateActiveTab({ backendOrderId: orderId, isSaved: true });

      for (const item of activeTab.items) {
        await addOrderItem({
          orderId,
          productId: item.product.id,
          quantity: item.quantity,
          buyAmount: item.buyAmount,
          bypassPromotion: item.bypassPromotion,
          unitConversionId: item.unitConversionId || undefined,
        }).unwrap();
      }

      if (activeTab.discountValue > 0) {
        await applyDiscount({
          orderId,
          discountType: activeTab.discountType,
          discountValue: activeTab.discountValue,
        }).unwrap();
      }
    }
    return orderId;
  };

  // Open Combined Payment Modal (NCL-03-CN-011)
  const handleOpenCombinedPaymentModal = async () => {
    if (activeTab.items.length === 0) return;
    try {
      await ensureBackendOrderSaved();
      setIsCombinedPaymentModalOpen(true);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Không thể chuẩn bị đơn hàng để phân bổ!";
      showToast(msg);
    }
  };

  // Confirm and Complete Combined Payment (NCL-03-CN-011)
  const handleConfirmCombinedPayment = async (
    payments: IOrderPaymentRequest[],
    dueDate?: string
  ) => {
    setIsCompletingOrder(true);
    isCompletingOrderRef.current = true;
    try {
      const orderId = await ensureBackendOrderSaved();

      const totals = calculatePosTotals(activeTab);
      const { finalTotal, totalCartAmount: totalCart, totalOrderLevelDiscounts: discountCash } = totals;

      const cashPayment = payments.find((p) => p.paymentMethod === "CASH");
      const effectiveChange =
        cashPayment && cashPayment.amountGiven && cashPayment.amountGiven > cashPayment.amount
          ? cashPayment.amountGiven - cashPayment.amount
          : 0;

      await completeOrder({
        orderId,
        data: {
          payments,
          dueDate,
        },
      }).unwrap();

      if (discountCash > 0 && totalCart > 0) {
        const discountPercent = Math.round((discountCash / totalCart) * 100);
        recordOrderDiscount({
          orderNumber: activeTab.orderNumber,
          totalAmount: totalCart,
          discountPercent,
          discountAmount: discountCash,
          actorUsername: authenticatedUser?.username || "nhanvien",
        });
      }

      setCompletedOrderData({
        tab: {
          ...activeTab,
          backendOrderId: orderId,
          paymentMethod: "COMBINED",
          combinedPayments: payments,
          dueDate,
          amountGiven: payments.reduce((acc, p) => acc + (p.amountGiven ?? p.amount), 0),
        },
        changeAmount: effectiveChange,
        finalTotal,
      });

      updateActiveTab({
        backendOrderId: orderId,
        paymentMethod: "COMBINED",
        combinedPayments: payments,
        dueDate,
        status: "COMPLETED",
        isSaved: true,
      });

      setIsCombinedPaymentModalOpen(false);
      notifyOrderCompleted(orderId, activeTab.orderNumber);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Thanh toán kết hợp thất bại. Vui lòng thử lại!";
      showToast(msg);
    } finally {
      setIsCompletingOrder(false);
      isCompletingOrderRef.current = false;
    }
  };

  // Bank Transfer Success Confirmation (NCL-03-CN-012)
  const handleBankTransferConfirmSuccess = async (txCode: string) => {
    try {
      const totals = calculatePosTotals(activeTab);
      const { finalTotal, totalCartAmount: totalCart, totalOrderLevelDiscounts: discountCash } = totals;

      await completeOrder({
        orderId: bankTransferOrderId,
        amountGiven: finalTotal,
      }).unwrap();

      if (discountCash > 0 && totalCart > 0) {
        const discountPercent = Math.round((discountCash / totalCart) * 100);
        recordOrderDiscount({
          orderNumber: activeTab.orderNumber,
          totalAmount: totalCart,
          discountPercent,
          discountAmount: discountCash,
          actorUsername: authenticatedUser?.username || "nhanvien",
        });
      }

      setCompletedOrderData({
        tab: {
          ...activeTab,
          backendOrderId: bankTransferOrderId,
          paymentMethod: "BANK_TRANSFER",
          bankTransferConfirmed: true,
          bankTransferTxCode: txCode,
          amountGiven: finalTotal,
        },
        changeAmount: 0,
        finalTotal,
      });

      updateActiveTab({
        backendOrderId: bankTransferOrderId,
        paymentMethod: "BANK_TRANSFER",
        bankTransferConfirmed: true,
        bankTransferTxCode: txCode,
        status: "COMPLETED",
        isSaved: true,
      });

      setIsBankTransferModalOpen(false);
      notifyOrderCompleted(bankTransferOrderId, activeTab.orderNumber);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Chốt đơn chuyển khoản thất bại. Vui lòng thử lại!";
      showToast(msg);
    }
  };

  // Bank Transfer switch to cash (NCL-03-CN-012-TC-03)
  const handleBankTransferSwitchToCash = () => {
    updateActiveTab({
      paymentMethod: "CASH",
      bankTransferConfirmed: false,
      bankTransferTxCode: undefined,
    });
    showToast("Đã đổi sang hình thức Tiền mặt theo yêu cầu của khách hàng (NCL-03-CN-012)");
  };

  // Complete Order (Thanh toán hoàn tất)
  const handleCompleteOrder = async () => {
    if (activeTab.items.length === 0 || isCompletingOrderRef.current) return;
    isCompletingOrderRef.current = true;
    setIsCompletingOrder(true);

    // Calculate totals via centralized utility (including Customer VIP discount)
    const totals = calculatePosTotals(activeTab);
    const {
      totalCartAmount: totalCart,
      totalOrderLevelDiscounts: discountCash,
      finalTotal,
      effectiveAmountGiven,
      changeAmount,
    } = totals;

    // NCL-03-CN-011: If COMBINED payment is selected, verify or open modal
    if (activeTab.paymentMethod === "COMBINED") {
      if (!activeTab.combinedPayments || activeTab.combinedPayments.length === 0) {
        setIsCompletingOrder(false);
        isCompletingOrderRef.current = false;
        await handleOpenCombinedPaymentModal();
        return;
      }

      const sum = activeTab.combinedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      if (sum !== finalTotal) {
        setIsCompletingOrder(false);
        isCompletingOrderRef.current = false;
        showToast("Phân bổ thanh toán kết hợp chưa khớp tổng đơn hàng (QTN-07)!");
        setIsCombinedPaymentModalOpen(true);
        return;
      }
    }

    // NCL-03-CN-012: If BANK_TRANSFER is selected, verify bank confirmation step
    if (activeTab.paymentMethod === "BANK_TRANSFER" && !activeTab.bankTransferConfirmed) {
      try {
        const orderId = await ensureBackendOrderSaved();
        const payRes = await setPaymentMethod({
          orderId,
          paymentMethod: "BANK_TRANSFER",
          amountGiven: finalTotal,
        }).unwrap();

        setBankTransferOrderId(orderId);
        setBankTransferQrUrl(payRes.result?.qrCodeUrl || activeTab.qrCodeUrl || null);
        setBankTransferAmount(finalTotal);
        setIsBankTransferModalOpen(true);
      } catch (err: unknown) {
        const msg = (err as { data?: { message?: string } })?.data?.message || "Không thể chuẩn bị thanh toán chuyển khoản!";
        showToast(msg);
      } finally {
        setIsCompletingOrder(false);
        isCompletingOrderRef.current = false;
      }
      return;
    }

    // QTN-13: Validate DEBT customer and credit limit
    if (activeTab.paymentMethod === "DEBT") {
      const cust = activeTab.customer || customersList.find((c) => c.id === activeTab.customerId);
      if (!cust) {
        showToast("Ghi nợ bắt buộc phải chọn khách hàng trong hệ thống (QTN-13)!");
        setIsCompletingOrder(false);
        isCompletingOrderRef.current = false;
        return;
      }

      const currentDebt = cust.debt || 0;
      const creditLimit = cust.creditLimit || 5000000;
      if (currentDebt + finalTotal > creditLimit) {
        showToast(
          `Khách hàng "${cust.name}" vượt hạn mức công nợ cho phép (Nợ hiện tại: ${formatCurrency(currentDebt)}, Hạn mức: ${formatCurrency(creditLimit)})!`
        );
        setIsCompletingOrder(false);
        isCompletingOrderRef.current = false;
        return;
      }
    }

    // Client-side validation: check cash payment amount before calling backend (chuẩn quy tắc QTN-03)
    if (activeTab.paymentMethod === "CASH" && effectiveAmountGiven < finalTotal) {
      showToast(
        `Số tiền khách đưa (${effectiveAmountGiven.toLocaleString("vi-VN")} đ) chưa đủ để thanh toán (${finalTotal.toLocaleString("vi-VN")} đ). Vui lòng nhập lại!`
      );
      setIsCompletingOrder(false);
      isCompletingOrderRef.current = false;
      return;
    }

    // Check if system is offline
    if (isOnline === false) {
      const limitStatus = checkOfflineLimitStatus();
      if (limitStatus.isExceeded) {
        showToast(
          limitStatus.errorMessage ||
            `Không thể chốt đơn! Đã vượt quá giới hạn bán khi mất mạng (${limitStatus.maxOrders} đơn / ${limitStatus.maxHours}h). Vui lòng kết nối mạng để đồng bộ!`
        );
        setIsCompletingOrder(false);
        isCompletingOrderRef.current = false;
        return;
      }

      completeOrderOffline(
        totalCart,
        discountCash,
        finalTotal,
        effectiveAmountGiven,
        changeAmount
      );
      setIsCompletingOrder(false);
      isCompletingOrderRef.current = false;
      return;
    }

    try {
      const orderId = await ensureBackendOrderSaved();

      // 4. Set Payment Method (chỉ gọi cho các hình thức đơn lẻ; COMBINED gửi danh sách payments qua completeOrder)
      if (activeTab.paymentMethod !== "COMBINED") {
        await setPaymentMethod({
          orderId,
          paymentMethod: activeTab.paymentMethod,
          amountGiven: effectiveAmountGiven,
        }).unwrap();
      }

      // 5. Complete Order
      const completePayload: ICompleteOrderRequest =
        activeTab.paymentMethod === "COMBINED" && activeTab.combinedPayments
          ? {
              payments: activeTab.combinedPayments,
              dueDate: activeTab.dueDate,
            }
          : {
              amountGiven: effectiveAmountGiven,
              dueDate: activeTab.paymentMethod === "DEBT" ? activeTab.dueDate : undefined,
            };

      await completeOrder({
        orderId,
        data: completePayload,
        amountGiven: effectiveAmountGiven,
      }).unwrap();

      if (discountCash > 0 && totalCart > 0) {
        const discountPercent = Math.round((discountCash / totalCart) * 100);
        recordOrderDiscount({
          orderNumber: activeTab.orderNumber,
          totalAmount: totalCart,
          discountPercent,
          discountAmount: discountCash,
          actorUsername: authenticatedUser?.username || "nhanvien",
        });
      }

      setCompletedOrderData({
        tab: { ...activeTab, backendOrderId: orderId, amountGiven: effectiveAmountGiven },
        changeAmount,
        finalTotal,
      });

      updateActiveTab({ backendOrderId: orderId, status: "COMPLETED", isSaved: true });
      notifyOrderCompleted(orderId, activeTab.orderNumber);
    } catch (err: any) {
      if (!window.navigator.onLine || err?.status === "FETCH_ERROR" || err?.status === 0) {
        if (discountCash > 0 && totalCart > 0) {
          const discountPercent = Math.round((discountCash / totalCart) * 100);
          recordOrderDiscount({
            orderNumber: activeTab.orderNumber,
            totalAmount: totalCart,
            discountPercent,
            discountAmount: discountCash,
            actorUsername: authenticatedUser?.username || "nhanvien",
          });
        }
        completeOrderOffline(
          totalCart,
          discountCash,
          finalTotal,
          effectiveAmountGiven,
          changeAmount
        );
      } else {
        updateActiveTab({ backendOrderId: undefined, isSaved: false });
        showToast(
          err?.data?.message || "Thanh toán thất bại. Vui lòng thử lại!"
        );
      }
    } finally {
      setIsCompletingOrder(false);
      isCompletingOrderRef.current = false;
    }
  };

  // Close order success modal & reset tab
  const handleCloseSuccessModal = () => {
    const completedOrderId = completedOrderData?.tab?.backendOrderId;
    const completedOrderNumber = completedOrderData?.tab?.orderNumber;
    setCompletedOrderData(null);

    setTabs((prevTabs) => {
      const remainingTabs = prevTabs.filter(
        (t) =>
          t.id !== activeTabId &&
          t.status !== "COMPLETED" &&
          (!completedOrderId || t.backendOrderId !== completedOrderId) &&
          (!completedOrderNumber ||
            (t.orderNumber !== completedOrderNumber &&
              !t.orderNumber?.includes(completedOrderNumber)))
      );

      if (remainingTabs.length === 0) {
        const nextIndex = tabCounter + 1;
        const freshTab = createInitialTab(nextIndex);
        setActiveTabId(freshTab.id);
        setTabCounter(nextIndex);
        return [freshTab];
      }

      const nextActiveId = remainingTabs.some((t) => t.id === activeTabId)
        ? activeTabId
        : remainingTabs[remainingTabs.length - 1].id;
      setActiveTabId(nextActiveId);
      return remainingTabs;
    });
  };

  return (
    <div className="h-full w-full bg-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 bg-slate-900/90 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-auth-fade-in flex items-center justify-between gap-3 max-w-sm">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-emerald-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
            aria-label="Đóng thông báo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* POS Top Header Bar */}
      <PosHeader
        products={productsList}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onSelectProduct={handleSelectProduct}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onScanBarcode={handleBarcodeScanned}
        isOnline={isOnline}
        userName={authenticatedUser?.fullName || authenticatedUser?.username}
        branchName={activeShift?.pointOfSaleName || authenticatedUser?.pointOfSaleName}
        posId={activeShift?.pointOfSaleId || authenticatedUser?.pointOfSaleId}
        heldOrdersCount={heldOrdersCount}
        overdueHeldOrdersCount={overdueHeldOrdersCount}
        onOpenHeldOrders={() => setIsHeldOrdersDrawerOpen(true)}
        onOpenTableManagement={canManage ? () => setIsTableManagementModalOpen(true) : undefined}
        onOpenShiftHandover={() => setIsShiftHandoverModalOpen(true)}
        onOpenCashTransaction={() => setIsCashTransactionModalOpen(true)}
        pendingExpenseCount={pendingExpenseCount}
        onReorderTabs={handleReorderTabs}
      />

      {/* POS Main Workspace Body */}
      <div className="flex-1 min-h-0 flex gap-3 p-3 overflow-hidden">
        {/* Left Area: Cart Table */}
        <PosCartTable
          items={activeTab.items}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          canManage={canManage}
          onToggleBypass={handleToggleBypassPromotion}
          onChangeUnit={handleChangeUnit}
          onOpenWeightModal={handleOpenWeightModal}
        />

        {/* Right Area: Payment Sidebar */}
        <PosPaymentSidebar
          tab={activeTab}
          customers={customersList}
          onUpdateTab={updateActiveTab}
          onOpenAddCustomerModal={() => setIsAddCustomerModalOpen(true)}
          onSaveDraft={handleSaveDraft}
          onCompleteOrder={handleCompleteOrder}
          onCancelOrder={handleOpenCancelOrder}
          onOpenHoldOrderModal={handleOpenHoldOrderModal}
          onOpenCombinedPaymentModal={handleOpenCombinedPaymentModal}
          isSavingDraft={isSavingDraft}
          isCompletingOrder={isCompletingOrder}
        />
      </div>

      {/* Customer Form Modal */}
      {isAddCustomerModalOpen && (
        <CustomerFormModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          onSave={handleSaveCustomer}
          customer={null}
          existingCustomers={customersList}
        />
      )}

      {/* Payment Success Modal */}
      {completedOrderData && (
        <OrderSuccessModal
          isOpen={Boolean(completedOrderData)}
          onClose={handleCloseSuccessModal}
          completedOrder={completedOrderData}
        />
      )}

      {/* Combined Payment Modal (NCL-03-CN-011) */}
      {isCombinedPaymentModalOpen && (
        <CombinedPaymentModal
          isOpen={isCombinedPaymentModalOpen}
          onClose={() => setIsCombinedPaymentModalOpen(false)}
          finalTotal={calculatePosTotals(activeTab).finalTotal}
          orderNumber={activeTab.orderNumber}
          orderId={activeTab.backendOrderId}
          qrCodeUrl={activeTab.qrCodeUrl || null}
          customer={activeTab.customer || customersList.find((c) => c.id === activeTab.customerId) || null}
          initialPayments={activeTab.combinedPayments}
          initialDueDate={activeTab.dueDate}
          onConfirmAndComplete={handleConfirmCombinedPayment}
          isCompleting={isCompletingOrder}
        />
      )}

      {/* Bank Transfer Confirmation Modal (NCL-03-CN-012) */}
      {isBankTransferModalOpen && (
        <BankTransferModal
          isOpen={isBankTransferModalOpen}
          onClose={() => setIsBankTransferModalOpen(false)}
          orderId={bankTransferOrderId}
          orderNumber={activeTab.orderNumber}
          amount={bankTransferAmount}
          qrCodeUrl={bankTransferQrUrl}
          onConfirmSuccess={handleBankTransferConfirmSuccess}
          onSwitchToCashSuccess={handleBankTransferSwitchToCash}
          isCompletingOrder={isCompletingOrder}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      {isScannerModalOpen && (
        <BarcodeScannerModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          onScan={handleBarcodeScanned}
        />
      )}

      {/* Voice Search Modal (NCL-16-CN-003) */}
      {isVoiceModalOpen && (
        <VoiceSearchModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSelectProduct={async (selectedProduct) => {
            await handleSelectProduct(selectedProduct);
            showToast(`Đã thêm "${selectedProduct.name}" vào đơn hàng!`);
          }}
        />
      )}

      {/* Unrecognized Barcode Modal (TC-02) */}
      {unrecognizedBarcode && (
        <UnrecognizedBarcodeModal
          isOpen={Boolean(unrecognizedBarcode)}
          onClose={() => setUnrecognizedBarcode(null)}
          unrecognizedBarcode={unrecognizedBarcode}
          onAssignAndAddToCart={async (assignedProduct) => {
            await handleSelectProduct(assignedProduct);
            showToast(`Đã gán mã và thêm "${assignedProduct.name}" vào đơn!`);
          }}
          canManage={canManage}
        />
      )}

      {/* Weight Scale Modal (Bán hàng theo cân & Mua theo tiền) */}
      {weightModalProduct && (
        <WeightScaleModal
          isOpen={Boolean(weightModalProduct)}
          onClose={() => {
            setWeightModalProduct(null);
            setWeightModalItem(null);
          }}
          product={weightModalProduct}
          initialQuantity={weightModalItem ? weightModalItem.quantity : 1}
          initialBuyAmount={weightModalItem?.buyAmount}
          unitConversionId={weightModalItem?.unitConversionId}
          onConfirm={handleConfirmWeightModal}
        />
      )}

      {/* Cancel Order Modal (NCL-03-CN-009) */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setOrderToCancel(null);
        }}
        order={orderToCancel}
        onSuccess={handleCancelOrderSuccess}
      />

      {/* Hold Order / Assign Table Modal (NCL-03-CN-010) */}
      {isHoldModalOpen && holdModalOrderId && (
        <HoldOrderModal
          isOpen={isHoldModalOpen}
          onClose={() => {
            setIsHoldModalOpen(false);
            setHoldModalOrderId(null);
          }}
          orderId={holdModalOrderId}
          orderNumber={holdModalOrderNumber || activeTab.orderNumber}
          currentOrderLabel={holdModalCurrentLabel}
          currentDiningTableId={holdModalCurrentTableId}
          currentDiningTableName={holdModalCurrentTableName}
          onSuccess={handleHoldOrderSuccess}
        />
      )}

      {/* Held Orders Drawer (NCL-03-CN-010) */}
      <HeldOrdersDrawer
        isOpen={isHeldOrdersDrawerOpen}
        onClose={() => setIsHeldOrdersDrawerOpen(false)}
        onSelectOrder={handleSelectHeldOrder}
        onEditOrder={handleEditHeldOrder}
        onCancelOrder={handleCancelHeldOrderFromDrawer}
      />

      {/* Dining Table Management Modal (NCL-03-CN-010 - VT-01 Owner) */}
      {isTableManagementModalOpen && (
        <DiningTableManagementModal
          isOpen={isTableManagementModalOpen}
          onClose={() => setIsTableManagementModalOpen(false)}
        />
      )}

      {/* Shift Handover Modal (NCL-03-CN-013) */}
      {isShiftHandoverModalOpen && (
        <ShiftHandoverModal
          isOpen={isShiftHandoverModalOpen}
          onClose={() => setIsShiftHandoverModalOpen(false)}
          onHandoverSuccess={() => {
            setIsShiftHandoverModalOpen(false);
            showToast("Bàn giao ca thành công! Ca làm việc đã được chuyển giao cho nhân viên tiếp nhận.");
            navigate(APP_ROUTES.SHIFTS);
          }}
        />
      )}

      {/* Cash Transaction Modal (NCL-03-CN-014: Ghi thu chi tiền mặt ngoài bán hàng) */}
      {isCashTransactionModalOpen && (
        <CreateCashTransactionModal
          isOpen={isCashTransactionModalOpen}
          onClose={() => setIsCashTransactionModalOpen(false)}
          shiftId={activeShift?.id}
          isOwner={canManage}
        />
      )}

      {/* Warning Overlay: No Active Sales Shift */}
      {!isShiftLoading && !isShiftOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center border border-slate-100 animate-modal-bounce-in relative overflow-hidden">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-lg shadow-amber-100">
              <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
            </div>

            <h2 className="font-black text-xl text-slate-800 mb-2 tracking-tight">
              Chưa mở ca bán hàng!
            </h2>
            <p className="text-xs text-slate-600 font-semibold mb-6 leading-relaxed">
              Bạn chưa mở ca bán hàng hoạt động. Vui lòng mở ca bán hàng trước khi thực hiện bán hàng và thanh toán tại quầy POS.
            </p>

            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.SHIFTS)}
              className="w-full py-3 rounded-2xl bg-[#0070f4] hover:bg-blue-600 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mở ca bán hàng ngay</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosPage;
