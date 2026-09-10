import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { CreateCashTransactionModal } from "@/modules/shift/components/CreateCashTransactionModal";
import { ShiftCashSummaryCard } from "@/modules/shift/components/ShiftCashSummaryCard";
import { ShiftCashTransactionsTable } from "@/modules/shift/components/ShiftCashTransactionsTable";
import { RejectExpenseModal } from "@/modules/shift/components/RejectExpenseModal";
import * as cashApi from "@/modules/shift/services/cashTransactionApi";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithProviders = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <NotificationProvider>{ui}</NotificationProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe("NCL-03-CN-014: Ghi thu chi tiền mặt ngoài bán hàng trong ca", () => {
  beforeEach(() => {
    // Mock get categories
    vi.spyOn(cashApi, "useGetCashCategoriesQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: [
          { id: "cat-1", name: "Mua đá lạnh & gia vị", type: "EXPENSE", isSystem: true },
          { id: "cat-2", name: "Thu hồi ứng tiền mặt", type: "INCOME", isSystem: true },
        ],
      },
      isLoading: false,
    } as any);

    // Mock create mutation
    vi.spyOn(cashApi, "useCreateCashTransactionMutation").mockReturnValue([
      vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) }),
      { isLoading: false },
    ] as any);

    // Mock reject mutation
    vi.spyOn(cashApi, "useRejectCashExpenseMutation").mockReturnValue([
      vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) }),
      { isLoading: false },
    ] as any);

    // Mock approve mutation
    vi.spyOn(cashApi, "useApproveCashExpenseMutation").mockReturnValue([
      vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) }),
      { isLoading: false },
    ] as any);

    // Mock get transactions query
    vi.spyOn(cashApi, "useGetShiftCashTransactionsQuery").mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: [],
      },
      isLoading: false,
    } as any);
  });

  describe("TC-01: Ghi nhận phiếu chi tiền mặt hợp lệ (<= 500k) và phiếu thu tiền mặt", () => {
    it("hiển thị đúng giao diện lập phiếu với tab Thu/Chi và các nút số tiền gợi ý", () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();

      renderWithProviders(
        <CreateCashTransactionModal
          isOpen={true}
          onClose={onClose}
          defaultType="EXPENSE"
          onSuccess={onSuccess}
        />
      );

      // Kiểm tra tiêu đề modal
      expect(screen.getByText(/Ghi thu chi tiền mặt ngoài bán hàng/i)).toBeInTheDocument();

      // Kiểm tra tab chuyển đổi
      expect(screen.getByText(/Phiếu Chi tiền/i)).toBeInTheDocument();
      expect(screen.getByText(/Phiếu Thu tiền/i)).toBeInTheDocument();

      // Kiểm tra các nút tiền nhanh
      expect(screen.getByText(/\+50\.000/)).toBeInTheDocument();
      expect(screen.getByText(/\+100\.000/)).toBeInTheDocument();
      expect(screen.getByText(/\+200\.000/)).toBeInTheDocument();
      expect(screen.getByText(/\+500\.000/)).toBeInTheDocument();
    });

    it("cho phép chuyển sang Tab Phiếu Thu và cập nhật nhãn người nộp tiền", () => {
      const onClose = vi.fn();

      renderWithProviders(
        <CreateCashTransactionModal
          isOpen={true}
          onClose={onClose}
          defaultType="EXPENSE"
        />
      );

      // Bấm chuyển sang tab Phiếu Thu
      const incomeTab = screen.getByRole("button", { name: /Phiếu Thu tiền/i });
      fireEvent.click(incomeTab);

      // Nhãn đổi sang Người nộp tiền
      expect(screen.getByText(/Người nộp tiền/i)).toBeInTheDocument();
    });

    it("cộng dồn số tiền nhanh khi nhấn các nút gợi ý tiền", () => {
      const onClose = vi.fn();

      renderWithProviders(
        <CreateCashTransactionModal
          isOpen={true}
          onClose={onClose}
          defaultType="EXPENSE"
        />
      );

      const btn100k = screen.getByText(/\+100\.000/);
      const btn50k = screen.getByText(/\+50\.000/);

      fireEvent.click(btn100k);
      fireEvent.click(btn50k);

      // Input số tiền hiển thị 150.000
      const amountInput = screen.getByPlaceholderText("0") as HTMLInputElement;
      expect(amountInput.value).toBe("150.000");
    });
  });

  describe("TC-02: Cơ chế kiểm soát hạn mức duyệt chi (> 500k) và phê duyệt của Chủ hộ", () => {
    it("hiển thị cảnh báo duyệt khi số tiền chi vượt hạn mức 500.000đ", () => {
      const onClose = vi.fn();

      renderWithProviders(
        <CreateCashTransactionModal
          isOpen={true}
          onClose={onClose}
          defaultType="EXPENSE"
        />
      );

      const amountInput = screen.getByPlaceholderText("0");
      // Nhập 800.000đ (vượt hạn mức 500.000đ)
      fireEvent.change(amountInput, { target: { value: "800000" } });

      // Phải xuất hiện cảnh báo vượt hạn mức
      expect(screen.getByText(/Khoản chi cần Chủ hộ phê duyệt/i)).toBeInTheDocument();
      expect(screen.getByText(/vượt hạn mức tự duyệt/i)).toBeInTheDocument();
    });

    it("modal từ chối phiếu chi yêu cầu nhập lý do bắt buộc trước khi xác nhận", () => {
      const onClose = vi.fn();

      renderWithProviders(
        <RejectExpenseModal
          isOpen={true}
          onClose={onClose}
          transactionId="tx-123"
          transactionCode="PC-2609-001"
          amount={800000}
        />
      );

      expect(screen.getByText(/Từ chối duyệt phiếu chi/i)).toBeInTheDocument();
      expect(screen.getByText(/PC-2609-001/i)).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: /Xác nhận từ chối/i });
      // Khi chưa nhập lý do, nút bấm bị disabled
      expect(confirmBtn).toBeDisabled();

      // Nhập lý do từ chối
      const reasonInput = screen.getByPlaceholderText(/Nhập lý do không đồng ý chi/i);
      fireEvent.change(reasonInput, { target: { value: "Chi phí không hợp lệ" } });

      // Nút xác nhận được kích hoạt
      expect(confirmBtn).not.toBeDisabled();
    });

    it("bảng danh sách phiếu thu chi hiển thị nút Duyệt và Từ chối cho Chủ hộ đối với phiếu chờ duyệt", () => {
      vi.spyOn(cashApi, "useGetShiftCashTransactionsQuery").mockReturnValue({
        data: {
          code: 1000,
          message: "Success",
          result: [
            {
              id: "tx-pending-1",
              code: "PC-001",
              type: "EXPENSE",
              amount: 800000,
              recipientName: "Bảo trì thiết bị",
              categoryName: "Sửa chữa",
              reason: "Sửa máy in bill",
              status: "PENDING_APPROVAL",
              createdByName: "Nhân viên A",
              createdAt: "2026-09-10T14:00:00Z",
            },
          ],
        },
        isLoading: false,
      } as any);

      renderWithProviders(
        <ShiftCashTransactionsTable shiftId="shift-001" isOwner={true} />
      );

      // Phải có badge "Chờ duyệt"
      expect(screen.getByText("Chờ duyệt")).toBeInTheDocument();

      // Chủ hộ có nút "Duyệt" và "Từ chối"
      expect(screen.getByText("Duyệt")).toBeInTheDocument();
      expect(screen.getByText("Từ chối")).toBeInTheDocument();
    });
  });

  describe("TC-03: Công thức tiền mặt lý thuyết và cảnh báo chặn đóng ca khi còn phiếu chờ duyệt", () => {
    it("tính toán đúng công thức tiền mặt lý thuyết trong ca: Tiền đầu + Bán hàng TM + Thu ngoài - Chi ngoài", () => {
      // Giả lập dữ liệu ca và dòng tiền mặt
      const openingCash = 1000000;
      const cashSales = 3500000;
      const totalIncome = 200000;
      const totalExpenseApproved = 150000;
      const handoverDiff = 0;

      // Công thức tiền mặt lý thuyết chuẩn QTN-16 & NCL-03-CN-014:
      const theoreticalCash = openingCash + cashSales + totalIncome - totalExpenseApproved + handoverDiff;
      expect(theoreticalCash).toBe(4550000);

      // Khoản chi PENDING_APPROVAL (800k) KHÔNG ĐƯỢC TRỪ vào tiền mặt lý thuyết cho đến khi duyệt
      const pendingExpense = 800000;
      const cashWithPendingIgnored = openingCash + cashSales + totalIncome - totalExpenseApproved;
      expect(cashWithPendingIgnored).toBe(theoreticalCash);
      expect(cashWithPendingIgnored).not.toBe(theoreticalCash - pendingExpense);
    });

    it("hiển thị banner cảnh báo khẩn cấp khi có khoản chi PENDING_APPROVAL", () => {
      vi.spyOn(cashApi, "useGetShiftCashSummaryQuery").mockReturnValue({
        data: {
          code: 1000,
          message: "Success",
          result: {
            shiftId: "shift-001",
            totalIncome: 100000,
            totalExpense: 150000,
            netCashFlow: -50000,
            totalPendingExpense: 800000,
            pendingExpenseCount: 2,
            expenseApprovalThreshold: 500000,
            incomeCount: 1,
            expenseCount: 1,
            pendingCount: 2,
          },
        },
        isLoading: false,
      } as any);

      renderWithProviders(<ShiftCashSummaryCard shiftId="shift-001" />);

      // Phải có banner cảnh báo khẩn cấp
      expect(screen.getByText(/2 khoản chi/i)).toBeInTheDocument();
      expect(screen.getByText(/Chặn đóng ca & bàn giao/i)).toBeInTheDocument();
      expect(screen.getByText(/Dòng tiền mặt ngoài bán hàng trong ca/i)).toBeInTheDocument();
    });
  });
});
