import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Clock,
  FileCheck,
} from "lucide-react";
import {
  BACKUP_RESTORE_UI,
  VERIFICATION_HEALTH_STYLES,
} from "@/constants/backupRestore";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IBackupVerificationStatus } from "../types/IBackupRestore";

interface BackupVerificationStatusBannerProps {
  status?: IBackupVerificationStatus | null;
  isLoading?: boolean;
}

export const BackupVerificationStatusBanner: React.FC<
  BackupVerificationStatusBannerProps
> = ({ status, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 animate-pulse flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3.5 shadow-xs">
        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 shrink-0">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-slate-800 leading-tight">
            Chưa có dữ liệu kiểm chứng bản sao lưu
          </h3>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Hệ thống chưa ghi nhận lượt kiểm thử phục hồi nào trong môi trường tạm. Vui lòng bấm &ldquo;Kích hoạt thử phục hồi ngay&rdquo; để kiểm tra độ tin cậy của các bản sao lưu.
          </p>
        </div>
      </div>
    );
  }

  const health = status.overallHealthStatus || "WARNING";
  const styles = VERIFICATION_HEALTH_STYLES[health] || VERIFICATION_HEALTH_STYLES.WARNING;
  const latestSuccess = status.latestSuccessfulVerification;
  const latest = status.latestVerification;

  return (
    <div
      className={`border rounded-xl p-5 shadow-xs transition-all ${styles.bg} ${styles.border}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              health === "NORMAL"
                ? "bg-emerald-100 text-emerald-700"
                : health === "WARNING"
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {health === "NORMAL" && <ShieldCheck className="w-7 h-7" />}
            {health === "WARNING" && <AlertTriangle className="w-7 h-7" />}
            {health === "DANGER" && <ShieldAlert className="w-7 h-7" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base text-slate-900 leading-tight">
                {health === "NORMAL" &&
                  BACKUP_RESTORE_UI.VERIFICATION.BANNER.SAFE_TITLE}
                {health === "WARNING" &&
                  BACKUP_RESTORE_UI.VERIFICATION.BANNER.WARNING_TITLE}
                {health === "DANGER" &&
                  BACKUP_RESTORE_UI.VERIFICATION.BANNER.DANGER_TITLE}
              </h3>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${styles.badge}`}
              >
                {styles.label}
              </span>
            </div>

            <p className="text-xs font-medium text-slate-700 max-w-2xl leading-relaxed">
              {status?.warningMessage ||
                (health === "NORMAL"
                  ? BACKUP_RESTORE_UI.VERIFICATION.BANNER.SAFE_DESC
                  : health === "WARNING"
                  ? BACKUP_RESTORE_UI.VERIFICATION.BANNER.WARNING_DESC
                  : BACKUP_RESTORE_UI.VERIFICATION.BANNER.DANGER_DESC)}
            </p>

            {/* Badges and metadata */}
            <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-600 flex-wrap">
              {latestSuccess?.verifiedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Thành công gần nhất:{" "}
                    <strong className="text-slate-800">
                      {formatDateShort(latestSuccess.verifiedAt)}
                    </strong>
                  </span>
                </div>
              )}

              {latestSuccess?.backupFileName && (
                <div className="flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Tệp:{" "}
                    <code className="text-slate-800 font-mono bg-white/70 px-1.5 py-0.5 rounded border border-slate-200">
                      {latestSuccess.backupFileName}
                    </code>
                  </span>
                </div>
              )}

              {status?.daysSinceLastSuccess != null && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Khoảng cách:{" "}
                    <strong
                      className={
                        status.isOverdue
                          ? "text-amber-700 font-bold"
                          : "text-slate-800"
                      }
                    >
                      {status.daysSinceLastSuccess} ngày
                    </strong>{" "}
                    (Hạn mức: {status.maxAllowedDaysWithoutVerification || 7}{" "}
                    ngày)
                  </span>
                </div>
              )}

              {health === "DANGER" && latest?.failureReason && (
                <div className="w-full text-rose-700 text-xs font-semibold bg-white/80 p-2 rounded-lg border border-rose-200 mt-1">
                  <strong>Chi tiết lỗi:</strong> {latest.failureReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
