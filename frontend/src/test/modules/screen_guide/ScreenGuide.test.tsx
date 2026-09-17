import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  ScreenGuideProvider,
  ScreenGuideDrawer,
  ScreenGuideTriggerButton,
  ScreenGuideHighlightOverlay,
  ContextualErrorGuideModal,
  ScreenGuideDirectoryModal,
  getScreenCodeFromPath,
  getScreenNameFromPath,
} from "@/modules/screen_guide";
import * as screenGuideApiModule from "@/modules/screen_guide/services/screenGuideApi";

// Mock screenGuideApi hooks
vi.mock("@/modules/screen_guide/services/screenGuideApi", () => ({
  useGetGuideByScreenCodeQuery: vi.fn(),
  useLazyGetGuideByScreenCodeQuery: vi.fn(),
  useTrackGuideViewMutation: vi.fn(),
  useGetContextualHelpQuery: vi.fn(),
  useGetAllGuidesQuery: vi.fn(),
  useGetTopViewedGuidesQuery: vi.fn(),
}));

describe("NCL-19-CN-003: Hướng dẫn ngắn tại chỗ theo từng màn hình", () => {
  const mockTrackGuideView = vi.fn().mockReturnValue({
    unwrap: () => Promise.resolve(),
    catch: vi.fn(),
  });

  const mockPosGuide = {
    id: "guide-pos-01",
    screenCode: "SCREEN_POS_CHECKOUT",
    screenName: "Màn hình thu ngân & Bán hàng POS",
    description: "Các bước chọn hàng, sửa số lượng và thanh toán tiền cho khách tại quầy",
    actionUrl: "/pos",
    targetRole: "ALL",
    viewCount: 12,
    isActive: true,
    totalSteps: 4,
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Tìm hàng hóa",
        content: "Dùng máy quét mã vạch hoặc gõ tên mặt hàng vào ô Tìm kiếm hàng hóa ở phía trên màn hình.",
        targetElementSelector: "#pos-search-input",
        buttonLabel: "Tìm hàng hóa",
        imageUrl: "/images/guides/pos_step1.png",
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Thêm vào giỏ",
        content: "Bấm vào mặt hàng để đưa vào giỏ và chỉnh số lượng.",
        targetElementSelector: "#pos-cart-table",
        buttonLabel: "Thêm vào giỏ",
        imageUrl: "/images/guides/pos_step2.png",
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Bấm thanh toán",
        content: "Nhìn sang góc dưới bên phải màn hình giỏ hàng và bấm nút Thanh toán màu xanh to.",
        targetElementSelector: "#btn-pos-checkout",
        buttonLabel: "Thanh toán",
        imageUrl: "/images/guides/pos_step3.png",
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Hoàn tất đơn",
        content: "Chọn hình thức Tiền mặt hoặc Chuyển khoản QR và bấm Hoàn tất để in hóa đơn.",
        targetElementSelector: "#btn-pos-complete",
        buttonLabel: "Hoàn tất đơn",
        imageUrl: "/images/guides/pos_step4.png",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(screenGuideApiModule.useTrackGuideViewMutation).mockReturnValue([
      mockTrackGuideView,
      { isLoading: false } as any,
    ]);

    vi.mocked(screenGuideApiModule.useGetGuideByScreenCodeQuery).mockImplementation(((screenCode: string) => {
      if (screenCode === "SCREEN_POS_CHECKOUT") {
        return {
          data: { code: 1000, message: "OK", result: mockPosGuide },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        } as any;
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as any;
    }) as any);

    vi.mocked(screenGuideApiModule.useGetContextualHelpQuery).mockReturnValue({
      data: {
        code: 1000,
        message: "OK",
        result: {
          errorCode: 4001,
          actionUrl: "/settings/invoice-template",
          guideScreenCode: "SCREEN_INVOICE_CONFIG",
          guideScreenName: "Cấu hình mẫu và ký hiệu hóa đơn",
          suggestedAction: "Khai báo ký hiệu và mẫu số hóa đơn để đủ điều kiện phát hành theo quy định Thuế",
        },
      },
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(screenGuideApiModule.useGetAllGuidesQuery).mockReturnValue({
      data: {
        code: 1000,
        message: "OK",
        result: {
          content: [
            {
              id: "g1",
              screenCode: "SCREEN_POS_CHECKOUT",
              screenName: "Màn hình thu ngân & Bán hàng POS",
              description: "Hướng dẫn bán hàng",
              actionUrl: "/pos",
              targetRole: "ALL",
              viewCount: 20,
              isActive: true,
              stepCount: 4,
            },
            {
              id: "g2",
              screenCode: "SCREEN_INVOICE_CONFIG",
              screenName: "Cấu hình mẫu và ký hiệu hóa đơn",
              description: "Khai báo ký hiệu hóa đơn theo chuẩn CQT",
              actionUrl: "/settings/invoice-template",
              targetRole: "VT-01",
              viewCount: 15,
              isActive: true,
              stepCount: 4,
            },
          ],
          totalElements: 2,
          totalPages: 1,
          last: true,
        },
      },
      isLoading: false,
      isError: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  describe("CV-01: Ánh xạ mã màn hình theo Route (screenRouteMapper)", () => {
    it("Nhận diện chính xác screenCode từ pathname", () => {
      expect(getScreenCodeFromPath("/pos")).toBe("SCREEN_POS_CHECKOUT");
      expect(getScreenCodeFromPath("/settings/invoice-template")).toBe("SCREEN_INVOICE_CONFIG");
      expect(getScreenCodeFromPath("/e-invoices")).toBe("SCREEN_E_INVOICE_CREATE");
      expect(getScreenCodeFromPath("/products")).toBe("SCREEN_PRODUCT_MANAGEMENT");
      expect(getScreenCodeFromPath("/products/stock-entry")).toBe("SCREEN_GOODS_RECEIPT");
      expect(getScreenCodeFromPath("/customers")).toBe("SCREEN_CUSTOMER_DEBT");
      expect(getScreenCodeFromPath("/reports/tax-declaration")).toBe("SCREEN_TAX_PERIOD");
    });

    it("Lấy tên hiển thị thân thiện theo pathname", () => {
      expect(getScreenNameFromPath("/pos")).toBe("Màn hình thu ngân & Bán hàng POS");
      expect(getScreenNameFromPath("/settings/invoice-template")).toBe("Cấu hình mẫu và ký hiệu hóa đơn");
    });
  });

  describe("TC-01: Xem hướng dẫn ngắn tại chỗ theo từng màn hình (CV-02 & CV-03)", () => {
    it("Mở Drawer hướng dẫn khi bấm nút Trợ giúp trên Header", async () => {
      render(
        <MemoryRouter initialEntries={["/pos"]}>
          <ScreenGuideProvider>
            <ScreenGuideTriggerButton variant="header" />
            <ScreenGuideDrawer />
          </ScreenGuideProvider>
        </MemoryRouter>
      );

      // Ban đầu Drawer chưa hiển thị
      expect(screen.queryByText("Màn hình thu ngân & Bán hàng POS")).not.toBeInTheDocument();

      // Bấm nút Trợ giúp
      const triggerBtn = screen.getByRole("button", { name: /mở hướng dẫn màn hình/i });
      fireEvent.click(triggerBtn);

      // Drawer hiển thị đúng tiêu đề và số bước
      expect(screen.getByText("Màn hình thu ngân & Bán hàng POS")).toBeInTheDocument();
      expect(screen.getByText("Bước 1/4")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Tìm hàng hóa" })).toBeInTheDocument();
      expect(screen.getByText(/Dùng máy quét mã vạch hoặc gõ tên mặt hàng/i)).toBeInTheDocument();
      expect(screen.getByText(/\[Tìm hàng hóa\]/i)).toBeInTheDocument();
    });

    it("Chuyển bước qua lại Tiếp tục / Trước và bấm trực tiếp số bước", async () => {
      render(
        <MemoryRouter initialEntries={["/pos"]}>
          <ScreenGuideProvider>
            <ScreenGuideTriggerButton variant="header" />
            <ScreenGuideDrawer />
          </ScreenGuideProvider>
        </MemoryRouter>
      );

      // Mở Drawer
      fireEvent.click(screen.getByRole("button", { name: /mở hướng dẫn màn hình/i }));

      // Đang ở bước 1, nút "Trước" bị disabled
      const prevBtn = screen.getByRole("button", { name: /trước/i });
      expect(prevBtn).toBeDisabled();

      // Bấm Tiếp theo -> Sang bước 2
      const nextBtn = screen.getByRole("button", { name: /tiếp theo/i });
      fireEvent.click(nextBtn);

      expect(screen.getByText("Bước 2/4")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Thêm vào giỏ" })).toBeInTheDocument();
      expect(prevBtn).not.toBeDisabled();

      // Bấm nút Trước -> Quay lại bước 1
      fireEvent.click(prevBtn);
      expect(screen.getByText("Bước 1/4")).toBeInTheDocument();

      // Bấm trực tiếp vào số bước 3 trên Stepper
      const step3Buttons = screen.getAllByRole("button", { name: /bấm thanh toán/i });
      fireEvent.click(step3Buttons[0]);
      expect(screen.getByText("Bước 3/4")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Bấm thanh toán" })).toBeInTheDocument();
    });

    it("Đóng Drawer bằng nút X hoặc phím ESC", async () => {
      render(
        <MemoryRouter initialEntries={["/pos"]}>
          <ScreenGuideProvider>
            <ScreenGuideTriggerButton variant="header" />
            <ScreenGuideDrawer />
          </ScreenGuideProvider>
        </MemoryRouter>
      );

      // Mở Drawer
      fireEvent.click(screen.getByRole("button", { name: /mở hướng dẫn màn hình/i }));
      expect(screen.getByText("Màn hình thu ngân & Bán hàng POS")).toBeInTheDocument();

      // Bấm nút đóng
      const closeBtn = screen.getByRole("button", { name: /đóng hướng dẫn/i });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText("Màn hình thu ngân & Bán hàng POS")).not.toBeInTheDocument();
      });
    });
  });

  describe("TC-02: Hỗ trợ ngữ cảnh khi bị chặn thao tác (Contextual Error Guide)", () => {
    it("Hiển thị Modal cảnh báo khi nhận mã lỗi 4001 với 2 lựa chọn xử lý", () => {
      const handleClose = vi.fn();

      render(
        <MemoryRouter initialEntries={["/pos"]}>
          <ScreenGuideProvider>
            <ContextualErrorGuideModal
              isOpen={true}
              errorCode={4001}
              onClose={handleClose}
            />
            <ScreenGuideDrawer />
          </ScreenGuideProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/Chưa đủ điều kiện phát hành hóa đơn/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Khai báo ký hiệu và mẫu số hóa đơn để đủ điều kiện phát hành theo quy định Thuế/i)
      ).toBeInTheDocument();

      const viewGuideBtn = screen.getByRole("button", { name: /xem hướng dẫn từng bước/i });
      expect(viewGuideBtn).toBeInTheDocument();

      const navigateSettingBtn = screen.getByRole("button", { name: /khai báo ký hiệu ngay/i });
      expect(navigateSettingBtn).toBeInTheDocument();

      // Bấm "Xem hướng dẫn từng bước" -> Modal đóng và mở Drawer SCREEN_INVOICE_CONFIG
      fireEvent.click(viewGuideBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("TC-03: Ghi nhận lịch sử mở xem trợ giúp & thời gian xem (trackGuideView)", () => {
    it("Ghi nhận durationSeconds và completed: true khi duyệt tới bước cuối cùng và bấm Hoàn thành", async () => {
      render(
        <MemoryRouter initialEntries={["/pos"]}>
          <ScreenGuideProvider>
            <ScreenGuideTriggerButton variant="header" />
            <ScreenGuideDrawer />
          </ScreenGuideProvider>
        </MemoryRouter>
      );

      // Mở Drawer
      fireEvent.click(screen.getByRole("button", { name: /mở hướng dẫn màn hình/i }));

      // Chuyển tới bước cuối cùng (bước 4)
      const step4Buttons = screen.getAllByRole("button", { name: /hoàn tất đơn/i });
      fireEvent.click(step4Buttons[0]);

      expect(screen.getByText("Bước 4/4")).toBeInTheDocument();
      const finishBtn = screen.getByRole("button", { name: /đã hiểu - hoàn thành/i });
      expect(finishBtn).toBeInTheDocument();

      // Bấm Hoàn thành -> Gọi trackGuideView với completed: true
      fireEvent.click(finishBtn);

      await waitFor(() => {
        expect(mockTrackGuideView).toHaveBeenCalledWith(
          expect.objectContaining({
            screenCode: "SCREEN_POS_CHECKOUT",
            data: expect.objectContaining({
              completed: true,
              durationSeconds: expect.any(Number),
            }),
          })
        );
      });
    });
  });

  describe("TC-04: Hiển thị Highlight Overlay quanh phần tử mục tiêu", () => {
    it("Render khung viền phát sáng khi phần tử mục tiêu tồn tại trên DOM", async () => {
      // Tạo phần tử giả lập trên DOM
      const fakeInput = document.createElement("input");
      fakeInput.id = "pos-search-input";
      fakeInput.style.width = "200px";
      fakeInput.style.height = "40px";
      fakeInput.getBoundingClientRect = () => ({
        top: 50,
        left: 100,
        width: 200,
        height: 40,
        bottom: 90,
        right: 300,
        x: 100,
        y: 50,
        toJSON: () => {},
      });
      document.body.appendChild(fakeInput);

      try {
        render(
          <MemoryRouter initialEntries={["/pos"]}>
            <ScreenGuideProvider>
              <ScreenGuideTriggerButton variant="header" />
              <ScreenGuideDrawer />
              <ScreenGuideHighlightOverlay />
            </ScreenGuideProvider>
          </MemoryRouter>
        );

        // Mở Drawer (bước 1 có selector #pos-search-input)
        fireEvent.click(screen.getByRole("button", { name: /mở hướng dẫn màn hình/i }));

        await waitFor(
          () => {
            expect(screen.getByText(/Vị trí thao tác: Tìm hàng hóa/i)).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      } finally {
        if (fakeInput.parentNode) {
          fakeInput.parentNode.removeChild(fakeInput);
        }
      }
    });
  });

  describe("TC-05: Danh bạ tra cứu toàn bộ hướng dẫn hệ thống (ScreenGuideDirectoryModal)", () => {
    it("Mở danh bạ và tìm kiếm hướng dẫn theo từ khóa", async () => {
      render(
        <MemoryRouter initialEntries={["/pos"]}>
          <ScreenGuideProvider>
            <ScreenGuideTriggerButton variant="header" />
            <ScreenGuideDrawer />
            <ScreenGuideDirectoryModal />
          </ScreenGuideProvider>
        </MemoryRouter>
      );

      // Mở Drawer
      fireEvent.click(screen.getByRole("button", { name: /mở hướng dẫn màn hình/i }));

      // Bấm nút mở danh bạ (icon BookOpen) trên header của Drawer
      const directoryBtn = screen.getByRole("button", { name: /danh bạ hướng dẫn/i });
      fireEvent.click(directoryBtn);

      // Modal danh bạ hiển thị
      expect(screen.getByText("Danh bạ hướng dẫn các màn hình")).toBeInTheDocument();
      expect(screen.getByText("Cấu hình mẫu và ký hiệu hóa đơn")).toBeInTheDocument();
      expect(screen.getAllByText(/4 bước/i).length).toBeGreaterThan(0);

      // Nhập từ khóa tìm kiếm
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm màn hình/i);
      fireEvent.change(searchInput, { target: { value: "hóa đơn" } });

    });
  });

  describe("TC-06: Điều hướng các tab nhỏ trong phân hệ (Sub-tabs Navigation: Nhà cung cấp, Kiểm kê...)", () => {
    it("Nhận diện chính xác các route tab nhỏ thuộc phân hệ Hàng hóa", () => {
      expect(getScreenCodeFromPath("/products/suppliers")).toBe("SCREEN_SUPPLIER_MANAGEMENT");
      expect(getScreenCodeFromPath("/products/inventory-audits")).toBe("SCREEN_INVENTORY_AUDIT");
      expect(getScreenCodeFromPath("/products/inventory-warnings")).toBe("SCREEN_INVENTORY_WARNING");
      expect(getScreenCodeFromPath("/products/supplier-returns")).toBe("SCREEN_SUPPLIER_RETURN");
      expect(getScreenCodeFromPath("/products/pos-transfers")).toBe("SCREEN_POS_TRANSFER");
    });

    it("Hiển thị thanh chuyển tab nhỏ trong Drawer và cho phép bấm chuyển sang tab Nhà cung cấp", () => {
      render(
        <MemoryRouter initialEntries={["/products"]}>
          <ScreenGuideProvider>
            <ScreenGuideTriggerButton variant="header" />
            <ScreenGuideDrawer />
          </ScreenGuideProvider>
        </MemoryRouter>
      );

      // Mở Drawer
      fireEvent.click(screen.getByRole("button", { name: /mở hướng dẫn màn hình/i }));

      // Kiểm tra thanh chuyển mục/tab nhỏ hiển thị đầy đủ các tab con của Hàng hóa
      expect(screen.getByRole("button", { name: /xem hướng dẫn: nhà cung cấp/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /xem hướng dẫn: kiểm kê kho/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /xem hướng dẫn: cảnh báo tồn/i })).toBeInTheDocument();

      // Bấm chuyển sang tab Nhà cung cấp
      fireEvent.click(screen.getByRole("button", { name: /xem hướng dẫn: nhà cung cấp/i }));

      // Tiêu đề Drawer cập nhật sang Quản lý Nhà cung cấp
      expect(screen.getByText("Quản lý Nhà cung cấp & Công nợ nhập hàng")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Tìm kiếm & Lọc nợ NCC/i })).toBeInTheDocument();
      expect(screen.getByText(/\[Tìm kiếm NCC\]/i)).toBeInTheDocument();
    });
  });
});

