import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PointOfSaleTable } from "@/modules/point_of_sale/components/PointOfSaleTable";
import { PointOfSaleModal } from "@/modules/point_of_sale/components/PointOfSaleModal";
import { DeletePointOfSaleModal } from "@/modules/point_of_sale/components/DeletePointOfSaleModal";
import { SetDefaultPosModal } from "@/modules/point_of_sale/components/SetDefaultPosModal";
import { PosInventoryTable } from "@/modules/point_of_sale/components/PosInventoryTable";
import { UpdatePosInventoryModal } from "@/modules/point_of_sale/components/UpdatePosInventoryModal";
import type { IPointOfSale, IPosInventory } from "@/modules/point_of_sale/types/IPointOfSale";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockPosList: IPointOfSale[] = [
  {
    id: "pos-1",
    posCode: "POS-01",
    name: "Quầy chính - 12 Lê Lợi",
    address: "12 Lê Lợi, P. Bến Nghé, Quận 1, TP.HCM",
    phoneNumber: "0988111222",
    invoiceSymbol: "C26TAA",
    isDefault: true,
    isActive: true,
  },
  {
    id: "pos-2",
    posCode: "POS-02",
    name: "Chi nhánh 2 - Bến Thành",
    address: "Cửa Tây Chợ Bến Thành, Quận 1, TP.HCM",
    phoneNumber: "0988333444",
    invoiceSymbol: "C26TAB",
    isDefault: false,
    isActive: true,
  },
  {
    id: "pos-3",
    posCode: "POS-03",
    name: "Chi nhánh 3 - Kho Đóng",
    address: "99 Võ Văn Ngân, Thủ Đức",
    phoneNumber: null,
    invoiceSymbol: null,
    isDefault: false,
    isActive: false,
  },
];

const mockInventories: IPosInventory[] = [
  {
    id: "inv-1",
    pointOfSaleId: "pos-1",
    pointOfSaleName: "Quầy chính - 12 Lê Lợi",
    posCode: "POS-01",
    productId: "prod-1",
    productSku: "BIA-SG-01",
    productName: "Bia Sài Gòn Special 330ml",
    unit: "Lon",
    price: 15000,
    stockQuantity: 45,
    minStockQuantity: 10,
    isLowStock: false,
    groupName: "Đồ uống",
  },
  {
    id: "inv-2",
    pointOfSaleId: "pos-1",
    pointOfSaleName: "Quầy chính - 12 Lê Lợi",
    posCode: "POS-01",
    productId: "prod-2",
    productSku: "GAO-ST25-05",
    productName: "Gạo ST25 Ông Cua 5kg",
    unit: "Túi",
    price: 180000,
    stockQuantity: 2,
    minStockQuantity: 5,
    isLowStock: true,
    groupName: "Lương thực",
  },
];

describe("PointOfSale Module (NCL-17-CN-001 & NCL-17-CN-002)", () => {
  // Test 1: Render PointOfSaleTable
  it("renders PointOfSaleTable with POS items, default badge, and actions", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleSetDefault = vi.fn();
    const handleAssign = vi.fn();

    render(
      <PointOfSaleTable
        data={mockPosList}
        totalElements={3}
        totalPages={1}
        currentPage={0}
        pageSize={10}
        onPageChange={vi.fn()}
        searchTerm=""
        onSearchChange={vi.fn()}
        statusFilter="ALL"
        onStatusFilterChange={vi.fn()}
        isLoading={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
        onAssignEmployees={handleAssign}
        onAddNew={vi.fn()}
        userRole="VT-01"
      />
    );

    expect(screen.getByText("Quầy chính - 12 Lê Lợi")).toBeInTheDocument();
    expect(screen.getByText("POS-01")).toBeInTheDocument();
    expect(screen.getByText("C26TAA")).toBeInTheDocument();
    expect(screen.getAllByText("Mặc định").length).toBeGreaterThan(0);
    expect(screen.getByText("Chi nhánh 2 - Bến Thành")).toBeInTheDocument();
    expect(screen.getByText("Ngừng")).toBeInTheDocument();
  });

  // Test 2: PointOfSaleModal form validation and submit
  it("validates required fields in PointOfSaleModal and prevents submit if empty", async () => {
    const handleSubmit = vi.fn();

    render(
      <PointOfSaleModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        initialData={null}
        isLoading={false}
      />
    );

    const submitBtn = screen.getByText("Lưu điểm bán");
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Vui lòng nhập tên điểm bán")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  // Test 3: PointOfSaleModal validates invoiceSymbol format (NCL-17-CN-001-TC-02)
  it("validates invalid invoice symbol in PointOfSaleModal", async () => {
    const handleSubmit = vi.fn();

    render(
      <PointOfSaleModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        initialData={null}
        isLoading={false}
      />
    );

    const nameInput = screen.getByPlaceholderText("Ví dụ: Tạp hóa Bà Năm - Chi nhánh 2");
    const addressInput = screen.getByPlaceholderText(/Ví dụ: Số 12 đường Lê Lợi/);
    const invoiceSymbolInput = screen.getByPlaceholderText("Ví dụ: C26TAA");

    fireEvent.change(nameInput, { target: { value: "Chi nhánh Mới" } });
    fireEvent.change(addressInput, { target: { value: "100 Nguyễn Huệ" } });
    fireEvent.change(invoiceSymbolInput, { target: { value: "???" } });

    fireEvent.click(screen.getByText("Lưu điểm bán"));

    expect(
      await screen.findByText(/Ký hiệu hóa đơn không hợp lệ/)
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  // Test 4: DeletePointOfSaleModal protects default POS
  it("blocks deleting a default point of sale", () => {
    render(
      <DeletePointOfSaleModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        pointOfSale={mockPosList[0]} // isDefault: true
        isLoading={false}
      />
    );

    expect(screen.getByText("Không thể xóa điểm bán mặc định")).toBeInTheDocument();
    expect(screen.queryByText("Xóa điểm bán")).not.toBeInTheDocument();
    expect(screen.getByText("Đã hiểu")).toBeInTheDocument();
  });

  // Test 5: DeletePointOfSaleModal allows deleting non-default POS
  it("allows deleting a non-default point of sale", async () => {
    const handleConfirm = vi.fn();

    render(
      <DeletePointOfSaleModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        pointOfSale={mockPosList[1]} // isDefault: false
        isLoading={false}
      />
    );

    const deleteBtn = screen.getByText("Xóa điểm bán");
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  // Test 6: SetDefaultPosModal confirms default switch
  it("confirms setting default point of sale", () => {
    const handleConfirm = vi.fn();

    render(
      <SetDefaultPosModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        pointOfSale={mockPosList[1]}
        isLoading={false}
      />
    );

    expect(
      screen.getByText(/Bạn có muốn đặt điểm bán/)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Xác nhận đặt mặc định"));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  // Test 7: PosInventoryTable renders stock and low-stock warning
  it("renders PosInventoryTable with stock quantity, warning badges, and low stock filter", () => {
    const handleEdit = vi.fn();
    const handleLowStockChange = vi.fn();

    render(
      <PosInventoryTable
        data={mockInventories}
        totalElements={2}
        totalPages={1}
        currentPage={0}
        pageSize={10}
        onPageChange={vi.fn()}
        searchTerm=""
        onSearchChange={vi.fn()}
        lowStockOnly={false}
        onLowStockOnlyChange={handleLowStockChange}
        isLoading={false}
        onEdit={handleEdit}
        userRole="VT-01"
      />
    );

    expect(screen.getByText("Bia Sài Gòn Special 330ml")).toBeInTheDocument();
    expect(screen.getByText("Gạo ST25 Ông Cua 5kg")).toBeInTheDocument();
    expect(screen.getByText("Đủ tồn")).toBeInTheDocument();
    expect(screen.getByText("Sắp hết")).toBeInTheDocument();

    const lowStockCheckbox = screen.getByRole("checkbox");
    fireEvent.click(lowStockCheckbox);
    expect(handleLowStockChange).toHaveBeenCalled();
  });

  // Test 8: UpdatePosInventoryModal updates inventory
  it("submits updated stock quantity in UpdatePosInventoryModal", async () => {
    const handleSubmit = vi.fn();

    render(
      <UpdatePosInventoryModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        inventory={mockInventories[0]}
        isLoading={false}
      />
    );

    expect(screen.getByText("Bia Sài Gòn Special 330ml (BIA-SG-01)")).toBeInTheDocument();

    const saveBtn = screen.getByText("Lưu thay đổi");
    fireEvent.click(saveBtn);

    expect(handleSubmit).toHaveBeenCalledWith({
      stockQuantity: 45,
      minStockQuantity: 10,
    });
  });
});
