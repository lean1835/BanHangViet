import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { InventoryAuditTable } from "@/modules/inventory_audit/components/InventoryAuditTable";
import { InventoryAuditModal } from "@/modules/inventory_audit/components/InventoryAuditModal";
import { InventoryAuditSidebar } from "@/modules/inventory_audit/components/InventoryAuditSidebar";
import type { IInventoryAudit } from "@/modules/inventory_audit/types/IInventoryAudit";
import type { IProduct } from "@/modules/product/types/IProduct";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";

afterEach(() => {
  cleanup();
});

// Helper to wrap with redux provider
const renderWithRedux = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(<Provider store={store}>{ui}</Provider>);
};

describe("InventoryAuditTable Component", () => {
  it("renders empty state when audits list is empty", () => {
    render(
      <InventoryAuditTable
        audits={[]}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={0}
        onPageChange={vi.fn()}
        onSelectAudit={vi.fn()}
      />
    );

    expect(
      screen.getByText("Chưa có phiếu kiểm kê nào được thực hiện.")
    ).toBeInTheDocument();
  });

  it("renders audit rows correctly with formatted numbers and difference badges", () => {
    const mockAudits: IInventoryAudit[] = [
      {
        id: "audit-1",
        auditNumber: "KK-20260820-0001",
        auditDate: "2026-08-20T10:00:00",
        status: "COMPLETED",
        totalItems: 3,
        totalDifferenceQty: -2,
        createdByUserId: "user-1",
        createdByUserName: "Chủ Hộ Anh Nam",
        notes: "Kiểm kê định kỳ",
        createdAt: "2026-08-20T10:00:00",
      },
      {
        id: "audit-2",
        auditNumber: "KK-20260820-0002",
        auditDate: "2026-08-20T11:00:00",
        status: "COMPLETED",
        totalItems: 5,
        totalDifferenceQty: 4,
        createdByUserId: "user-1",
        createdByUserName: "Chủ Hộ Anh Nam",
        notes: null,
        createdAt: "2026-08-20T11:00:00",
      },
    ];

    const onSelectAudit = vi.fn();

    render(
      <InventoryAuditTable
        audits={mockAudits}
        isLoading={false}
        page={0}
        pageSize={10}
        totalPages={1}
        totalElements={2}
        onPageChange={vi.fn()}
        onSelectAudit={onSelectAudit}
      />
    );

    expect(screen.getByText("KK-20260820-0001")).toBeInTheDocument();
    expect(screen.getByText("KK-20260820-0002")).toBeInTheDocument();
    expect(screen.getByText("-2")).toBeInTheDocument();
    expect(screen.getByText("+4")).toBeInTheDocument();
    expect(screen.getByText("3 mặt hàng")).toBeInTheDocument();

    // Click on row
    fireEvent.click(screen.getByText("KK-20260820-0001"));
    expect(onSelectAudit).toHaveBeenCalledWith("audit-1");
  });
});

describe("InventoryAuditSidebar Component", () => {
  it("triggers filter callback when changing filter status", () => {
    const onFilterChange = vi.fn();
    const filter = {
      search: "",
      statusFilter: "ALL",
      dateFrom: "",
      dateTo: "",
    };

    render(
      <InventoryAuditSidebar filter={filter} onFilterChange={onFilterChange} />
    );

    const selectElement = screen.getByLabelText("Tiêu chí chênh lệch");
    fireEvent.change(selectElement, { target: { value: "HAS_DIFFERENCE" } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ statusFilter: "HAS_DIFFERENCE" })
    );
  });
});

describe("InventoryAuditModal Component", () => {
  const mockProducts: IProduct[] = [
    {
      id: "prod-1",
      sku: "89350011",
      name: "Sữa Tươi Tiệt Trùng 100ml",
      unit: "Hộp",
      price: 10000,
      stockQuantity: 12,
      status: "ACTIVE",
      groupId: null,
      groupName: null,
      taxRateId: "tax-1",
      taxRateName: "Thuế 1%",
      taxRatePercentage: 1,
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
    },
    {
      id: "prod-2",
      sku: "89350022",
      name: "Bánh Quy Bơ Danisa 454g",
      unit: "Hộp",
      price: 120000,
      stockQuantity: 5,
      status: "ACTIVE",
      groupId: null,
      groupName: null,
      taxRateId: "tax-1",
      taxRateName: "Thuế 1%",
      taxRatePercentage: 1,
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
    },
  ];

  it("adds all products when clicking 'Thêm tất cả sản phẩm đang bán'", async () => {
    renderWithRedux(
      <InventoryAuditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        products={mockProducts}
      />
    );

    const addAllBtn = screen.getByText("Thêm tất cả sản phẩm đang bán");
    fireEvent.click(addAllBtn);

    expect(screen.getByText("Sữa Tươi Tiệt Trùng 100ml")).toBeInTheDocument();
    expect(screen.getByText("Bánh Quy Bơ Danisa 454g")).toBeInTheDocument();
  });

  it("calculates difference quantity in real-time and validates reason requirement", async () => {
    renderWithRedux(
      <InventoryAuditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        products={mockProducts}
      />
    );

    // Add all products
    fireEvent.click(screen.getByText("Thêm tất cả sản phẩm đang bán"));

    // Find actual quantity inputs
    const inputs = screen.getAllByRole("textbox");
    // Change actual quantity of first product from 12 to 10 (difference = -2)
    // Find the input containing '12'
    const actualQtyInput = inputs.find((inp) => (inp as HTMLInputElement).value === "12");
    expect(actualQtyInput).toBeDefined();
    if (actualQtyInput) {
      fireEvent.change(actualQtyInput, { target: { value: "10" } });
    }

    // Check difference badge is displayed in table and summary box
    expect(screen.getAllByText("-2").length).toBeGreaterThanOrEqual(1);

    // Click submit without entering reason -> Should block and show error
    const submitBtn = screen.getByText("Xác nhận & Cập nhật tồn kho");
    fireEvent.click(submitBtn);

    expect(
      screen.getAllByText(
        "Vui lòng nhập lý do điều chỉnh cho tất cả các mặt hàng có chênh lệch tồn."
      ).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("handles products with negative system stock by defaulting actual quantity to 0 and calculating positive difference", async () => {
    const negativeStockProducts: IProduct[] = [
      {
        id: "prod-negative",
        sku: "89350099",
        name: "Nước Ngọt Coca Cola 330ml",
        unit: "Lon",
        price: 10000,
        stockQuantity: -5,
        status: "ACTIVE",
        groupId: null,
        groupName: null,
        taxRateId: "tax-1",
        taxRateName: "Thuế 1%",
        taxRatePercentage: 1,
        createdAt: "2026-08-20",
        updatedAt: "2026-08-20",
      },
    ];

    renderWithRedux(
      <InventoryAuditModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        products={negativeStockProducts}
      />
    );

    fireEvent.click(screen.getByText("Thêm tất cả sản phẩm đang bán"));

    // Tồn máy should display -5
    expect(screen.getByText("-5")).toBeInTheDocument();
    // Actual quantity should default to 0 (non-negative)
    const inputs = screen.getAllByRole("textbox");
    const actualQtyInput = inputs.find((inp) => (inp as HTMLInputElement).value === "0");
    expect(actualQtyInput).toBeDefined();

    // Difference should be +5 (0 - (-5) = +5)
    expect(screen.getAllByText("+5").length).toBeGreaterThanOrEqual(1);
  });
});
