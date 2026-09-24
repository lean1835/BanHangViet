import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { ImportProductsModal } from "@/modules/product/components/ImportProductsModal";
import * as productApiModule from "@/modules/product/services/productApi";
import * as taxRateApiModule from "@/modules/settings/services/taxRateApi";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

vi.mock("@/providers/DashboardDemoProvider", () => ({
  useDashboardDemo: () => ({
    addLogEntry: vi.fn(),
  }),
}));

let mockSheetRows: any[] = [];

vi.mock("xlsx", async () => {
  const actual: any = await vi.importActual("xlsx");
  return {
    ...actual,
    read: () => ({
      SheetNames: ["Danh_Muc_Hang_Hoa"],
      Sheets: { Danh_Muc_Hang_Hoa: {} },
    }),
    utils: {
      ...actual.utils,
      sheet_to_json: () => mockSheetRows,
      book_new: () => ({ SheetNames: [], Sheets: {} }),
      book_append_sheet: vi.fn(),
      aoa_to_sheet: vi.fn(),
    },
    write: () => new Uint8Array([1, 2, 3]),
  };
});

describe("ImportProductsModal with Pagination & O(N) Batch Validation", () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });

  const mockImportMutation = vi.fn().mockReturnValue({
    unwrap: vi.fn().mockResolvedValue({
      totalRows: 2,
      successCount: 2,
      errorCount: 0,
      errors: [],
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSheetRows = [];

    vi.spyOn(productApiModule, "useGetProductsQuery").mockReturnValue({
      data: {
        content: [{ id: "p1", sku: "SP_EXISTING", name: "Sản phẩm cũ" }],
      },
      isLoading: false,
    } as any);

    vi.spyOn(productApiModule, "useImportProductsMutation").mockReturnValue([
      mockImportMutation,
      { isLoading: false },
    ] as any);

    vi.spyOn(taxRateApiModule, "useGetTaxRatesQuery").mockReturnValue({
      data: [
        { id: 1, ratePercentage: 10, isActive: true },
        { id: 2, ratePercentage: 8, isActive: true },
        { id: 3, ratePercentage: 5, isActive: true },
        { id: 4, ratePercentage: 0, isActive: true },
      ],
      isLoading: false,
    } as any);
  });

  it("renders modal with file upload zone and template download button", () => {
    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <ImportProductsModal
            isOpen={true}
            onClose={vi.fn()}
            onImportSuccess={vi.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByText("Nhập danh mục hàng hóa từ tệp Excel")
    ).toBeInTheDocument();
    expect(screen.getByText("Tải tệp mẫu")).toBeInTheDocument();
    expect(
      screen.getByText(/Kéo thả tệp Excel vào đây/)
    ).toBeInTheDocument();
  });

  it("parses 100 rows, validates O(N), and paginates properly with 50 rows per page", async () => {
    // Generate 120 mock rows
    mockSheetRows = Array.from({ length: 120 }, (_, i) => ({
      "Mã SKU": `SP_NEW_${i + 1}`,
      "Tên hàng hóa": `Mặt hàng thử nghiệm ${i + 1}`,
      "Đơn vị tính": "Hộp",
      "Giá bán": 50000 + i * 1000,
      "% Thuế suất": "10%",
      "Tên nhóm hàng": "Thực phẩm",
      "Tồn ban đầu": 100,
    }));

    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <ImportProductsModal
            isOpen={true}
            onClose={vi.fn()}
            onImportSuccess={vi.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["dummy"], "10k_sample.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    fireEvent.change(input, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Tất cả \(120\)/i)).toBeInTheDocument();
    });

    // Pagination verification: Displays 50 rows on page 1
    expect(screen.getByText(/Trang 1 \/ 3/i)).toBeInTheDocument();

    // Check first and 50th row are in the DOM
    expect(screen.getByDisplayValue("SP_NEW_1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("SP_NEW_50")).toBeInTheDocument();
    // 51st row is NOT on page 1
    expect(screen.queryByDisplayValue("SP_NEW_51")).not.toBeInTheDocument();

    // Click Next Page
    const nextButton = screen.getByTitle("Trang sau");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Trang 2 \/ 3/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("SP_NEW_51")).toBeInTheDocument();
    });
  });

  it("detects duplicate SKU within file and flags error without crashing", async () => {
    mockSheetRows = [
      {
        "Mã SKU": "SP_DUP_001",
        "Tên hàng hóa": "Hàng trùng 1",
        "Đơn vị tính": "Hộp",
        "Giá bán": 50000,
        "% Thuế suất": "10%",
      },
      {
        "Mã SKU": "SP_DUP_001",
        "Tên hàng hóa": "Hàng trùng 2",
        "Đơn vị tính": "Hộp",
        "Giá bán": 60000,
        "% Thuế suất": "10%",
      },
    ];

    render(
      <Provider store={createTestStore()}>
        <MemoryRouter>
          <ImportProductsModal
            isOpen={true}
            onClose={vi.fn()}
            onImportSuccess={vi.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(["dummy"], "dup_test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    fireEvent.change(input, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Bị lỗi \(2\)/i)).toBeInTheDocument();
    });

    // Both rows should show error badge
    const errorBadges = screen.getAllByText("Bị lỗi");
    expect(errorBadges.length).toBeGreaterThanOrEqual(2);
  });
});
