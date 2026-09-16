import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { InventoryValuationPrintModal } from "@/modules/inventory_valuation/components/InventoryValuationPrintModal";
import type { IInventoryValuationReport } from "@/modules/inventory_valuation/types/IInventoryValuation";

vi.mock("@/modules/settings/services/settingsApi", () => ({
  useGetMyHouseholdQuery: () => ({
    data: {
      result: {
        name: "HỘ KINH DOANH BÁN HÀNG VIỆT",
        address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM",
        phoneNumber: "0901234567",
        taxCode: "0123456789",
      },
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockReport: IInventoryValuationReport = {
  summary: {
    asOfDate: "2026-09-16T07:00:00",
    isHistorical: false,
    totalProducts: 16,
    valuedProductsCount: 14,
    missingCostProductsCount: 2,
    totalStockQuantity: 5109.07,
    missingCostStockQuantity: 300,
    totalInventoryValue: 89513043,
    totalRetailValue: 10704889133,
    potentialGrossProfit: 10615376090,
    potentialProfitMargin: 99.16,
    averageDaysInStock: 6,
  },
  groupValuations: [
    {
      groupId: "grp-1",
      groupName: "Đồ ăn",
      productCount: 5,
      totalStockQuantity: 1251.256,
      totalInventoryValue: 68799277,
      totalRetailValue: 197185680,
      valuePercentage: 76.86,
      averageDaysInStock: 6,
    },
  ],
  items: [
    {
      productId: "prod-1",
      sku: "075468345168",
      productName: "bánh mì",
      unit: "Lon",
      groupId: "grp-1",
      groupName: "Đồ ăn",
      stockQuantity: 52,
      costPrice: 816388,
      inventoryValue: 42452157,
      retailPrice: 2754000,
      retailValue: 143208000,
      lastImportDate: "2026-09-16T07:00:00",
      daysInStock: 0,
      isNegativeStock: false,
    },
  ],
  missingCostItems: [
    {
      productId: "prod-2",
      sku: "986787089",
      productName: "ouihguihuo",
      unit: "Lon",
      groupId: null,
      groupName: null,
      stockQuantity: 10,
      retailPrice: 20000,
      warningMessage: "Chưa có giá vốn",
    },
  ],
};

describe("InventoryValuationPrintModal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <InventoryValuationPrintModal
        isOpen={false}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    expect(screen.queryByText("BÁO CÁO GIÁ TRỊ TỒN KHO THEO GIÁ VỐN")).not.toBeInTheDocument();
  });

  it("renders full accounting print sheet when isOpen is true", () => {
    const onClose = vi.fn();

    render(
      <InventoryValuationPrintModal
        isOpen={true}
        onClose={onClose}
        report={mockReport}
      />
    );

    // Title & headers
    expect(screen.getByText("Mẫu Báo Cáo Định Giá Tồn Kho Chứng Từ")).toBeInTheDocument();
    expect(screen.getByText("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")).toBeInTheDocument();
    expect(screen.getByText("Độc lập - Tự do - Hạnh phúc")).toBeInTheDocument();

    // Sections
    expect(screen.getByText("I. TỔNG HỢP GIÁ TRỊ VỐN ĐỌNG & KỲ VỌNG TÀI CHÍNH")).toBeInTheDocument();
    expect(screen.getByText("II. CƠ CẤU GIÁ TRỊ VỐN TỒN THEO NHÓM HÀNG")).toBeInTheDocument();
    expect(screen.getByText("III. DANH SÁCH CHI TIẾT TỒN KHO & GIÁ VỐN TỪNG MẶT HÀNG")).toBeInTheDocument();

    // Table data
    expect(screen.getByText("Đồ ăn")).toBeInTheDocument();
    expect(screen.getByText("bánh mì")).toBeInTheDocument();

    // Accounting Signatures
    expect(screen.getByText("Người lập báo cáo")).toBeInTheDocument();
    expect(screen.getByText("Thủ kho")).toBeInTheDocument();
    expect(screen.getByText("Chủ hộ kinh doanh")).toBeInTheDocument();
  });

  it("triggers window.print when print button is clicked", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(
      <InventoryValuationPrintModal
        isOpen={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    const buttons = screen.getAllByRole("button");
    const printBtn = buttons.find((btn) => btn.textContent?.includes("In báo cáo"));
    expect(printBtn).toBeDefined();
    if (printBtn) {
      fireEvent.click(printBtn);
      expect(printSpy).toHaveBeenCalledTimes(1);
    }
    printSpy.mockRestore();
  });
});
