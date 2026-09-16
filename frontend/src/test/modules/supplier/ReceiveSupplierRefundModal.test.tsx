import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ReceiveSupplierRefundModal } from "@/modules/supplier/components/ReceiveSupplierRefundModal";
import { SupplierTable } from "@/modules/supplier/components/SupplierTable";
import type { ISupplier } from "@/modules/supplier/types/ISupplier";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockSupplierWithNegativeDebt: ISupplier = {
  id: "sup-neg-1",
  householdId: "hh-1",
  name: "Nhà Cung Cấp Thái Nguyên",
  phoneNumber: "068481215",
  address: "Thái Nguyên",
  currentDebt: -500000,
  status: "ACTIVE",
  createdAt: "2026-09-16T00:00:00Z",
  updatedAt: "2026-09-16T00:00:00Z",
};

describe("ReceiveSupplierRefundModal & Negative Debt Handling", () => {
  it("renders negative debt as credit balance in SupplierTable", () => {
    render(
      <SupplierTable
        suppliers={[mockSupplierWithNegativeDebt]}
        isLoading={false}
        canManage={true}
        canPayDebt={true}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onViewDetail={vi.fn()}
        onPayDebt={vi.fn()}
        onReceiveRefund={vi.fn()}
      />
    );

    // Should not show negative string "-500.000", but friendly label "NCC nợ: 500.000 đ"
    expect(screen.getByText(/NCC nợ: 500\.000/i)).toBeInTheDocument();
    expect(screen.getByText(/Dư có \/ Cần thu hoàn/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Thu tiền hoàn.*từ nhà cung cấp/i)).toBeInTheDocument();
  });

  it("triggers onReceiveRefund when clicking refund icon in SupplierTable", () => {
    const handleReceiveRefund = vi.fn();
    render(
      <SupplierTable
        suppliers={[mockSupplierWithNegativeDebt]}
        isLoading={false}
        canManage={true}
        canPayDebt={true}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onViewDetail={vi.fn()}
        onPayDebt={vi.fn()}
        onReceiveRefund={handleReceiveRefund}
      />
    );

    const refundBtn = screen.getByTitle(/Thu tiền hoàn.*từ nhà cung cấp/i);
    fireEvent.click(refundBtn);
    expect(handleReceiveRefund).toHaveBeenCalledWith(mockSupplierWithNegativeDebt);
  });

  it("renders ReceiveSupplierRefundModal with max refundable amount prefilled and submits", () => {
    const handleConfirm = vi.fn();
    render(
      <ReceiveSupplierRefundModal
        isOpen={true}
        onClose={vi.fn()}
        supplier={mockSupplierWithNegativeDebt}
        onConfirmRefund={handleConfirm}
      />
    );

    expect(screen.getByText("Thu Tiền Hoàn Từ Nhà Cung Cấp")).toBeInTheDocument();
    expect(screen.getAllByText(/Nhà Cung Cấp Thái Nguyên/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/500\.000/i).length).toBeGreaterThan(0);

    const submitBtn = screen.getByText("Xác nhận đã thu tiền");
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith({
      supplierId: "sup-neg-1",
      amount: 500000,
      paymentMethod: "CASH",
      notes: "Thu tiền hoàn từ nhà cung cấp Nhà Cung Cấp Thái Nguyên do trả hàng",
    });
  });

  it("calculates partial refund correctly with percentage buttons", () => {
    const handleConfirm = vi.fn();
    render(
      <ReceiveSupplierRefundModal
        isOpen={true}
        onClose={vi.fn()}
        supplier={mockSupplierWithNegativeDebt}
        onConfirmRefund={handleConfirm}
      />
    );

    const halfBtn = screen.getByText("50%");
    fireEvent.click(halfBtn);

    const submitBtn = screen.getByText("Xác nhận đã thu tiền");
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith({
      supplierId: "sup-neg-1",
      amount: 250000,
      paymentMethod: "CASH",
      notes: "Thu tiền hoàn từ nhà cung cấp Nhà Cung Cấp Thái Nguyên do trả hàng",
    });
  });
});
