import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { AnomalyAlertSummaryCards } from "@/modules/anomaly_alert/components/AnomalyAlertSummaryCards";
import { AnomalyAlertFilterBar } from "@/modules/anomaly_alert/components/AnomalyAlertFilterBar";
import { AnomalyAlertSidebar } from "@/modules/anomaly_alert/components/AnomalyAlertSidebar";
import { AnomalyAlertFilterProvider } from "@/modules/anomaly_alert/context/AnomalyAlertFilterContext";
import { AnomalyAlertTable } from "@/modules/anomaly_alert/components/AnomalyAlertTable";
import { ReviewAnomalyAlertModal } from "@/modules/anomaly_alert/components/ReviewAnomalyAlertModal";
import { AnomalyRuleConfigModal } from "@/modules/anomaly_alert/components/AnomalyRuleConfigModal";
import { ScanAnomalyModal } from "@/modules/anomaly_alert/components/ScanAnomalyModal";
import { AnomalyAlertPage } from "@/modules/anomaly_alert/pages/AnomalyAlertPage";
import { ANOMALY_UI } from "@/constants/anomalyAlert";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import type {
  IAnomalyAlert,
  IAnomalyAlertSummary,
  IAnomalyAlertFilterParams,
} from "@/modules/anomaly_alert/types/IAnomalyAlert";

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
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <NotificationProvider>
        <DashboardDemoContext.Provider
          value={
            {
              currentRole: role,
              setCurrentRole: vi.fn(),
              addLogEntry: vi.fn(),
            } as any
          }
        >
          <MemoryRouter>{ui}</MemoryRouter>
        </DashboardDemoContext.Provider>
      </NotificationProvider>
    </Provider>
  );
};

const mockSummaryCleanDay: IAnomalyAlertSummary = {
  totalAlerts: 0,
  pendingAlerts: 0,
  reviewedAlerts: 0,
  dismissedAlerts: 0,
  criticalAlerts: 0,
  warningAlerts: 0,
  infoAlerts: 0,
  isCleanDay: true,
  evaluatedDate: "2026-09-15",
  lastScannedAt: "2026-09-15T09:30:00Z",
};

const mockSummaryWithAlerts: IAnomalyAlertSummary = {
  totalAlerts: 10,
  pendingAlerts: 5,
  reviewedAlerts: 4,
  dismissedAlerts: 1,
  criticalAlerts: 3,
  warningAlerts: 2,
  infoAlerts: 0,
  isCleanDay: false,
  evaluatedDate: "2026-09-15",
  lastScannedAt: "2026-09-15T09:30:00Z",
};

const mockAlerts: IAnomalyAlert[] = [
  {
    id: "alt-001",
    householdId: "hh-001",
    alertType: "MASS_INVOICE_CANCEL",
    severity: "CRITICAL",
    title: "Phát hiện tài khoản hủy 5 hóa đơn trong 10 phút",
    description: "Tài khoản bannam01 đã hủy 5 hóa đơn điện tử liên tiếp trong khoảng thời gian từ 09:20 đến 09:30.",
    actorUserId: "u-002",
    actorUsername: "bannam01",
    actorFullName: "Nguyễn Văn Nam",
    status: "PENDING",
    evidenceData: JSON.stringify({
      cancelledInvoiceCount: 5,
      invoiceIds: ["inv-1", "inv-2", "inv-3", "inv-4", "inv-5"],
      timeWindowMinutes: 10,
    }),
    detectedAt: "2026-09-15T09:30:00Z",
    reviewedByUserId: null,
    reviewedByUsername: null,
    reviewedByFullName: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: "2026-09-15T09:30:00Z",
  },
  {
    id: "alt-002",
    householdId: "hh-001",
    alertType: "UNUSUAL_HIGH_DISCOUNT",
    severity: "WARNING",
    title: "Phát hiện đơn hàng giảm giá 40%",
    description: "Đơn hàng #ORD-9923 có mức giảm giá 40%, vượt ngưỡng cấu hình 30%.",
    actorUserId: "u-002",
    actorUsername: "bannam01",
    actorFullName: "Nguyễn Văn Nam",
    status: "REVIEWED",
    evidenceData: JSON.stringify({
      orderId: "ord-9923",
      discountPercentage: 40,
      thresholdPercentage: 30,
    }),
    detectedAt: "2026-09-15T11:00:00Z",
    reviewedByUserId: "u-001",
    reviewedByUsername: "owner01",
    reviewedByFullName: "Chủ hộ",
    reviewedAt: "2026-09-15T11:30:00Z",
    reviewNotes: "Đã xác nhận chương trình ưu đãi VIP.",
    createdAt: "2026-09-15T11:00:00Z",
  },
];

describe("NCL-14-CN-004: Anomaly Detection & Alert Module", () => {
  /* =======================================================================
   * TC-01: Luồng thành công - Hiển thị cảnh báo vi phạm
   * ======================================================================= */
  describe("NCL-14-CN-004-TC-01: AnomalyAlertTable Component", () => {
    it("Renders alert rows correctly with Severity, Type, Title, Actor, and Status", () => {
      const handleViewDetail = vi.fn();

      renderWithProviders(
        <AnomalyAlertTable
          alerts={mockAlerts}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={2}
          onPageChange={vi.fn()}
          onViewDetail={handleViewDetail}
        />
      );

      // Verify Severity badges
      expect(screen.getByText("CRITICAL")).toBeInTheDocument();
      expect(screen.getByText("WARNING")).toBeInTheDocument();

      // Verify Alert Types
      expect(screen.getByText("Hủy hóa đơn hàng loạt")).toBeInTheDocument();
      expect(screen.getByText("Chiết khấu/Giảm giá bất thường")).toBeInTheDocument();

      // Verify Actor Username & Full Name
      expect(screen.getAllByText("bannam01").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Nguyễn Văn Nam").length).toBeGreaterThan(0);

      // Verify Status
      expect(screen.getByText("Chờ xử lý")).toBeInTheDocument();
      expect(screen.getByText("Đã xử lý")).toBeInTheDocument();
    });

    it("Fires onViewDetail callback when clicking an alert row", () => {
      const handleViewDetail = vi.fn();

      renderWithProviders(
        <AnomalyAlertTable
          alerts={mockAlerts}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={2}
          onPageChange={vi.fn()}
          onViewDetail={handleViewDetail}
        />
      );

      const alertRowText = screen.getByText("Hủy hóa đơn hàng loạt");
      fireEvent.click(alertRowText.closest("tr")!);
      expect(handleViewDetail).toHaveBeenCalledWith(mockAlerts[0]);
    });
  });

  /* =======================================================================
   * TC-02: Dữ liệu rỗng - Ngày làm việc an toàn (Clean Day)
   * ======================================================================= */
  describe("NCL-14-CN-004-TC-02: AnomalyAlertSummaryCards Component", () => {
    it("Renders Clean Day Badge (Ngày làm việc an toàn) when isCleanDay is true", () => {
      renderWithProviders(
        <AnomalyAlertSummaryCards
          summary={mockSummaryCleanDay}
          isLoading={false}
          onOpenScanModal={vi.fn()}
          onOpenRulesModal={vi.fn()}
        />
      );

      expect(screen.getByText(ANOMALY_UI.OVERVIEW.CLEAN_DAY_TITLE)).toBeInTheDocument();
      expect(screen.getByText(ANOMALY_UI.OVERVIEW.CLEAN_DAY_DESC)).toBeInTheDocument();
      expect(screen.getByText("An toàn 100%")).toBeInTheDocument();
    });

    it("Renders KPI statistics counters when alerts exist", () => {
      renderWithProviders(
        <AnomalyAlertSummaryCards
          summary={mockSummaryWithAlerts}
          isLoading={false}
          onOpenScanModal={vi.fn()}
          onOpenRulesModal={vi.fn()}
        />
      );

      expect(screen.getByText("10")).toBeInTheDocument(); // total
      expect(screen.getByText("5")).toBeInTheDocument(); // pending
      expect(screen.getByText("3")).toBeInTheDocument(); // critical
      expect(screen.getByText("2")).toBeInTheDocument(); // warning
      expect(screen.queryByText(ANOMALY_UI.OVERVIEW.CLEAN_DAY_TITLE)).not.toBeInTheDocument();
    });
  });

  /* =======================================================================
   * Filter Bar Component
   * ======================================================================= */
  describe("AnomalyAlertFilterBar Component", () => {
    it("Handles keyword and filter dropdown changes", () => {
      const handleFilterChange = vi.fn();
      const handleResetFilter = vi.fn();
      const filterParams: IAnomalyAlertFilterParams = {
        keyword: "",
        severity: "",
        status: "",
        alertType: "",
      };

      renderWithProviders(
        <AnomalyAlertFilterBar
          filter={filterParams}
          onFilterChange={handleFilterChange}
          onResetFilter={handleResetFilter}
        />
      );

      const input = screen.getByPlaceholderText(ANOMALY_UI.FILTERS.SEARCH_PLACEHOLDER);
      fireEvent.change(input, { target: { value: "bannam" } });
      expect(handleFilterChange).toHaveBeenCalledWith({ keyword: "bannam" });

      const resetBtn = screen.getByTitle(ANOMALY_UI.FILTERS.RESET_BTN);
      fireEvent.click(resetBtn);
      expect(handleResetFilter).toHaveBeenCalledTimes(1);
    });
  });

  /* =======================================================================
   * AnomalyAlertSidebar Component (Left Navigation Tab Filter)
   * ======================================================================= */
  describe("AnomalyAlertSidebar Component", () => {
    it("Renders BỘ LỌC CẢNH BÁO in sidebar with filter controls", () => {
      renderWithProviders(
        <AnomalyAlertFilterProvider>
          <AnomalyAlertSidebar />
        </AnomalyAlertFilterProvider>
      );

      expect(screen.getByText("BỘ LỌC CẢNH BÁO")).toBeInTheDocument();
      expect(screen.getByText(ANOMALY_UI.FILTERS.SEVERITY_ALL)).toBeInTheDocument();
      expect(screen.getByText(ANOMALY_UI.FILTERS.STATUS_ALL)).toBeInTheDocument();
      expect(screen.getByText(ANOMALY_UI.FILTERS.TYPE_ALL)).toBeInTheDocument();
    });
  });

  /* =======================================================================
   * TC-03: Phân quyền RBAC Guard
   * ======================================================================= */
  describe("NCL-14-CN-004-TC-03: Security & RBAC Guard", () => {
    it("Blocks access for Cashier (VT-02) role with Permission Warning", () => {
      renderWithProviders(<AnomalyAlertPage />, USER_ROLES.CASHIER);

      expect(screen.getByText(ANOMALY_UI.RBAC_WARNING.TITLE)).toBeInTheDocument();
      expect(screen.getByText(/Chủ hộ kinh doanh/)).toBeInTheDocument();
    });

    it("Blocks access for Accountant (VT-03) role with Permission Warning", () => {
      renderWithProviders(<AnomalyAlertPage />, USER_ROLES.ACCOUNTANT);

      expect(screen.getByText(ANOMALY_UI.RBAC_WARNING.TITLE)).toBeInTheDocument();
    });

    it("Grants access for Store Owner (VT-01) role", () => {
      renderWithProviders(<AnomalyAlertPage />, USER_ROLES.OWNER);

      expect(screen.getByText(ANOMALY_UI.PAGE_TITLE)).toBeInTheDocument();
      expect(screen.getByText(ANOMALY_UI.OVERVIEW.SCAN_NOW_BTN)).toBeInTheDocument();
      expect(screen.getByText(ANOMALY_UI.OVERVIEW.RULES_CONFIG_BTN)).toBeInTheDocument();
    });
  });

  /* =======================================================================
   * Review Anomaly Alert Modal
   * ======================================================================= */
  describe("ReviewAnomalyAlertModal Component", () => {
    it("Renders Evidence JSON and allows submitting review status with notes", () => {
      const handleSubmitReview = vi.fn();

      renderWithProviders(
        <ReviewAnomalyAlertModal
          alert={mockAlerts[0]}
          isOpen={true}
          onClose={vi.fn()}
          isSubmitting={false}
          onSubmitReview={handleSubmitReview}
        />
      );

      expect(screen.getByText(ANOMALY_UI.REVIEW_MODAL.TITLE)).toBeInTheDocument();
      expect(
        screen.getByText("Phát hiện tài khoản hủy 5 hóa đơn trong 10 phút")
      ).toBeInTheDocument();
      expect(screen.getByText(ANOMALY_UI.REVIEW_MODAL.EVIDENCE_TITLE)).toBeInTheDocument();

      const notesInput = screen.getByPlaceholderText(
        ANOMALY_UI.REVIEW_MODAL.REVIEW_NOTES_PLACEHOLDER
      );
      fireEvent.change(notesInput, { target: { value: "Đã kiểm tra và nhắc nhở nhân viên" } });

      const submitBtn = screen.getByText(ANOMALY_UI.REVIEW_MODAL.SAVE_BTN);
      fireEvent.click(submitBtn);

      expect(handleSubmitReview).toHaveBeenCalledTimes(1);
      expect(handleSubmitReview).toHaveBeenCalledWith(
        "alt-001",
        "REVIEWED",
        "Đã kiểm tra và nhắc nhở nhân viên"
      );
    });
  });

  /* =======================================================================
   * Rule Config & Scan Modals
   * ======================================================================= */
  describe("Anomaly Modals Component", () => {
    it("Renders AnomalyRuleConfigModal and closes properly", () => {
      const handleClose = vi.fn();
      renderWithProviders(<AnomalyRuleConfigModal isOpen={true} onClose={handleClose} />);

      expect(screen.getByText(ANOMALY_UI.RULES_MODAL.TITLE)).toBeInTheDocument();
      const closeBtn = screen.getByText(ANOMALY_UI.RULES_MODAL.CLOSE_BTN);
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("Renders ScanAnomalyModal and allows setting date", () => {
      const handleClose = vi.fn();
      renderWithProviders(<ScanAnomalyModal isOpen={true} onClose={handleClose} />);

      expect(screen.getByText(ANOMALY_UI.SCAN_MODAL.TITLE)).toBeInTheDocument();
      expect(screen.getByText(ANOMALY_UI.SCAN_MODAL.SCAN_BTN)).toBeInTheDocument();
    });
  });

  /* =======================================================================
   * Rapid Failed Logins Detection & Storage
   * ======================================================================= */
  describe("Rapid Failed Logins Detection Engine", () => {
    it("Triggers RAPID_FAILED_LOGINS alert when failed login attempts reach threshold (5 attempts)", async () => {
      const {
        recordFailedLoginAttempt,
        getLocalAnomalyAlerts,
        updateLocalAnomalyAlert,
      } = await import("@/modules/anomaly_alert/utils/anomalyStorage");

      localStorage.clear();

      // 4 lần đăng nhập sai -> Chưa kích hoạt cảnh báo
      for (let i = 1; i <= 4; i++) {
        const res = recordFailedLoginAttempt("testuser_spam", "Sai mật khẩu");
        expect(res).toBeNull();
      }

      // Lần thứ 5 -> Kích hoạt cảnh báo CRITICAL RAPID_FAILED_LOGINS
      const alert = recordFailedLoginAttempt("testuser_spam", "Sai mật khẩu");
      expect(alert).not.toBeNull();
      expect(alert?.alertType).toBe("RAPID_FAILED_LOGINS");
      expect(alert?.severity).toBe("CRITICAL");
      expect(alert?.actorUsername).toBe("testuser_spam");
      expect(alert?.title).toContain("5 lần trong 15 phút");

      // Kiểm tra danh sách trong localStorage
      const localAlerts = getLocalAnomalyAlerts();
      expect(localAlerts.length).toBe(1);
      expect(localAlerts[0].actorUsername).toBe("testuser_spam");

      // Cập nhật trạng thái review
      const updated = updateLocalAnomalyAlert(
        alert!.id,
        "REVIEWED",
        "Đã xác nhận sự cố quên mật khẩu của người dùng"
      );
      expect(updated?.status).toBe("REVIEWED");
      expect(updated?.reviewNotes).toBe("Đã xác nhận sự cố quên mật khẩu của người dùng");
    });
  });
});
