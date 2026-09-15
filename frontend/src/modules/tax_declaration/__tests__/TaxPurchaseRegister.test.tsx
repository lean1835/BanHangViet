import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "@/stores";
import { TaxPurchaseKpiSummaryCards } from "../components/TaxPurchaseKpiSummaryCards";
import { MissingSupplierWarningBanner } from "../components/MissingSupplierWarningBanner";
import { TaxPurchaseRegisterAnnexTable } from "../components/TaxPurchaseRegisterAnnexTable";
import { GeneratePurchaseRegisterModal } from "../components/GeneratePurchaseRegisterModal";
import { downloadPurchaseRegisterExcel } from "../services/taxDeclarationApi";
import type { ITaxPurchaseRegisterSummaryResponse } from "../types/ITaxPurchaseRegister";

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

const mockPurchaseSummary: ITaxPurchaseRegisterSummaryResponse = {
  periodId: "period-q3-2026",
  periodName: "Bảng kê thuế Quý 3 năm 2026",
  periodType: "QUARTERLY",
  year: 2026,
  periodNumber: 3,
  startDate: "2026-07-01",
  endDate: "2026-09-30",
  status: "GENERATED",
  isLocked: false,
  grandTotalQuantity: 1250,
  grandTotalAmount: 85000000,
  eligibleForTaxDeductionAmount: 75000000,
  totalReceiptCount: 5,
  hasMissingSupplierReceipts: true,
  missingSupplierReceiptCount: 1,
  warningMessage:
    "Cảnh báo: Phát hiện 1 phiếu nhập hàng (tổng giá trị 10.000.000 đ) không có thông tin Nhà cung cấp. Các khoản này không đủ điều kiện đưa vào hồ sơ kê khai thuế hợp lệ.",
  validSuppliers: [
    {
      supplierId: "supp-001",
      supplierName: "Công ty TNHH Nông Sản Việt",
      supplierTaxCode: "0101234567",
      subtotalQuantity: 800,
      subtotalAmount: 50000000,
      receiptCount: 3,
      items: [
        {
          id: "item-01",
          receiptId: "rc-001",
          receiptNumber: "PN-2026-001",
          receiptDate: "2026-07-15T09:00:00",
          supplierId: "supp-001",
          supplierName: "Công ty TNHH Nông Sản Việt",
          supplierTaxCode: "0101234567",
          supplierInvoiceNumber: "HD-00129",
          productId: "prod-001",
          productCode: "GAO-ST25",
          productName: "Gạo ST25 Ông Cua 5kg",
          unitName: "Bao",
          baseQuantity: 500,
          basePurchasePrice: 60000,
          totalAmount: 30000000,
          isSupplierMissing: false,
        },
        {
          id: "item-02",
          receiptId: "rc-002",
          receiptNumber: "PN-2026-002",
          receiptDate: "2026-08-10T14:30:00",
          supplierId: "supp-001",
          supplierName: "Công ty TNHH Nông Sản Việt",
          supplierTaxCode: "0101234567",
          supplierInvoiceNumber: "HD-00185",
          productId: "prod-002",
          productCode: "NEP-CAI",
          productName: "Nếp Cái Hoa Vàng 1kg",
          unitName: "Kg",
          baseQuantity: 300,
          basePurchasePrice: 20000,
          totalAmount: 20000000,
          isSupplierMissing: false,
        },
      ],
    },
    {
      supplierId: "supp-002",
      supplierName: "Nhà phân phối Bánh kẹo Kinh Đô",
      supplierTaxCode: "0309876543",
      subtotalQuantity: 250,
      subtotalAmount: 25000000,
      receiptCount: 1,
      items: [
        {
          id: "item-03",
          receiptId: "rc-003",
          receiptNumber: "PN-2026-003",
          receiptDate: "2026-09-02T10:00:00",
          supplierId: "supp-002",
          supplierName: "Nhà phân phối Bánh kẹo Kinh Đô",
          supplierTaxCode: "0309876543",
          supplierInvoiceNumber: "HD-00991",
          productId: "prod-003",
          productCode: "BANH-COSY",
          productName: "Bánh Cosy Mè gói 200g",
          unitName: "Gói",
          baseQuantity: 250,
          basePurchasePrice: 100000,
          totalAmount: 25000000,
          isSupplierMissing: false,
        },
      ],
    },
  ],
  unidentifiedSuppliers: {
    supplierId: null,
    supplierName: "Chứng từ không có thông tin Nhà cung cấp",
    supplierTaxCode: null,
    subtotalQuantity: 200,
    subtotalAmount: 10000000,
    receiptCount: 1,
    items: [
      {
        id: "item-04",
        receiptId: "rc-004",
        receiptNumber: "PN-2026-004",
        receiptDate: "2026-09-20T16:00:00",
        supplierId: null,
        supplierName: "Không xác định",
        supplierTaxCode: null,
        supplierInvoiceNumber: null,
        productId: "prod-004",
        productCode: "CHAI-NUOC",
        productName: "Nước giải khát nhập lẻ chợ đầu mối",
        unitName: "Chai",
        baseQuantity: 200,
        basePurchasePrice: 50000,
        totalAmount: 10000000,
        isSupplierMissing: true,
      },
    ],
  },
};

describe("NCL-12-CN-006: Bảng kê hàng hóa mua vào theo kỳ", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // TC-01: Lập và hiển thị bảng kê hàng hóa mua vào thành công
  it("NCL-12-CN-006-TC-01: Hiển thị đúng danh sách nhóm Nhà cung cấp, subtotal và tổng toàn kỳ", () => {
    render(
      <TaxPurchaseRegisterAnnexTable
        summary={mockPurchaseSummary}
        periodLabel="Quý 3 / 2026"
      />
    );

    // Kiểm tra tên các NCC hợp lệ
    expect(
      screen.getByText(/Công ty TNHH Nông Sản Việt/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nhà phân phối Bánh kẹo Kinh Đô/i)
    ).toBeInTheDocument();

    // Kiểm tra MST
    expect(screen.getByText("0101234567")).toBeInTheDocument();
    expect(screen.getByText("0309876543")).toBeInTheDocument();

    // Kiểm tra các mặt hàng
    expect(screen.getByText("Gạo ST25 Ông Cua 5kg")).toBeInTheDocument();
    expect(screen.getByText("Bánh Cosy Mè gói 200g")).toBeInTheDocument();

    // Kiểm tra dòng tổng cộng toàn kỳ
    expect(
      screen.getByText(/TỔNG CỘNG HÀNG HÓA MUA VÀO TOÀN KỲ/i)
    ).toBeInTheDocument();
  });

  // TC-02: Phiếu nhập thiếu NCC -> Gom riêng vào unidentifiedSuppliers kèm cảnh báo
  it("NCL-12-CN-006-TC-02: Gom riêng chứng từ thiếu NCC vào unidentifiedSuppliers kèm cảnh báo loại trừ", () => {
    render(
      <>
        <MissingSupplierWarningBanner
          missingCount={mockPurchaseSummary.missingSupplierReceiptCount}
          missingAmount={
            mockPurchaseSummary.unidentifiedSuppliers?.subtotalAmount || 0
          }
          customMessage={mockPurchaseSummary.warningMessage}
        />
        <TaxPurchaseRegisterAnnexTable
          summary={mockPurchaseSummary}
          periodLabel="Quý 3 / 2026"
        />
      </>
    );

    // Kiểm tra Banner cảnh báo thiếu NCC
    expect(
      screen.getByText(/Cảnh báo chứng từ không đủ điều kiện kê khai thuế/i)
    ).toBeInTheDocument();
    expect(screen.getByText("1 phiếu")).toBeInTheDocument();

    // Kiểm tra khối gom riêng chứng từ thiếu NCC
    expect(
      screen.getByText(/CHỨNG TỪ THIẾU THÔNG TIN NHÀ CUNG CẤP/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Không đưa vào hồ sơ kê khai/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nước giải khát nhập lẻ chợ đầu mối")
    ).toBeInTheDocument();
  });

  // TC-03: Thẻ KPI mua vào hiển thị chi phí đủ điều kiện và cảnh báo
  it("NCL-12-CN-006-KPI: Render 4 thẻ KPI mua vào phản ánh đúng tổng tiền và chi phí hợp lệ", () => {
    render(<TaxPurchaseKpiSummaryCards summary={mockPurchaseSummary} />);

    expect(screen.getByText("Tổng giá trị mua vào")).toBeInTheDocument();
    expect(screen.getByText("Đủ điều kiện kê khai")).toBeInTheDocument();
    expect(screen.getByText("Tổng số lượng nhập")).toBeInTheDocument();
    expect(screen.getByText("Chứng từ thiếu NCC")).toBeInTheDocument();
    expect(screen.getByText("1 phiếu")).toBeInTheDocument();
  });

  // TC-04: Tìm kiếm theo từ khóa trong bảng kê mua vào
  it("NCL-12-CN-006-SEARCH: Lọc danh sách mặt hàng mua vào theo từ khóa tìm kiếm", () => {
    render(
      <TaxPurchaseRegisterAnnexTable
        summary={mockPurchaseSummary}
        periodLabel="Quý 3 / 2026"
      />
    );

    const searchInput = screen.getByPlaceholderText(
      /Tìm theo mã hàng, tên hàng, số phiếu/i
    );
    fireEvent.change(searchInput, { target: { value: "ST25" } });

    // Mặt hàng ST25 vẫn còn
    expect(screen.getByText("Gạo ST25 Ông Cua 5kg")).toBeInTheDocument();
    // Mặt hàng Bánh Cosy bị lọc mất
    expect(
      screen.queryByText("Bánh Cosy Mè gói 200g")
    ).not.toBeInTheDocument();
  });

  // TC-05: Modal Lập bảng kê mua vào
  it("NCL-12-CN-006-MODAL: Render Modal lập bảng kê mua vào với tùy chọn Tháng/Quý", () => {
    render(
      <Provider store={store}>
        <GeneratePurchaseRegisterModal
          isOpen={true}
          onClose={() => {}}
          defaultPeriodType="QUARTERLY"
          defaultYear={2026}
          defaultPeriodNumber={3}
        />
      </Provider>
    );

    expect(
      screen.getByText(/Lập bảng kê hàng hóa mua vào/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Theo Quý \(3 tháng\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Theo Tháng/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Tổng hợp bảng kê mua vào/i)
    ).toBeInTheDocument();
  });

  // TC-06: Xuất tệp Excel bảng kê mua vào (downloadPurchaseRegisterExcel)
  it("NCL-12-CN-006-EXPORT: Gọi đúng API export-purchase-register và tạo blob tải tệp", async () => {
    const mockBlob = new Blob(["mock-excel-binary"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as Response);

    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    await downloadPurchaseRegisterExcel("period-q3-2026", "Bang_ke_mua_vao_Q3_2026.xlsx");

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/tax-periods/period-q3-2026/export-purchase-register"),
      expect.objectContaining({ method: "GET" })
    );
    expect(createObjectURLMock).toHaveBeenCalledWith(mockBlob);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/test");
  });

  // TC-07: Phân trang đồng nhất 8 records
  it("NCL-12-CN-006-PAGINATION: Hiển thị phân trang 8 records và chuyển trang chính xác", () => {
    // Tạo mock dữ liệu có 10 dòng hàng (vượt quá 8 records/trang)
    const tenItems = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i + 1}`,
      receiptId: `rc-${i + 1}`,
      receiptNumber: `PN-2026-${String(i + 1).padStart(3, "0")}`,
      receiptDate: "2026-07-15T09:00:00",
      supplierId: "supp-001",
      supplierName: "Công ty TNHH Nông Sản Việt",
      supplierTaxCode: "0101234567",
      supplierInvoiceNumber: `HD-${i + 100}`,
      productId: `prod-${i + 1}`,
      productCode: `PROD-${i + 1}`,
      productName: `Mặt hàng thử nghiệm ${i + 1}`,
      unitName: "Gói",
      baseQuantity: 10,
      basePurchasePrice: 10000,
      totalAmount: 100000,
      isSupplierMissing: false,
    }));

    const summaryWith10Items: ITaxPurchaseRegisterSummaryResponse = {
      ...mockPurchaseSummary,
      validSuppliers: [
        {
          supplierId: "supp-001",
          supplierName: "Công ty TNHH Nông Sản Việt",
          supplierTaxCode: "0101234567",
          subtotalQuantity: 100,
          subtotalAmount: 1000000,
          receiptCount: 10,
          items: tenItems,
        },
      ],
      unidentifiedSuppliers: null,
    };

    render(
      <TaxPurchaseRegisterAnnexTable
        summary={summaryWith10Items}
        periodLabel="Quý 3 / 2026"
      />
    );

    // Trang 1: Hiển thị 8 records đầu (Mặt hàng 1 đến 8)
    expect(screen.getByText("Mặt hàng thử nghiệm 1")).toBeInTheDocument();
    expect(screen.getByText("Mặt hàng thử nghiệm 8")).toBeInTheDocument();
    expect(screen.queryByText("Mặt hàng thử nghiệm 9")).not.toBeInTheDocument();
    expect(screen.getByText(/Hiển thị bản ghi từ/i)).toBeInTheDocument();
    expect(screen.getByText(/Trang 1 \/ 2/i)).toBeInTheDocument();

    // Bấm nút chuyển sang Trang 2
    const nextBtn = screen.getByRole("button", { name: /Trang sau/i });
    fireEvent.click(nextBtn);

    // Trang 2: Hiển thị 2 records còn lại (Mặt hàng 9 và 10)
    expect(screen.getByText("Mặt hàng thử nghiệm 9")).toBeInTheDocument();
    expect(screen.getByText("Mặt hàng thử nghiệm 10")).toBeInTheDocument();
    expect(screen.queryByText("Mặt hàng thử nghiệm 1")).not.toBeInTheDocument();
    expect(screen.getByText(/Trang 2 \/ 2/i)).toBeInTheDocument();
  });
});
