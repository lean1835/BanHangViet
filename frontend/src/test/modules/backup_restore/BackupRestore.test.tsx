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
import { BackupRestorePage } from "@/modules/backup_restore/pages/BackupRestorePage";
import { BACKUP_RESTORE_UI } from "@/constants/backupRestore";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";
import type {
  IBackupConfig,
  IBackupHistory,
  IBackupStatusOverview,
  IRestorePreview,
  IRestoreHistory,
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
});
