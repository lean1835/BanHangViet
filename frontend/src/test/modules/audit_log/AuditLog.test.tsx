import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { AuditLogTable } from "@/modules/audit_log/components/AuditLogTable";
import { AuditLogSidebar } from "@/modules/audit_log/components/AuditLogSidebar";
import { AuditLogDetailModal } from "@/modules/audit_log/components/AuditLogDetailModal";
import { AuditIntegrityModal } from "@/modules/audit_log/components/AuditIntegrityModal";
import { AuditLogPage } from "@/modules/audit_log/pages/AuditLogPage";
import { AUDIT_LOG_UI } from "@/constants/auditLog";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import type { IActivityLog, IAuditIntegrityResponse } from "@/modules/audit_log/types/IAuditLog";

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
            } as any
          }
        >
          <MemoryRouter>{ui}</MemoryRouter>
        </DashboardDemoContext.Provider>
      </NotificationProvider>
    </Provider>
  );
};

const mockLogs: IActivityLog[] = [
  {
    id: "log-1",
    sequenceNumber: 1,
    householdId: "hh-001",
    userId: "u-001",
    username: "bannam01",
    fullName: "Nguyễn Văn Nam",
    action: "CANCEL_INVOICE",
    targetTable: "e_invoices",
    targetId: "inv-000123",
    oldValue: JSON.stringify({ status: "ISSUED", total: 150000 }),
    newValue: JSON.stringify({ status: "CANCELED", reason: "Khách đổi ý" }),
    clientIp: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    createdAt: "2026-09-15T09:30:00Z",
  },
  {
    id: "log-2",
    sequenceNumber: 2,
    householdId: "hh-001",
    userId: "u-001",
    username: "owner01",
    fullName: "Chủ Hộ Kinh Doanh",
    action: "KIEM_KE_KHO",
    targetTable: "inventory_audits",
    targetId: "audit-001",
    oldValue: JSON.stringify({ totalItems: 5 }),
    newValue: JSON.stringify({ totalItems: 5, totalDifferenceQty: -2 }),
    clientIp: "127.0.0.1",
    userAgent: "Chrome/120.0.0.0",
    previousHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    hash: "b2c3d4e5f6a17890123456789abcdef0123456789abcdef0123456789abcdef0",
    createdAt: "2026-09-15T10:15:00Z",
  },
];

describe("NCL-14-CN-001: Audit Log Unit & Integration Tests", () => {
  /* =======================================================================
   * TC-01: Luồng thành công - Hiển thị nhật ký kiểm toán với chuỗi SHA-256
   * ======================================================================= */
  describe("NCL-14-CN-001-TC-01: AuditLogTable Component", () => {
    it("Renders audit log rows correctly with Sequence, Action, User, and Target", () => {
      const handleViewDetail = vi.fn();

      renderWithProviders(
        <AuditLogTable
          logs={mockLogs}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={2}
          onPageChange={vi.fn()}
          onViewDetail={handleViewDetail}
        />
      );

      // Verify Sequence numbers
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();

      // Verify Username & Full Name
      expect(screen.getByText(/bannam01/)).toBeInTheDocument();
      expect(screen.getByText("Nguyễn Văn Nam")).toBeInTheDocument();
      expect(screen.getByText(/owner01/)).toBeInTheDocument();

      // Verify Actions & Targets
      expect(screen.getByText("CANCEL_INVOICE")).toBeInTheDocument();
      expect(screen.getByText("KIEM_KE_KHO")).toBeInTheDocument();
      expect(screen.getByText("Hóa đơn điện tử")).toBeInTheDocument();
      expect(screen.getByText("Phiếu kiểm kê kho")).toBeInTheDocument();
    });

    it("Fires onViewDetail callback when clicking on a table row", () => {
      const handleViewDetail = vi.fn();

      renderWithProviders(
        <AuditLogTable
          logs={mockLogs}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={2}
          onPageChange={vi.fn()}
          onViewDetail={handleViewDetail}
        />
      );

      const row1 = screen.getByRole("button", { name: /Xem chi tiết nhật ký kiểm toán #1/i });
      expect(row1).toBeInTheDocument();

      fireEvent.click(row1);
      expect(handleViewDetail).toHaveBeenCalledTimes(1);
      expect(handleViewDetail).toHaveBeenCalledWith(mockLogs[0]);
    });

    it("Renders empty state message when logs array is empty", () => {
      renderWithProviders(
        <AuditLogTable
          logs={[]}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={0}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
        />
      );

      expect(screen.getByText(AUDIT_LOG_UI.EMPTY_LOGS)).toBeInTheDocument();
    });
  });

  /* =======================================================================
   * TC-02: Phân quyền & Tính bất biến (RBAC & Immutability)
   * ======================================================================= */
  describe("NCL-14-CN-001-TC-02: Security & RBAC Guard", () => {
    it("Blocks access and displays Permission Warning for Cashier role (VT-02)", () => {
      renderWithProviders(<AuditLogPage />, USER_ROLES.CASHIER);

      expect(screen.getByText(AUDIT_LOG_UI.RBAC_WARNING.TITLE)).toBeInTheDocument();
      expect(screen.getByText(AUDIT_LOG_UI.RBAC_WARNING.ACTION_BACK)).toBeInTheDocument();
    });

    it("Blocks access and displays Permission Warning for Accountant role (VT-03)", () => {
      renderWithProviders(<AuditLogPage />, USER_ROLES.ACCOUNTANT);

      expect(screen.getByText(AUDIT_LOG_UI.RBAC_WARNING.TITLE)).toBeInTheDocument();
    });

    it("Grants access and renders table for Store Owner role (VT-01)", () => {
      renderWithProviders(<AuditLogPage />, USER_ROLES.OWNER);

      expect(screen.getByRole("heading", { name: AUDIT_LOG_UI.TITLE })).toBeInTheDocument();
      expect(screen.getByText(AUDIT_LOG_UI.INTEGRITY_CHECK_BTN)).toBeInTheDocument();
      expect(screen.getByText(AUDIT_LOG_UI.EXPORT_EXCEL_BTN)).toBeInTheDocument();
    });

    it("Never renders any Edit or Delete action buttons (Append-only QTN-25)", () => {
      renderWithProviders(
        <AuditLogTable
          logs={mockLogs}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={2}
          onPageChange={vi.fn()}
          onViewDetail={vi.fn()}
        />
      );

      // Verify no Edit/Delete UI elements exist anywhere
      expect(screen.queryByText(/chỉnh sửa/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/xóa bản ghi/i)).not.toBeInTheDocument();
      expect(screen.queryByTitle(/xóa/i)).not.toBeInTheDocument();
    });
  });

  /* =======================================================================
   * TC-03: Ngoại lệ - Kiểm tra tính toàn vẹn Hash Chain
   * ======================================================================= */
  describe("NCL-14-CN-001-TC-03: AuditIntegrityModal Component", () => {
    it("Renders valid integrity status with total records checked", () => {
      const validResult: IAuditIntegrityResponse = {
        valid: true,
        totalRecordsChecked: 45,
        corruptedSequenceNumber: null,
        corruptedLogId: null,
        failureReason: null,
        verifiedAt: "2026-09-15T12:00:00Z",
      };

      renderWithProviders(
        <AuditIntegrityModal
          isOpen={true}
          onClose={vi.fn()}
          result={validResult}
          isLoading={false}
          onReverify={vi.fn()}
        />
      );

      expect(
        screen.getByText("Dữ liệu nhật ký kiểm toán hoàn toàn toàn vẹn và hợp lệ!")
      ).toBeInTheDocument();
      expect(screen.getByText("45 bản ghi")).toBeInTheDocument();
    });

    it("Renders alert warning and pinpointed corrupted sequence when tampered", () => {
      const corruptedResult: IAuditIntegrityResponse = {
        valid: false,
        totalRecordsChecked: 12,
        corruptedSequenceNumber: 2,
        corruptedLogId: "log-corrupted-id",
        failureReason:
          "Phát hiện dữ liệu bản ghi bị can thiệp trái phép tại sequence #2 (Hash calculation mismatch)",
        verifiedAt: "2026-09-15T12:00:00Z",
      };

      renderWithProviders(
        <AuditIntegrityModal
          isOpen={true}
          onClose={vi.fn()}
          result={corruptedResult}
          isLoading={false}
          onReverify={vi.fn()}
        />
      );

      expect(
        screen.getByText(
          "CẢNH BÁO: Phát hiện dữ liệu nhật ký kiểm toán có dấu hiệu bị can thiệp trái phép!"
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Sequence #2")).toBeInTheDocument();
      expect(screen.getByText("log-corrupted-id")).toBeInTheDocument();
      expect(
        screen.getByText(/Phát hiện dữ liệu bản ghi bị can thiệp trái phép/)
      ).toBeInTheDocument();
    });
  });

  /* =======================================================================
   * TC-04: Lưu lịch sử & Tra cứu / Xuất tệp
   * ======================================================================= */
  describe("NCL-14-CN-001-TC-04: AuditLogSidebar & Detail Modal", () => {
    it("Triggers onFilterChange when typing username or selecting action", () => {
      const handleFilterChange = vi.fn();
      const handleResetFilter = vi.fn();

      renderWithProviders(
        <AuditLogSidebar
          filter={{
            username: "",
            action: "",
            targetTable: "",
            startDate: "",
            endDate: "",
          }}
          onFilterChange={handleFilterChange}
          onResetFilter={handleResetFilter}
        />
      );

      const usernameInput = screen.getByPlaceholderText(/nhập username/i);
      fireEvent.change(usernameInput, { target: { value: "bannam01" } });
      expect(handleFilterChange).toHaveBeenCalledWith({ username: "bannam01" });

      const actionSelect = screen.getByDisplayValue("Tất cả hành động");
      fireEvent.change(actionSelect, { target: { value: "CANCEL_INVOICE" } });
      expect(handleFilterChange).toHaveBeenCalledWith({ action: "CANCEL_INVOICE" });
    });

    it("AuditLogDetailModal renders Before/After JSON diff and Hash details correctly", () => {
      const handleClose = vi.fn();

      renderWithProviders(
        <AuditLogDetailModal log={mockLogs[0]} onClose={handleClose} />
      );

      expect(
        screen.getByText("Chi tiết bản ghi nhật ký kiểm toán #1")
      ).toBeInTheDocument();
      expect(screen.getByText("Dữ liệu cũ (Old Value / Trước thay đổi)")).toBeInTheDocument();
      expect(screen.getByText("Dữ liệu mới (New Value / Sau thay đổi)")).toBeInTheDocument();
      expect(screen.getByText(/ISSUED/)).toBeInTheDocument();
      expect(screen.getByText(/CANCELED/)).toBeInTheDocument();
      expect(screen.getByText("192.168.1.100")).toBeInTheDocument();
      expect(screen.getByText(mockLogs[0].hash)).toBeInTheDocument();

      const closeButton = screen.getByRole("button", { name: /đóng modal/i });
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
