import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import authReducer, { setCredentials } from "@/stores/authSlice";
import {
  DashboardDemoContext,
  type IDashboardDemoContext,
} from "@/providers/DashboardDemoProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { USER_ROLES } from "@/constants/roles";
import { CustomerDetailPage } from "@/modules/customer/pages/CustomerDetailPage";
import * as customerApiModule from "@/modules/customer/services/customerApi";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import type { IDebtReconciliationResponse } from "@/modules/customer/types/ICustomerDebtReconciliation";

const mockCustomer: ICustomer = {
  id: "cust-999",
  name: "Nguyễn Văn Khách VIP",
  phone: "0987654321",
  phoneNumber: "0987654321",
  email: "khachvip@example.com",
  address: "100 Nguyễn Văn Linh, Đà Nẵng",
  creditLimit: 10000000,
  debt: 2500000,
  currentDebt: 2500000,
  discountRate: 5,
  discountType: "PERCENTAGE",
  totalSpent: 15000000,
  isVip: true,
  defaultDeliveryChannel: "ZALO",
  reminderDaysBefore: 3,
  reminderDaysAfter: 3,
};

const mockPreviewData: IDebtReconciliationResponse = {
  id: "rec-preview-detail",
  code: "DREC-260914-PREVIEW",
  customerId: "cust-999",
  customerName: "Nguyễn Văn Khách VIP",
  customerPhone: "0987654321",
  startDate: "2026-09-01",
  endDate: "2026-09-14",
  openingDebtBalance: 1500000,
  totalDebtIncurred: 1500000,
  totalDebtPaid: 500000,
  closingDebtBalance: 2500000,
  closingDebtInWords: "Hai triệu năm trăm nghìn đồng chẵn",
  status: "DRAFT",
  hasTransactions: true,
  createdAt: "2026-09-14T09:00:00",
  items: [
    {
      id: "item-1",
      reconciliationId: "rec-preview-detail",
      transactionDate: "2026-09-05T10:00:00",
      type: "DEBT_CREATED",
      typeDescription: "Mua hàng ghi nợ",
      referenceCode: "HD-00123",
      amount: 1500000,
      runningBalance: 3000000,
    },
  ],
};

const setupStore = (role: string = USER_ROLES.OWNER) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  store.dispatch(
    setCredentials({
      token: "fake-jwt-token",
      user: {
        id: "user-1",
        username: role === USER_ROLES.OWNER ? "chuhoviet" : "nhanvien01",
        fullName: role === USER_ROLES.OWNER ? "Trần Văn Chủ" : "Lê Thu Ngân",
        roleId: role,
        role: {
          id: "role-1",
          code: role,
          name: role,
        },
      } as any,
    }),
  );

  return store;
};

let renderResult: ReturnType<typeof render> | null = null;

const renderDetailPage = (
  initialEntries: string[] = ["/customers/cust-999"],
  role: string = USER_ROLES.OWNER,
) => {
  const store = setupStore(role);

  const mockContextValue = {
    currentRole: role,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    currentHouseholdId: "hh-1",
    setCurrentHouseholdId: vi.fn(),
    recentLogs: [],
    addLogEntry: vi.fn(),
    clearLogs: vi.fn(),
  } as unknown as IDashboardDemoContext;

  renderResult = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <DashboardDemoContext.Provider value={mockContextValue}>
          <NotificationProvider>
            <Routes>
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
            </Routes>
          </NotificationProvider>
        </DashboardDemoContext.Provider>
      </MemoryRouter>
    </Provider>,
  );
  return renderResult;
};

describe("CustomerDetailPage: Giao diện chi tiết khách hàng chuẩn vibe Nhà cung cấp", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(customerApiModule, "useGetCustomerByIdQuery").mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(customerApiModule, "useGetCustomersQuery").mockReturnValue({
      data: [mockCustomer],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(customerApiModule, "useGetDebtHistoryQuery").mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(customerApiModule, "useGetDebtReconciliationsQuery").mockReturnValue({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 50,
        number: 0,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(customerApiModule, "useGetLatestDebtReconciliationQuery").mockReturnValue({
      data: null,
      isFetching: false,
    } as any);

    vi.spyOn(customerApiModule, "usePreviewDebtReconciliationMutation").mockReturnValue([
      vi.fn().mockReturnValue({
        unwrap: () => Promise.resolve(mockPreviewData),
      }),
      { isLoading: false },
    ] as any);
  });

  afterEach(() => {
    if (renderResult) {
      renderResult.unmount();
      renderResult = null;
    }
    cleanup();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("1. Hiển thị Header với tên khách hàng, mã KH, huy hiệu VIP và Thẻ Banner Dư nợ chuẩn vibe SupplierDetail", () => {
    renderDetailPage();

    // Customer Name & Code
    expect(screen.getByText("Nguyễn Văn Khách VIP")).toBeInTheDocument();
    expect(screen.getByText("KH-CUST-9")).toBeInTheDocument();
    expect(screen.getByText("VIP")).toBeInTheDocument();

    // Debt Card Banner
    expect(screen.getByText("Dư nợ khách hàng hiện tại")).toBeInTheDocument();
    expect(screen.getByText("2.500.000 đ")).toBeInTheDocument();
    expect(screen.getByText("Thu nợ ngay")).toBeInTheDocument();

    // 3 Tabs
    expect(screen.getByText("Thông tin chung")).toBeInTheDocument();
    expect(screen.getByText(/Đơn hàng nợ/)).toBeInTheDocument();
    expect(screen.getByText(/Đối chiếu công nợ/)).toBeInTheDocument();
  });

  it("2. Chuyển đổi Tab và hiển thị thông tin chung chi tiết", () => {
    renderDetailPage();

    expect(screen.getAllByText("0987654321").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("khachvip@example.com")).toBeInTheDocument();
    expect(screen.getByText("100 Nguyễn Văn Linh, Đà Nẵng")).toBeInTheDocument();
    expect(screen.getByText("Giảm 5%")).toBeInTheDocument();
    expect(screen.getByText("ZALO")).toBeInTheDocument();
  });

  it("3. Mở trực tiếp Tab Đối chiếu công nợ qua URL ?tab=reconciliation", () => {
    renderDetailPage(["/customers/cust-999?tab=reconciliation"]);

    // Tab Đối chiếu được kích hoạt sẵn
    expect(screen.getByText(/Lập & Quản lý Đối chiếu Công nợ/)).toBeInTheDocument();
    expect(screen.getByText(/1. Chọn khoảng thời gian đối chiếu/)).toBeInTheDocument();
    expect(screen.getByText("Xem trước số liệu")).toBeInTheDocument();
    expect(screen.getByText(/2. Danh sách các biên bản đối chiếu trước đó/)).toBeInTheDocument();
  });

  it("4. Thao tác xem trước số liệu đối chiếu inline trực tiếp trong trang", async () => {
    const previewMock = vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve(mockPreviewData),
    });
    vi.spyOn(customerApiModule, "usePreviewDebtReconciliationMutation").mockReturnValue([
      previewMock,
      { isLoading: false },
    ] as any);

    renderDetailPage(["/customers/cust-999?tab=reconciliation"]);

    const previewBtn = screen.getByRole("button", { name: /Xem trước số liệu/i });
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(previewMock).toHaveBeenCalled();
    });

    // Verify 4 KPI cards render inline inside the page
    await waitFor(() => {
      expect(screen.getByText(/1\. Dư nợ đầu kỳ/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Phát sinh tăng/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Phát sinh giảm/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Dư nợ cuối kỳ/i)).toBeInTheDocument();
      expect(screen.getByText(/Hai triệu năm trăm nghìn đồng chẵn/i)).toBeInTheDocument();
      expect(screen.getByText("HD-00123")).toBeInTheDocument();
    });
  });
});
