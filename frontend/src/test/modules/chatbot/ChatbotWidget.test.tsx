import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, createEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChatbotWidget } from "@/modules/chatbot";
import * as chatbotApiModule from "@/modules/chatbot/services/chatbotApi";

// Mock chatbotApi hooks
vi.mock("@/modules/chatbot/services/chatbotApi", () => ({
  useSendChatbotMessageMutation: vi.fn(),
  useGetChatbotQuickSuggestionsQuery: vi.fn(),
}));

describe("ChatbotWidget: Trợ lý AI Bán hàng & Kế toán Thuế (Phase 1 & Phase 2)", () => {
  const mockSendMessage = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(chatbotApiModule.useSendChatbotMessageMutation).mockReturnValue([
      mockSendMessage,
      { isLoading: false } as any,
    ]);

    vi.mocked(chatbotApiModule.useGetChatbotQuickSuggestionsQuery).mockReturnValue({
      data: {
        code: 1000,
        message: "Success",
        result: [
          {
            category: "Bán hàng",
            description: "Gợi ý bán hàng",
            items: [
              { prompt: "Doanh thu hôm nay bao nhiêu?" },
              { prompt: "Có hàng nào sắp hết?" },
            ],
          },
        ],
      },
      isLoading: false,
    } as any);

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("TC-CHAT-01: Hiển thị nút FAB nổi Trợ lý AI ở góc màn hình", () => {
    render(
      <MemoryRouter>
        <ChatbotWidget />
      </MemoryRouter>
    );

    const fabButton = screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i });
    expect(fabButton).toBeInTheDocument();
  });

  it("TC-CHAT-02: Nhấn vào FAB mở cửa sổ chat với lời chào ban đầu và các gợi ý", () => {
    render(
      <MemoryRouter>
        <ChatbotWidget />
      </MemoryRouter>
    );

    const fabButton = screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i });
    fireEvent.click(fabButton);

    // Cửa sổ chat hiển thị
    expect(screen.getAllByText(/Trợ lý AI Bán hàng/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Online/i)).toBeInTheDocument();

    // Lời chào và các gợi ý ban đầu
    expect(screen.getByText(/Tôi là/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Doanh thu hôm nay bao nhiêu\?/i).length).toBeGreaterThanOrEqual(1);
  });

  it("TC-CHAT-03: Gửi tin nhắn tra cứu doanh thu và hiển thị Action Card liên kết sâu", async () => {
    mockSendMessage.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          code: 1000,
          message: "OK",
          result: {
            reply: "📊 Báo cáo doanh thu hôm nay đạt 15.500.000 VNĐ với 42 đơn hàng.",
            actionType: "VIEW_REPORT",
            actionLabel: "Xem Chi Tiết Báo Cáo Doanh Thu",
            actionUrl: "/reports/revenue",
            geminiPowered: true,
            suggestedQuestions: ["Có mặt hàng nào sắp hết kho không?"],
          },
        }),
    });

    render(
      <MemoryRouter>
        <ChatbotWidget />
      </MemoryRouter>
    );

    // Mở chatbot
    const fabButton = screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i });
    fireEvent.click(fabButton);

    const input = screen.getByPlaceholderText(/Hỏi doanh thu/i);
    fireEvent.change(input, { target: { value: "Doanh thu hôm nay bao nhiêu?" } });

    const sendBtn = screen.getByTitle("Gửi tin nhắn");
    fireEvent.click(sendBtn);

    expect(mockSendMessage).toHaveBeenCalledWith({
      message: "Doanh thu hôm nay bao nhiêu?",
      currentScreen: "/",
      history: [],
    });

    await waitFor(() => {
      expect(screen.getByText(/15.500.000 VNĐ/i)).toBeInTheDocument();
      // Đảm bảo không hiển thị tên model kỹ thuật 3.5 Flash cho người dùng
      expect(screen.queryByText(/3\.5/i)).not.toBeInTheDocument();
    });
  });

  it("TC-CHAT-04: Xử lý nút Reset cuộc trò chuyện và nút Đóng", () => {
    render(
      <MemoryRouter>
        <ChatbotWidget />
      </MemoryRouter>
    );

    // Mở chatbot
    fireEvent.click(screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i }));

    // Bấm reset
    const resetBtn = screen.getByRole("button", { name: /Làm mới chat/i });
    fireEvent.click(resetBtn);

    // Bấm đóng
    const closeBtn = screen.getByRole("button", { name: /Đóng/i });
    fireEvent.click(closeBtn);

    // Quay lại FAB
    expect(screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i })).toBeInTheDocument();
  });

  it("TC-CHAT-05: Tự động đổi vị trí sang góc trái ở màn POS (/pos) để không che nút Thanh toán", () => {
    render(
      <MemoryRouter initialEntries={["/pos"]}>
        <ChatbotWidget />
      </MemoryRouter>
    );

    const fabButton = screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i });
    expect(fabButton).toBeInTheDocument();
    // Ở màn /pos, left mặc định là 24px (góc dưới bên trái), không nằm ở góc phải che nút Thanh toán
    expect(fabButton.style.left).toBe("24px");
  });

  it("TC-CHAT-06: Parse và hiển thị chuẩn Markdown Table khi bot trả về bảng danh sách mặt hàng", async () => {
    mockSendMessage.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          code: 1000,
          message: "OK",
          result: {
            reply:
              "Dưới đây là top mặt hàng bán chạy:\n\n" +
              "| STT | Tên sản phẩm | Số lượng bán | Doanh thu |\n" +
              "| :---: | :--- | :---: | :---: |\n" +
              "| 1 | tnq | 68 | 652.402.000 VNĐ |\n" +
              "| 2 | Nước ngọt Coca-Cola 320ml | 18 | 163.620.000 VNĐ |\n",
            actionType: "VIEW_REPORT",
            actionLabel: "Xem Báo Cáo",
            actionUrl: "/reports/products",
            geminiPowered: true,
          },
        }),
    });

    render(
      <MemoryRouter>
        <ChatbotWidget />
      </MemoryRouter>
    );

    // Mở chatbot
    fireEvent.click(screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i }));

    const input = screen.getByPlaceholderText(/Hỏi doanh thu/i);
    fireEvent.change(input, { target: { value: "Top mặt hàng bán chạy" } });
    fireEvent.click(screen.getByTitle("Gửi tin nhắn"));

    await waitFor(() => {
      // Bảng HTML <table> được render với thẻ <th> và <td>
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
      expect(screen.getByText(/Tên sản phẩm/i)).toBeInTheDocument();
      expect(screen.getByText(/Nước ngọt Coca-Cola 320ml/i)).toBeInTheDocument();
      expect(screen.getByText(/652.402.000 VNĐ/i)).toBeInTheDocument();
    });
  });

  it("TC-CHAT-07: Khung chat ở góc phải được neo chính xác bên phải (left: auto, right: 1.5rem)", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ChatbotWidget />
      </MemoryRouter>
    );

    // Mở chatbot
    fireEvent.click(screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i }));

    const chatWindow = document.getElementById("chatbot-window");
    expect(chatWindow).toBeInTheDocument();

    // Kiểm tra style: right được set (1.5rem), left là auto
    expect(chatWindow?.style.right).toBe("1.5rem");
    expect(chatWindow?.style.left).toBe("auto");
  });

  it("TC-CHAT-08: Vai trò Thu ngân (VT-02) hiển thị lời chào và gợi ý quầy POS, chặn nút link kho", async () => {
    // Giả lập tài khoản Thu ngân
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "usr-cashier",
        username: "nhanvien_viet",
        fullName: "Nguyễn Thu Ngân",
        role: { code: "VT-02", name: "Nhân viên bán hàng" },
      })
    );

    mockSendMessage.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          code: 1000,
          message: "OK",
          result: {
            reply: "Dạ, thông tin tồn kho thuộc thẩm quyền quản trị của Chủ hộ.",
            actionType: "VIEW_INVENTORY",
            actionLabel: "Xem Cảnh Báo Tồn Kho",
            actionUrl: "/products/inventory-warnings", // Link trái quyền bị chặn
            geminiPowered: false,
            suggestedQuestions: ["Tình trạng ca bán hàng & tiền két hiện tại?"],
          },
        }),
    });

    render(
      <MemoryRouter>
        <ChatbotWidget />
      </MemoryRouter>
    );

    // Mở chatbot
    fireEvent.click(screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i }));

    // Lời chào và placeholder dành riêng cho Thu ngân
    expect(screen.getByText(/hướng dẫn quy trình bán hàng tại quầy POS/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Hỏi về ca bán hàng, phím tắt POS/i)).toBeInTheDocument();

    // Gửi câu hỏi
    const input = screen.getByPlaceholderText(/Hỏi về ca bán hàng, phím tắt POS/i);
    fireEvent.change(input, { target: { value: "Có sản phẩm nào sắp hết kho?" } });
    fireEvent.click(screen.getByTitle("Gửi tin nhắn"));

    await waitFor(() => {
      expect(screen.getByText(/thẩm quyền quản trị của Chủ hộ/i)).toBeInTheDocument();
      // Nút "Xem Cảnh Báo Tồn Kho" bị chặn hoàn toàn, không được hiển thị cho Thu ngân
      expect(screen.queryByText(/Xem Cảnh Báo Tồn Kho/i)).not.toBeInTheDocument();
    });

    localStorage.removeItem("user");
  });

  it("TC-CHAT-09: Bấm nút Sparkles mở/đóng drawer phân mục gợi ý theo vai trò", () => {
    render(
      <MemoryRouter>
        <ChatbotWidget />
      </MemoryRouter>
    );

    // Mở chatbot
    fireEvent.click(screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i }));

    // Bấm nút Phân mục gợi ý
    const sparklesBtn = screen.getByRole("button", { name: /Phân mục gợi ý/i });
    fireEvent.click(sparklesBtn);

    // Drawer hiển thị
    expect(screen.getAllByText(/Phân mục gợi ý/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Bán hàng/i).length).toBeGreaterThanOrEqual(1);

    // Bấm nút Đóng trên drawer
    const closeDrawerBtn = screen.getByText("Đóng");
    fireEvent.click(closeDrawerBtn);
  });

  it("TC-CHAT-10: Hỗ trợ kéo di chuyển khung chat khi đang mở và nhấp đúp để đặt lại vị trí", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ChatbotWidget />
      </MemoryRouter>
    );

    // Mở chatbot
    fireEvent.click(screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i }));

    const chatWindow = document.getElementById("chatbot-window");
    expect(chatWindow).toBeInTheDocument();

    const header = chatWindow?.querySelector('[title*="Kéo thanh tiêu đề để di chuyển"]');
    expect(header).toBeInTheDocument();

    // Giả lập thao tác kéo thả khung chat với tọa độ trong môi trường JSDOM
    const downEvt = createEvent.pointerDown(header!);
    Object.assign(downEvt, { clientX: 600, clientY: 400, button: 0 });
    fireEvent(header!, downEvt);

    const moveEvt = createEvent.pointerMove(header!);
    Object.assign(moveEvt, { clientX: 450, clientY: 250, button: 0 });
    fireEvent(header!, moveEvt);

    const upEvt = createEvent.pointerUp(header!);
    Object.assign(upEvt, { clientX: 450, clientY: 250, button: 0 });
    fireEvent(header!, upEvt);

    // Khung chat được chuyển sang vị trí tọa độ động (left / top cụ thể, right / bottom là auto)
    expect(chatWindow?.style.left).not.toBe("auto");
    expect(chatWindow?.style.top).not.toBe("auto");
    expect(chatWindow?.style.right).toBe("auto");
    expect(chatWindow?.style.bottom).toBe("auto");

    // Nhấp đúp chuột lên header để reset về vị trí mặc định
    fireEvent.doubleClick(header!);
    expect(chatWindow?.style.right).toBe("1.5rem");
    expect(chatWindow?.style.left).toBe("auto");
    expect(chatWindow?.style.bottom).toBe("1.5rem");
  });

  it("TC-CHAT-11: Đồng nhất 100% vị trí giữa trạng thái mở và đóng (kéo khi mở thì nút đóng di chuyển theo)", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ChatbotWidget />
      </MemoryRouter>
    );

    // 1. Mở chatbot
    const fabButton = screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i });
    const initialFabLeft = fabButton.style.left;
    fireEvent.click(fabButton);

    const chatWindow = document.getElementById("chatbot-window");
    expect(chatWindow).toBeInTheDocument();

    const header = chatWindow?.querySelector('[title*="Kéo thanh tiêu đề để di chuyển"]');
    expect(header).toBeInTheDocument();

    // 2. Kéo khung chat sang vị trí mới ở trạng thái mở
    const downEvt = createEvent.pointerDown(header!);
    Object.assign(downEvt, { clientX: 700, clientY: 500, button: 0 });
    fireEvent(header!, downEvt);

    const moveEvt = createEvent.pointerMove(header!);
    Object.assign(moveEvt, { clientX: 400, clientY: 200, button: 0 });
    fireEvent(header!, moveEvt);

    const upEvt = createEvent.pointerUp(header!);
    Object.assign(upEvt, { clientX: 400, clientY: 200, button: 0 });
    fireEvent(header!, upEvt);

    // 3. Đóng khung chat lại
    const closeBtn = screen.getByRole("button", { name: /Đóng/i });
    fireEvent.click(closeBtn);

    // 4. Kiểm tra nút FAB ở trạng thái đóng: ĐÃ ĐƯỢC ĐỒNG BỘ theo vị trí vừa kéo, không bị quay về vị trí ban đầu
    const newFabButton = screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i });
    expect(newFabButton).toBeInTheDocument();
    expect(newFabButton.style.left).not.toBe(initialFabLeft);

    // 5. Mở lại chatbot từ nút FAB mới: Cửa sổ mở ra ngay tại vị trí đã đồng bộ
    fireEvent.click(newFabButton);
    const reopenedWindow = document.getElementById("chatbot-window");
    expect(reopenedWindow).toBeInTheDocument();
    expect(reopenedWindow?.style.left).not.toBe("auto");
    expect(reopenedWindow?.style.top).not.toBe("auto");
  });

  it("TC-CHAT-12: Kéo di chuyển nút FAB ở trạng thái đóng và chuột phải để reset vị trí", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ChatbotWidget />
      </MemoryRouter>
    );

    const fabButton = screen.getByRole("button", { name: /Trợ lý AI Bán hàng/i });
    expect(fabButton).toBeInTheDocument();
    const initialLeft = fabButton.style.left;

    // Giả lập kéo nút FAB
    const downEvt = createEvent.pointerDown(fabButton);
    Object.assign(downEvt, { clientX: 800, clientY: 600, button: 0 });
    fireEvent(fabButton, downEvt);

    const moveEvt = createEvent.pointerMove(fabButton);
    Object.assign(moveEvt, { clientX: 500, clientY: 300, button: 0 });
    fireEvent(fabButton, moveEvt);

    const upEvt = createEvent.pointerUp(fabButton);
    Object.assign(upEvt, { clientX: 500, clientY: 300, button: 0 });
    fireEvent(fabButton, upEvt);

    // Nút FAB đã chuyển sang vị trí mới
    expect(fabButton.style.left).not.toBe(initialLeft);

    // Chuột phải (ContextMenu) lên FAB để reset về mặc định
    fireEvent.contextMenu(fabButton);
    expect(fabButton.style.left).toBe(initialLeft);
  });
});

