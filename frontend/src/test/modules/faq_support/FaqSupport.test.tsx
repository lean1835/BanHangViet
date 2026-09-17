import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  FaqSupportPage,
  FaqSearchBar,
  FaqCategoryTabs,
  FaqAccordionItem,
  FaqEmptyState,
} from "@/modules/faq_support";
import * as faqSupportApiModule from "@/modules/faq_support/services/faqSupportApi";
import type {
  IFaqItem,
  ISupportInfo,
  ISupportChannel,
  IFaqCategoryGroup,
} from "@/modules/faq_support/types/faqSupport.types";

// Mock RTK Query hooks của faqSupportApi
vi.mock("@/modules/faq_support/services/faqSupportApi", () => ({
  useGetFaqsQuery: vi.fn(),
  useGetFaqsGroupedQuery: vi.fn(),
  useGetFaqDetailQuery: vi.fn(),
  useGetSupportInfoQuery: vi.fn(),
  useGetActiveSupportChannelsQuery: vi.fn(),
}));

describe("NCL-19-CN-004: Màn hình câu hỏi thường gặp và thông tin hỗ trợ", () => {
  const mockFaqItems: IFaqItem[] = [
    {
      id: "faq-inv-001",
      category: "INVOICE",
      categoryDisplayName: "Hóa đơn",
      question: "Hóa đơn điện tử bị treo hoặc gửi Cơ quan thuế bị lỗi thì xử lý thế nào?",
      answer: "Mở màn hình Quản lý hóa đơn điện tử, lọc trạng thái Gửi lỗi hoặc Đang xử lý. Bạn có thể nhấn nút Gửi lại thuế.",
      actionUrl: "/invoices?status=FAILED",
      actionLabel: "Kiểm tra hóa đơn lỗi",
      keywords: "hóa đơn treo, hoa don treo, loi hoa don, thue tu choi",
      displayOrder: 1,
      viewCount: 15,
      isActive: true,
    },
    {
      id: "faq-inv-002",
      category: "INVOICE",
      categoryDisplayName: "Hóa đơn",
      question: "Làm thế nào để sửa hoặc điều chỉnh hóa đơn đã cấp mã bị sai sót?",
      answer: "Vào danh sách Hóa đơn, chọn hóa đơn cần xử lý và nhấn Lập hóa đơn điều chỉnh hoặc Thay thế.",
      actionUrl: "/invoices",
      actionLabel: "Xem danh sách hóa đơn",
      keywords: "sua hoa don, dieu chinh hoa don, hoa don sai",
      displayOrder: 2,
      viewCount: 8,
      isActive: true,
    },
    {
      id: "faq-acc-001",
      category: "ACCOUNT",
      categoryDisplayName: "Tài khoản",
      question: "Quên mật khẩu đăng nhập hoặc muốn đổi mật khẩu thì làm sao?",
      answer: "Nhấn Quên mật khẩu tại màn hình đăng nhập hoặc vào mục Thông tin cá nhân để đổi mật khẩu.",
      actionUrl: "/settings/user-profile",
      actionLabel: "Đổi mật khẩu ngay",
      keywords: "quen mat khau, doi mat khau, doi pass",
      displayOrder: 1,
      viewCount: 20,
      isActive: true,
    },
    {
      id: "faq-sal-001",
      category: "SALES",
      categoryDisplayName: "Bán hàng",
      question: "Cách xử lý khi khách hàng trả lại hàng đã mua?",
      answer: "Vào mục Bán hàng -> Phiếu trả hàng, chọn đơn hàng gốc để hoàn tiền và hoàn tồn kho.",
      actionUrl: "/return-tickets",
      actionLabel: "Lập phiếu trả hàng",
      keywords: "tra hang, doi tra, phieu tra hang",
      displayOrder: 1,
      viewCount: 9,
      isActive: true,
    },
    {
      id: "faq-dat-001",
      category: "DATA",
      categoryDisplayName: "Dữ liệu",
      question: "Dữ liệu của tôi được sao lưu như thế nào và làm sao kiểm tra an toàn?",
      answer: "Hệ thống tự động sao lưu dữ liệu toàn bộ cửa hàng hàng ngày vào lúc 02:30 sáng.",
      actionUrl: "/settings/backup-export",
      actionLabel: "Xem lịch sử sao lưu",
      keywords: "sao luu du lieu, backup, mat du lieu",
      displayOrder: 1,
      viewCount: 7,
      isActive: true,
    },
  ];

  const mockSupportChannels: ISupportChannel[] = [
    {
      id: "sc-001",
      channelType: "HOTLINE",
      channelTypeDisplayName: "Tổng đài điện thoại",
      channelName: "Tổng đài hỗ trợ kỹ thuật",
      contactValue: "1900 6868",
      description: "Miễn phí cước cuộc gọi, tiếp nhận 07:30 - 22:00",
      displayOrder: 1,
      isActive: true,
    },
    {
      id: "sc-002",
      channelType: "ZALO",
      channelTypeDisplayName: "Zalo hỗ trợ",
      channelName: "Zalo hỗ trợ kỹ thuật 24/7",
      contactValue: "0988 123 456",
      description: "Tiếp nhận hình ảnh lỗi và giải đáp tức thì",
      displayOrder: 2,
      isActive: true,
    },
    {
      id: "sc-003",
      channelType: "EMAIL",
      channelTypeDisplayName: "Hộp thư điện tử",
      channelName: "Hộp thư điện tử hỗ trợ",
      contactValue: "hotro@banhangviet.vn",
      description: "Phản hồi chi tiết trong vòng 15 phút",
      displayOrder: 3,
      isActive: true,
    },
    {
      id: "sc-004",
      channelType: "WORKING_HOURS",
      channelTypeDisplayName: "Giờ làm việc",
      channelName: "Giờ làm việc bộ phận hỗ trợ",
      contactValue: "07:30 - 22:00 (Thứ Hai - Chủ Nhật)",
      description: "Hỗ trợ liên tục tất cả các ngày trong tuần",
      displayOrder: 4,
      isActive: true,
    },
  ];

  const mockSupportInfo: ISupportInfo = {
    systemVersion: "v1.2.0-STABLE",
    householdId: "hh-hn-001",
    householdCode: "HKD-HN-001",
    householdName: "Tạp Hóa Cô Mai Bình An",
    taxCode: "0109876543",
    representativeName: "Nguyễn Thị Mai",
    phoneNumber: "0912 345 678",
    currentUsername: "chu_ho_mai",
    currentUserFullName: "Bà Nguyễn Thị Mai",
    currentUserRole: "VT-01",
    quickSupportSummary:
      "Phiên bản phần mềm: v1.2.0-STABLE | Mã hộ KD: HKD-HN-001 | Mã số thuế: 0109876543 | Tên hộ: Tạp Hóa Cô Mai Bình An | Người liên hệ: Bà Nguyễn Thị Mai (SĐT: 0912 345 678)",
    supportChannels: mockSupportChannels,
  };

  const mockGrouped: IFaqCategoryGroup[] = [
    {
      category: "INVOICE",
      categoryDisplayName: "Hóa đơn",
      totalQuestions: 2,
      questions: [mockFaqItems[0], mockFaqItems[1]],
    },
    {
      category: "SALES",
      categoryDisplayName: "Bán hàng",
      totalQuestions: 1,
      questions: [mockFaqItems[3]],
    },
    {
      category: "ACCOUNT",
      categoryDisplayName: "Tài khoản",
      totalQuestions: 1,
      questions: [mockFaqItems[2]],
    },
    {
      category: "DATA",
      categoryDisplayName: "Dữ liệu",
      totalQuestions: 1,
      questions: [mockFaqItems[4]],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(faqSupportApiModule.useGetFaqsQuery).mockReturnValue({
      data: {
        code: 1000,
        message: "Tra cứu câu hỏi thành công",
        result: {
          content: mockFaqItems,
          pageNumber: 0,
          pageSize: 20,
          totalElements: mockFaqItems.length,
          totalPages: 1,
          last: true,
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(faqSupportApiModule.useGetSupportInfoQuery).mockReturnValue({
      data: {
        code: 1000,
        message: "Lấy thông tin hỗ trợ thành công",
        result: mockSupportInfo,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(faqSupportApiModule.useGetFaqsGroupedQuery).mockReturnValue({
      data: {
        code: 1000,
        message: "Thành công",
        result: mockGrouped,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(faqSupportApiModule.useGetFaqDetailQuery).mockReturnValue({
      data: {
        code: 1000,
        message: "Thành công",
        result: mockFaqItems[0],
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // TC-01: Luồng thành công tra cứu câu hỏi và hiển thị liên kết xử lý
  // =========================================================================
  describe("TC-01: Tra cứu câu hỏi thường gặp theo từ khóa và liên kết xử lý", () => {
    it("hiển thị danh sách câu hỏi thường gặp và thanh tìm kiếm", () => {
      render(
        <MemoryRouter>
          <FaqSupportPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Câu hỏi thường gặp & Thông tin hỗ trợ kỹ thuật/i)).toBeInTheDocument();
      expect(screen.getByRole("search")).toBeInTheDocument();
      expect(
        screen.getByText("Hóa đơn điện tử bị treo hoặc gửi Cơ quan thuế bị lỗi thì xử lý thế nào?")
      ).toBeInTheDocument();
    });

    it("mở câu trả lời khi nhấn vào tiêu đề câu hỏi và hiển thị nút liên kết màn hình xử lý", async () => {
      render(
        <MemoryRouter>
          <FaqSupportPage />
        </MemoryRouter>
      );

      const faqQuestionButton = screen.getByText(
        "Hóa đơn điện tử bị treo hoặc gửi Cơ quan thuế bị lỗi thì xử lý thế nào?"
      );
      fireEvent.click(faqQuestionButton);

      // Xác nhận nội dung câu trả lời được hiển thị
      expect(
        await screen.findByText(/Mở màn hình Quản lý hóa đơn điện tử, lọc trạng thái Gửi lỗi/i)
      ).toBeInTheDocument();

      // Xác nhận nút hành động mở màn hình xử lý xuất hiện đúng label (TC-01)
      const actionButton = screen.getByRole("button", { name: /Kiểm tra hóa đơn lỗi/i });
      expect(actionButton).toBeInTheDocument();
    });

    it("lọc câu hỏi theo 4 nhóm category chuẩn (Hóa đơn, Bán hàng, Tài khoản, Dữ liệu)", () => {
      render(
        <MemoryRouter>
          <FaqSupportPage />
        </MemoryRouter>
      );

      // Kiểm tra có đủ các tab danh mục
      expect(screen.getByRole("tab", { name: /Tất cả/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Hóa đơn & Thuế/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Bán hàng & Ca/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Tài khoản & Quyền/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Dữ liệu & Sao lưu/i })).toBeInTheDocument();

      // Bấm tab Hóa đơn
      const invoiceTab = screen.getByRole("tab", { name: /Hóa đơn & Thuế/i });
      fireEvent.click(invoiceTab);

      // Verify hook useGetFaqsQuery được gọi lại với category INVOICE
      expect(faqSupportApiModule.useGetFaqsQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "INVOICE",
        })
      );
    });
  });

  // =========================================================================
  // TC-02: Dữ liệu rỗng và kênh liên hệ hỗ trợ tức thì
  // =========================================================================
  describe("TC-02: Trường hợp không tìm thấy câu hỏi phù hợp (Empty State)", () => {
    it("hiển thị thông báo không tìm thấy và hiện các kênh liên hệ hỗ trợ kỹ thuật", () => {
      vi.mocked(faqSupportApiModule.useGetFaqsQuery).mockReturnValue({
        data: {
          code: 1000,
          message: "Không tìm thấy câu hỏi phù hợp",
          result: {
            content: [],
            pageNumber: 0,
            pageSize: 20,
            totalElements: 0,
            totalPages: 0,
            last: true,
          },
        },
        isLoading: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      render(
        <MemoryRouter>
          <FaqSupportPage />
        </MemoryRouter>
      );

      // Xác nhận Empty State thông báo thân thiện
      expect(screen.getByText(/Chưa có câu hỏi nào trong danh mục này/i)).toBeInTheDocument();

      // Xác nhận các kênh liên hệ tức thì (Hotline, Zalo) xuất hiện theo TC-02
      expect(screen.getByText(/Gọi Tổng đài: 1900 6868/i)).toBeInTheDocument();
      expect(screen.getByText(/Zalo: 0988 123 456/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // TC-03: Màn hình thông tin hỗ trợ và định danh hộ kinh doanh báo lỗi
  // =========================================================================
  describe("TC-03: Thông tin định danh báo lỗi cho tổng đài", () => {
    it("hiển thị phiên bản hệ thống, mã hộ kinh doanh, tên hộ, MST và người dùng hiện tại", () => {
      render(
        <MemoryRouter>
          <FaqSupportPage />
        </MemoryRouter>
      );

      // Kiểm tra phiên bản hệ thống
      expect(screen.getByText("v1.2.0-STABLE")).toBeInTheDocument();

      // Kiểm tra mã hộ kinh doanh
      expect(screen.getByText("HKD-HN-001")).toBeInTheDocument();

      // Kiểm tra mã số thuế
      expect(screen.getByText("0109876543")).toBeInTheDocument();

      // Kiểm tra tên hộ kinh doanh
      expect(screen.getByText("Tạp Hóa Cô Mai Bình An")).toBeInTheDocument();

      // Kiểm tra người liên hệ
      expect(screen.getByText(/Bà Nguyễn Thị Mai/i)).toBeInTheDocument();
    });

    it("sao chép thông tin báo lỗi định dạng sẵn vào clipboard khi nhấn nút 1 chạm", async () => {
      // Mock navigator.clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <MemoryRouter>
          <FaqSupportPage />
        </MemoryRouter>
      );

      const copyButton = screen.getByRole("button", {
        name: /Sao chép toàn bộ thông tin định danh báo lỗi/i,
      });
      expect(copyButton).toBeInTheDocument();

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith(mockSupportInfo.quickSupportSummary);
        expect(screen.getByText(/Đã sao chép thông tin báo lỗi/i)).toBeInTheDocument();
      });
    });

    it("hiển thị danh sách kênh hỗ trợ đa kênh (Hotline, Zalo, Email, Giờ làm việc)", () => {
      render(
        <MemoryRouter>
          <FaqSupportPage />
        </MemoryRouter>
      );

      expect(screen.getByText("Tổng đài hỗ trợ kỹ thuật")).toBeInTheDocument();
      expect(screen.getByText("1900 6868")).toBeInTheDocument();
      expect(screen.getByText("Zalo hỗ trợ kỹ thuật 24/7")).toBeInTheDocument();
      expect(screen.getByText("hotro@banhangviet.vn")).toBeInTheDocument();
      expect(screen.getByText("07:30 - 22:00 (Thứ Hai - Chủ Nhật)")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Kiểm thử các Component độc lập
  // =========================================================================
  describe("Kiểm thử các UI Components độc lập", () => {
    it("FaqSearchBar cho phép nhập tìm kiếm và xóa từ khóa bằng nút clear", () => {
      const handleChange = vi.fn();
      const handleClear = vi.fn();

      render(
        <FaqSearchBar
          value="hóa đơn"
          onChange={handleChange}
          onClear={handleClear}
        />
      );

      const input = screen.getByRole("textbox", { name: /Tìm kiếm câu hỏi thường gặp/i });
      expect(input).toHaveValue("hóa đơn");

      const clearButton = screen.getByRole("button", { name: /Xóa nội dung tìm kiếm/i });
      fireEvent.click(clearButton);
      expect(handleClear).toHaveBeenCalled();
    });

    it("FaqCategoryTabs kích hoạt callback onTabChange khi click vào tab khác", () => {
      const handleTabChange = vi.fn();

      render(
        <FaqCategoryTabs
          activeTab="ALL"
          onTabChange={handleTabChange}
          categoryCounts={{ ALL: 5, INVOICE: 2, SALES: 1, ACCOUNT: 1, DATA: 1 }}
        />
      );

      const salesTab = screen.getByRole("tab", { name: /Bán hàng & Ca/i });
      fireEvent.click(salesTab);
      expect(handleTabChange).toHaveBeenCalledWith("SALES");
    });

    it("cho phép chọn từ khóa gợi ý trong Empty State để tìm kiếm", () => {
      const handleSelect = vi.fn();

      render(
        <FaqEmptyState
          keyword="abcxyz"
          onSelectSuggestion={handleSelect}
        />
      );

      const suggestionButton = screen.getByRole("button", { name: /hóa đơn treo/i });
      fireEvent.click(suggestionButton);
      expect(handleSelect).toHaveBeenCalledWith("hóa đơn treo");
    });

    it("FaqAccordionItem đóng lại khi bấm lần thứ hai", () => {
      const handleToggle = vi.fn();

      const { rerender } = render(
        <MemoryRouter>
          <FaqAccordionItem
            item={mockFaqItems[0]}
            isOpen={false}
            onToggle={handleToggle}
          />
        </MemoryRouter>
      );

      // Chưa mở thì không có nút Kiểm tra hóa đơn lỗi
      expect(screen.queryByRole("button", { name: /Kiểm tra hóa đơn lỗi/i })).not.toBeInTheDocument();

      // Rerender trạng thái mở
      rerender(
        <MemoryRouter>
          <FaqAccordionItem
            item={mockFaqItems[0]}
            isOpen={true}
            onToggle={handleToggle}
          />
        </MemoryRouter>
      );

      expect(screen.getByRole("button", { name: /Kiểm tra hóa đơn lỗi/i })).toBeInTheDocument();
    });

    it("hiển thị trạng thái đang tải câu hỏi thường gặp khi isLoading là true", () => {
      vi.mocked(faqSupportApiModule.useGetFaqsQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      render(
        <MemoryRouter>
          <FaqSupportPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Đang tải câu hỏi thường gặp.../i)).toBeInTheDocument();
    });
  });
});
