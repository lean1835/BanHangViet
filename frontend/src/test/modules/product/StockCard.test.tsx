import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import {
  DashboardDemoContext,
  type IDashboardDemoContext,
} from "@/providers/DashboardDemoProvider";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import { StockCardSummaryCards } from "@/modules/product/components/StockCardSummaryCards";
import { StockCardFilterBar } from "@/modules/product/components/StockCardFilterBar";
import { StockCardTable } from "@/modules/product/components/StockCardTable";
import { StockCardModal } from "@/modules/product/components/StockCardModal";
import { StockCardPage } from "@/modules/product/pages/StockCardPage";
import { ProductList } from "@/modules/product/components/ProductList";
import { ProductDetailPage } from "@/modules/product/pages/ProductDetailPage";
import type { IStockMovement, IStockCardResponse } from "@/modules/product/types/IStockCard";
import type { IProduct } from "@/modules/product/types/IProduct";
import {
  STOCK_MOVEMENT_TYPE,
  STOCK_CARD_MESSAGES,
} from "@/constants/product";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "prod-1" }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock Sample Movements (TC-01)
const mockMovements: IStockMovement[] = [
  {
    id: "init-1",
    documentId: "prod-1",
    documentType: STOCK_MOVEMENT_TYPE.INITIAL_STOCK,
    documentTypeName: "Tồn kho ban đầu khi tạo sản phẩm",
    documentNumber: "SP001",
    documentUrl: "/products?id=prod-1",
    timestamp: "2026-08-01T08:00:00",
    changeType: "IN",
    quantityIn: 50,
    quantityOut: 0,
    quantityChange: 50,
    balanceAfter: 50,
    performedBy: "Chủ hộ",
    notes: "Khởi tạo tồn đầu",
  },
  {
    id: "gr-1",
    documentId: "rec-101",
    documentType: STOCK_MOVEMENT_TYPE.GOODS_RECEIPT,
    documentTypeName: "Phiếu nhập kho",
    documentNumber: "PNK-0001",
    documentUrl: "/products/stock-entry?id=rec-101",
    timestamp: "2026-08-05T10:00:00",
    changeType: "IN",
    quantityIn: 100,
    quantityOut: 0,
    quantityChange: 100,
    balanceAfter: 150,
    performedBy: "Chủ hộ",
    notes: "Nhập từ NCC Vinamilk",
  },
  {
    id: "ord-1",
    documentId: "order-201",
    documentType: STOCK_MOVEMENT_TYPE.SALE_ORDER,
    documentTypeName: "Hóa đơn bán hàng",
    documentNumber: "HD-0001",
    documentUrl: "/orders?id=order-201",
    timestamp: "2026-08-10T14:30:00",
    changeType: "OUT",
    quantityIn: 0,
    quantityOut: 30,
    quantityChange: -30,
    balanceAfter: 120,
    performedBy: "Nhân viên Bán hàng",
    notes: "Bán hàng theo đơn HD-0001",
  },
  {
    id: "audit-1",
    documentId: "audit-301",
    documentType: STOCK_MOVEMENT_TYPE.INVENTORY_AUDIT,
    documentTypeName: "Phiếu kiểm kê kho",
    documentNumber: "PKK-0001",
    documentUrl: "/products/inventory-audits?id=audit-301",
    timestamp: "2026-08-15T16:00:00",
    changeType: "OUT",
    quantityIn: 0,
    quantityOut: 5,
    quantityChange: -5,
    balanceAfter: 115,
    performedBy: "Chủ hộ",
    notes: "Hao hụt kiểm kê cuối tuần",
  },
  {
    id: "ret-1",
    documentId: "ret-401",
    documentType: STOCK_MOVEMENT_TYPE.CUSTOMER_RETURN,
    documentTypeName: "Phiếu khách trả hàng",
    documentNumber: "PTH-0001",
    documentUrl: "/return-tickets?id=ret-401",
    timestamp: "2026-08-18T09:00:00",
    changeType: "IN",
    quantityIn: 2,
    quantityOut: 0,
    quantityChange: 2,
    balanceAfter: 117,
    performedBy: "Chủ hộ",
    notes: "Khách đổi lon khác",
  },
];

const mockStockCardData: IStockCardResponse = {
  productId: "prod-1",
  productSku: "SP001",
  productName: "Sữa đặc Ông Thọ đỏ 380g",
  unit: "Lon",
  fromDate: "2026-08-01",
  toDate: "2026-08-31",
  openingStock: 50,
  totalQuantityIn: 102,
  totalQuantityOut: 35,
  closingStock: 117,
  currentStock: 117,
  isDiscrepancy: false,
  warning: null,
  movements: {
    content: mockMovements,
    pageNumber: 0,
    pageSize: 20,
    totalElements: 5,
    totalPages: 1,
    last: true,
  },
};

const mockSampleProduct: IProduct = {
  id: "prod-1",
  sku: "SP001",
  name: "Sữa đặc Ông Thọ đỏ 380g",
  unit: "Lon",
  price: 24000,
  stockQuantity: 117,
  minStockQuantity: 10,
  status: "ACTIVE",
  groupId: null,
  groupName: null,
  taxRateId: "tax-1",
  taxRateName: "Thuế 1%",
  taxRatePercentage: 1,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

// Mock productApi hooks
vi.mock("@/modules/product/services/productApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/product/services/productApi")>();
  return {
    ...actual,
    useGetProductsQuery: vi.fn(() => ({
      data: {
        content: [mockSampleProduct],
        totalElements: 1,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })),
    useGetProductByIdQuery: vi.fn(() => ({
      data: mockSampleProduct,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })),
    useGetStockCardQuery: vi.fn(() => ({
      data: mockStockCardData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    })),
    useUpdateProductMutation: vi.fn(() => [
      vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) }),
      { isLoading: false },
    ]),
  };
});

const createMockStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

const renderWithProviders = (
  ui: React.ReactElement,
  role: string = USER_ROLES.OWNER
) => {
  const store = createMockStore();
  const mockContextValue: IDashboardDemoContext = {
    currentRole: role as TDemoRole,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    simConflict: false,
    setSimConflict: vi.fn(),
    invoices: [],
    setInvoices: vi.fn(),
    customers: [],
    setCustomers: vi.fn(),
    logs: [],
    addLogEntry: vi.fn(),
    stockEntries: [],
    setStockEntries: vi.fn(),
    orders: [],
    setOrders: vi.fn(),
    isOrdersLoading: false,
    isOrdersError: false,
    ordersError: null,
    refetchOrders: vi.fn(),
  };

  return render(
    <Provider store={store}>
      <NotificationProvider>
        <DashboardDemoContext.Provider value={mockContextValue}>
          <MemoryRouter>{ui}</MemoryRouter>
        </DashboardDemoContext.Provider>
      </NotificationProvider>
    </Provider>
  );
};

describe("NCL-02-CN-006: Thẻ kho biến động tồn theo mặt hàng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("NCL-02-CN-006-TC-01: Luồng thành công - Hiển thị thẻ tóm tắt và danh sách biến động", () => {
    it("Hiển thị đầy đủ 5 thẻ KPI tóm tắt đầu kỳ, nhập, xuất, cuối kỳ và thực tế DB", () => {
      render(
        <StockCardSummaryCards
          openingStock={50}
          totalQuantityIn={102}
          totalQuantityOut={35}
          closingStock={117}
          currentStock={117}
          unit="Lon"
          isDiscrepancy={false}
          warning={null}
        />
      );

      // Kiểm tra tên các chỉ số
      expect(screen.getByText(/Tồn đầu kỳ/i)).toBeInTheDocument();
      expect(screen.getByText(/Tổng nhập/i)).toBeInTheDocument();
      expect(screen.getByText(/Tổng xuất/i)).toBeInTheDocument();
      expect(screen.getByText(/Tồn cuối kỳ/i)).toBeInTheDocument();
      expect(screen.getByText(/Tồn thực tế DB/i)).toBeInTheDocument();

      // Kiểm tra số lượng
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("+102")).toBeInTheDocument();
      expect(screen.getByText("-35")).toBeInTheDocument();
      expect(screen.getAllByText("117").length).toBe(2);
    });

    it("Hiển thị bảng biến động thời gian thực với đầy đủ các cột và số dư lũy kế từng dòng", () => {
      render(
        <StockCardTable
          movements={mockMovements}
          unit="Lon"
          isLoading={false}
          page={0}
          pageSize={20}
          totalElements={5}
          totalPages={1}
          onPageChange={vi.fn()}
        />
      );

      // Kiểm tra các cột tiêu đề
      expect(screen.getByText("Thời gian")).toBeInTheDocument();
      expect(screen.getByText("Loại chứng từ")).toBeInTheDocument();
      expect(screen.getByText("Số chứng từ")).toBeInTheDocument();
      expect(screen.getByText("Người thực hiện")).toBeInTheDocument();
      expect(screen.getByText("Số lượng Nhập")).toBeInTheDocument();
      expect(screen.getByText("Số lượng Xuất")).toBeInTheDocument();
      expect(screen.getByText("Tồn sau biến động")).toBeInTheDocument();

      // Kiểm tra sự xuất hiện của các mã chứng từ
      expect(screen.getByText("PNK-0001")).toBeInTheDocument();
      expect(screen.getByText("HD-0001")).toBeInTheDocument();
      expect(screen.getByText("PKK-0001")).toBeInTheDocument();
      expect(screen.getByText("PTH-0001")).toBeInTheDocument();

      // Kiểm tra loại chứng từ
      expect(screen.getByText("Phiếu nhập kho")).toBeInTheDocument();
      expect(screen.getByText("Hóa đơn bán hàng")).toBeInTheDocument();
      expect(screen.getByText("Phiếu kiểm kê kho")).toBeInTheDocument();
      expect(screen.getByText("Phiếu khách trả hàng")).toBeInTheDocument();
    });
  });

  describe("NCL-02-CN-006-TC-02: Luồng thành công - Mở chứng từ gốc (Drill-down)", () => {
    it("Gọi onOpenDocument khi người dùng bấm vào mã chứng từ trên dòng biến động", () => {
      const handleOpenDocument = vi.fn();

      render(
        <StockCardTable
          movements={mockMovements}
          unit="Lon"
          isLoading={false}
          page={0}
          pageSize={20}
          totalElements={5}
          totalPages={1}
          onPageChange={vi.fn()}
          onOpenDocument={handleOpenDocument}
        />
      );

      // Bấm vào chứng từ Phiếu nhập kho PNK-0001
      const pnkBtn = screen.getByTitle("Mở chứng từ gốc: PNK-0001");
      expect(pnkBtn).toBeInTheDocument();
      fireEvent.click(pnkBtn);

      expect(handleOpenDocument).toHaveBeenCalledTimes(1);
      expect(handleOpenDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          documentNumber: "PNK-0001",
          documentUrl: "/products/stock-entry?id=rec-101",
        })
      );
    });
  });

  describe("NCL-02-CN-006-TC-03: Ngoại lệ - Cảnh báo sai lệch tồn kho (Discrepancy Alert)", () => {
    it("Hiển thị Banner cảnh báo lỗi dữ liệu nổi bật khi isDiscrepancy là true", () => {
      const customWarning =
        "Cảnh báo: Phát hiện sai lệch số liệu tồn kho! Tồn kho lũy kế từ chuỗi chứng từ (117) không khớp với tồn kho thực tế trong hệ thống (100).";

      render(
        <StockCardSummaryCards
          openingStock={50}
          totalQuantityIn={102}
          totalQuantityOut={35}
          closingStock={117}
          currentStock={100}
          unit="Lon"
          isDiscrepancy={true}
          warning={customWarning}
        />
      );

      // Kiểm tra banner alert xuất hiện
      const alertBox = screen.getByRole("alert");
      expect(alertBox).toBeInTheDocument();
      expect(screen.getByText(STOCK_CARD_MESSAGES.DISCREPANCY_ALERT_TITLE)).toBeInTheDocument();
      expect(screen.getByText(customWarning)).toBeInTheDocument();
      expect(screen.getByText("Cảnh báo lệch tồn")).toBeInTheDocument();
      expect(screen.getByText("Lệch so với chuỗi chứng từ")).toBeInTheDocument();
    });

    it("Không hiển thị Banner cảnh báo khi isDiscrepancy là false", () => {
      render(
        <StockCardSummaryCards
          openingStock={50}
          totalQuantityIn={102}
          totalQuantityOut={35}
          closingStock={117}
          currentStock={117}
          unit="Lon"
          isDiscrepancy={false}
          warning={null}
        />
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText("Khớp dữ liệu chứng từ")).toBeInTheDocument();
    });
  });

  describe("Bộ lọc ngày & Kiểm tra ràng buộc (Filter & Validation)", () => {
    it("Hiển thị cảnh báo lỗi nếu Từ ngày lớn hơn Đến ngày", () => {
      const handleDateChange = vi.fn();

      render(
        <StockCardFilterBar
          fromDate="2026-08-30"
          toDate="2026-08-01"
          onDateChange={handleDateChange}
          onReset={vi.fn()}
        />
      );

      expect(
        screen.getByText(/Từ ngày phải nhỏ hơn hoặc bằng Đến ngày/i)
      ).toBeInTheDocument();
    });

    it("Hiển thị cảnh báo lỗi nếu khoảng thời gian tra cứu vượt quá 365 ngày", () => {
      render(
        <StockCardFilterBar
          fromDate="2024-01-01"
          toDate="2026-08-01"
          onDateChange={vi.fn()}
          onReset={vi.fn()}
        />
      );

      expect(
        screen.getByText(/không được vượt quá 365 ngày/i)
      ).toBeInTheDocument();
    });

    it("Thay đổi ngày trên input gọi hàm onDateChange", () => {
      const handleDateChange = vi.fn();

      render(
        <StockCardFilterBar
          fromDate="2026-08-01"
          toDate="2026-08-31"
          onDateChange={handleDateChange}
          onReset={vi.fn()}
        />
      );

      const fromInput = screen.getByLabelText(/Từ:/i);
      fireEvent.change(fromInput, { target: { value: "2026-08-10" } });

      expect(handleDateChange).toHaveBeenCalledWith("2026-08-10", "2026-08-31");
    });
  });

  describe("Phân quyền vai trò (Role-based access)", () => {
    it("Chặn truy cập và hiển thị thông báo với Nhân viên bán hàng (VT-02)", () => {
      renderWithProviders(<StockCardPage />, USER_ROLES.CASHIER);

      expect(screen.getByText(/Hạn chế quyền truy cập/i)).toBeInTheDocument();
      expect(
        screen.getByText(STOCK_CARD_MESSAGES.FORBIDDEN_ROLE)
      ).toBeInTheDocument();
    });

    it("Cho phép Chủ hộ (VT-01) truy cập màn hình thẻ kho", () => {
      renderWithProviders(<StockCardPage />, USER_ROLES.OWNER);

      expect(screen.getByText(STOCK_CARD_MESSAGES.TITLE)).toBeInTheDocument();
      expect(
        screen.getByText(STOCK_CARD_MESSAGES.SELECT_PRODUCT_PROMPT)
      ).toBeInTheDocument();
    });

    it("Cho phép Kế toán (VT-03) truy cập màn hình thẻ kho", () => {
      renderWithProviders(<StockCardPage />, USER_ROLES.ACCOUNTANT);

      expect(screen.getByText(STOCK_CARD_MESSAGES.TITLE)).toBeInTheDocument();
    });
  });

  describe("Tích hợp nút Thẻ kho trong ProductList", () => {
    it("Chủ hộ nhìn thấy nút Xem thẻ kho trên từng dòng sản phẩm", () => {
      renderWithProviders(
        <ProductList
          userRole={USER_ROLES.OWNER}
          selectedGroup="ALL"
          stockFilter="ALL"
        />,
        USER_ROLES.OWNER
      );

      // Thao tác header phải có mặt
      expect(screen.getByText("Thao tác")).toBeInTheDocument();
      // Nút Xem thẻ kho với title
      expect(screen.getByTitle("Xem thẻ kho")).toBeInTheDocument();
    });

    it("Kế toán cũng nhìn thấy cột Thao tác và nút Xem thẻ kho trên bảng sản phẩm", () => {
      renderWithProviders(
        <ProductList
          userRole={USER_ROLES.ACCOUNTANT}
          selectedGroup="ALL"
          stockFilter="ALL"
        />,
        USER_ROLES.ACCOUNTANT
      );

      expect(screen.getByText("Thao tác")).toBeInTheDocument();
      expect(screen.getByTitle("In tem mã vạch")).toBeInTheDocument();
    });
  });

  describe("StockCardModal: Modal xem nhanh thẻ kho và chi tiết sản phẩm 2 tab", () => {
    it("Hiển thị tên sản phẩm, SKU và modal khi isOpen là true", () => {
      renderWithProviders(
        <StockCardModal
          isOpen={true}
          onClose={vi.fn()}
          productId="prod-1"
          productName="Sữa đặc Ông Thọ đỏ 380g"
          productSku="SP001"
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getAllByText(/Sữa đặc Ông Thọ đỏ 380g/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/SKU: SP001/i).length).toBeGreaterThan(0);
    });

    it("Không hiển thị khi isOpen là false", () => {
      renderWithProviders(
        <StockCardModal
          isOpen={false}
          onClose={vi.fn()}
          productId="prod-1"
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("Chuyển đổi qua lại mượt mà giữa 2 tab 'Thông tin chung' và 'Thẻ kho biến động'", () => {
      renderWithProviders(
        <StockCardModal
          isOpen={true}
          onClose={vi.fn()}
          productId="prod-1"
          product={mockSampleProduct}
          initialTab="STOCK_CARD"
        />
      );

      // Cả 2 nút tab đều xuất hiện như chi tiết NCC
      const infoTabBtn = screen.getByRole("button", { name: /Thông tin chung/i });
      const stockCardTabBtn = screen.getByRole("button", { name: /Thẻ kho biến động/i });
      expect(infoTabBtn).toBeInTheDocument();
      expect(stockCardTabBtn).toBeInTheDocument();

      // Đang ở tab Thẻ kho: có bộ lọc và bảng biến động
      expect(screen.getByText(/Tra cứu ngày:/i)).toBeInTheDocument();
      expect(screen.getByText(/Tồn đầu kỳ/i)).toBeInTheDocument();

      // Bấm chuyển sang tab Thông tin chung
      fireEvent.click(infoTabBtn);

      // Tab Thông tin chung: có Giá bán niêm yết, Tồn kho khả dụng, Đơn vị tính
      expect(screen.getByText(/Giá bán niêm yết/i)).toBeInTheDocument();
      expect(screen.getByText(/Tồn kho khả dụng hiện tại/i)).toBeInTheDocument();
      expect(screen.getByText(/Đơn vị tính cơ sở/i)).toBeInTheDocument();

      // Bấm quay lại tab Thẻ kho
      fireEvent.click(stockCardTabBtn);
      expect(screen.getByText(/Tra cứu ngày:/i)).toBeInTheDocument();
    });

    it("Click vào dòng hàng hóa trong ProductList điều hướng sang trang chi tiết với tab Thông tin chung", () => {
      renderWithProviders(
        <ProductList
          userRole={USER_ROLES.OWNER}
          selectedGroup="ALL"
          stockFilter="ALL"
        />,
        USER_ROLES.OWNER
      );

      // Click vào dòng hàng hóa
      const productRow = screen.getByText("Sữa đặc Ông Thọ đỏ 380g");
      fireEvent.click(productRow);

      expect(mockNavigate).toHaveBeenCalledWith("/products/prod-1?tab=INFO");
    });

    it("Click vào nút Sửa trong ProductList mở form sửa hàng hóa", () => {
      renderWithProviders(
        <ProductList
          userRole={USER_ROLES.OWNER}
          selectedGroup="ALL"
          stockFilter="ALL"
        />,
        USER_ROLES.OWNER
      );

      const editBtn = screen.getByTitle("Chỉnh sửa sản phẩm");
      expect(editBtn).toBeInTheDocument();
      fireEvent.click(editBtn);
    });
  });

  describe("ProductDetailPage: Màn hình trang chi tiết hàng hóa riêng biệt có nút Quay lại và các Tab", () => {
    it("Hiển thị nút Quay lại, tên hàng hóa, mã SKU và Tab điều hướng", () => {
      renderWithProviders(<ProductDetailPage />, USER_ROLES.OWNER);

      // Nút Quay lại
      const backBtn = screen.getByTitle("Quay lại danh sách hàng hóa");
      expect(backBtn).toBeInTheDocument();
      expect(screen.getByText("Quay lại")).toBeInTheDocument();

      // Tên hàng hóa và SKU
      expect(screen.getByText("Sữa đặc Ông Thọ đỏ 380g")).toBeInTheDocument();
      expect(screen.getByText("SP001")).toBeInTheDocument();

      // Các Tab
      const infoTabBtn = screen.getByRole("button", { name: /Thông tin chung/i });
      const stockCardTabBtn = screen.getByRole("button", { name: /Thẻ kho biến động/i });
      expect(infoTabBtn).toBeInTheDocument();
      expect(stockCardTabBtn).toBeInTheDocument();
    });

    it("Click vào nút Quay lại sẽ điều hướng trở về danh sách hàng hóa (/products)", () => {
      renderWithProviders(<ProductDetailPage />, USER_ROLES.OWNER);

      const backBtn = screen.getByTitle("Quay lại danh sách hàng hóa");
      fireEvent.click(backBtn);

      expect(mockNavigate).toHaveBeenCalledWith("/products");
    });

    it("Chuyển đổi giữa Tab Thông tin chung và Tab Thẻ kho biến động", () => {
      renderWithProviders(<ProductDetailPage />, USER_ROLES.OWNER);

      const infoTabBtn = screen.getByRole("button", { name: /Thông tin chung/i });
      const stockCardTabBtn = screen.getByRole("button", { name: /Thẻ kho biến động/i });

      // Mặc định tab Thông tin chung
      expect(screen.getByText("Đơn vị tính cơ sở")).toBeInTheDocument();
      expect(screen.getByText("Nhóm hàng hóa")).toBeInTheDocument();

      // Chuyển sang Tab Thẻ kho biến động
      fireEvent.click(stockCardTabBtn);
      expect(screen.getByText(/Tra cứu ngày:/i)).toBeInTheDocument();
      expect(screen.getByText(/Tồn đầu kỳ/i)).toBeInTheDocument();

      // Chuyển lại Tab Thông tin chung
      fireEvent.click(infoTabBtn);
      expect(screen.getByText("Đơn vị tính cơ sở")).toBeInTheDocument();
    });

    it("Tự động cập nhật native khi duyệt phiếu trả hàng mà không cần F5", () => {
      renderWithProviders(<ProductDetailPage />, USER_ROLES.OWNER);

      // Bắn sự kiện duyệt phiếu trả hàng (cùng tab hoặc khác tab)
      window.dispatchEvent(
        new CustomEvent("banhangviet:return-ticket-approved", {
          detail: {
            ticketId: "ret-100",
            ticketNumber: "TH-12345",
            productIds: ["prod-1"],
            timestamp: Date.now(),
          },
        })
      );

      // Dữ liệu vẫn được giữ vững và tự động làm mới
      expect(screen.getByText("Sữa đặc Ông Thọ đỏ 380g")).toBeInTheDocument();
      expect(screen.getByText("SP001")).toBeInTheDocument();
    });
  });
});


