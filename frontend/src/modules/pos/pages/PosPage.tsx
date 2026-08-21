import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CalendarCheck } from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
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
} from "@/modules/order/services/orderApi";
import { useGetActiveShiftQuery } from "@/modules/shift/services/shiftApi";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";

import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { saveOfflineOrder, checkOfflineLimitStatus, saveOfflineConfig } from "@/modules/sync/utils/offlineSyncStorage";
import type { IOfflineOrderRequest } from "@/modules/sync/types/ISync";
import type { IOrderResponse } from "@/modules/order/types/IOrder";
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
import { CustomerFormModal } from "@/modules/customer/components/CustomerFormModal";
import { OrderSuccessModal } from "../components/OrderSuccessModal";

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
  const { isOnline, setOrders, addLogEntry, setCustomers } = useDashboardDemo();

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

  const productsList: IProduct[] = productsData?.content || [];
  const customersList: ICustomer[] = Array.isArray(customersData)
    ? customersData
    : (customersData as any)?.result || [];

  // 2. RTK Query Mutations
  const [createOrder] = useCreateOrderMutation();
  const [addOrderItem] = useAddOrderItemMutation();
  const [applyDiscount] = useApplyDiscountMutation();
  const [setPaymentMethod] = useSetPaymentMethodMutation();
  const [completeOrder] = useCompleteOrderMutation();
  const [createCustomer] = useCreateCustomerMutation();

  // 3. Multi-order Tabs State with localStorage persistence
  const [tabs, setTabs] = useState<IPosTab[]>(() => {
    try {
      const saved = localStorage.getItem(POS_TABS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.tabs) && parsed.tabs.length > 0) {
          const activeTabs = parsed.tabs.filter((t: IPosTab) => t.status !== "COMPLETED");
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
  const [completedOrderData, setCompletedOrderData] = useState<{
    tab: IPosTab;
    changeAmount: number;
    finalTotal: number;
  } | null>(null);

  // Loading states
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState<boolean>(false);
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

  // Product selection & cart manipulation
  const handleSelectProduct = (product: IProduct) => {
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
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id !== activeTabId) return t;

        const existingItemIndex = t.items.findIndex(
          (item) => item.product.id === product.id
        );

        let newItems: IPosCartItem[];

        if (existingItemIndex > -1) {
          newItems = [...t.items];
          const existingItem = newItems[existingItemIndex];
          const updatedQty = existingItem.quantity + 1;
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: updatedQty,
            lineTotal:
              updatedQty * existingItem.price - existingItem.lineDiscount,
          };
        } else {
          newItems = [
            ...t.items,
            {
              id: product.id,
              product,
              quantity: 1,
              price: product.price,
              lineDiscount: 0,
              lineTotal: product.price,
            },
          ];
        }

        return { ...t, items: newItems, isSaved: false };
      })
    );
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id !== activeTabId) return t;
        const newItems = t.items.map((item) => {
          if (item.id !== itemId && item.product.id !== itemId) return item;
          return {
            ...item,
            quantity: newQuantity,
            lineTotal: newQuantity * item.price - item.lineDiscount,
          };
        });
        return { ...t, items: newItems, isSaved: false };
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id !== activeTabId) return t;
        return {
          ...t,
          items: t.items.filter(
            (item) => item.id !== itemId && item.product.id !== itemId
          ),
          isSaved: false,
        };
      })
    );
  };

  const handleClearCart = () => {
    updateActiveTab({ items: [], isSaved: false });
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
    if (activeTab.items.length === 0) return;
    setIsSavingDraft(true);

    try {
      let orderId = activeTab.backendOrderId;

      // 1. Create Order Draft, add items & apply discount if not existing on server
      if (!orderId) {
        const createRes = await createOrder({
          customerId: activeTab.customerId,
        }).unwrap();
        orderId = createRes.result.id;

        // 2. Add Items
        for (const item of activeTab.items) {
          await addOrderItem({
            orderId,
            productId: item.product.id,
            quantity: item.quantity,
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
      showToast(
        err?.data?.message || "Lưu đơn nháp thất bại. Vui lòng thử lại!"
      );
    } finally {
      setIsSavingDraft(false);
    }
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
    const limitStatus = checkOfflineLimitStatus();
    showToast(
      `Đã lưu đơn hàng ở chế độ Ngoại tuyến (Đã lưu ${limitStatus.currentOrdersCount}/${limitStatus.maxOrders} đơn). Đơn hàng sẽ tự động đồng bộ khi có kết nối mạng.`
    );
  };

  // Complete Order (Thanh toán hoàn tất)
  const handleCompleteOrder = async () => {
    if (activeTab.items.length === 0) return;
    setIsCompletingOrder(true);

    // Calculate totals first
    const totalCart = activeTab.items.reduce(
      (sum, i) => sum + i.lineTotal,
      0
    );
    const discountCash =
      activeTab.discountType === "PERCENTAGE"
        ? (totalCart * (activeTab.discountValue || 0)) / 100
        : activeTab.discountValue || 0;
    const afterDiscount = Math.max(0, totalCart - discountCash);

    const itemTaxTotal = activeTab.items.reduce((sum, item) => {
      const itemTax = (item.product.taxRatePercentage || 0) / 100;
      return sum + item.lineTotal * itemTax;
    }, 0);

    const totalTaxAmount =
      activeTab.vatRate !== undefined
        ? afterDiscount * (activeTab.vatRate / 100)
        : itemTaxTotal;
    const finalTotal = Math.max(0, afterDiscount + totalTaxAmount);

    const effectiveAmountGiven =
      activeTab.saleMode === "FAST"
        ? finalTotal
        : typeof activeTab.amountGiven === "number"
        ? activeTab.amountGiven
        : activeTab.paymentMethod === "DEBT"
        ? 0
        : finalTotal;

    const changeAmount = effectiveAmountGiven - finalTotal;

    // Check if system is offline
    if (isOnline === false) {
      const limitStatus = checkOfflineLimitStatus();
      if (limitStatus.isExceeded) {
        showToast(
          limitStatus.errorMessage ||
            `Không thể chốt đơn! Đã vượt quá giới hạn bán khi mất mạng (${limitStatus.maxOrders} đơn / ${limitStatus.maxHours}h). Vui lòng kết nối mạng để đồng bộ!`
        );
        setIsCompletingOrder(false);
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
      return;
    }

    try {
      let orderId = activeTab.backendOrderId;

      // 1. Create order, add items & apply discount if not created yet on server
      if (!orderId) {
        const createRes = await createOrder({
          customerId: activeTab.customerId,
        }).unwrap();
        orderId = createRes.result.id;

        // 2. Add Items
        for (const item of activeTab.items) {
          await addOrderItem({
            orderId: orderId!,
            productId: item.product.id,
            quantity: item.quantity,
          }).unwrap();
        }

        // 3. Apply Discount
        if (activeTab.discountValue > 0) {
          await applyDiscount({
            orderId: orderId!,
            discountType: activeTab.discountType,
            discountValue: activeTab.discountValue,
          }).unwrap();
        }
      }

      // 4. Set Payment Method
      await setPaymentMethod({
        orderId: orderId!,
        paymentMethod: activeTab.paymentMethod,
        amountGiven: effectiveAmountGiven,
      }).unwrap();

      // 5. Complete Order
      await completeOrder({
        orderId: orderId!,
        amountGiven: effectiveAmountGiven,
      }).unwrap();

      setCompletedOrderData({
        tab: { ...activeTab, backendOrderId: orderId!, amountGiven: effectiveAmountGiven },
        changeAmount,
        finalTotal,
      });

      updateActiveTab({ backendOrderId: orderId!, status: "COMPLETED", isSaved: true });
    } catch (err: any) {
      if (!window.navigator.onLine || err?.status === "FETCH_ERROR" || err?.status === 0) {
        completeOrderOffline(
          totalCart,
          discountCash,
          finalTotal,
          effectiveAmountGiven,
          changeAmount
        );
      } else {
        showToast(
          err?.data?.message || "Thanh toán thất bại. Vui lòng thử lại!"
        );
      }
    } finally {
      setIsCompletingOrder(false);
    }
  };

  // Close order success modal & reset tab
  const handleCloseSuccessModal = () => {
    setCompletedOrderData(null);
    if (tabs.length > 1) {
      handleCloseTab(activeTabId);
    } else {
      const nextIndex = tabCounter + 1;
      const freshTab = createInitialTab(nextIndex);
      setTabs([freshTab]);
      setActiveTabId(freshTab.id);
      setTabCounter(nextIndex);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none overflow-hidden">
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
        isOnline={isOnline}
        userName={authenticatedUser?.fullName || authenticatedUser?.username}
      />

      {/* POS Main Workspace Body */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* Left Area: Cart Table */}
        <PosCartTable
          items={activeTab.items}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
        />

        {/* Right Area: Payment Sidebar */}
        <PosPaymentSidebar
          tab={activeTab}
          customers={customersList}
          onUpdateTab={updateActiveTab}
          onOpenAddCustomerModal={() => setIsAddCustomerModalOpen(true)}
          onSaveDraft={handleSaveDraft}
          onCompleteOrder={handleCompleteOrder}
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
