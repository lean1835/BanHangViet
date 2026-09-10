import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { TaxConnectionWidget } from "@/modules/e_invoice/components/TaxConnectionWidget";
import { TaxConnectionDrawer } from "@/modules/e_invoice/components/TaxConnectionDrawer";
import { AutoRetryQueuePanel } from "@/modules/e_invoice/components/AutoRetryQueuePanel";
import * as eInvoiceApiModule from "@/modules/e_invoice/services/eInvoiceApi";
import * as networkHookModule from "@/hooks/useNetworkStatus";

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

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: (
        state = {
          user: { id: "u1", username: "test_owner", roleId: "VT-01" },
          token: "fake-token",
          isAuthenticated: true,
        }
      ) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(baseApi.middleware),
  });

describe("NCL-04-CN-010: Theo dõi trạng thái kết nối cơ quan thuế mô phỏng", () => {
  it("NCL-04-CN-010-TC-01: Trạng thái ONLINE khi phản hồi bình thường", () => {
    vi.spyOn(eInvoiceApiModule, "useGetTaxConnectionStatusQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          status: "ONLINE",
          responseTimeMs: 85,
          lastSuccessfulResponseAt: "2026-09-09T12:00:00",
          pendingQueueCount: 0,
          checkedAt: "2026-09-09T12:05:00",
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <Provider store={createTestStore()}>
        <TaxConnectionWidget onOpenDetails={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText("CQT: Trực tuyến")).toBeInTheDocument();
    expect(screen.getByText("(85ms)")).toBeInTheDocument();
  });

  it("NCL-04-CN-010-TC-02: Trạng thái OFFLINE -> Mở Drawer hiển thị hướng dẫn an tâm cho chủ hộ", () => {
    vi.spyOn(eInvoiceApiModule, "useGetTaxConnectionStatusQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          status: "OFFLINE",
          responseTimeMs: 0,
          lastSuccessfulResponseAt: "2026-09-09T10:00:00",
          pendingQueueCount: 4,
          userGuideMessage:
            "Đường truyền đến CQT đang gián đoạn. Hóa đơn vẫn được lưu an toàn tại cửa hàng.",
          checkedAt: "2026-09-09T12:00:00",
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(eInvoiceApiModule, "useGetTaxConnectionHistoryQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          householdId: "h-1",
          totalLogs: 1,
          historyLogs: [],
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(
      <Provider store={createTestStore()}>
        <TaxConnectionDrawer isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText("Mất kết nối Cơ quan Thuế")).toBeInTheDocument();
    expect(
      screen.getByText(/Đường truyền đến CQT đang gián đoạn. Hóa đơn vẫn được lưu an toàn/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Dữ liệu hóa đơn không bị mất mát")).toBeInTheDocument();
  });

  it("NCL-04-CN-010-TC-03: Drawer hiển thị nhật ký lịch sử 7 ngày gần nhất", () => {
    vi.spyOn(eInvoiceApiModule, "useGetTaxConnectionStatusQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          status: "ONLINE",
          responseTimeMs: 90,
          lastSuccessfulResponseAt: "2026-09-09T12:00:00",
          pendingQueueCount: 0,
          checkedAt: "2026-09-09T12:00:00",
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(eInvoiceApiModule, "useGetTaxConnectionHistoryQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          householdId: "h-1",
          totalLogs: 2,
          historyLogs: [
            {
              id: "log-1",
              status: "ONLINE",
              responseTimeMs: 80,
              lastSuccessfulResponseAt: "2026-09-09T11:00:00",
              pendingQueueCount: 0,
              errorMessage: "",
              createdAt: "2026-09-09T11:00:00",
            },
            {
              id: "log-2",
              status: "OFFLINE",
              responseTimeMs: 0,
              lastSuccessfulResponseAt: "2026-09-09T09:00:00",
              pendingQueueCount: 2,
              errorMessage: "Cổng CQT bảo trì định kỳ",
              createdAt: "2026-09-09T09:30:00",
            },
          ],
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(
      <Provider store={createTestStore()}>
        <TaxConnectionDrawer isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText(/Lịch sử kết nối 7 ngày gần nhất \(2 bản ghi\)/i)).toBeInTheDocument();
    expect(screen.getByText("Cổng CQT bảo trì định kỳ")).toBeInTheDocument();
  });

  it("NCL-04-CN-010-TC-04: Khi thiết bị mất mạng (DevTools Offline) -> Widget tự động chuyển CQT: Mất kết nối", () => {
    vi.spyOn(networkHookModule, "useNetworkStatus").mockReturnValue({ isOnline: false, isSlow: false, liveLatencyMs: 0 });
    vi.spyOn(eInvoiceApiModule, "useGetTaxConnectionStatusQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          status: "ONLINE",
          responseTimeMs: 85,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(
      <Provider store={createTestStore()}>
        <TaxConnectionWidget onOpenDetails={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText("CQT: Mất kết nối")).toBeInTheDocument();
    expect(screen.getByText("(Ngoại tuyến)")).toBeInTheDocument();
  });
});


describe("NCL-04-CN-007: Tự động gửi lại hóa đơn chưa được cấp mã theo lịch & Xử lý thủ công", () => {
  it("NCL-04-CN-007-TC-01: Kích hoạt nút trigger gửi lại và hiển thị thẻ tóm tắt kết quả", async () => {
    const triggerMock = vi.fn().mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          code: 1000,
          message: "Success",
          result: {
            totalProcessed: 5,
            successCount: 4,
            failedCount: 1,
            movedToManualCount: 1,
            issuedInvoiceIds: ["inv-1", "inv-2", "inv-3", "inv-4"],
            manualProcessingInvoiceIds: ["inv-5"],
          },
        }),
    });

    vi.spyOn(eInvoiceApiModule, "useTriggerAutoRetryMutation").mockReturnValue([
      triggerMock,
      { isLoading: false },
    ] as any);

    vi.spyOn(eInvoiceApiModule, "useGetManualProcessingInvoicesQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          content: [],
          totalElements: 0,
          totalPages: 0,
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(eInvoiceApiModule, "useResendAutoRetryInvoiceMutation").mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);

    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <AutoRetryQueuePanel />
        </MemoryRouter>
      </Provider>
    );

    const triggerBtn = screen.getByText("Quét & Gửi lại ngay");
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(triggerMock).toHaveBeenCalled();
      expect(screen.getByText(/Kết quả tiến trình quét tự động gửi lại gần nhất/i)).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument(); // totalProcessed
      expect(screen.getByText("4")).toBeInTheDocument(); // successCount
    });
  });

  it("NCL-04-CN-007-TC-02: Bảng danh sách hóa đơn cần xử lý thủ công (MANUAL_PROCESSING)", () => {
    vi.spyOn(eInvoiceApiModule, "useTriggerAutoRetryMutation").mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);

    vi.spyOn(eInvoiceApiModule, "useGetManualProcessingInvoicesQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: {
          content: [
            {
              id: "inv-manual-1",
              invoiceNumber: "HD-000999",
              lookupCode: "LK-999",
              buyerName: "Công ty TNHH Thử Nghiệm",
              buyerTaxCode: "0101234567-999",
              finalAmount: 1200000,
              status: "MANUAL_PROCESSING",
              taxAuthorityResponse: "Mã số thuế chi nhánh chưa đăng ký sử dụng hóa đơn",
              errorCategory: "BRANCH_TAX_CODE_INVALID",
              retryCount: 5,
              createdAt: "2026-09-09T08:00:00",
            },
          ],
          totalElements: 1,
          totalPages: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(eInvoiceApiModule, "useResendAutoRetryInvoiceMutation").mockReturnValue([
      vi.fn(),
      { isLoading: false },
    ] as any);

    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <AutoRetryQueuePanel />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText("HD-000999")).toBeInTheDocument();
    expect(screen.getByText("Công ty TNHH Thử Nghiệm")).toBeInTheDocument();
    expect(screen.getByText("MST: 0101234567-999")).toBeInTheDocument();
    expect(
      screen.getByText("Mã số thuế chi nhánh chưa đăng ký sử dụng hóa đơn")
    ).toBeInTheDocument();
    expect(screen.getByText("CẦN XỬ LÝ THỦ CÔNG")).toBeInTheDocument();
    expect(screen.getByText("Gửi lại")).toBeInTheDocument();
    expect(screen.getByText("Sửa")).toBeInTheDocument();
  });
});
