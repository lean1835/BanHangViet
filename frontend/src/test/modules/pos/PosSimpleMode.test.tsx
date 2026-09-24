import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import authReducer from "@/stores/authSlice";
import displaySettingsReducer, {
  type IDisplaySettingsState,
} from "@/stores/displaySettingsSlice";
import { PosHeader } from "@/modules/pos/components/PosHeader";
import { PosPaymentSidebar } from "@/modules/pos/components/PosPaymentSidebar";
import * as displaySettingApiModule from "@/modules/settings/services/displaySettingApi";
import * as loyaltyApiModule from "@/modules/customer/services/loyaltyApi";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

describe("NCL-19-CN-001: Tích hợp Chế độ đơn giản & Chữ lớn trên màn hình POS", () => {
  const mockToggleSimpleMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(
      displaySettingApiModule,
      "useToggleSimpleModeMutation"
    ).mockReturnValue([
      mockToggleSimpleMode,
      { isLoading: false } as any,
    ]);

    vi.spyOn(
      loyaltyApiModule,
      "useGetCustomerLoyaltySummaryQuery"
    ).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    vi.spyOn(loyaltyApiModule, "useGetLoyaltyConfigQuery").mockReturnValue({
      data: null,
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createTestStore = (simpleModeEnabled = false) => {
    const displaySettingsState: IDisplaySettingsState = {
      simpleModeEnabled,
      fontSizeLevel: simpleModeEnabled ? "LARGE" : "STANDARD",
      fontSizeLevelName: simpleModeEnabled ? "Lớn" : "Tiêu chuẩn",
      fontScalePercentage: simpleModeEnabled ? 125 : 100,
      buttonSizeLevel: simpleModeEnabled ? "LARGE" : "STANDARD",
      buttonSizeLevelName: simpleModeEnabled ? "Lớn" : "Tiêu chuẩn",
      buttonScalePercentage: simpleModeEnabled ? 125 : 100,
      minTouchHeight: simpleModeEnabled ? "52px" : "40px",
      showTextLabels: true,
      requireConfirmationDialog: true,
      highContrastEnabled: false,
      simplifiedPosLayout: true,
      isLoaded: true,
    };

    return configureStore({
      reducer: {
        auth: authReducer,
        displaySettings: displaySettingsReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      },
      preloadedState: {
        displaySettings: displaySettingsState,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(
          baseApi.middleware
        ),
    });
  };

  it("TC-01: PosHeader ẩn các nút thao tác phụ khi ở Chế độ đơn giản để giữ giao diện tối giản", () => {
    const store = createTestStore(true);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <PosHeader
            products={[]}
            tabs={[]}
            activeTabId=""
            onSelectTab={vi.fn()}
            onAddTab={vi.fn()}
            onCloseTab={vi.fn()}
            onSelectProduct={vi.fn()}
            onOpenHeldOrders={vi.fn()}
            onOpenTableManagement={vi.fn()}
            onOpenShiftHandover={vi.fn()}
            onOpenCashTransaction={vi.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    // Ở chế độ đơn giản, các nút phụ được ẩn khỏi Header để tập trung 4 thao tác chính
    expect(screen.queryByText("Đơn treo")).not.toBeInTheDocument();
    expect(screen.queryByText("Phòng/Bàn")).not.toBeInTheDocument();
    expect(screen.queryByText("Bàn giao ca")).not.toBeInTheDocument();
    expect(screen.queryByText("Thu/Chi")).not.toBeInTheDocument();
  });

  it("TC-01: PosHeader hiển thị đầy đủ các thao tác phụ khi ở Chế độ tiêu chuẩn", () => {
    const store = createTestStore(false);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <PosHeader
            products={[]}
            tabs={[]}
            activeTabId=""
            onSelectTab={vi.fn()}
            onAddTab={vi.fn()}
            onCloseTab={vi.fn()}
            onSelectProduct={vi.fn()}
            onOpenHeldOrders={vi.fn()}
            onOpenTableManagement={vi.fn()}
            onOpenShiftHandover={vi.fn()}
            onOpenCashTransaction={vi.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    // Ở chế độ tiêu chuẩn, các nút phụ được hiển thị bình thường trên Header
    expect(screen.getByText("Đơn treo")).toBeInTheDocument();
    expect(screen.getByText("Phòng/Bàn")).toBeInTheDocument();
    expect(screen.getByText("Bàn giao ca")).toBeInTheDocument();
    expect(screen.getByText("Thu/Chi")).toBeInTheDocument();
  });

  it("TC-01: PosPaymentSidebar áp dụng minTouchHeight và nhãn chữ rõ ràng khi ở chế độ đơn giản", () => {
    const store = createTestStore(true);

    const mockTab = {
      id: "tab-1",
      orderNumber: "Hóa đơn 1",
      status: "PENDING" as any,
      saleMode: "FAST" as any,
      items: [
        {
          id: "item-1",
          product: { id: "p1", name: "Sản phẩm A", code: "SP01", retailPrice: 50000 } as any,
          quantity: 2,
          price: 50000,
          lineTotal: 100000,
        },
      ],
      discountType: "PERCENTAGE" as any,
      discountValue: 0,
      paymentMethod: "CASH" as any,
      amountGiven: 100000,
      isSaved: false,
    };

    render(
      <Provider store={store}>
        <MemoryRouter>
          <PosPaymentSidebar
            tab={mockTab as any}
            customers={[]}
            onUpdateTab={vi.fn()}
            onOpenAddCustomerModal={vi.fn()}
            onSaveDraft={vi.fn()}
            onCompleteOrder={vi.fn()}
            onCancelOrder={vi.fn()}
            isSavingDraft={false}
            isCompletingOrder={false}
          />
        </MemoryRouter>
      </Provider>
    );

    const completeBtn = screen.getByRole("button", { name: /Thanh toán \(F9\)/i });
    expect(completeBtn).toBeInTheDocument();
    expect(completeBtn.style.minHeight).toBe("52px");

    const cancelBtn = screen.getByRole("button", { name: /Hủy đơn/i });
    expect(cancelBtn).toBeInTheDocument();
    expect(cancelBtn.style.minHeight).toBe("52px");
  });
});
