import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { SettingsSidebar } from "@/modules/settings/components/SettingsSidebar";
import { DashboardNavigation } from "@/components/layouts/DashboardNavigation";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithProviders = (
  ui: React.ReactElement,
  role: TDemoRole = USER_ROLES.OWNER
) => {
  const store = configureStore({
    reducer: {
      auth: (state = {
        user: {
          id: "1",
          username: "testuser",
          fullName: "Test User",
          roleId: role,
          household: null,
        },
        token: "fake-token",
        isAuthenticated: true,
      }) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(baseApi.middleware),
  });

  const mockContextValue: any = {
    currentRole: role,
    setCurrentRole: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
    simConflict: false,
    setSimConflict: vi.fn(),
    invoices: [],
    setInvoices: vi.fn(),
    customers: [],
    logs: [],
    addActivityLog: vi.fn(),
    refetchOrders: vi.fn(),
  };

  return render(
    <Provider store={store}>
      <DashboardDemoContext.Provider value={mockContextValue}>
        <MemoryRouter>{ui}</MemoryRouter>
      </DashboardDemoContext.Provider>
    </Provider>
  );
};

describe("Settings Role-Based Access Control (RBAC)", () => {
  describe("Cashier / Nhân viên bán hàng (VT-02)", () => {
    it("shows 'Cấu hình' in the top navigation bar", () => {
      renderWithProviders(
        <DashboardNavigation currentRole={USER_ROLES.CASHIER} />,
        USER_ROLES.CASHIER
      );
      expect(screen.getByText("Cấu hình")).toBeInTheDocument();
    });

    it("renders ONLY 'Tài khoản người dùng' in the Settings sidebar", () => {
      renderWithProviders(<SettingsSidebar />, USER_ROLES.CASHIER);

      // Must be present
      expect(screen.getByText("Tài khoản người dùng")).toBeInTheDocument();

      // Must NOT be present
      expect(screen.queryByText("Điểm bán (Chi nhánh)")).not.toBeInTheDocument();
      expect(screen.queryByText("Thông tin cửa hàng")).not.toBeInTheDocument();
      expect(screen.queryByText("Mẫu hóa đơn")).not.toBeInTheDocument();
      expect(screen.queryByText("Thuế suất")).not.toBeInTheDocument();
      expect(screen.queryByText("Sao lưu & Phục hồi dữ liệu")).not.toBeInTheDocument();
    });
  });

  describe("Accountant / Kế toán (VT-03)", () => {
    it("renders accounting-relevant settings items and hides admin-only settings", () => {
      renderWithProviders(<SettingsSidebar />, USER_ROLES.ACCOUNTANT);

      // Must be present
      expect(screen.getByText("Tài khoản người dùng")).toBeInTheDocument();
      expect(screen.getByText("Thông tin cửa hàng")).toBeInTheDocument();
      expect(screen.getByText("Mẫu hóa đơn")).toBeInTheDocument();
      expect(screen.getByText("Thuế suất")).toBeInTheDocument();

      // Must NOT be present for Accountant
      expect(screen.queryByText("Điểm bán (Chi nhánh)")).not.toBeInTheDocument();
      expect(screen.queryByText("Sao lưu & Phục hồi dữ liệu")).not.toBeInTheDocument();
    });
  });

  describe("Owner / Chủ hộ kinh doanh (VT-01)", () => {
    it("renders ALL 6 settings navigation items in SettingsSidebar", () => {
      renderWithProviders(<SettingsSidebar />, USER_ROLES.OWNER);

      expect(screen.getByText("Tài khoản người dùng")).toBeInTheDocument();
      expect(screen.getByText("Điểm bán (Chi nhánh)")).toBeInTheDocument();
      expect(screen.getByText("Thông tin cửa hàng")).toBeInTheDocument();
      expect(screen.getByText("Mẫu hóa đơn")).toBeInTheDocument();
      expect(screen.getByText("Thuế suất")).toBeInTheDocument();
      expect(screen.getByText("Sao lưu & Phục hồi dữ liệu")).toBeInTheDocument();
    });
  });
});
