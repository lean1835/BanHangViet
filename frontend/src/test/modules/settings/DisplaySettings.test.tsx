import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/stores/baseApi";
import authReducer from "@/stores/authSlice";
import displaySettingsReducer, {
  setDisplaySettings,
} from "@/stores/displaySettingsSlice";
import { DisplaySettingsPanel } from "@/modules/settings/components/DisplaySettingsPanel";
import { ActionConsequenceConfirmModal } from "@/modules/order/components/ActionConsequenceConfirmModal";
import { PosMoreActionsModal } from "@/modules/pos/components/PosMoreActionsModal";
import * as displaySettingApiModule from "@/modules/settings/services/displaySettingApi";
import * as actionConfirmationApiModule from "@/modules/order/services/actionConfirmationApi";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockShowWarning = vi.fn();
const mockShowInfo = vi.fn();

vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: mockShowWarning,
    showInfo: mockShowInfo,
  }),
}));

describe("NCL-19-CN-001: Chế độ hiển thị chữ lớn và thao tác đơn giản", () => {
  const mockUpdateDisplaySettings = vi.fn();
  const mockToggleSimpleMode = vi.fn();

  const mockDisplaySetting = {
    id: "ds-001",
    userId: "usr-001",
    username: "chuho_viet",
    simpleModeEnabled: false,
    fontSizeLevel: "STANDARD" as const,
    fontSizeLevelName: "Tiêu chuẩn",
    fontScalePercentage: 100,
    buttonSizeLevel: "STANDARD" as const,
    buttonSizeLevelName: "Tiêu chuẩn",
    buttonScalePercentage: 100,
    minTouchHeight: "40px",
    showTextLabels: true,
    requireConfirmationDialog: true,
    highContrastEnabled: false,
    simplifiedPosLayout: true,
    updatedAt: "2026-09-17T08:00:00",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(
      displaySettingApiModule,
      "useGetDisplaySettingsQuery"
    ).mockReturnValue({
      data: {
        code: 1000,
        message: "Thành công",
        result: mockDisplaySetting,
      },
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(
      displaySettingApiModule,
      "useUpdateDisplaySettingsMutation"
    ).mockReturnValue([
      mockUpdateDisplaySettings,
      { isLoading: false } as any,
    ]);

    vi.spyOn(
      displaySettingApiModule,
      "useToggleSimpleModeMutation"
    ).mockReturnValue([
      mockToggleSimpleMode,
      { isLoading: false } as any,
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createTestStore = () => {
    return configureStore({
      reducer: {
        auth: authReducer,
        displaySettings: displaySettingsReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: "usr-001",
            username: "chuho_viet",
            fullName: "Nguyễn Văn Việt",
            phoneNumber: "0912345678",
            email: "viet@example.com",
            roleId: "VT-01",
            household: null,
          },
          token: "valid-test-token",
          isAuthenticated: true,
        },
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(
          baseApi.middleware
        ),
    });
  };

  const renderWithProviders = (
    ui: React.ReactElement,
    store = createTestStore()
  ) => {
    return {
      store,
      ...render(
        <Provider store={store}>
          <MemoryRouter>{ui}</MemoryRouter>
        </Provider>
      ),
    };
  };

  it("TC-01: Hiển thị giao diện cấu hình và cho phép tùy chỉnh cỡ chữ, nút bấm", async () => {
    renderWithProviders(<DisplaySettingsPanel />);

    expect(
      screen.getByText(/Chế độ hiển thị chữ lớn & Thao tác đơn giản/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Mức cỡ chữ hiển thị/i)).toBeInTheDocument();
    expect(screen.getByText(/Kích thước nút bấm/i)).toBeInTheDocument();

    const user = userEvent.setup();

    // Click chọn Cỡ chữ "Lớn (Khuyên dùng)"
    const largeFontButton = screen.getByRole("button", {
      name: /Lớn \(Khuyên dùng\)/i,
    });
    await user.click(largeFontButton);

    // Click chọn Kích thước nút bấm "Lớn (52px)"
    const largeButton = screen.getByRole("button", {
      name: /Lớn \(52px\)/i,
    });
    await user.click(largeButton);

    // Click "Lưu cấu hình hiển thị"
    mockUpdateDisplaySettings.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          code: 1000,
          result: { ...mockDisplaySetting, fontSizeLevel: "LARGE", buttonSizeLevel: "LARGE" },
        }),
    });

    const saveButton = screen.getByRole("button", {
      name: /Lưu cấu hình hiển thị/i,
    });
    await user.click(saveButton);

    expect(mockUpdateDisplaySettings).toHaveBeenCalled();
  });

  it("TC-02: Bật nhanh Simple Mode gọi mutation toggle và cập nhật trạng thái", async () => {
    mockToggleSimpleMode.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          code: 1000,
          result: {
            ...mockDisplaySetting,
            simpleModeEnabled: true,
            fontSizeLevel: "LARGE",
            buttonSizeLevel: "LARGE",
          },
        }),
    });

    renderWithProviders(<DisplaySettingsPanel />);

    const user = userEvent.setup();
    const toggleButton = screen.getByRole("button", {
      name: "",
    });
    await user.click(toggleButton);

    expect(mockToggleSimpleMode).toHaveBeenCalledWith({ enabled: true });
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Đã bật chế độ chữ lớn và thao tác đơn giản!"
      );
    });
  });

  it("TC-02: Đồng bộ cấu hình vào DOM attributes và CSS custom properties", () => {
    const store = createTestStore();
    store.dispatch(
      setDisplaySettings({
        simpleModeEnabled: true,
        fontSizeLevel: "LARGE",
        buttonSizeLevel: "LARGE",
        highContrastEnabled: true,
      })
    );

    const root = document.documentElement;
    expect(root.getAttribute("data-simple-mode")).toBe("true");
    expect(root.getAttribute("data-font-size")).toBe("LARGE");
    expect(root.getAttribute("data-button-size")).toBe("LARGE");
    expect(root.getAttribute("data-high-contrast")).toBe("true");
    expect(root.style.getPropertyValue("--app-font-scale")).toBe("1.25");
    expect(root.style.getPropertyValue("--app-min-touch-height")).toBe("52px");
  });

  it("TC-03: ActionConsequenceConfirmModal hiển thị đầy đủ hậu quả một chiều từ máy chủ", () => {
    vi.spyOn(
      actionConfirmationApiModule,
      "useGetActionConsequencesQuery"
    ).mockReturnValue({
      data: {
        code: 1000,
        result: {
          actionType: "CANCEL_ORDER",
          actionName: "Hủy đơn hàng",
          targetId: "ord-123",
          targetCode: "HD-00123",
          targetSummary: "Đơn hàng HD-00123 - Tổng tiền: 250.000 đ",
          isIrreversible: true,
          severity: "DANGER",
          warningTitle: "Xác nhận hủy đơn hàng đang bán",
          consequences: [
            "Đơn bán hàng gồm 2 mặt hàng với tổng số tiền 250.000 đ sẽ bị hủy bỏ hoàn toàn.",
            "Bàn 'Bàn 3' đang gắn với đơn sẽ được giải phóng về trạng thái trống.",
            "Thao tác này KHÔNG THỂ HOÀN TÁC.",
          ],
          confirmPrompt: "Bạn có chắc chắn muốn hủy bỏ đơn hàng này không?",
          confirmButtonText: "Tôi hiểu hậu quả, Hủy đơn ngay",
          cancelButtonText: "Quay lại màn hình bán",
        },
      },
      isLoading: false,
      isError: false,
    } as any);

    const onConfirmMock = vi.fn();
    const onCloseMock = vi.fn();

    renderWithProviders(
      <ActionConsequenceConfirmModal
        isOpen={true}
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        actionType="CANCEL_ORDER"
        targetId="ord-123"
      />
    );

    expect(
      screen.getByText("Xác nhận hủy đơn hàng đang bán")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Đơn hàng HD-00123 - Tổng tiền: 250.000 đ")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sẽ bị hủy bỏ hoàn toàn/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Thao tác này KHÔNG THỂ HOÀN TÁC/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tôi hiểu hậu quả, Hủy đơn ngay/i })
    ).toBeInTheDocument();
  });

  it("TC-01: PosMoreActionsModal hiển thị các chức năng phụ được thu gọn", async () => {
    const onOpenTableMock = vi.fn();
    const onCancelMock = vi.fn();
    const onCloseMock = vi.fn();

    renderWithProviders(
      <PosMoreActionsModal
        isOpen={true}
        onClose={onCloseMock}
        onOpenTableManagement={onOpenTableMock}
        onCancelOrder={onCancelMock}
        canManage={true}
        heldOrdersCount={3}
      />
    );

    expect(
      screen.getByText("Các chức năng xem thêm")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Quản lý phòng / bàn")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hủy đơn hàng đang tạo")
    ).toBeInTheDocument();

    const user = userEvent.setup();
    const tableButton = screen.getByText("Quản lý phòng / bàn");
    await user.click(tableButton);

    expect(onOpenTableMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });
});
