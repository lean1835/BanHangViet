import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowLeft,
  Hash,
  Database,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import { AUDIT_LOG_UI } from "@/constants/auditLog";
import {
  useGetAuditLogsQuery,
  useLazyVerifyAuditIntegrityQuery,
  downloadAuditLogsExcel,
} from "../services/auditLogApi";
import { useAuditLogFilter } from "../context/AuditLogFilterContext";
import { AuditLogTable } from "../components/AuditLogTable";
import { AuditLogDetailModal } from "../components/AuditLogDetailModal";
import { AuditIntegrityModal } from "../components/AuditIntegrityModal";
import { useNotification } from "@/hooks/useNotification";
import type { IActivityLog, IAuditIntegrityResponse } from "../types/IAuditLog";

export const AuditLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  // RBAC Permission Check
  const isAuthorized =
    currentRole === USER_ROLES.OWNER ||
    currentRole === USER_ROLES.PLATFORM_ADMIN;

  // Filter state from Left Sidebar Context
  const { filter } = useAuditLogFilter();
  const [page, setPage] = useState<number>(0);
  const pageSize = 15;

  // Auto reset page to 0 when filter changes
  useEffect(() => {
    setPage(0);
  }, [filter]);

  // Modal states
  const [selectedLog, setSelectedLog] = useState<IActivityLog | null>(null);
  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState<boolean>(false);
  const [integrityResult, setIntegrityResult] = useState<IAuditIntegrityResponse | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Formatted date parameters for Spring Boot ISO.DATE_TIME
  const queryStartDate = filter.startDate
    ? `${filter.startDate}T00:00:00`
    : undefined;
  const queryEndDate = filter.endDate
    ? `${filter.endDate}T23:59:59`
    : undefined;

  // Queries
  const { data, isLoading, isFetching } = useGetAuditLogsQuery(
    {
      username: filter.username.trim() || undefined,
      action: filter.action || undefined,
      targetTable: filter.targetTable || undefined,
      startDate: queryStartDate,
      endDate: queryEndDate,
      page,
      size: pageSize,
    },
    { skip: !isAuthorized }
  );

  const [triggerVerifyIntegrity, { isFetching: isVerifying }] =
    useLazyVerifyAuditIntegrityQuery();

  // Kiểm tra tính toàn vẹn
  const handleVerifyIntegrity = async () => {
    setIsIntegrityModalOpen(true);
    try {
      const res = await triggerVerifyIntegrity().unwrap();
      if (res?.result) {
        setIntegrityResult(res.result);
        if (res.result.valid) {
          showSuccess("Nhật ký kiểm toán hoàn toàn toàn vẹn và hợp lệ!");
        } else {
          showError("Phát hiện chuỗi kiểm tra nhật ký có dấu hiệu bị can thiệp!");
        }
      }
    } catch {
      showError("Không thể hoàn tất kiểm tra tính toàn vẹn nhật ký");
    }
  };

  // Xuất file báo cáo Excel (.xlsx)
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await downloadAuditLogsExcel({
        username: filter.username.trim() || undefined,
        action: filter.action || undefined,
        targetTable: filter.targetTable || undefined,
        startDate: queryStartDate,
        endDate: queryEndDate,
      });
      showSuccess("Đã xuất file báo cáo nhật ký kiểm toán thành công!");
    } catch {
      showError("Xuất file báo cáo nhật ký kiểm toán thất bại");
    } finally {
      setIsExporting(false);
    }
  };

  // Permission Warning View for VT-02 (Cashier) & VT-03 (Accountant)
  if (!isAuthorized) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-rose-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-800">
              {AUDIT_LOG_UI.RBAC_WARNING.TITLE}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Theo quy định bảo mật nghiệp vụ hóa đơn & thuế, màn hình Nhật ký kiểm toán chỉ cho phép{" "}
              <strong>Chủ hộ kinh doanh (VT-01)</strong> và{" "}
              <strong>Quản trị nền tảng (VT-04)</strong> truy cập.
            </p>
          </div>
          <button
            onClick={() => navigate(APP_ROUTES.DASHBOARD)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{AUDIT_LOG_UI.RBAC_WARNING.ACTION_BACK}</span>
          </button>
        </div>
      </div>
    );
  }

  const logsList = data?.result?.content || [];
  const totalPages = data?.result?.totalPages || 1;
  const totalElements = data?.result?.totalElements || 0;

  return (
    <div className="flex flex-col gap-4 w-full flex-1 animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <span>BÁO CÁO</span>
            <span>/</span>
            <span className="text-kv-blue-primary">NHẬT KÝ KIỂM TOÁN</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            {AUDIT_LOG_UI.TITLE}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {AUDIT_LOG_UI.SUBTITLE}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleVerifyIntegrity}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
            title="Kiểm tra tính toàn vẹn dữ liệu"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{AUDIT_LOG_UI.INTEGRITY_CHECK_BTN}</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting || totalElements === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#00b865] hover:bg-[#00a359] active:scale-95 rounded-xl shadow-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Xuất tệp báo cáo Excel (.xlsx)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{isExporting ? "Đang xuất..." : AUDIT_LOG_UI.EXPORT_EXCEL_BTN}</span>
          </button>
        </div>
      </div>

      {/* KPI & Security Status Cards (3 Cards) - Evenly spaced & aligned */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Tổng số bản ghi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5 h-[74px]">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-kv-blue-primary flex items-center justify-center shrink-0 shadow-2xs">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block leading-tight">
              Tổng bản ghi kiểm toán
            </span>
            <span className="text-base font-black text-slate-800 leading-tight block mt-0.5">
              {totalElements.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        {/* Card 2: Bảo mật dữ liệu */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5 h-[74px]">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Hash className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block leading-tight">
              Bảo mật dữ liệu
            </span>
            <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1 leading-tight mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ghi vết liên tục</span>
            </span>
          </div>
        </div>

        {/* Card 3: Quy định bất biến */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5 h-[74px]">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block leading-tight">
              Tính bất biến
            </span>
            <span className="text-xs font-extrabold text-indigo-800 leading-tight block mt-0.5 truncate">
              Chỉ ghi thêm (Không thể sửa)
            </span>
          </div>
        </div>
      </div>

      {/* Audit Log Data Table */}
      <AuditLogTable
        logs={logsList}
        isLoading={isLoading || isFetching}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setPage}
        onViewDetail={setSelectedLog}
      />

      {/* Modals */}
      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />

      <AuditIntegrityModal
        isOpen={isIntegrityModalOpen}
        onClose={() => setIsIntegrityModalOpen(false)}
        result={integrityResult}
        isLoading={isVerifying}
        onReverify={handleVerifyIntegrity}
      />
    </div>
  );
};

export default AuditLogPage;
