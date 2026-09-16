import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { SupplierReturnTable } from "@/modules/supplier_return/components/SupplierReturnTable";
import { SupplierReturnSidebar } from "@/modules/supplier_return/components/SupplierReturnSidebar";
import { SupplierReturnDetailModal } from "@/modules/supplier_return/components/SupplierReturnDetailModal";
import { CreateSupplierReturnModal } from "@/modules/supplier_return/components/CreateSupplierReturnModal";
import { SupplierReturnPrintModal } from "@/modules/supplier_return/components/SupplierReturnPrintModal";
import type {
  ISupplierReturn,
  ISupplierReturnDetail,
} from "@/modules/supplier_return/types/ISupplierReturn";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithReduxAndToast = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <NotificationProvider>{ui}</NotificationProvider>
    </Provider>
  );
};

const mockReturns: ISupplierReturn[] = [
  {
    id: "sr-1",
    returnNumber: "TH-NCC-20260916-ABC123",
    receiptId: "rc-1",
    receiptNumber: "PN-0001",
    supplierId: "sup-1",
    supplierName: "Công ty Nước Giải Khát ABC",
    totalReturnAmount: 40000,
    reason: "Hàng hỏng",
    notes: "Chai bị móp vỡ khi kiểm kho",
    returnDate: "2026-09-16T09:00:00Z",
    createdByUserId: "user-1",
    createdByUserName: "Chủ hộ Nguyễn Văn A",
    createdAt: "2026-09-16T09:00:00Z",
    totalItems: 2,
  },
  {
    id: "sr-2",
    returnNumber: "TH-NCC-20260916-XYZ789",
    receiptId: "rc-2",
    receiptNumber: "PN-0002",
    supplierId: "sup-2",
    supplierName: "Đại lý Bánh Kẹo Phú Quý",
    totalReturnAmount: 150000,
    reason: "Cận hạn",
    notes: "Date dưới 1 tháng",
    returnDate: "2026-09-15T14:30:00Z",
    createdByUserId: "user-1",
    createdByUserName: "Chủ hộ Nguyễn Văn A",
    createdAt: "2026-09-15T14:30:00Z",
    totalItems: 5,
  },
];

describe("NCL-13-CN-006: Trả hàng lại nhà cung cấp (Frontend Tests)", () => {
  describe("SupplierReturnTable Component", () => {
    it("renders table with return tickets accurately", () => {
      const onViewDetails = vi.fn();

      renderWithReduxAndToast(
        <SupplierReturnTable
          returns={mockReturns}
          onViewDetails={onViewDetails}
          totalElements={2}
          totalPages={1}
        />
      );

      expect(screen.getByText("TH-NCC-20260916-ABC123")).toBeInTheDocument();
      expect(screen.getByText("TH-NCC-20260916-XYZ789")).toBeInTheDocument();
      expect(screen.getByText("Công ty Nước Giải Khát ABC")).toBeInTheDocument();
      expect(screen.getByText("Đại lý Bánh Kẹo Phú Quý")).toBeInTheDocument();
      expect(screen.getByText("Hàng hỏng")).toBeInTheDocument();
      expect(screen.getByText("Cận hạn")).toBeInTheDocument();
    });

    it("triggers onViewDetails when clicking a row or print button", () => {
      const onViewDetails = vi.fn();

      renderWithReduxAndToast(
        <SupplierReturnTable
          returns={mockReturns}
          onViewDetails={onViewDetails}
          totalElements={2}
          totalPages={1}
        />
      );

      const printButtons = screen.getAllByRole("button", { name: /In phiếu/i });
      fireEvent.click(printButtons[0]);

      expect(onViewDetails).toHaveBeenCalledWith("sr-1");
    });

    it("renders empty state message when returns array is empty", () => {
      renderWithReduxAndToast(
        <SupplierReturnTable
          returns={[]}
          onViewDetails={vi.fn()}
          totalElements={0}
          totalPages={1}
        />
      );

      expect(
        screen.getByText("Không tìm thấy phiếu trả hàng nhà cung cấp nào.")
      ).toBeInTheDocument();
    });
  });

  describe("SupplierReturnSidebar Component", () => {
    it("renders date filter presets and triggers change", () => {
      const onFilterChange = vi.fn();

      renderWithReduxAndToast(
        <SupplierReturnSidebar
          filter={{
            supplierId: "",
            fromDate: "",
            toDate: "",
          }}
          onFilterChange={onFilterChange}
        />
      );

      expect(screen.getByText("Bộ Lọc Phiếu Trả")).toBeInTheDocument();
      expect(screen.getByText("Hôm nay")).toBeInTheDocument();
      expect(screen.getByText("7 ngày qua")).toBeInTheDocument();
      expect(screen.getByText("Tháng này")).toBeInTheDocument();

      // Click "7 ngày qua"
      fireEvent.click(screen.getByText("7 ngày qua"));
      expect(onFilterChange).toHaveBeenCalled();
    });
  });

  describe("CreateSupplierReturnModal Component (Validation TC-01 & TC-02)", () => {
    it("renders correctly when open is false", () => {
      const { container } = renderWithReduxAndToast(
        <CreateSupplierReturnModal
          isOpen={false}
          onClose={vi.fn()}
          receiptId="rc-1"
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("renders modal elements when opened with receiptId", () => {
      renderWithReduxAndToast(
        <CreateSupplierReturnModal
          isOpen={true}
          onClose={vi.fn()}
          receiptId="rc-1"
        />
      );

      expect(
        screen.getByText("Lập Phiếu Trả Hàng Cho Nhà Cung Cấp")
      ).toBeInTheDocument();
      expect(screen.getByText("Xác nhận trả hàng")).toBeInTheDocument();
    });
  });

  describe("SupplierReturnDetailModal Component", () => {
    it("renders correctly when open is false", () => {
      const { container } = renderWithReduxAndToast(
        <SupplierReturnDetailModal
          isOpen={false}
          onClose={vi.fn()}
          returnId="sr-1"
        />
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("SupplierReturnPrintModal Component (Accounting Voucher Sheet)", () => {
    const mockReturnDetail: ISupplierReturnDetail = {
      id: "sr-100",
      returnNumber: "TH-NCC-20260916-0A8A03",
      receiptId: "rc-100",
      receiptNumber: "NK-1789528193769-4a5f31da",
      supplierId: "sup-1",
      supplierName: "LE VAN AN",
      supplierPhone: "068481215",
      totalReturnAmount: 1000000,
      supplierDebtReduced: 1000000,
      reason: "Hàng hỏng",
      notes: "Hàng bị móp méo khi kiểm kho",
      returnDate: "2026-09-16T10:10:00Z",
      createdByUserName: "Nguyễn Văn A",
      createdAt: "2026-09-16T10:10:00Z",
      items: [
        {
          id: "item-1",
          productCode: "5o43j53454",
          productName: "tnq",
          unitName: "Lon",
          quantity: 10,
          purchasePrice: 100000,
          conversionFactor: 1,
          baseQuantity: 10,
          basePurchasePrice: 100000,
          subtotal: 1000000,
          itemReason: "Hàng hỏng",
        },
      ],
    };

    it("renders voucher sheet with all accounting information and triggers window.print", () => {
      const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
      const handleClose = vi.fn();

      renderWithReduxAndToast(
        <SupplierReturnPrintModal
          isOpen={true}
          onClose={handleClose}
          returnDetail={mockReturnDetail}
        />
      );

      // Check title and voucher number
      expect(
        screen.getByText("PHIẾU XUẤT TRẢ HÀNG NHÀ CUNG CẤP")
      ).toBeInTheDocument();
      expect(screen.getAllByText(/TH-NCC-20260916-0A8A03/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/LE VAN AN/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/NK-1789528193769-4a5f31da/i)).toBeInTheDocument();

      // Check items table
      expect(screen.getByText("5o43j53454")).toBeInTheDocument();
      expect(screen.getByText("tnq")).toBeInTheDocument();
      expect(screen.getByText("Lon")).toBeInTheDocument();
      expect(screen.getAllByText(/1\.000\.000/i).length).toBeGreaterThan(0);

      // Check signatures
      expect(screen.getByText("NGƯỜI LẬP PHIẾU")).toBeInTheDocument();
      expect(screen.getByText("NGƯỜI NHẬN HÀNG (NCC)")).toBeInTheDocument();
      expect(screen.getByText("THỦ KHO")).toBeInTheDocument();

      // Click print button
      const printBtn = screen.getByText(/In phiếu \(Print\)/i);
      fireEvent.click(printBtn);
      expect(printSpy).toHaveBeenCalled();

      printSpy.mockRestore();
    });
  });
});
