import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { USER_ROLES } from "@/constants/roles";
import type { IOrderResponse } from "@/modules/order/types/IOrder";
import { OrderHistoryTable } from "./OrderHistoryTable";

const mocks = vi.hoisted(() => ({
  useDashboardDemo: vi.fn(),
  useGetProductsQuery: vi.fn(),
  useGetActiveShiftQuery: vi.fn(),
  useNotification: vi.fn(),
  useAppSelector: vi.fn(),
  createOrder: vi.fn(),
  addOrderItem: vi.fn(),
  updateOrderItem: vi.fn(),
  deleteOrderItem: vi.fn(),
  applyDiscount: vi.fn(),
  setPaymentMethod: vi.fn(),
  completeOrder: vi.fn(),
  getOrder: vi.fn(),
  getOrdersHistory: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
  navigate: vi.fn(),
  createInvoiceDraft: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("@/modules/e_invoice/services/eInvoiceApi", () => ({
  useCreateInvoiceDraftMutation: () => [mocks.createInvoiceDraft, { isLoading: false }],
  useGetInvoicesQuery: () => ({ data: undefined }),
}));

vi.mock("@/providers/DashboardDemoProvider", () => ({
  useDashboardDemo: mocks.useDashboardDemo,
}));

vi.mock("@/modules/product/services/productApi", () => ({
  useGetProductsQuery: mocks.useGetProductsQuery,
}));

vi.mock("@/modules/shift/services/shiftApi", () => ({
  useGetActiveShiftQuery: mocks.useGetActiveShiftQuery,
}));

vi.mock("@/modules/order/services/orderApi", () => ({
  useCreateOrderMutation: () => [mocks.createOrder],
  useAddOrderItemMutation: () => [mocks.addOrderItem],
  useUpdateOrderItemMutation: () => [mocks.updateOrderItem],
  useDeleteOrderItemMutation: () => [mocks.deleteOrderItem],
  useApplyDiscountMutation: () => [mocks.applyDiscount],
  useSetPaymentMethodMutation: () => [mocks.setPaymentMethod],
  useCompleteOrderMutation: () => [mocks.completeOrder],
  useLazyGetOrderQuery: () => [mocks.getOrder],
  useLazyGetOrdersHistoryQuery: () => [mocks.getOrdersHistory],
}));

vi.mock("@/hooks/useNotification", () => ({
  useNotification: mocks.useNotification,
}));

vi.mock("@/hooks/useRedux", () => ({
  useAppSelector: mocks.useAppSelector,
}));

vi.mock("@/hooks/useAccessibleDialog", () => ({
  useAccessibleDialog: () => ({ current: null }),
}));

const creatingOrder: IOrderResponse = {
  id: "order-draft-1",
  orderNumber: "OD-001",
  householdId: "household-1",
  shiftId: "shift-1",
  createdByUserId: "owner-1",
  createdByUsername: "chuho",
  customerId: null,
  customerName: null,
  totalAmount: 11_000,
  discountAmount: 0,
  finalAmount: 11_000,
  paymentMethod: "CASH",
  paymentStatus: "PENDING",
  status: "CREATING",
  syncStatus: "SYNCED",
  isOffline: false,
  syncedAt: null,
  createdAt: "2026-07-20T08:00:00",
  updatedAt: "2026-07-20T08:00:00",
  items: [
    {
      id: "item-1",
      productId: "product-1",
      productName: "Sản phẩm thử nghiệm",
      quantity: 1,
      unitPrice: 10_000,
      discountAmount: 0,
      taxRatePercentage: 10,
      taxAmount: 1_000,
      subtotal: 11_000,
    },
  ],
  warningMessages: [],
  qrCodeUrl: null,
  changeAmount: null,
};

const openCreateModalAndAddProduct = () => {
  fireEvent.click(screen.getByRole("button", { name: "+ Tạo đơn hàng" }));
  const productOption = screen.getByRole("option", {
    name: /Sản phẩm thử nghiệm - Giá:/,
  });
  fireEvent.change(productOption.parentElement as HTMLSelectElement, {
    target: { value: "product-1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Thêm sản phẩm" }));
};

const getStoredPendingDraft = () => {
  const storageKey = Array.from(
    { length: localStorage.length },
    (_, index) => localStorage.key(index),
  ).find(
    (key) =>
      key?.startsWith("sales.pending-order-draft.v2:") &&
      !key.endsWith(":form"),
  );
  if (!storageKey) throw new Error("Không tìm thấy pending order draft");
  return JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<
    string,
    unknown
  >;
};

const hasStoredPendingDraft = () =>
  Array.from(
    { length: localStorage.length },
    (_, index) => localStorage.key(index),
  ).some(
    (key) =>
      key?.startsWith("sales.pending-order-draft.v2:") &&
      !key.endsWith(":form"),
  );

const mockWebLockAvailability = (isAvailable: boolean) => {
  const request = vi.fn(
    async (
      name: string,
      _options: LockOptions,
      callback: (lock: Lock | null) => Promise<boolean>,
    ) =>
      callback(
        isAvailable ? ({ name, mode: "exclusive" } as Lock) : null,
      ),
  );
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request },
  });
  return request;
};

describe("OrderHistoryTable draft recovery", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    mockWebLockAvailability(true);
    vi.clearAllMocks();
    mocks.useAppSelector.mockReturnValue({
      id: "owner-1",
      username: "chuho",
      fullName: "Chủ hộ",
      roleId: USER_ROLES.OWNER,
      household: { id: "household-1", name: "Hộ kinh doanh" },
    });
    mocks.useNotification.mockReturnValue({
      showSuccess: mocks.showSuccess,
      showError: mocks.showError,
      showInfo: mocks.showInfo,
      showWarning: mocks.showWarning,
    });
    mocks.useDashboardDemo.mockReturnValue({
      orders: [creatingOrder],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    mocks.useGetProductsQuery.mockReturnValue({
      data: {
        content: [
          {
            id: "product-1",
            name: "Sản phẩm thử nghiệm",
            sku: "SKU-001",
            price: 10_000,
            stockQuantity: 10,
            taxRatePercentage: 10,
          },
        ],
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    mocks.useGetActiveShiftQuery.mockReturnValue({
      data: { result: { id: "shift-1" } },
      error: null,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("khôi phục đơn CREATING của ca hiện tại từ lịch sử máy chủ", () => {
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục đơn hàng OD-001" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Tạo đơn hàng bán lẻ mới" }),
    ).toBeInTheDocument();
    expect(screen.getByText("SKU-001")).toBeInTheDocument();
    const storedDraft = getStoredPendingDraft();
    expect(storedDraft).toMatchObject({
      orderId: creatingOrder.id,
      userId: "owner-1",
      shiftId: "shift-1",
    });
  });

  it("chặn tạo đơn mới khi ca hiện tại còn đơn nháp trên máy chủ", () => {
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Tạo đơn hàng" }));

    expect(mocks.showWarning).toHaveBeenCalledWith(
      expect.stringContaining("đang có đơn nháp"),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("đối soát lịch sử và nhận lại orderId khi phản hồi POST tạo đơn bị mất", async () => {
    const recoveredOrder: IOrderResponse = {
      ...creatingOrder,
      id: "order-recovered-1",
      orderNumber: "OD-RECOVERED",
      totalAmount: 0,
      finalAmount: 0,
      items: [],
    };
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    mocks.getOrdersHistory
      .mockReturnValueOnce({
        unwrap: () => Promise.resolve({ result: [] }),
      })
      .mockReturnValueOnce({
        unwrap: () => Promise.resolve({ result: [recoveredOrder] }),
      });
    mocks.createOrder.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: "FETCH_ERROR", error: "Mất kết nối" }),
    });
    mocks.getOrder.mockReturnValue({
      unwrap: () => Promise.reject({ status: 500, data: { message: "Tạm lỗi" } }),
    });
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    openCreateModalAndAddProduct();
    fireEvent.click(
      screen.getByRole("button", { name: "XÁC NHẬN TẠO ĐƠN" }),
    );

    await waitFor(() => {
      expect(mocks.getOrder).toHaveBeenCalledWith(recoveredOrder.id);
    });
    expect(mocks.createOrder).toHaveBeenCalledTimes(1);
    expect(mocks.showInfo).toHaveBeenCalledWith(
      expect.stringContaining("dữ liệu đã có trên máy chủ"),
    );
    const storedDraft = getStoredPendingDraft();
    expect(storedDraft.orderId).toBe(recoveredOrder.id);
  });

  it("dùng fresh history để chặn POST khi cache chưa có đơn nháp", async () => {
    const setOrders = vi.fn();
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders,
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    mocks.getOrdersHistory.mockReturnValue({
      unwrap: () => Promise.resolve({ result: [creatingOrder] }),
    });
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    openCreateModalAndAddProduct();
    fireEvent.click(
      screen.getByRole("button", { name: "XÁC NHẬN TẠO ĐƠN" }),
    );

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.stringContaining("đã có đơn nháp trên máy chủ"),
      );
    });
    expect(setOrders).toHaveBeenCalledWith([creatingOrder]);
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("dừng trước POST khi trình duyệt không thể lưu pending draft", async () => {
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    mocks.getOrdersHistory.mockReturnValue({
      unwrap: () => Promise.resolve({ result: [] }),
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Hết dung lượng", "QuotaExceededError");
    });
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    openCreateModalAndAddProduct();
    fireEvent.click(
      screen.getByRole("button", { name: "XÁC NHẬN TẠO ĐƠN" }),
    );

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.stringContaining("Không thể lưu tiến trình đơn hàng"),
      );
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("giữ phase SENT và không POST lần hai khi kết quả mạng chưa xác định", async () => {
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    mocks.getOrdersHistory.mockReturnValue({
      unwrap: () => Promise.resolve({ result: [] }),
    });
    mocks.createOrder.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: "FETCH_ERROR", error: "Mất kết nối" }),
    });
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    openCreateModalAndAddProduct();
    fireEvent.click(
      screen.getByRole("button", { name: "XÁC NHẬN TẠO ĐƠN" }),
    );

    await waitFor(
      () => {
        expect(mocks.showError).toHaveBeenCalledWith(
          expect.stringContaining("thời gian đối soát an toàn"),
        );
      },
      { timeout: 3_000 },
    );
    const storedDraft = getStoredPendingDraft();
    expect(storedDraft).toMatchObject({ orderId: null, createPhase: "SENT" });

    fireEvent.click(
      screen.getByRole("button", { name: "ĐỐI SOÁT LẠI TRẠNG THÁI ĐƠN" }),
    );
    await waitFor(() => expect(mocks.showError).toHaveBeenCalledTimes(2));
    expect(mocks.createOrder).toHaveBeenCalledTimes(1);
  });

  it("xóa draft ngay khi POST tạo đơn bị từ chối dứt khoát bằng 4xx", async () => {
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    mocks.getOrdersHistory.mockReturnValue({
      unwrap: () => Promise.resolve({ result: [] }),
    });
    mocks.createOrder.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: 403, data: { message: "Không có quyền" } }),
    });
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    openCreateModalAndAddProduct();
    fireEvent.click(
      screen.getByRole("button", { name: "XÁC NHẬN TẠO ĐƠN" }),
    );

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith("Không có quyền");
    });
    expect(mocks.getOrdersHistory).toHaveBeenCalledTimes(1);
    expect(mocks.createOrder).toHaveBeenCalledTimes(1);
    expect(hasStoredPendingDraft()).toBe(false);
  });

  it("không tự POST lại SENT và chỉ cho bỏ thủ công sau lần đối soát mới", async () => {
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    mocks.getOrdersHistory.mockReturnValue({
      unwrap: () => Promise.resolve({ result: [] }),
    });
    localStorage.setItem(
      "sales.pending-order-draft.v2:household-1:owner-1",
      JSON.stringify({
        orderId: null,
        createPhase: "SENT",
        createAttemptedAt: Date.now() - 61_000,
        userId: "owner-1",
        householdId: "household-1",
        shiftId: "shift-1",
        baselineOrderIds: [],
        customerId: "",
        selectedItems: [
          {
            productId: "product-1",
            productName: "Sản phẩm thử nghiệm",
            productSku: "SKU-001",
            quantity: 1,
            unitPrice: 10_000,
            taxRatePercentage: 10,
          },
        ],
        discountType: "VALUE",
        discountValueInput: 0,
        paidAmountInput: 11_000,
        paymentMethod: "CASH",
      }),
    );
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "ĐỐI SOÁT LẠI TRẠNG THÁI ĐƠN",
      }),
    );

    await waitFor(() => {
      expect(mocks.showWarning).toHaveBeenCalledWith(
        expect.stringContaining("FE sẽ không tự gửi lại"),
      );
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "BỎ TIẾN TRÌNH" }));
    expect(
      screen.getByRole("alertdialog", { name: "Xác nhận bỏ tiến trình" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /Tôi đã kiểm tra lịch sử nghiệp vụ/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "XÁC NHẬN BỎ" }));

    await waitFor(() => expect(hasStoredPendingDraft()).toBe(false));
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("đồng bộ draft được tab khác tạo sau khi màn hình đã mở và không POST trùng", async () => {
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);
    openCreateModalAndAddProduct();
    localStorage.setItem(
      "sales.pending-order-draft.v2:household-1:owner-1",
      JSON.stringify({
        orderId: null,
        createPhase: "SENT",
        createAttemptedAt: Date.now(),
        userId: "owner-1",
        householdId: "household-1",
        shiftId: "shift-1",
        baselineOrderIds: [],
        customerId: "",
        selectedItems: [
          {
            productId: "product-1",
            productName: "Sản phẩm thử nghiệm",
            productSku: "SKU-001",
            quantity: 1,
            unitPrice: 10_000,
            taxRatePercentage: 10,
          },
        ],
        discountType: "VALUE",
        discountValueInput: 0,
        paidAmountInput: 11_000,
        paymentMethod: "CASH",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "XÁC NHẬN TẠO ĐƠN" }),
    );

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.stringContaining("cửa sổ khác"),
      );
    });
    expect(mocks.getOrdersHistory).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("autosave form ở tab cũ không ghi đè metadata SENT mới của tab khác", async () => {
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    const storageKey =
      "sales.pending-order-draft.v2:household-1:owner-1";
    const preparedDraft = {
      orderId: null,
      createPhase: "PREPARED",
      createAttemptedAt: null,
      userId: "owner-1",
      householdId: "household-1",
      shiftId: "shift-1",
      baselineOrderIds: [],
      customerId: "",
      selectedItems: [
        {
          productId: "product-1",
          productName: "Sản phẩm thử nghiệm",
          productSku: "SKU-001",
          quantity: 1,
          unitPrice: 10_000,
          taxRatePercentage: 10,
        },
      ],
      discountType: "VALUE",
      discountValueInput: 0,
      paidAmountInput: 11_000,
      paymentMethod: "CASH",
    };
    localStorage.setItem(storageKey, JSON.stringify(preparedDraft));
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);
    await screen.findByRole("dialog", { name: "Tạo đơn hàng bán lẻ mới" });

    const sentAt = Date.now();
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...preparedDraft,
        createPhase: "SENT",
        createAttemptedAt: sentAt,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      const storedForm = JSON.parse(
        localStorage.getItem(`${storageKey}:form`) ?? "{}",
      ) as { selectedItems?: unknown[] };
      expect(storedForm.selectedItems).toHaveLength(0);
    });
    expect(getStoredPendingDraft()).toMatchObject({
      orderId: null,
      createPhase: "SENT",
      createAttemptedAt: sentAt,
    });
  });

  it("không xử lý song song khi Web Locks báo tab khác đang giữ khóa", async () => {
    mocks.useDashboardDemo.mockReturnValue({
      orders: [],
      setOrders: vi.fn(),
      customers: [],
      addLogEntry: vi.fn(),
      isOrdersLoading: false,
      isOrdersError: false,
      ordersError: null,
      refetchOrders: vi.fn(),
    });
    mockWebLockAvailability(false);
    render(<OrderHistoryTable currentRole={USER_ROLES.OWNER} />);

    openCreateModalAndAddProduct();
    fireEvent.click(
      screen.getByRole("button", { name: "XÁC NHẬN TẠO ĐƠN" }),
    );

    await waitFor(() => {
      expect(mocks.showError).toHaveBeenCalledWith(
        expect.stringContaining("Một cửa sổ khác đang xử lý đơn hàng"),
      );
    });
    expect(mocks.getOrdersHistory).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });
});
