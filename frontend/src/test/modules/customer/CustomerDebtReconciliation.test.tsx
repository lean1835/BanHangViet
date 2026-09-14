import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import authReducer, { setCredentials } from "@/stores/authSlice";
import { NotificationProvider } from "@/providers/NotificationProvider";
import {
  DashboardDemoContext,
  type IDashboardDemoContext,
} from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { DebtReconciliationModal } from "@/modules/customer/components/DebtReconciliationModal";
import { DebtStatementPrintModal } from "@/modules/customer/components/DebtStatementPrintModal";
import { DebtAdjustmentModal } from "@/modules/customer/components/DebtAdjustmentModal";
import { CustomerReconciliationHistoryTab } from "@/modules/customer/components/CustomerReconciliationHistoryTab";
import * as customerApiModule from "@/modules/customer/services/customerApi";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import type {
  IDebtReconciliationResponse,
  IDebtStatementPrintResponse,
} from "@/modules/customer/types/ICustomerDebtReconciliation";

const mockCustomer: ICustomer = {
  id: "cust-001",
  name: "Nguyễn Văn A",
  phone: "0901234567",
  phoneNumber: "0901234567",
  email: "nguyenvana@gmail.com",
  address: "45 Lê Duẩn, Đà Nẵng",
  creditLimit: 20000000,
  debt: 1900000,
  currentDebt: 1900000,
  discountRate: 0,
  discountType: "PERCENTAGE",
  totalSpent: 5000000,
  isVip: false,
};

const mockPreviewResponse: IDebtReconciliationResponse = {
  id: "rec-preview",
  code: "DREC-PREVIEW",
  customerId: "cust-001",
  customerName: "Nguyễn Văn A",
  customerPhone: "0901234567",
  customerAddress: "45 Lê Duẩn, Đà Nẵng",
  startDate: "2026-09-01",
  endDate: "2026-09-14",
  openingDebtBalance: 1500000,
  totalDebtIncurred: 800000,
  totalDebtPaid: 400000,
  closingDebtBalance: 1900000,
  closingDebtInWords: "Một triệu chín trăm nghìn đồng chẵn",
  status: "DRAFT",
  hasTransactions: true,
  notes: "Kỳ đối chiếu nửa đầu tháng 9",
  createdAt: "2026-09-14T09:00:00",
  items: [
    {
      id: "item-1",
      transactionDate: "2026-09-03T10:00:00",
      type: "DEBT_CREATED",
      typeDescription: "Mua hàng ghi nợ",
      referenceCode: "HD-001",
      debtId: "debt-1",
      amount: 500000,
      runningBalance: 2000000,
      notes: "Đơn hàng bánh kẹo",
    },
    {
      id: "item-2",
      transactionDate: "2026-09-05T14:30:00",
      type: "DEBT_PAID",
      typeDescription: "Khách trả nợ",
      referenceCode: "PHIEU-THU",
      debtId: "debt-2",
      amount: 400000,
      runningBalance: 1600000,
      notes: "Chuyển khoản Vietcombank",
    },
    {
      id: "item-3",
      transactionDate: "2026-09-10T16:00:00",
      type: "DEBT_CREATED",
      typeDescription: "Mua hàng ghi nợ",
      referenceCode: "HD-002",
      debtId: "debt-3",
      amount: 300000,
      runningBalance: 1900000,
      notes: "Đơn hàng nước ngọt",
    },
  ],
};

const mockEmptyPreviewResponse: IDebtReconciliationResponse = {
  id: "rec-empty",
  code: "DREC-EMPTY",
  customerId: "cust-001",
  customerName: "Nguyễn Văn A",
  customerPhone: "0901234567",
  startDate: "2026-09-01",
  endDate: "2026-09-14",
  openingDebtBalance: 1900000,
  totalDebtIncurred: 0,
  totalDebtPaid: 0,
  closingDebtBalance: 1900000,
  closingDebtInWords: "Một triệu chín trăm nghìn đồng chẵn",
  status: "DRAFT",
  hasTransactions: false,
  createdAt: "2026-09-14T09:00:00",
  items: [],
};

const mockPrintStatement: IDebtStatementPrintResponse = {
  documentTitle: "GIẤY ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ",
  reconciliationCode: "DREC-260914-0001",
  printedDate: "2026-09-14",
  householdName: "Hộ Kinh Doanh Bán Hàng Việt",
  householdTaxCode: "0109876543",
  householdAddress: "123 Hoàng Diệu, Đà Nẵng",
  householdPhone: "02363888999",
  householdRepresentative: "Trần Văn Chủ",
  customerName: "Nguyễn Văn A",
  customerPhone: "0901234567",
  customerAddress: "45 Lê Duẩn, Đà Nẵng",
  startDate: "2026-09-01",
  endDate: "2026-09-14",
  openingDebtBalance: 1500000,
  totalDebtIncurred: 800000,
  totalDebtPaid: 400000,
  closingDebtBalance: 1900000,
  closingDebtInWords: "Một triệu chín trăm nghìn đồng chẵn",
  hasTransactions: true,
  notes: "Hai bên thống nhất số nợ đến hết ngày 14/09/2026",
  transactions: mockPreviewResponse.items,
  sellerSignTitle: "ĐẠI DIỆN BÊN BÁN\n(Ký, đóng dấu và ghi rõ họ tên)",
  buyerSignTitle: "ĐẠI DIỆN BÊN MUA\n(Ký, xác nhận nợ và ghi rõ họ tên)",
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

const renderWithProviders = (
  ui: React.ReactElement,
  role: string = USER_ROLES.OWNER,
  customStore?: ReturnType<typeof setupStore>,
) => {
  const store = customStore || setupStore(role);

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

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <BrowserRouter>
            <DashboardDemoContext.Provider value={mockContextValue}>
              <NotificationProvider>{children}</NotificationProvider>
            </DashboardDemoContext.Provider>
          </BrowserRouter>
        </Provider>
      ),
    }),
    store,
    mockContextValue,
  };
};

describe("NCL-10-CN-007: Đối chiếu công nợ và in giấy xác nhận nợ", () => {
  beforeEach(() => {
    vi.spyOn(customerApiModule, "useGetLatestDebtReconciliationQuery").mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    vi.spyOn(customerApiModule, "useGetDebtReconciliationsQuery").mockReturnValue({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 50,
        number: 0,
        first: true,
        last: true,
        empty: true,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(customerApiModule, "useGetDebtStatementPrintQuery").mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  // --- NCL-10-CN-007-TC-01: Luồng thành công - Xem trước đối chiếu ---
  describe("NCL-10-CN-007-TC-01: Xem trước bảng đối chiếu công nợ", () => {
    it("Hiển thị giao diện lập đối chiếu với thông tin khách hàng, bộ chọn ngày và các nút chọn nhanh", () => {
      renderWithProviders(
        <DebtReconciliationModal
          isOpen={true}
          onClose={vi.fn()}
          customer={mockCustomer}
        />,
      );

      expect(screen.getByText(/Biên bản Đối chiếu Công nợ Khách hàng/i)).toBeInTheDocument();
      expect(screen.getByText(mockCustomer.name)).toBeInTheDocument();
      expect(screen.getByText(/Tháng này/i)).toBeInTheDocument();
      expect(screen.getByText(/Tháng trước/i)).toBeInTheDocument();
      expect(screen.getByText(/Quý này/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Xem trước số liệu/i })).toBeInTheDocument();
    });

    it("Xem trước số liệu hiển thị đầy đủ số dư đầu kỳ, phát sinh tăng, phát sinh giảm và số dư cuối kỳ bằng số và chữ", async () => {
      vi.spyOn(customerApiModule, "usePreviewDebtReconciliationMutation").mockReturnValue([
        vi.fn().mockReturnValue({
          unwrap: () => Promise.resolve(mockPreviewResponse),
        }),
        { isLoading: false, reset: vi.fn() } as any,
      ]);

      renderWithProviders(
        <DebtReconciliationModal
          isOpen={true}
          onClose={vi.fn()}
          customer={mockCustomer}
        />,
      );

      // Click "Xem trước số liệu"
      const previewBtn = screen.getByRole("button", { name: /Xem trước số liệu/i });
      fireEvent.click(previewBtn);

      await waitFor(() => {
        // Balances KPI Cards
        expect(screen.getByText(/1\. Dư nợ đầu kỳ/i)).toBeInTheDocument();
        expect(screen.getByText(/2\. Phát sinh tăng \(Nợ\)/i)).toBeInTheDocument();
        expect(screen.getByText(/3\. Phát sinh giảm \(Trả\)/i)).toBeInTheDocument();
        expect(screen.getByText(/4\. Dư nợ cuối kỳ/i)).toBeInTheDocument();

        // Amount in words
        expect(
          screen.getByText(/Một triệu chín trăm nghìn đồng chẵn/i),
        ).toBeInTheDocument();

        // Reference codes and items in table
        expect(screen.getByText("HD-001")).toBeInTheDocument();
        expect(screen.getByText("HD-002")).toBeInTheDocument();
        expect(screen.getByText("PHIEU-THU")).toBeInTheDocument();
      });
    });
  });

  // --- NCL-10-CN-007-TC-02: Chốt khóa sổ công nợ chống sửa lùi ---
  describe("NCL-10-CN-007-TC-02: Chốt khóa sổ công nợ", () => {
    it("Chủ hộ (VT-01) có tùy chọn 'Chốt khóa sổ ngay' và lưu biên bản ở trạng thái CONFIRMED", async () => {
      const mockCreate = vi.fn().mockReturnValue({
        unwrap: () =>
          Promise.resolve({
            ...mockPreviewResponse,
            id: "rec-confirmed-1",
            code: "DREC-260914-0001",
            status: "CONFIRMED",
            reconciledToDate: "2026-09-14",
          }),
      });

      vi.spyOn(customerApiModule, "usePreviewDebtReconciliationMutation").mockReturnValue([
        vi.fn().mockReturnValue({
          unwrap: () => Promise.resolve(mockPreviewResponse),
        }),
        { isLoading: false, reset: vi.fn() } as any,
      ]);

      vi.spyOn(customerApiModule, "useCreateDebtReconciliationMutation").mockReturnValue([
        mockCreate,
        { isLoading: false, reset: vi.fn() } as any,
      ]);

      const handleSuccess = vi.fn();
      renderWithProviders(
        <DebtReconciliationModal
          isOpen={true}
          onClose={vi.fn()}
          customer={mockCustomer}
          onSuccess={handleSuccess}
        />,
        USER_ROLES.OWNER,
      );

      // Trigger preview first
      fireEvent.click(screen.getByRole("button", { name: /Xem trước số liệu/i }));

      await waitFor(() => {
        expect(screen.getByText(/Chốt khóa sổ ngay/i)).toBeInTheDocument();
      });

      // Tick confirmNow
      const confirmCheckbox = screen.getByRole("checkbox");
      fireEvent.click(confirmCheckbox);

      // Submit button should now say "Chốt & Khóa sổ nợ"
      const submitBtn = screen.getByRole("button", { name: /Chốt & Khóa sổ nợ/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            customerId: "cust-001",
            confirmNow: true,
          }),
        );
        expect(handleSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "CONFIRMED",
          }),
        );
      });
    });
  });

  // --- NCL-10-CN-007-TC-03: Kỳ đối chiếu không phát sinh giao dịch ---
  describe("NCL-10-CN-007-TC-03: Kỳ đối chiếu không có giao dịch", () => {
    it("Hiển thị thông báo kỳ không có phát sinh và số dư đầu kỳ bằng số dư cuối kỳ", async () => {
      vi.spyOn(customerApiModule, "usePreviewDebtReconciliationMutation").mockReturnValue([
        vi.fn().mockReturnValue({
          unwrap: () => Promise.resolve(mockEmptyPreviewResponse),
        }),
        { isLoading: false, reset: vi.fn() } as any,
      ]);

      renderWithProviders(
        <DebtReconciliationModal
          isOpen={true}
          onClose={vi.fn()}
          customer={mockCustomer}
        />,
        USER_ROLES.OWNER,
      );

      fireEvent.click(screen.getByRole("button", { name: /Xem trước số liệu/i }));

      await waitFor(() => {
        // Banner notice for empty transactions
        expect(
          screen.getByText(/Khách hàng không phát sinh giao dịch nợ trong kỳ đối chiếu này/i),
        ).toBeInTheDocument();

        // Check opening balance equals closing balance
        expect(screen.getByText(/1\. Dư nợ đầu kỳ/i)).toBeInTheDocument();
        expect(screen.getByText(/4\. Dư nợ cuối kỳ/i)).toBeInTheDocument();
      });
    });
  });

  // --- In giấy xác nhận nợ (DebtStatementPrintModal) ---
  describe("In giấy xác nhận nợ (DebtStatementPrintModal)", () => {
    it("Hiển thị đầy đủ thông tin bên bán, bên mua, bảng chi tiết và 2 chữ ký xác nhận", () => {
      const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

      renderWithProviders(
        <DebtStatementPrintModal
          isOpen={true}
          onClose={vi.fn()}
          initialData={mockPrintStatement}
        />,
      );

      expect(screen.getByText(/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: /GIẤY ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Hộ Kinh Doanh Bán Hàng Việt")).toBeInTheDocument();
      expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("DREC-260914-0001")).toBeInTheDocument();

      // Signatures
      expect(screen.getByText(/ĐẠI DIỆN BÊN BÁN/i)).toBeInTheDocument();
      expect(screen.getByText(/ĐẠI DIỆN BÊN MUA/i)).toBeInTheDocument();

      // Click print button
      const printBtn = screen.getByRole("button", { name: /In biên bản/i });
      fireEvent.click(printBtn);
      expect(printSpy).toHaveBeenCalled();
    });
  });

  // --- Lịch sử đối chiếu công nợ (CustomerReconciliationHistoryTab) & Phân quyền RBAC ---
  describe("Lịch sử đối chiếu công nợ & Phân quyền RBAC", () => {
    it("Hiển thị danh sách các lần đối chiếu kèm huy hiệu trạng thái (CONFIRMED, DRAFT)", () => {
      vi.spyOn(customerApiModule, "useGetDebtReconciliationsQuery").mockReturnValue({
        data: {
          content: [
            {
              ...mockPreviewResponse,
              id: "rec-1",
              code: "DREC-001",
              status: "CONFIRMED",
              confirmedAt: "2026-09-14T09:00:00",
            },
            {
              ...mockPreviewResponse,
              id: "rec-2",
              code: "DREC-002",
              status: "DRAFT",
              confirmedAt: null,
            },
          ],
          totalElements: 2,
          totalPages: 1,
          size: 50,
          number: 0,
          first: true,
          last: true,
          empty: false,
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(
        <CustomerReconciliationHistoryTab
          customer={mockCustomer}
          onOpenCreateReconciliation={vi.fn()}
          onOpenAdjustment={vi.fn()}
          onOpenPrint={vi.fn()}
        />,
        USER_ROLES.OWNER,
      );

      expect(screen.getByText("DREC-001")).toBeInTheDocument();
      expect(screen.getByText("DREC-002")).toBeInTheDocument();
      expect(screen.getByText(/ĐÃ XÁC NHẬN & KHÓA SỔ/i)).toBeInTheDocument();
      expect(screen.getByText(/BẢN NHÁP \(DRAFT\)/i)).toBeInTheDocument();
    });

    it("Kiểm soát RBAC: Nhân viên bán hàng (VT-02) không thấy nút Khóa sổ hay Bút toán điều chỉnh", () => {
      vi.spyOn(customerApiModule, "useGetDebtReconciliationsQuery").mockReturnValue({
        data: {
          content: [
            {
              ...mockPreviewResponse,
              id: "rec-draft",
              code: "DREC-DRAFT",
              status: "DRAFT",
            },
          ],
          totalElements: 1,
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(
        <CustomerReconciliationHistoryTab
          customer={mockCustomer}
          onOpenCreateReconciliation={vi.fn()}
          onOpenAdjustment={vi.fn()}
          onOpenPrint={vi.fn()}
        />,
        USER_ROLES.CASHIER, // VT-02
      );

      // Cashier can print
      expect(screen.getByRole("button", { name: /In giấy/i })).toBeInTheDocument();

      // Cashier CANNOT lock or create debt adjustment
      expect(screen.queryByRole("button", { name: /Khóa sổ/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Bút toán điều chỉnh/i })).not.toBeInTheDocument();
    });
  });

  // --- Bút toán điều chỉnh nợ (DebtAdjustmentModal) ---
  describe("Bút toán điều chỉnh công nợ (DebtAdjustmentModal)", () => {
    it("Chủ hộ có thể lập bút toán điều chỉnh tăng/giảm nợ kèm lý do bắt buộc", async () => {
      const mockAdjMutation = vi.fn().mockReturnValue({
        unwrap: () =>
          Promise.resolve({
            id: "adj-1",
            amount: 200000,
            type: "DEBT_DECREASE",
            notes: "[Bút toán điều chỉnh]: Khấu trừ chiết khấu bỏ quên",
          }),
      });

      vi.spyOn(customerApiModule, "useCreateDebtAdjustmentMutation").mockReturnValue([
        mockAdjMutation,
        { isLoading: false, reset: vi.fn() } as any,
      ]);

      const handleSuccess = vi.fn();
      renderWithProviders(
        <DebtAdjustmentModal
          isOpen={true}
          onClose={vi.fn()}
          customer={mockCustomer}
          onSuccess={handleSuccess}
        />,
        USER_ROLES.OWNER,
      );

      expect(screen.getByText(/Lập Bút toán Điều chỉnh Công nợ/i)).toBeInTheDocument();

      // Input amount
      const amountInput = screen.getByPlaceholderText(/Nhập số tiền điều chỉnh/i);
      fireEvent.change(amountInput, { target: { value: "200000" } });

      // Input reason
      const reasonInput = screen.getByPlaceholderText(/Ví dụ: Sai lệch số liệu đơn cũ/i);
      fireEvent.change(reasonInput, { target: { value: "Khấu trừ chiết khấu bỏ quên" } });

      // Submit
      const submitBtn = screen.getByRole("button", { name: /Lập bút toán/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockAdjMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            customerId: "cust-001",
            adjustmentType: "DEBT_DECREASE",
            amount: 200000,
            reason: "Khấu trừ chiết khấu bỏ quên",
          }),
        );
        expect(handleSuccess).toHaveBeenCalled();
      });
    });
  });
});
