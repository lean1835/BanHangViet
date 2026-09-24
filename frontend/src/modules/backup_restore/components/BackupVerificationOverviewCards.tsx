import React from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  CalendarCheck,
  Shield,
  Layers,
} from "lucide-react";
import {
  BACKUP_RESTORE_UI,
  VERIFICATION_STATUS_STYLES,
  VERIFICATION_HEALTH_STYLES,
} from "@/constants/backupRestore";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IBackupVerificationStatus } from "../types/IBackupRestore";

interface BackupVerificationOverviewCardsProps {
  status?: IBackupVerificationStatus | null;
  isLoading: boolean;
  isTriggering: boolean;
  onOpenTriggerModal: () => void;
}

export const BackupVerificationOverviewCards: React.FC<
  BackupVerificationOverviewCardsProps
> = ({ status, isLoading, isTriggering, onOpenTriggerModal }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-32 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const health = status?.overallHealthStatus || "NORMAL";
  const healthStyle = VERIFICATION_HEALTH_STYLES[health];
  const latest = status?.latestVerification;
  const latestSuccess = status?.latestSuccessfulVerification;
  const totalRuns = status?.totalVerificationsRun ?? 0;
  const passedCount = status?.passedVerificationsCount ?? 0;
  const failedCount = status?.failedVerificationsCount ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Trạng thái tổng thể & Lần gần nhất */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {BACKUP_RESTORE_UI.VERIFICATION.OVERVIEW.HEALTH_LABEL}
          </span>
          <div className="p-2 rounded-lg bg-blue-50 text-kv-blue-primary">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full border ${healthStyle.badge}`}
            >
              {healthStyle.label}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1.5 truncate">
            {latest ? (
              <span>
                Bản gần nhất:{" "}
                <span
                  className={
                    VERIFICATION_STATUS_STYLES[latest.status]?.text ||
                    "text-slate-700"
                  }
                >
                  [{VERIFICATION_STATUS_STYLES[latest.status]?.label || latest.status}]
                </span>{" "}
                {latest.backupFileName}
              </span>
            ) : (
              "Chưa có lần kiểm thử nào"
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100 flex items-center gap-1">
          <Shield className="w-3 h-3 text-slate-400" />
          <span>Kiểm chứng Sandbox 3 trụ cột</span>
        </div>
      </div>

      {/* Card 2: Lần thành công gần nhất & Ngày quá hạn */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Thành công gần nhất
          </span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <div className="text-sm font-black text-slate-900 truncate">
            {latestSuccess?.verifiedAt
              ? formatDateShort(latestSuccess.verifiedAt)
              : "Chưa có bản đạt"}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {status?.daysSinceLastSuccess != null ? (
                <>
                  Cách đây{" "}
                  <strong
                    className={
                      status.isOverdue
                        ? "text-amber-600 font-bold"
                        : "text-slate-800"
                    }
                  >
                    {status.daysSinceLastSuccess} ngày
                  </strong>
                </>
              ) : (
                "Chưa ghi nhận"
              )}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
          Ngưỡng cảnh báo:{" "}
          <strong className="text-slate-600">
            {status?.maxAllowedDaysWithoutVerification || 7} ngày
          </strong>
        </div>
      </div>

      {/* Card 3: Thống kê số lần chạy & Tỉ lệ đạt */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Lịch sử kiểm thử
          </span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <div className="text-lg font-black text-slate-900">
            {totalRuns}{" "}
            <span className="text-xs font-semibold text-slate-400">
              lần kiểm thử
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold mt-1">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {passedCount} Đạt
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <XCircle className="w-3.5 h-3.5" />
              {failedCount} Lỗi
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
          Tỉ lệ an toàn:{" "}
          <strong className="text-slate-700">
            {totalRuns > 0
              ? `${Math.round((passedCount / totalRuns) * 100)}%`
              : "100%"}
          </strong>
        </div>
      </div>

      {/* Card 4: Nút Kích hoạt kiểm thử thủ công */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-xl border border-blue-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <span className="text-xs font-extrabold text-kv-blue-primary uppercase tracking-wider">
            Thao tác tức thì
          </span>
          <p className="text-[11px] font-semibold text-slate-600 mt-1 leading-snug">
            Chạy thử phục hồi vào môi trường tạm để kiểm chứng ngay bản sao lưu mới nhất.
          </p>
        </div>

        <div className="mt-3">
          <button
            onClick={onOpenTriggerModal}
            disabled={isTriggering}
            className="w-full bg-kv-blue-primary hover:bg-blue-600 text-white font-extrabold text-xs py-2.5 px-3 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isTriggering ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{BACKUP_RESTORE_UI.VERIFICATION.OVERVIEW.TRIGGERING_BTN}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{BACKUP_RESTORE_UI.VERIFICATION.OVERVIEW.TRIGGER_BTN}</span>
              </>
            )}
          </button>
          <span className="text-[9px] text-slate-500 text-center block mt-1.5 font-medium">
            Môi trường Sandbox • Tuyệt đối an toàn
          </span>
        </div>
      </div>
    </div>
  );
};
