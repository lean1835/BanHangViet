import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { InvoiceRangeSection } from "@/modules/settings/components/InvoiceRangeSection";
import * as invoiceRangeApiModule from "@/modules/settings/services/invoiceRangeApi";

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderComponent = () => {
  const store = configureStore({
    reducer: {
      auth: (state = {
        user: { id: "u1", username: "owner", roleId: "VT-01" },
        token: "fake-token",
        isAuthenticated: true,
      }) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <InvoiceRangeSection currentPattern="1" currentSymbol="1C26TAA" />
    </Provider>
  );
};

describe("NCL-04-CN-009: Quản lý & Khai báo dải số hóa đơn điện tử", () => {
  it("Hiển thị thông tin dải số đang hoạt động và số lượng còn lại", () => {
    vi.spyOn(invoiceRangeApiModule, "useGetActiveInvoiceRangeQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          id: "range-1",
          householdId: "h-1",
          invoicePattern: "1",
          invoiceSymbol: "1C26TAA",
          startNumber: 1,
          endNumber: 100000,
          currentNumber: 24,
          remainingCount: 99976,
          warningThreshold: 50,
          dailyConsumptionRate: 5.2,
          status: "ACTIVE",
          warningMessage: null,
          createdAt: "2026-09-01T00:00:00",
          updatedAt: "2026-09-09T00:00:00",
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(invoiceRangeApiModule, "useGetAllInvoiceRangesQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          content: [
            {
              id: "range-1",
              householdId: "h-1",
              invoicePattern: "1",
              invoiceSymbol: "1C26TAA",
              startNumber: 1,
              endNumber: 100000,
              currentNumber: 24,
              remainingCount: 99976,
              warningThreshold: 50,
              status: "ACTIVE",
              createdAt: "2026-09-01T00:00:00",
              updatedAt: "2026-09-09T00:00:00",
            },
          ],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getByText("Quản lý dải số hóa đơn điện tử")).toBeInTheDocument();
    expect(screen.getByText("Mẫu: 1 | Ký hiệu: 1C26TAA")).toBeInTheDocument();
    expect(screen.getAllByText("00000024").length).toBeGreaterThan(0);
    expect(screen.getByText("99.976 số")).toBeInTheDocument();
    expect(screen.getAllByText("Đang sử dụng").length).toBeGreaterThan(0);
  });

  it("Hiển thị cảnh báo khi dải số rơi vào trạng thái WARNING_LOW hoặc EXHAUSTED", () => {
    vi.spyOn(invoiceRangeApiModule, "useGetActiveInvoiceRangeQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          id: "range-2",
          householdId: "h-1",
          invoicePattern: "1",
          invoiceSymbol: "1C26TAA",
          startNumber: 1,
          endNumber: 100,
          currentNumber: 100,
          remainingCount: 0,
          warningThreshold: 50,
          status: "EXHAUSTED",
          warningMessage: "Dải số hóa đơn đã dùng hết! Vui lòng khai báo dải số mới.",
          createdAt: "2026-09-01T00:00:00",
          updatedAt: "2026-09-09T00:00:00",
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(invoiceRangeApiModule, "useGetAllInvoiceRangesQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    expect(screen.getAllByText("Đã hết số").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Dải số hóa đơn đã dùng hết! Vui lòng khai báo dải số mới.")
    ).toBeInTheDocument();
  });

  it("Mở modal khai báo dải số mới và hiển thị đầy đủ các trường nhập liệu", async () => {
    vi.spyOn(invoiceRangeApiModule, "useGetActiveInvoiceRangeQuery").mockReturnValue({
      data: { code: 1000, result: null },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(invoiceRangeApiModule, "useGetAllInvoiceRangesQuery").mockReturnValue({
      data: { code: 1000, result: { content: [] } },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    renderComponent();

    const openBtn = screen.getByRole("button", { name: /Khai báo dải số mới/i });
    fireEvent.click(openBtn);

    expect(screen.getByText("Khai báo dải số hóa đơn mới")).toBeInTheDocument();
    expect(screen.getByText(/Từ số/i)).toBeInTheDocument();
    expect(screen.getByText(/Đến số/i)).toBeInTheDocument();
    expect(screen.getByText(/Ngưỡng cảnh báo/i)).toBeInTheDocument();
  });
});
