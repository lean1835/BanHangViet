import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { baseApi } from "@/stores/baseApi";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { DashboardDemoContext } from "@/providers/DashboardDemoProvider";
import { BackupStatusOverviewCards } from "@/modules/backup_restore/components/BackupStatusOverviewCards";
import { AutoBackupConfigCard } from "@/modules/backup_restore/components/AutoBackupConfigCard";
import { BackupHistoryTable } from "@/modules/backup_restore/components/BackupHistoryTable";
import { AvailableBackupsTable } from "@/modules/backup_restore/components/AvailableBackupsTable";
import { RestorePreviewModal } from "@/modules/backup_restore/components/RestorePreviewModal";
import { RestoreHistoryTable } from "@/modules/backup_restore/components/RestoreHistoryTable";
import { BackupVerificationStatusBanner } from "@/modules/backup_restore/components/BackupVerificationStatusBanner";
import { BackupVerificationOverviewCards } from "@/modules/backup_restore/components/BackupVerificationOverviewCards";
import { BackupVerificationHistoryTable } from "@/modules/backup_restore/components/BackupVerificationHistoryTable";
import { TriggerVerificationModal } from "@/modules/backup_restore/components/TriggerVerificationModal";
import { VerificationDetailModal } from "@/modules/backup_restore/components/VerificationDetailModal";
import { BackupRestorePage } from "@/modules/backup_restore/pages/BackupRestorePage";
import { BACKUP_RESTORE_UI } from "@/constants/backupRestore";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import type {
  IBackupConfig,
  IBackupHistory,
  IBackupStatusOverview,
  IRestorePreview,
  IRestoreHistory,
  IBackupVerificationHistory,
  IBackupVerificationStatus,
} from "@/modules/backup_restore/types/IBackupRestore";

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

const mockOverview: IBackupStatusOverview = {
  isAutoBackupEnabled: true,
  scheduledTime: "02:00",
  retentionCount: 30,
  lastBackupTime: "2026-09-15T02:00:00Z",
  lastBackupStatus: "SUCCESS",
  lastBackupFileName: "BanHangViet_Backup_FULL_2026-09-15.zip",
  activeBackupCount: 15,
  totalStorageSizeBytes: 15728640, // 15MB
};

const mockBackupConfig: IBackupConfig = {
  id: "cfg-001",
  householdId: "hh-001",
  isAutoBackupEnabled: true,
  scheduledTime: "02:00",
  retentionCount: 30,
  backupType: "FULL",
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-15T00:00:00Z",
};

const mockBackupHistories: IBackupHistory[] = [
  {
    id: "bk-1",
    fileName: "BanHangViet_Backup_FULL_2026-09-15.zip",
    filePath: "/backups/hh-001/BanHangViet_Backup_FULL_2026-09-15.zip",
    fileSize: 1048576, // 1MB
    backupType: "FULL",
    triggerType: "AUTOMATIC",
    status: "SUCCESS",
    notes: "Tự động sao lưu định kỳ",
    createdByUserId: null,
    createdByUserName: "Hệ thống tự động",
    backupTime: "2026-09-15T02:00:00Z",
    createdAt: "2026-09-15T02:00:00Z",
  },
  {
    id: "bk-2",
    fileName: "BanHangViet_Backup_PRODUCTS_2026-09-01.xlsx",
    filePath: "/backups/hh-001/BanHangViet_Backup_PRODUCTS_2026-09-01.xlsx",
    fileSize: 524288, // 512KB
    backupType: "PRODUCTS",
    triggerType: "MANUAL",
    status: "PURGED",
    notes: "Đã dọn dẹp theo chính sách lưu giữ",
    createdByUserId: "u-001",
    createdByUserName: "Chủ hộ kinh doanh",
    backupTime: "2026-09-01T10:00:00Z",
    createdAt: "2026-09-01T10:00:00Z",
  },
];

const mockRestorePreview: IRestorePreview = {
  backupHistoryId: "bk-1",
  fileName: "BanHangViet_Backup_FULL_2026-09-15.zip",
  filePath: "/backups/hh-001/BanHangViet_Backup_FULL_2026-09-15.zip",
  fileSize: 1048576,
  backupType: "FULL",
  triggerType: "AUTOMATIC",
  status: "SUCCESS",
  backupTime: "2026-09-15T02:00:00Z",
  createdByUserName: "Hệ thống tự động",
  isEligibleForRestore: true,
  summaryDescription: "Bản sao lưu chứa 120 sản phẩm, 450 đơn hàng và 420 hóa đơn.",
  warningMessage: null,
};

const mockRestoreHistories: IRestoreHistory[] = [
  {
    id: "rst-001",
    backupHistoryId: "bk-1",
    backupFileName: "BanHangViet_Backup_FULL_2026-09-15.zip",
    backupType: "FULL",
    status: "SUCCESS",
    notes: "Khôi phục sau sự cố",
    restoredByUserId: "u-001",
    restoredByUserName: "Chủ hộ",
    restoredAt: "2026-09-15T15:30:00Z",
    createdAt: "2026-09-15T15:30:00Z",
  },
];

const mockVerificationStatusNormal: IBackupVerificationStatus = {
  latestVerification: {
    id: "ver-1",
    backupHistoryId: "bk-1",
    backupFileName: "BanHangViet_Backup_FULL_2026-09-15.zip",
    backupTime: "2026-09-15T02:00:00Z",
    fileSize: 1536000,
    status: "PASSED",
    executionDurationMs: 345,
    verifiedAt: "2026-09-16T02:05:00Z",
    checkedFileReadable: true,
    checkedRecordCountsMatched: true,
    checkedAuditChainIntact: true,
    productCount: 120,
    customerCount: 45,
    supplierCount: 12,
    userCount: 5,
    auditLogCount: 520,
    failureReason: null,
    triggerType: "AUTOMATIC",
    notes: "Tự động kiểm thử sandbox",
    createdAt: "2026-09-16T02:05:00Z",
  },
  latestSuccessfulVerification: {
    id: "ver-1",
    backupHistoryId: "bk-1",
    backupFileName: "BanHangViet_Backup_FULL_2026-09-15.zip",
    backupTime: "2026-09-15T02:00:00Z",
    fileSize: 1536000,
    status: "PASSED",
    executionDurationMs: 345,
    verifiedAt: "2026-09-16T02:05:00Z",
    checkedFileReadable: true,
    checkedRecordCountsMatched: true,
    checkedAuditChainIntact: true,
    productCount: 120,
    customerCount: 45,
    supplierCount: 12,
    userCount: 5,
    auditLogCount: 520,
    failureReason: null,
    triggerType: "AUTOMATIC",
    notes: "Tự động kiểm thử sandbox",
    createdAt: "2026-09-16T02:05:00Z",
  },
  daysSinceLastSuccess: 0,
  maxAllowedDaysWithoutVerification: 7,
  isOverdue: false,
  hasFailedRecent: false,
  overallHealthStatus: "NORMAL",
  warningMessage: "Bản sao lưu gần nhất đã được kiểm chứng thành công và sẵn sàng phục hồi.",
  totalVerificationsRun: 15,
  passedVerificationsCount: 14,
  failedVerificationsCount: 1,
};

const mockVerificationStatusDanger: IBackupVerificationStatus = {
  ...mockVerificationStatusNormal,
  overallHealthStatus: "DANGER",
  hasFailedRecent: true,
  isOverdue: true,
  warningMessage:
    "CẢNH BÁO NGUY HIỂM: Lần thử phục hồi bản sao lưu gần nhất bị THẤT BẠI. Chi tiết lỗi: Tệp sao lưu bị lỗi cấu trúc hoặc định dạng dữ liệu hỏng.",
  latestVerification: {
    ...mockVerificationStatusNormal.latestVerification!,
    id: "ver-failed",
    status: "FAILED",
    checkedFileReadable: false,
    checkedRecordCountsMatched: false,
    checkedAuditChainIntact: false,
    failureReason: "Tệp sao lưu bị lỗi cấu trúc hoặc định dạng dữ liệu hỏng.",
  },
};

const mockVerificationStatusWarning: IBackupVerificationStatus = {
  ...mockVerificationStatusNormal,
  overallHealthStatus: "WARNING",
  isOverdue: true,
  daysSinceLastSuccess: 10,
  warningMessage:
    "CẢNH BÁO QUÁ HẠN: Đã quá 10 ngày kể từ lần kiểm chứng bản sao lưu thành công gần nhất (ngưỡng cho phép: 7 ngày).",
};

const mockVerificationHistories: IBackupVerificationHistory[] = [
  mockVerificationStatusNormal.latestVerification!,
  {
    id: "ver-2",
    backupHistoryId: "bk-2",
    backupFileName: "BanHangViet_Backup_MANUAL_2026-09-14.zip",
    backupTime: "2026-09-14T10:00:00Z",
    fileSize: 1024000,
    status: "FAILED",
    executionDurationMs: 120,
    verifiedAt: "2026-09-14T10:01:00Z",
    checkedFileReadable: true,
    checkedRecordCountsMatched: false,
    checkedAuditChainIntact: true,
    productCount: 120,
    customerCount: 0,
    supplierCount: 0,
    userCount: 0,
    auditLogCount: 300,
    failureReason:
      "Tệp sao lưu thiếu các bảng thực thể bắt buộc (customers, suppliers, users)",
    triggerType: "MANUAL",
    notes: "Kiểm tra sau xuất tay",
    createdAt: "2026-09-14T10:01:00Z",
  },
];

describe("NCL-14: Module Sao lưu & Phục hồi dữ liệu (Backup & Restore)", () => {
  /* =======================================================================
   * NCL-14-CN-002: Sao lưu dữ liệu tự động theo ngày
   * ======================================================================= */
  describe("NCL-14-CN-002: Sao lưu dữ liệu tự động theo ngày", () => {
    it("TC-01: Renders BackupStatusOverviewCards correctly with schedule, retention, and size", () => {
      const handleTrigger = vi.fn();

      renderWithProviders(
        <BackupStatusOverviewCards
          overview={mockOverview}
          isLoading={false}
          isTriggering={false}
          onTriggerBackup={handleTrigger}
        />
      );

      expect(screen.getByText("Đang bật")).toBeInTheDocument();
      expect(screen.getByText("(02:00)")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText(/30 bản lưu tối đa/)).toBeInTheDocument();
      expect(screen.getByText("15.00 MB")).toBeInTheDocument();
      expect(screen.getByText(BACKUP_RESTORE_UI.OVERVIEW.TRIGGER_BTN)).toBeInTheDocument();

      fireEvent.click(screen.getByText(BACKUP_RESTORE_UI.OVERVIEW.TRIGGER_BTN));
      expect(handleTrigger).toHaveBeenCalledTimes(1);
    });

    it("TC-01: Renders AutoBackupConfigCard form fields and allows modifying retention and schedule", () => {
      renderWithProviders(
        <AutoBackupConfigCard config={mockBackupConfig} isLoading={false} />
      );

      expect(screen.getByText(BACKUP_RESTORE_UI.CONFIG.CARD_TITLE)).toBeInTheDocument();
      expect(screen.getByDisplayValue("02:00")).toBeInTheDocument();
      expect(screen.getByDisplayValue("30")).toBeInTheDocument();
      expect(screen.getByText(BACKUP_RESTORE_UI.CONFIG.SAVE_BTN)).toBeInTheDocument();
    });

    it("TC-01 & TC-02: Renders BackupHistoryTable with SUCCESS and PURGED status badges", () => {
      renderWithProviders(
        <BackupHistoryTable
          histories={mockBackupHistories}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={2}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByText("BanHangViet_Backup_FULL_2026-09-15.zip")).toBeInTheDocument();
      expect(screen.getByText("BanHangViet_Backup_PRODUCTS_2026-09-01.xlsx")).toBeInTheDocument();
      expect(screen.getByText("Thành công")).toBeInTheDocument();
      expect(screen.getByText("Đã dọn dẹp")).toBeInTheDocument();
      expect(screen.getByText("1.00 MB")).toBeInTheDocument();
      expect(screen.getByText("512.0 KB")).toBeInTheDocument();
    });

    it("TC-03: Blocks Cashier (VT-02) and Accountant (VT-03) with RBAC Warning on BackupRestorePage", () => {
      renderWithProviders(<BackupRestorePage />, USER_ROLES.CASHIER);

      expect(screen.getByText(BACKUP_RESTORE_UI.RBAC_WARNING.TITLE)).toBeInTheDocument();
      expect(screen.getByText(/Chủ hộ kinh doanh/)).toBeInTheDocument();
    });

    it("TC-03: Grants access to Store Owner (VT-01)", () => {
      renderWithProviders(<BackupRestorePage />, USER_ROLES.OWNER);

      expect(screen.getByText(BACKUP_RESTORE_UI.PAGE_TITLE)).toBeInTheDocument();
      expect(
        screen.getByText(BACKUP_RESTORE_UI.TABS.LABELS.AUTO_BACKUP)
      ).toBeInTheDocument();
      expect(screen.getByText(BACKUP_RESTORE_UI.TABS.LABELS.RESTORE)).toBeInTheDocument();
    });
  });

  /* =======================================================================
   * NCL-14-CN-003: Phục hồi dữ liệu từ bản sao lưu
   * ======================================================================= */
  describe("NCL-14-CN-003: Phục hồi dữ liệu từ bản sao lưu", () => {
    it("TC-01: AvailableBackupsTable renders active backup and fires onSelectBackup callback", () => {
      const handleSelectBackup = vi.fn();

      renderWithProviders(
        <AvailableBackupsTable
          backups={[mockBackupHistories[0]]}
          isLoading={false}
          onSelectBackup={handleSelectBackup}
        />
      );

      expect(screen.getByText(BACKUP_RESTORE_UI.RESTORE.AVAILABLE_TITLE)).toBeInTheDocument();
      expect(screen.getByText("BanHangViet_Backup_FULL_2026-09-15.zip")).toBeInTheDocument();

      const restoreBtn = screen.getByText(BACKUP_RESTORE_UI.RESTORE.RESTORE_ACTION_BTN);
      fireEvent.click(restoreBtn);
      expect(handleSelectBackup).toHaveBeenCalledWith("bk-1");
    });

    it("TC-01: RestorePreviewModal enables execution when confirmed", () => {
      const handleConfirmRestore = vi.fn();

      renderWithProviders(
        <RestorePreviewModal
          isOpen={true}
          onClose={vi.fn()}
          previewData={mockRestorePreview}
          isLoading={false}
          isExecuting={false}
          onConfirmRestore={handleConfirmRestore}
        />
      );

      expect(screen.getByText(BACKUP_RESTORE_UI.PREVIEW_MODAL.TITLE)).toBeInTheDocument();
      expect(screen.getByText(BACKUP_RESTORE_UI.PREVIEW_MODAL.WARNING_TITLE)).toBeInTheDocument();
      expect(
        screen.getByText(/Bản sao lưu chứa 120 sản phẩm, 450 đơn hàng và 420 hóa đơn/)
      ).toBeInTheDocument();

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      const submitBtn = screen.getByRole("button", {
        name: new RegExp(BACKUP_RESTORE_UI.PREVIEW_MODAL.EXECUTE_BTN, "i"),
      });
      expect(submitBtn).toBeDisabled();

      // Check confirm checkbox
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(submitBtn).not.toBeDisabled();

      // Submit restore
      fireEvent.click(submitBtn);
      expect(handleConfirmRestore).toHaveBeenCalledTimes(1);
    });

    it("TC-02: Pre-validation blocks restore when backup is ineligible (isEligibleForRestore = false)", () => {
      const ineligiblePreview: IRestorePreview = {
        ...mockRestorePreview,
        isEligibleForRestore: false,
        warningMessage:
          "Bản sao lưu này đang ở trạng thái [PURGED] và không đủ điều kiện để phục hồi dữ liệu.",
      };

      renderWithProviders(
        <RestorePreviewModal
          isOpen={true}
          onClose={vi.fn()}
          previewData={ineligiblePreview}
          isLoading={false}
          isExecuting={false}
          onConfirmRestore={vi.fn()}
        />
      );

      expect(
        screen.getByText("Bản sao lưu không đủ điều kiện phục hồi!")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Bản sao lưu này đang ở trạng thái \[PURGED\]/)
      ).toBeInTheDocument();
      expect(
        screen.queryByText(BACKUP_RESTORE_UI.PREVIEW_MODAL.EXECUTE_BTN)
      ).not.toBeInTheDocument();
    });

    it("TC-04: RestoreHistoryTable renders historical restore runs", () => {
      renderWithProviders(
        <RestoreHistoryTable
          histories={mockRestoreHistories}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={1}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByText(BACKUP_RESTORE_UI.RESTORE.HISTORY_TITLE)).toBeInTheDocument();
      expect(screen.getByText("BanHangViet_Backup_FULL_2026-09-15.zip")).toBeInTheDocument();
      expect(screen.getByText("Khôi phục sau sự cố")).toBeInTheDocument();
    });
  });

  /* =======================================================================
   * NCL-14-CN-005: Thử phục hồi định kỳ và báo cáo tình trạng bản sao lưu
   * ======================================================================= */
  describe("NCL-14-CN-005: Thử phục hồi định kỳ và báo cáo tình trạng bản sao lưu", () => {
    it("TC-01: BackupVerificationStatusBanner renders NORMAL safe banner with timestamps", () => {
      renderWithProviders(
        <BackupVerificationStatusBanner
          status={mockVerificationStatusNormal}
          isLoading={false}
        />
      );

      expect(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.BANNER.SAFE_TITLE)
      ).toBeInTheDocument();
      expect(screen.getByText("An toàn - Đã kiểm chứng")).toBeInTheDocument();
      expect(
        screen.getByText("BanHangViet_Backup_FULL_2026-09-15.zip")
      ).toBeInTheDocument();
      expect(screen.getByText(/0 ngày/)).toBeInTheDocument();
    });

    it("TC-01: BackupVerificationOverviewCards renders health status, statistics, and trigger button", () => {
      const handleOpenTrigger = vi.fn();

      renderWithProviders(
        <BackupVerificationOverviewCards
          status={mockVerificationStatusNormal}
          isLoading={false}
          isTriggering={false}
          onOpenTriggerModal={handleOpenTrigger}
        />
      );

      expect(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.OVERVIEW.HEALTH_LABEL)
      ).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText(/14 Đạt/)).toBeInTheDocument();
      expect(screen.getByText(/1 Lỗi/)).toBeInTheDocument();
      expect(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.OVERVIEW.TRIGGER_BTN)
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.OVERVIEW.TRIGGER_BTN)
      );
      expect(handleOpenTrigger).toHaveBeenCalledTimes(1);
    });

    it("TC-01: BackupVerificationHistoryTable renders 3 pillars and triggers onViewDetail", () => {
      const handleViewDetail = vi.fn();

      renderWithProviders(
        <BackupVerificationHistoryTable
          histories={mockVerificationHistories}
          isLoading={false}
          page={0}
          totalPages={1}
          totalElements={2}
          onPageChange={vi.fn()}
          onViewDetail={handleViewDetail}
        />
      );

      expect(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.HISTORY.TITLE)
      ).toBeInTheDocument();
      expect(
        screen.getByText("BanHangViet_Backup_FULL_2026-09-15.zip")
      ).toBeInTheDocument();
      expect(
        screen.getByText("BanHangViet_Backup_MANUAL_2026-09-14.zip")
      ).toBeInTheDocument();
      expect(screen.getByText("345 ms")).toBeInTheDocument();
      expect(screen.getByText("Đạt (An toàn)")).toBeInTheDocument();
      expect(screen.getByText("Không đạt (Lỗi)")).toBeInTheDocument();

      const detailButtons = screen.getAllByText(
        BACKUP_RESTORE_UI.VERIFICATION.HISTORY.DETAIL_BTN
      );
      fireEvent.click(detailButtons[0]);
      expect(handleViewDetail).toHaveBeenCalledWith(
        mockVerificationHistories[0]
      );
    });

    it("TC-01: VerificationDetailModal renders 3 pillars scorecard and core entity counts", () => {
      renderWithProviders(
        <VerificationDetailModal
          isOpen={true}
          onClose={vi.fn()}
          verification={mockVerificationStatusNormal.latestVerification!}
        />
      );

      expect(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.TITLE)
      ).toBeInTheDocument();
      expect(
        screen.getByText("Kiểm chứng đạt chuẩn an toàn")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.PILLAR_1_TITLE
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.PILLAR_2_TITLE
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.PILLAR_3_TITLE
        )
      ).toBeInTheDocument();

      // Entity counts
      expect(screen.getByText("120")).toBeInTheDocument(); // Products
      expect(screen.getByText("45")).toBeInTheDocument(); // Customers
      expect(screen.getByText("12")).toBeInTheDocument(); // Suppliers
      expect(screen.getByText("5")).toBeInTheDocument(); // Users
      expect(screen.getByText("520")).toBeInTheDocument(); // Audit logs
    });

    it("TC-02: BackupVerificationStatusBanner renders DANGER warning with failure reason on failure", () => {
      renderWithProviders(
        <BackupVerificationStatusBanner
          status={mockVerificationStatusDanger}
          isLoading={false}
        />
      );

      expect(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.BANNER.DANGER_TITLE)
      ).toBeInTheDocument();
      expect(
        screen.getByText("Nguy hiểm - Thử phục hồi thất bại")
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(/Tệp sao lưu bị lỗi cấu trúc hoặc định dạng dữ liệu hỏng/).length
      ).toBeGreaterThan(0);
    });

    it("TC-02: VerificationDetailModal displays failure reason callout when verification FAILED", () => {
      renderWithProviders(
        <VerificationDetailModal
          isOpen={true}
          onClose={vi.fn()}
          verification={mockVerificationHistories[1]}
        />
      );

      expect(
        screen.getByText("Kiểm chứng không đạt yêu cầu")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.FAILURE_REASON_TITLE
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Tệp sao lưu thiếu các bảng thực thể bắt buộc \(customers, suppliers, users\)/
        )
      ).toBeInTheDocument();
    });

    it("TC-03: BackupVerificationStatusBanner renders WARNING alert when overdue (daysSinceLastSuccess > 7)", () => {
      renderWithProviders(
        <BackupVerificationStatusBanner
          status={mockVerificationStatusWarning}
          isLoading={false}
        />
      );

      expect(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.BANNER.WARNING_TITLE)
      ).toBeInTheDocument();
      expect(
        screen.getByText("Cảnh báo - Quá hạn kiểm chứng")
      ).toBeInTheDocument();
      expect(screen.getAllByText(/10 ngày/).length).toBeGreaterThan(0);
    });

    it("TC-01/TC-02: TriggerVerificationModal allows selecting backup, entering notes, and triggers onConfirmTrigger", async () => {
      const handleConfirmTrigger = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <TriggerVerificationModal
          isOpen={true}
          onClose={vi.fn()}
          availableBackups={mockBackupHistories}
          isLoadingBackups={false}
          isTriggering={false}
          onConfirmTrigger={handleConfirmTrigger}
        />
      );

      expect(
        screen.getByText(BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.TITLE)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.NOTICE_TITLE
        )
      ).toBeInTheDocument();

      const notesTextarea = screen.getByPlaceholderText(
        BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.NOTES_PLACEHOLDER
      );
      fireEvent.change(notesTextarea, {
        target: { value: "Kiểm tra thử nghiệm sandbox" },
      });

      const submitBtn = screen.getByText(
        BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.SUBMIT_BTN
      );
      fireEvent.click(submitBtn);

      expect(handleConfirmTrigger).toHaveBeenCalledWith(
        undefined,
        "Kiểm tra thử nghiệm sandbox"
      );
    });

    it("Security & RBAC Guard: Cashier (VT-02) is blocked with RBAC warning when on BackupRestorePage", () => {
      renderWithProviders(<BackupRestorePage />, USER_ROLES.CASHIER);

      expect(
        screen.getByText(BACKUP_RESTORE_UI.RBAC_WARNING.TITLE)
      ).toBeInTheDocument();
      expect(screen.getByText(/Chủ hộ kinh doanh/)).toBeInTheDocument();
    });
  });
});

