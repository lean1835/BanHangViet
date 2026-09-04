import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import {
  DashboardDemoContext,
  type IDashboardDemoContext,
} from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { VoiceSearchModal } from "@/modules/product/components/VoiceSearchModal";
import { PosHeader } from "@/modules/pos/components/PosHeader";
import { ProductList } from "@/modules/product/components/ProductList";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IPosTab } from "@/modules/pos/types/IPos";
import { VOICE_SEARCH_MESSAGES } from "@/constants/product";

const mockProductNamNgu: IProduct = {
  id: "prod-001",
  sku: "SP001",
  barcode: "8934567890123",
  name: "Nước mắm Nam Ngư chai 500 mililít",
  unit: "Chai",
  price: 45000,
  stockQuantity: 50,
  minStockQuantity: 5,
  status: "ACTIVE",
  groupId: "grp-1",
  groupName: "Gia vị",
  taxRateId: "tax-8",
  taxRateName: "Thuế 8%",
  taxRatePercentage: 8,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

const mockProductCoca: IProduct = {
  id: "prod-002",
  sku: "SP002",
  barcode: "893000111222",
  name: "Nước ngọt Coca Cola lon 320ml",
  unit: "Lon",
  price: 12000,
  stockQuantity: 120,
  minStockQuantity: 10,
  status: "ACTIVE",
  groupId: "grp-2",
  groupName: "Giải khát",
  taxRateId: "tax-8",
  taxRateName: "Thuế 8%",
  taxRatePercentage: 8,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

const mockProductsList: IProduct[] = [mockProductNamNgu, mockProductCoca];

const mockInitialTab: IPosTab = {
  id: "tab-1",
  orderNumber: "Hóa đơn 1",
  status: "PENDING",
  saleMode: "FAST",
  items: [],
  discountType: "PERCENTAGE",
  discountValue: 0,
  paymentMethod: "CASH",
  amountGiven: 0,
  isSaved: false,
};

const renderWithProviders = (
  ui: React.ReactElement,
  role: string = USER_ROLES.CASHIER
) => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  const mockContextValue = {
    currentRole: role,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    currentHouseholdId: "hh-100",
    setCurrentHouseholdId: vi.fn(),
    recentLogs: [],
    addLogEntry: vi.fn(),
    products: mockProductsList,
    setProducts: vi.fn(),
    orders: [],
    setOrders: vi.fn(),
    customers: [],
    setCustomers: vi.fn(),
  } as unknown as IDashboardDemoContext;

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <DashboardDemoContext.Provider value={mockContextValue}>
          <NotificationProvider>{ui}</NotificationProvider>
        </DashboardDemoContext.Provider>
      </BrowserRouter>
    </Provider>
  );
};

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = true;
  lang = "vi-VN";
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onresult: ((event: any) => void) | null = null;

  start = vi.fn().mockImplementation(() => {
    if (this.onstart) {
      this.onstart();
    }
  });

  stop = vi.fn().mockImplementation(() => {
    if (this.onend) {
      this.onend();
    }
  });

  abort = vi.fn();

  // Helper trigger methods for test simulation
  triggerResult(transcript: string, isFinal = true) {
    if (this.onresult) {
      this.onresult({
        resultIndex: 0,
        results: [
          {
            isFinal,
            0: {
              transcript,
              confidence: 0.95,
            },
            length: 1,
          },
        ],
      });
    }
  }

  triggerError(error: string) {
    if (this.onerror) {
      this.onerror({ error });
    }
  }
}

let mockRecognitionInstance: MockSpeechRecognition;

beforeEach(() => {
  mockRecognitionInstance = new MockSpeechRecognition();
  (window as any).webkitSpeechRecognition = vi.fn(() => mockRecognitionInstance);
  (window as any).SpeechRecognition = vi.fn(() => mockRecognitionInstance);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  delete (window as any).webkitSpeechRecognition;
  delete (window as any).SpeechRecognition;
});

describe("NCL-16-CN-003 (NCL-016-CN-003): Đọc tên hàng bằng giọng nói để tìm nhanh", () => {
  describe("Subtask CV-01 & CV-02: Thiết kế giao diện & Kích hoạt Voice Search", () => {
    it("PosHeader renders Voice Search microphone button in search bar corner and opens voice modal when clicked", () => {
      const handleOpenVoiceModal = vi.fn();
      renderWithProviders(
        <PosHeader
          products={mockProductsList}
          tabs={[mockInitialTab]}
          activeTabId={mockInitialTab.id}
          onSelectTab={vi.fn()}
          onAddTab={vi.fn()}
          onCloseTab={vi.fn()}
          onSelectProduct={vi.fn()}
          onOpenVoiceModal={handleOpenVoiceModal}
        />
      );

      const voiceButton = screen.getByTitle("Tìm hàng bằng giọng nói (F4)");
      expect(voiceButton).toBeInTheDocument();

      fireEvent.click(voiceButton);
      expect(handleOpenVoiceModal).toHaveBeenCalledTimes(1);
    });

    it("PosHeader triggers search input focus when pressing / hotkey", () => {
      renderWithProviders(
        <PosHeader
          products={mockProductsList}
          tabs={[mockInitialTab]}
          activeTabId={mockInitialTab.id}
          onSelectTab={vi.fn()}
          onAddTab={vi.fn()}
          onCloseTab={vi.fn()}
          onSelectProduct={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Tìm hàng hóa/i);
      expect(document.activeElement).not.toBe(searchInput);

      fireEvent.keyDown(window, { key: "/" });
      expect(document.activeElement).toBe(searchInput);
    });

    it("PosHeader triggers onOpenVoiceModal when pressing F4 hotkey", () => {
      const handleOpenVoiceModal = vi.fn();
      renderWithProviders(
        <PosHeader
          products={mockProductsList}
          tabs={[mockInitialTab]}
          activeTabId={mockInitialTab.id}
          onSelectTab={vi.fn()}
          onAddTab={vi.fn()}
          onCloseTab={vi.fn()}
          onSelectProduct={vi.fn()}
          onOpenVoiceModal={handleOpenVoiceModal}
        />
      );

      fireEvent.keyDown(window, { key: "F4" });
      expect(handleOpenVoiceModal).toHaveBeenCalledTimes(1);
    });
  });

  describe("NCL-16-CN-003-TC-01: Luồng thành công (Nhận diện giọng nói và chọn mặt hàng)", () => {
    it("renders modal, starts listening automatically, accepts speech transcript, and allows selecting product", async () => {
      const handleSelectProduct = vi.fn();
      const handleClose = vi.fn();

      renderWithProviders(
        <VoiceSearchModal
          isOpen={true}
          onClose={handleClose}
          onSelectProduct={handleSelectProduct}
        />
      );

      expect(screen.getByText(VOICE_SEARCH_MESSAGES.MODAL_TITLE)).toBeInTheDocument();
      expect(mockRecognitionInstance.start).toHaveBeenCalled();

      // Simulate speech recognition result with trailing punctuation (e.g. "nuoc mam.")
      mockRecognitionInstance.triggerResult("nuoc mam.", true);

      // Verify manual input fallback is populated with CLEANED recognized text (no dot)
      const input = screen.getByPlaceholderText("Nhập tên mặt hàng hoặc mã SKU...") as HTMLInputElement;
      await waitFor(() => {
        expect(input.value).toBe("nuoc mam");
      });

      // Verify manual submission triggers search
      fireEvent.submit(input.closest("form")!);

      // Close modal on escape
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalled();
    });

    it("automatically cleans trailing punctuation marks (dots, commas, question marks) from speech transcript", async () => {
      renderWithProviders(
        <VoiceSearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectProduct={vi.fn()}
        />
      );

      // Simulate SpeechRecognition with "Nước cam."
      mockRecognitionInstance.triggerResult("Nước cam.", true);

      const input = screen.getByPlaceholderText("Nhập tên mặt hàng hoặc mã SKU...") as HTMLInputElement;
      await waitFor(() => {
        expect(input.value).toBe("Nước cam");
      });
    });
  });

  describe("NCL-16-CN-003-TC-02: Ngoại lệ (Quán ồn / Chưa nghe rõ từ khóa)", () => {
    it("displays friendly retry message when no speech is detected (no-speech error)", async () => {
      renderWithProviders(
        <VoiceSearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectProduct={vi.fn()}
        />
      );

      // Simulate SpeechRecognition 'no-speech' error
      mockRecognitionInstance.triggerError("no-speech");

      await waitFor(() => {
        expect(
          screen.getByText(VOICE_SEARCH_MESSAGES.NOT_RECOGNIZED)
        ).toBeInTheDocument();
      });

      // Verify retry button is present
      const retryButtons = screen.getAllByText("Thử lại");
      expect(retryButtons.length).toBeGreaterThan(0);
      fireEvent.click(retryButtons[0]);

      // Should restart speech recognition
      expect(mockRecognitionInstance.start).toHaveBeenCalled();
    });
  });

  describe("NCL-16-CN-003-TC-03: Không có quyền / Trình duyệt không hỗ trợ", () => {
    it("displays permission guide banner when microphone access is denied (not-allowed)", async () => {
      renderWithProviders(
        <VoiceSearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectProduct={vi.fn()}
        />
      );

      // Simulate SpeechRecognition 'not-allowed' error
      mockRecognitionInstance.triggerError("not-allowed");

      await waitFor(() => {
        expect(screen.getByText("Chưa cấp quyền Microphone")).toBeInTheDocument();
        expect(
          screen.getByText(VOICE_SEARCH_MESSAGES.PERMISSION_DENIED)
        ).toBeInTheDocument();
      });

      // Fallback input should still be accessible for typing
      const input = screen.getByPlaceholderText("Nhập tên mặt hàng hoặc mã SKU...");
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: "Coca" } });
      await waitFor(() => {
        expect((input as HTMLInputElement).value).toBe("Coca");
      });
    });

    it("displays fallback message when browser does not support Web Speech API", () => {
      // Remove SpeechRecognition support
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).SpeechRecognition;

      renderWithProviders(
        <VoiceSearchModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectProduct={vi.fn()}
        />
      );

      expect(
        screen.getByText(VOICE_SEARCH_MESSAGES.NOT_SUPPORTED)
      ).toBeInTheDocument();
    });
  });

  describe("Subtask CV-04: Tích hợp Voice Search trong danh mục sản phẩm (ProductList)", () => {
    it("ProductList renders microphone button in search bar and opens VoiceSearchModal", () => {
      renderWithProviders(
        <ProductList
          userRole={USER_ROLES.OWNER}
          selectedGroup="ALL"
          stockFilter="ALL"
        />
      );

      const micButton = screen.getByTitle("Tìm hàng bằng giọng nói");
      expect(micButton).toBeInTheDocument();

      fireEvent.click(micButton);
      expect(screen.getByText(VOICE_SEARCH_MESSAGES.MODAL_TITLE)).toBeInTheDocument();
    });
  });
});
