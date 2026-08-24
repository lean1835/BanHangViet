import React, { useState } from "react";
import {
  RotateCcw,
  Download,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES, ROLE_LABELS } from "@/constants/roles";
import { BACKUP_RESTORE_UI } from "@/constants/backupRestore";
import { useNotification } from "@/hooks/useNotification";
import {
  useGetBackupConfigQuery,
  useGetBackupHistoriesQuery,
  useGetBackupStatusOverviewQuery,
  useTriggerManualBackupMutation,
} from "../services/autoBackupApi";
import {
  useGetAvailableBackupsForRestoreQuery,
  useLazyPreviewBackupForRestoreQuery,
  useExecuteRestoreMutation,
  useGetRestoreHistoriesQuery,
} from "../services/restoreApi";
import { BackupStatusOverviewCards } from "../components/BackupStatusOverviewCards";
import { AutoBackupConfigCard } from "../components/AutoBackupConfigCard";
import { BackupHistoryTable } from "../components/BackupHistoryTable";
import { AvailableBackupsTable } from "../components/AvailableBackupsTable";
import { RestorePreviewModal } from "../components/RestorePreviewModal";
import { RestoreHistoryTable } from "../components/RestoreHistoryTable";
import { BackupExportPanel } from "@/modules/settings/components/BackupExportPanel";
import type { IRestorePreview } from "../types/IBackupRestore";

type TActiveTab = "auto_backup" | "restore" | "manual_export";

export const BackupRestorePage: React.FC = () => {
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<TActiveTab>("auto_backup");
  const [backupPage, setBackupPage] = useState<number>(0);
  const [restorePage, setRestorePage] = useState<number>(0);

  // Restore preview modal state
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<IRestorePreview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // RBAC Guard check (TC-03: VT-01 Owner only for AutoBackup & Restore)
  const isOwner = currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.PLATFORM_ADMIN;

  // Auto Backup Queries
  const { data: configData, isLoading: isConfigLoading } = useGetBackupConfigQuery(undefined, {
    skip: !isOwner,
  });
  const { data: overviewData, isLoading: isOverviewLoading } = useGetBackupStatusOverviewQuery(
    undefined,
    { skip: !isOwner }
  );
  const { data: historiesData, isLoading: isHistoriesLoading } = useGetBackupHistoriesQuery(
    { page: backupPage, size: 10 },
    { skip: !isOwner }
  );

  // Restore Queries
  const { data: availableData, isLoading: isAvailableLoading } =
    useGetAvailableBackupsForRestoreQuery(undefined, { skip: !isOwner });
  const { data: restoreHistoriesData, isLoading: isRestoreHistoriesLoading } =
    useGetRestoreHistoriesQuery({ page: restorePage, size: 10 }, { skip: !isOwner });

  // Mutations
  const [triggerBackup, { isLoading: isTriggering }] = useTriggerManualBackupMutation();
  const [fetchPreview, { isLoading: isPreviewLoading }] = useLazyPreviewBackupForRestoreQuery();
  const [executeRestore, { isLoading: isExecuting }] = useExecuteRestoreMutation();

  const handleTriggerManualBackup = async () => {
    try {
      const res = await triggerBackup().unwrap();
      showSuccess(`Kích hoạt sao lưu thành công! Đã tạo tệp: ${res.result.fileName}`);
      addLogEntry("MANUAL_BACKUP_EXECUTE", `Tạo bản sao lưu: ${res.result.fileName}`);
    } catch {
      showError("Không thể tạo bản sao lưu thủ công. Vui lòng thử lại!");
    }
  };

  const handleSelectBackupForRestore = async (backupId: string) => {
    setSelectedBackupId(backupId);
    setIsModalOpen(true);
    try {
      const res = await fetchPreview(backupId).unwrap();
      setPreviewData(res.result);
    } catch {
      showError("Không thể nạp thông tin bản sao lưu. Vui lòng thử lại!");
    }
  };

  const handleConfirmRestore = async (notes: string) => {
    if (!selectedBackupId) return;

    try {
      const res = await executeRestore({
        backupHistoryId: selectedBackupId,
        confirm: true,
        notes,
      }).unwrap();

      showSuccess(`Phục hồi CSDL thành công từ tệp: ${res.result.backupFileName}!`);
      addLogEntry(
        "RESTORE_DATA_EXECUTE",
        `Phục hồi dữ liệu từ bản sao lưu: ${res.result.backupFileName}`
      );
      setIsModalOpen(false);
      setSelectedBackupId(null);
      setPreviewData(null);
    } catch {
      showError("Phục hồi dữ liệu thất bại. Bản sao lưu có thể bị lỗi hoặc không tương thích!");
    }
  };

  // If role is Cashier or Accountant and they are on AutoBackup or Restore tab, show RBAC Guard
  if (!isOwner && (activeTab as string) !== "manual_export") {
    return (
      <div className="space-y-6 w-full">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 pb-px">
          <button
            onClick={() => setActiveTab("auto_backup")}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "auto_backup"
                ? "bg-white text-kv-blue-primary border-t-2 border-x border-b-0 border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{BACKUP_RESTORE_UI.TABS.LABELS.AUTO_BACKUP}</span>
          </button>
          <button
            onClick={() => setActiveTab("restore")}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "restore"
                ? "bg-white text-kv-blue-primary border-t-2 border-x border-b-0 border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{BACKUP_RESTORE_UI.TABS.LABELS.RESTORE}</span>
          </button>
          <button
            onClick={() => setActiveTab("manual_export")}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "manual_export"
                ? "bg-white text-kv-blue-primary border-t-2 border-x border-b-0 border-slate-200 -mb-px"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{BACKUP_RESTORE_UI.TABS.LABELS.MANUAL_EXPORT}</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center max-w-lg mx-auto my-6">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-full mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-base mb-1">
            {BACKUP_RESTORE_UI.RBAC_WARNING.TITLE}
          </h3>
          <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">
            {BACKUP_RESTORE_UI.RBAC_WARNING.DESCRIPTION} (Vai trò hiện tại:{" "}
            <strong>{ROLE_LABELS[currentRole]}</strong>)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
            {BACKUP_RESTORE_UI.PAGE_TITLE}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {BACKUP_RESTORE_UI.PAGE_SUBTITLE}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("auto_backup")}
            className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "auto_backup"
                ? "bg-white text-kv-blue-primary shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{BACKUP_RESTORE_UI.TABS.LABELS.AUTO_BACKUP}</span>
          </button>
          <button
            onClick={() => setActiveTab("restore")}
            className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "restore"
                ? "bg-white text-kv-blue-primary shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{BACKUP_RESTORE_UI.TABS.LABELS.RESTORE}</span>
          </button>
          <button
            onClick={() => setActiveTab("manual_export")}
            className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "manual_export"
                ? "bg-white text-kv-blue-primary shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{BACKUP_RESTORE_UI.TABS.LABELS.MANUAL_EXPORT}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Auto Backup (NCL-14-CN-002) */}
      {activeTab === "auto_backup" && (
        <div className="space-y-6">
          <BackupStatusOverviewCards
            overview={overviewData?.result}
            isLoading={isOverviewLoading}
            isTriggering={isTriggering}
            onTriggerBackup={handleTriggerManualBackup}
          />

          <AutoBackupConfigCard
            config={configData?.result}
            isLoading={isConfigLoading}
          />

          <BackupHistoryTable
            histories={historiesData?.result?.content || []}
            isLoading={isHistoriesLoading}
            page={backupPage}
            totalPages={historiesData?.result?.totalPages || 0}
            totalElements={historiesData?.result?.totalElements || 0}
            onPageChange={setBackupPage}
          />
        </div>
      )}

      {/* TAB 2: Restore Data (NCL-14-CN-003) */}
      {activeTab === "restore" && (
        <div className="space-y-6">
          <AvailableBackupsTable
            backups={availableData?.result || []}
            isLoading={isAvailableLoading}
            onSelectBackup={handleSelectBackupForRestore}
          />

          <RestoreHistoryTable
            histories={restoreHistoriesData?.result?.content || []}
            isLoading={isRestoreHistoriesLoading}
            page={restorePage}
            totalPages={restoreHistoriesData?.result?.totalPages || 0}
            totalElements={restoreHistoriesData?.result?.totalElements || 0}
            onPageChange={setRestorePage}
          />

          <RestorePreviewModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedBackupId(null);
              setPreviewData(null);
            }}
            previewData={previewData}
            isLoading={isPreviewLoading}
            isExecuting={isExecuting}
            onConfirmRestore={handleConfirmRestore}
          />
        </div>
      )}

      {/* TAB 3: Manual Export (NCL-09-CN-006) */}
      {activeTab === "manual_export" && <BackupExportPanel />}
    </div>
  );
};

export default BackupRestorePage;
