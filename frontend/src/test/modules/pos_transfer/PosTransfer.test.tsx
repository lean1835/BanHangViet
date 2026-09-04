import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { baseApi } from "@/stores/baseApi";
import { PosTransferTable } from "@/modules/pos_transfer/components/PosTransferTable";
import { PosTransferDetailModal } from "@/modules/pos_transfer/components/PosTransferDetailModal";
import { CreatePosTransferModal } from "@/modules/pos_transfer/components/CreatePosTransferModal";
import type { IPosTransfer } from "@/modules/pos_transfer/types/IPosTransfer";
import type { IPointOfSale } from "@/modules/point_of_sale/types/IPointOfSale";

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

  return render(<Provider store={store}>{ui}</Provider>);
};

const mockPosList: IPointOfSale[] = [
  {
    id: "pos-1",
    posCode: "POS-01",
    name: "Quầy chính",
    address: "12 Lê Lợi",
    isDefault: true,
    isActive: true,
  },
  {
    id: "pos-2",
    posCode: "POS-02",
    name: "Chi nhánh 2",
    address: "Bến Thành",
    isDefault: false,
    isActive: true,
  },
];

const mockTransfers: IPosTransfer[] = [
  {
    id: "tr-1",
    transferNumber: "CK-20260826-0001",
    transferCode: "TRF-0001",
    fromPointOfSaleId: "pos-1",
    fromPointOfSaleName: "Quầy chính",
    toPointOfSaleId: "pos-2",
    toPointOfSaleName: "Chi nhánh 2",
    status: "IN_TRANSIT",
    totalItems: 1,
    totalQuantity: 24,
    notes: "Chuyển gấp cho chi nhánh",
    transferredAt: "2026-08-25T10:00:00Z",
    createdByFullName: "Chủ hộ Nguyễn Văn A",
    items: [
      {
        productId: "prod-1",
        productSku: "BIA-SG-01",
        productName: "Bia Sài Gòn Special",
        unit: "Lon",
        quantity: 24,
      },
    ],
  },
  {
    id: "tr-2",
    transferNumber: "CK-20260826-0002",
    transferCode: "TRF-0002",
    fromPointOfSaleId: "pos-2",
    fromPointOfSaleName: "Chi nhánh 2",
    toPointOfSaleId: "pos-1",
    toPointOfSaleName: "Quầy chính",
    status: "COMPLETED",
    totalItems: 1,
    totalQuantity: 5,
    transferredAt: "2026-08-24T09:00:00Z",
    receivedAt: "2026-08-24T14:00:00Z",
    receivedByFullName: "Thu ngân Chi nhánh 1",
    items: [
      {
        productId: "prod-2",
        productSku: "GAO-ST25",
        productName: "Gạo ST25 5kg",
        unit: "Túi",
        quantity: 5,
      },
    ],
  },
];

describe("PosTransfer Module (NCL-17-CN-003)", () => {
  // Test 1: Render PosTransferTable
  it("renders PosTransferTable with list of transfers and correct statuses", () => {
    const handleViewDetail = vi.fn();

    render(
      <PosTransferTable
        data={mockTransfers}
        totalElements={2}
        totalPages={1}
        currentPage={0}
        pageSize={10}
        onPageChange={vi.fn()}
        searchTerm=""
        onSearchChange={vi.fn()}
        statusFilter="ALL"
        onStatusFilterChange={vi.fn()}
        fromPosFilter=""
        onFromPosFilterChange={vi.fn()}
        toPosFilter=""
        onToPosFilterChange={vi.fn()}
        posList={mockPosList}
        isLoading={false}
        onViewDetail={handleViewDetail}
        onAddNew={vi.fn()}
        userRole="VT-01"
      />
    );

    expect(screen.getByText("CK-20260826-0001")).toBeInTheDocument();
    expect(screen.getByText("CK-20260826-0002")).toBeInTheDocument();
    expect(screen.getAllByText("Đang chuyển").length).toBeGreaterThan(0);
    expect(screen.getByText("Đã nhận đủ")).toBeInTheDocument();

    const viewButtons = screen.getAllByText("Xem");
    fireEvent.click(viewButtons[0]);
    expect(handleViewDetail).toHaveBeenCalledWith(mockTransfers[0]);
  });

  // Test 2: PosTransferDetailModal allows receiving a pending transfer (NCL-17-CN-003-TC-01)
  it("allows confirming receipt for a IN_TRANSIT transfer", async () => {
    const handleReceive = vi.fn();
    const handleCancel = vi.fn();

    renderWithProviders(
      <PosTransferDetailModal
        isOpen={true}
        onClose={vi.fn()}
        transfer={mockTransfers[0]}
        onReceive={handleReceive}
        onCancel={handleCancel}
        userRole="VT-01"
      />
    );

    expect(screen.getByText("Chi tiết phiếu chuyển hàng")).toBeInTheDocument();
    expect(screen.getByText("CK-20260826-0001")).toBeInTheDocument();
    expect(screen.getByText("Bia Sài Gòn Special")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();

    const receiveBtn = screen.getByText("Xác nhận đã nhận đủ hàng");
    expect(receiveBtn).toBeInTheDocument();

    fireEvent.click(receiveBtn);
    expect(handleReceive).toHaveBeenCalledWith("tr-1");
  });

  // Test 3: PosTransferDetailModal handles cancellation with reason
  it("requires cancel reason and triggers onCancel", async () => {
    const handleReceive = vi.fn();
    const handleCancel = vi.fn();

    renderWithProviders(
      <PosTransferDetailModal
        isOpen={true}
        onClose={vi.fn()}
        transfer={mockTransfers[0]}
        onReceive={handleReceive}
        onCancel={handleCancel}
        userRole="VT-01"
      />
    );

    const cancelBtn = screen.getByText("Hủy phiếu chuyển");
    fireEvent.click(cancelBtn);

    expect(
      screen.getByText("Nhập lý do hủy phiếu chuyển hàng")
    ).toBeInTheDocument();

    const confirmCancelBtn = screen.getByText("Xác nhận hủy phiếu");
    fireEvent.click(confirmCancelBtn);

    expect(
      await screen.findByText("Vui lòng nhập lý do hủy phiếu chuyển")
    ).toBeInTheDocument();
    expect(handleCancel).not.toHaveBeenCalled();

    const reasonInput = screen.getByPlaceholderText(/Ví dụ: Đổi ý không chuyển/);
    fireEvent.change(reasonInput, { target: { value: "Khách hủy nhu cầu" } });

    fireEvent.click(confirmCancelBtn);
    expect(handleCancel).toHaveBeenCalledWith("tr-1", "Khách hủy nhu cầu");
  });

  // Test 4: Completed transfer hides action buttons
  it("does not show action buttons on a COMPLETED transfer", () => {
    renderWithProviders(
      <PosTransferDetailModal
        isOpen={true}
        onClose={vi.fn()}
        transfer={mockTransfers[1]} // status: COMPLETED
        onReceive={vi.fn()}
        onCancel={vi.fn()}
        userRole="VT-01"
      />
    );

    expect(screen.getByText("Đã nhận hàng thành công")).toBeInTheDocument();
    expect(screen.queryByText("Xác nhận đã nhận đủ hàng")).not.toBeInTheDocument();
    expect(screen.queryByText("Hủy phiếu chuyển")).not.toBeInTheDocument();
  });

  // Test 5: PosTransferDetailModal handles transfer with items=null without crashing
  it("renders safely without crashing when transfer.items is null or undefined", () => {
    const transferWithNullItems: IPosTransfer = {
      id: "tr-3",
      transferNumber: "CK-20260826-0003",
      fromPointOfSaleId: "pos-1",
      fromPointOfSaleName: "Quầy chính",
      toPointOfSaleId: "pos-2",
      toPointOfSaleName: "Chi nhánh 2",
      status: "IN_TRANSIT",
      totalItems: 0,
      items: null,
    };

    renderWithProviders(
      <PosTransferDetailModal
        isOpen={true}
        onClose={vi.fn()}
        transfer={transferWithNullItems}
        onReceive={vi.fn()}
        onCancel={vi.fn()}
        userRole="VT-01"
      />
    );

    expect(screen.getByText("CK-20260826-0003")).toBeInTheDocument();
    expect(screen.getByText("Danh sách mặt hàng chuyển (0)")).toBeInTheDocument();
  });

  // Test 6: CreatePosTransferModal renders search bar and empty state
  it("renders CreatePosTransferModal with search combobox and handles search input", () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    renderWithProviders(
      <CreatePosTransferModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    expect(
      screen.getByText("Lập phiếu chuyển hàng giữa các điểm bán")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Điểm gửi hàng (Kho xuất)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Điểm nhận hàng (Kho nhập)")
    ).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      "Gõ tên hàng hóa hoặc mã SKU để tìm kiếm và thêm vào phiếu..."
    );
    expect(searchInput).toBeInTheDocument();

    // Type into search input
    fireEvent.change(searchInput, { target: { value: "Bia" } });
    expect(searchInput).toHaveValue("Bia");

    // Click clear button
    const clearBtn = screen.getByLabelText("Xóa từ khóa tìm kiếm");
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(searchInput).toHaveValue("");
  });

  // Test 7: CreatePosTransferModal validates empty items on submission
  it("validates that at least one item is selected before submitting", async () => {
    const handleSubmit = vi.fn();

    renderWithProviders(
      <CreatePosTransferModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole("button", {
      name: /Lập phiếu chuyển hàng/i,
    });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("Vui lòng chọn ít nhất 1 mặt hàng để chuyển")
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
