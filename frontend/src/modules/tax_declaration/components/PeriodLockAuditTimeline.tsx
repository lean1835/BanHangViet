import React, { useState, useEffect } from "react";
import {
  Lock,
  History,
  User,
  Calendar,
  FileText,
  Unlock,
  AlertCircle,
  Clock,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import type { ITaxDeclarationPeriodResponse } from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";
import { useGetActivityLogsQuery } from "@/modules/report/services/reportApi";
import type { IActivityLogResponse } from "@/modules/report/types/IReport";

interface IPeriodLockAuditTimelineProps {
  period?: ITaxDeclarationPeriodResponse;
}

export const PeriodLockAuditTimeline: React.FC<
  IPeriodLockAuditTimelineProps
> = ({ period }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const { data: logsResponse, isLoading: isLoadingLogs } =
    useGetActivityLogsQuery({ size: 100 });

  // Reset trang về 1 khi chọn kỳ khác
  useEffect(() => {
    setCurrentPage(1);
  }, [period?.id]);

  if (!period) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 italic text-xs">
        Vui lòng chọn một kỳ kê khai để xem lịch sử kiểm toán.
      </div>
    );
  }

  const allLogs: IActivityLogResponse[] = logsResponse?.result?.content || [];

  // Lọc các bản ghi nhật ký kiểm toán liên quan đến kỳ thuế này từ Backend
  const matchingLogs = allLogs.filter((log) => {
    const isTaxEntity =
      log.targetTable === "tax_declaration_periods" ||
      log.targetTable === "tax_sales_registers";
    const matchesId = log.targetId === period.id;
    const matchesName =
      (log.newValue &&
        log.newValue.toLowerCase().includes(period.periodName.toLowerCase())) ||
      (log.oldValue &&
        log.oldValue.toLowerCase().includes(period.periodName.toLowerCase()));
    return isTaxEntity && (matchesId || matchesName);
  });

  // Cấu hình giao diện và phân loại hành động
  const getActionConfig = (action: string) => {
    const upperAction = action?.toUpperCase() || "";
    if (
      upperAction === "GENERATE_TAX_SALES_REGISTER" ||
      upperAction === "GENERATE_TAX_REGISTER" ||
      upperAction === "GENERATE"
    ) {
      return {
        title: "LẬP BẢNG KÊ HÓA ĐƠN",
        badgeBg: "bg-blue-100 text-blue-700 border-blue-200",
        iconBorder: "border-blue-500 text-blue-600",
        Icon: FileText,
      };
    }
    if (upperAction === "SUMMARIZE_TAX_REVENUE") {
      return {
        title: "TỔNG HỢP DOANH THU THUẾ",
        badgeBg: "bg-indigo-100 text-indigo-700 border-indigo-200",
        iconBorder: "border-indigo-500 text-indigo-600",
        Icon: Layers,
      };
    }
    if (upperAction === "LOCK_TAX_PERIOD" || upperAction === "LOCK") {
      return {
        title: "CHỐT KHÓA SỐ LIỆU KỲ",
        badgeBg: "bg-rose-100 text-rose-700 border-rose-200",
        iconBorder: "border-rose-500 text-rose-600",
        Icon: Lock,
      };
    }
    if (upperAction === "UNLOCK_TAX_PERIOD" || upperAction === "UNLOCK") {
      return {
        title: "MỞ LẠI KỲ KÊ KHAI",
        badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
        iconBorder: "border-amber-500 text-amber-600",
        Icon: Unlock,
      };
    }
    if (
      upperAction === "RECALCULATE_TAX_REGISTER" ||
      upperAction === "RECALCULATE"
    ) {
      return {
        title: "TÍNH TOÁN LẠI BẢNG KÊ",
        badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
        iconBorder: "border-emerald-500 text-emerald-600",
        Icon: RefreshCw,
      };
    }
    return {
      title: action || "THAO TÁC KỲ THUẾ",
      badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
      iconBorder: "border-slate-400 text-slate-600",
      Icon: History,
    };
  };

  // Trích xuất lý do mở lại nếu có
  const extractReason = (desc?: string) => {
    if (!desc) return null;
    const reasonIndex = desc.indexOf("- Lý do:");
    if (reasonIndex !== -1) {
      return desc.substring(reasonIndex + 8).trim();
    }
    return null;
  };

  // Chuẩn bị danh sách sự kiện hiển thị
  let timelineItems = [];

  if (matchingLogs.length > 0) {
    timelineItems = matchingLogs.map((log) => {
      const config = getActionConfig(log.action);
      const reason = extractReason(log.newValue);
      return {
        id: log.id,
        title: config.title,
        action: log.action,
        performedBy: log.fullName || log.username || "Chủ hộ / Kế toán",
        performedAt: log.createdAt,
        desc: log.newValue || `Thực hiện thao tác trên kỳ ${period.periodName}`,
        reason,
        config,
      };
    });
  } else {
    // Fallback nếu kỳ chưa có trong bảng activity_logs (dữ liệu mock ban đầu)
    const baseCreateConfig = getActionConfig("GENERATE");
    timelineItems.push({
      id: "create-fallback",
      title: baseCreateConfig.title,
      action: "GENERATE",
      performedBy: period.createdByName || "Hệ thống Bán Hàng Việt",
      performedAt: period.createdAt,
      desc: `Đã lập bảng kê ${period.periodName} với ${period.totalValidInvoices} hóa đơn hợp lệ. Tổng doanh thu: ${formatCurrency(period.totalRevenue)}, Tổng thuế: ${formatCurrency(period.totalTaxAmount)}.`,
      reason: null,
      config: baseCreateConfig,
    });

    if (period.lockedAt) {
      const baseLockConfig = getActionConfig("LOCK");
      timelineItems.push({
        id: "lock-fallback",
        title: baseLockConfig.title,
        action: "LOCK",
        performedBy: period.lockedByName || "Chủ hộ (VT-01)",
        performedAt: period.lockedAt,
        desc: `Chủ hộ đã xác nhận chốt sổ liệu kỳ ${period.periodName}. Dữ liệu được đóng băng an toàn và không thể chỉnh sửa.`,
        reason: null,
        config: baseLockConfig,
      });
    }
  }

  // Phân trang danh sách sự kiện timeline
  const totalPages = Math.ceil(timelineItems.length / pageSize) || 1;
  const paginatedTimelineItems = timelineItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
            <History className="w-4 h-4 shrink-0 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-800 tracking-tight">
              Nhật ký kiểm toán & Thao tác kỳ ({period.periodName})
            </h3>
            <p className="text-[11px] text-slate-500">
              Lưu vết vĩnh viễn mọi hành động theo chuẩn quy định kiểm toán thuế Thông tư 40
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoadingLogs && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin stroke-[2]" />
              <span>Đang đồng bộ...</span>
            </span>
          )}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
              period.status === "LOCKED"
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {period.status === "LOCKED" ? (
              <>
                <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Trạng thái: Đã khóa sổ</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Trạng thái: Đang mở (Đã lập bảng kê)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pt-1">
        {paginatedTimelineItems.map((entry) => {
          const { Icon } = entry.config;
          return (
            <div key={entry.id} className="relative pl-10 group">
              {/* Timeline Icon */}
              <div
                className={`absolute left-1.5 top-1.5 w-6 h-6 rounded-full flex items-center justify-center -translate-x-1/2 border-2 bg-white transition-transform duration-200 group-hover:scale-110 shadow-xs ${entry.config.iconBorder}`}
              >
                <Icon className="w-3 h-3 stroke-[2.2]" />
              </div>

              {/* Content Card */}
              <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs transition-colors duration-150 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-black px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider border shadow-2xs ${entry.config.badgeBg}`}
                    >
                      {entry.title}
                    </span>
                    <span className="font-extrabold text-slate-800">
                      {period.periodName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                    <Clock className="w-3.5 h-3.5 stroke-[2]" />
                    <span>{new Date(entry.performedAt).toLocaleString("vi-VN")}</span>
                  </div>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed font-medium">
                  {entry.desc}
                </p>

                {/* Highlight box for unlock reason */}
                {entry.reason && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.2]" />
                    <div>
                      <span className="font-bold text-amber-900 block text-[11px]">
                        Lý do giải trình mở lại kỳ thuế:
                      </span>
                      <p className="mt-0.5 text-amber-800 font-semibold italic text-xs">
                        "{entry.reason}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 text-[11px] pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                    <span>
                      Người thực hiện: <strong className="text-slate-800">{entry.performedBy}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Mã định danh kỳ: {period.id.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-100 text-xs">
          <span className="text-slate-500 text-[11px]">
            Hiển thị <strong>{paginatedTimelineItems.length}</strong> trên tổng số{" "}
            <strong>{timelineItems.length}</strong> sự kiện kiểm toán
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Trước</span>
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-700 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
