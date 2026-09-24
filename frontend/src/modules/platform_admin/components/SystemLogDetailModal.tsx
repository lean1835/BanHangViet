import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Terminal,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import {
  SYSTEM_LOG_CATEGORY_LABELS,
  SYSTEM_LOG_SEVERITY,
  type ISystemAuditLog,
} from "../types/platformAdminTypes";

interface SystemLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: ISystemAuditLog | null;
}

export const SystemLogDetailModal: React.FC<SystemLogDetailModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  if (!isOpen || !log) return null;

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case SYSTEM_LOG_SEVERITY.CRITICAL:
        return "bg-rose-100 text-rose-800 border-rose-300";
      case SYSTEM_LOG_SEVERITY.ERROR:
        return "bg-rose-50 text-rose-700 border-rose-200";
      case SYSTEM_LOG_SEVERITY.WARNING:
        return "bg-amber-50 text-amber-700 border-amber-200";
      case SYSTEM_LOG_SEVERITY.INFO:
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-200 text-slate-700">
              <Terminal size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Chi Tiết Sự Kiện Kỹ Thuật Nền Tảng
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Log ID: {log.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] font-medium block">
                Thời gian ghi nhận
              </span>
              <span className="font-mono font-bold text-slate-800">
                {log.timestamp}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-medium block">
                Mức độ sự cố
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getSeverityBadge(
                  log.severity,
                )}`}
              >
                {log.severity}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] font-medium block">
                Phân loại
              </span>
              <span className="font-bold text-slate-800">
                {SYSTEM_LOG_CATEGORY_LABELS[log.category] || log.category}
              </span>
            </div>

            {log.householdName && (
              <div>
                <span className="text-slate-400 text-[10px] font-medium block">
                  Hộ liên quan
                </span>
                <span className="font-bold text-slate-900">
                  {log.householdName}
                </span>
              </div>
            )}

            {log.taxCode && (
              <div>
                <span className="text-slate-400 text-[10px] font-medium block">
                  Mã số thuế
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {log.taxCode}
                </span>
              </div>
            )}

            {log.latencyMs !== undefined && (
              <div>
                <span className="text-slate-400 text-[10px] font-medium block">
                  Độ trễ xử lý
                </span>
                <span
                  className={`font-mono font-bold ${log.latencyMs > 3000 ? "text-rose-600" : "text-emerald-600"
                    }`}
                >
                  {log.latencyMs} ms
                </span>
              </div>
            )}

            <div>
              <span className="text-slate-400 text-[10px] font-medium block">
                Địa chỉ IP
              </span>
              <span className="font-mono text-slate-700">{log.ipAddress}</span>
            </div>

            {log.errorCode && (
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px] font-medium block">
                  Mã lỗi kỹ thuật
                </span>
                <span className="font-mono font-bold text-rose-600">
                  {log.errorCode}
                </span>
              </div>
            )}
          </div>

          {/* Action description */}
          <div>
            <span className="block font-bold text-slate-800 mb-1">
              Mô tả sự kiện:
            </span>
            <div className="p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-800">
              {log.action}
            </div>
          </div>

          {/* Technical Details Trace */}
          <div>
            <span className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Cpu size={14} className="text-slate-500" />
              <span>Thông tin kỹ thuật (Trace / Payload log):</span>
            </span>
            <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {log.technicalDetails}
            </pre>
          </div>

          {/* Security & Privacy Disclaimer (VT-04 Constraint) */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2 text-[11px] text-emerald-900 leading-relaxed">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Tuân thủ giới hạn quyền Quản trị nền tảng (VT-04 & AC-TC-03):</strong>{" "}
              Hệ thống chỉ cung cấp thông tin vận hành kỹ thuật (mã hộ, loại lỗi, độ trễ, queue). Toàn bộ nội dung kinh doanh chi tiết (tên khách hàng, mặt hàng, số tiền hóa đơn) hoàn toàn được bảo mật và cách ly.
            </div>
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
