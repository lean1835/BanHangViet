import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  Database,
  Clock,
  User,
  Globe,
  Hash,
  ArrowRight,
  X,
  Copy,
  Check,
  Activity,
} from "lucide-react";
import type { IActivityLog } from "../types/IAuditLog";
import { AUDIT_ACTION_MAP, AUDIT_TABLE_MAP } from "@/constants/auditLog";

interface AuditLogDetailModalProps {
  log: IActivityLog | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!log) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatJson = (val?: string) => {
    if (!val) return "Không có dữ liệu (NULL)";
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const actionDisplay = AUDIT_ACTION_MAP[log.action]?.label || log.action;
  const tableDisplay = AUDIT_TABLE_MAP[log.targetTable] || log.targetTable;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-log-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 app-modal-backdrop animate-backdrop-fade-in"
    >
      <div className="app-modal-panel w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-modal-bounce-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 app-modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-kv-blue-primary rounded-2xl shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="audit-log-detail-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Chi tiết bản ghi nhật ký kiểm toán #{log.sequenceNumber}</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                  {actionDisplay}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bản ghi bất biến được bảo vệ và chống can thiệp dữ liệu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal chi tiết"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 hover:rotate-90 active:scale-90 p-2 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs app-modal-body">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-extrabold text-[11px] uppercase">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Thời gian
              </span>
              <p className="font-bold text-slate-800">{formatDateTime(log.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-extrabold text-[11px] uppercase">
                <User className="w-3.5 h-3.5 text-slate-400" /> Người thực hiện
              </span>
              <p className="font-bold text-slate-800">
                {log.fullName || log.username || "Hệ thống"}{" "}
                {log.username && <span className="text-slate-400 font-normal">(@{log.username})</span>}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-extrabold text-[11px] uppercase">
                <Database className="w-3.5 h-3.5 text-slate-400" /> Mục tiêu tác động
              </span>
              <p className="font-bold text-slate-800">
                {tableDisplay}{" "}
                {log.targetId && (
                  <span className="font-mono text-[10px] text-kv-blue-primary block truncate">
                    #{log.targetId}
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-extrabold text-[11px] uppercase">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Mạng & Thiết bị
              </span>
              <p className="font-mono text-slate-700 truncate font-semibold" title={`${log.clientIp} - ${log.userAgent}`}>
                {log.clientIp || "127.0.0.1"}
              </p>
            </div>
          </div>

          {/* Cryptographic Hash Chain Info */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-indigo-900 font-bold text-xs">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-600" />
                <span>Chuỗi bảo mật</span>
              </div>
              <span className="text-[10px] text-indigo-600 bg-indigo-100/60 px-2.5 py-0.5 rounded-md font-bold border border-indigo-200/50">
                Khóa xác thực liên tục
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-sans text-[10px] uppercase font-extrabold">
                    Mã xác thực bản ghi trước:
                  </span>
                  <button
                    onClick={() => handleCopy(log.previousHash || "", "prevHash")}
                    className="text-slate-400 hover:text-indigo-600 font-sans text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Sao chép mã"
                  >
                    {copiedKey === "prevHash" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-slate-700 break-all select-all font-medium text-[10px] leading-relaxed">
                  {log.previousHash || "0000000000000000000000000000000000000000000000000000000000000000"}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-sans text-[10px] uppercase font-extrabold">
                    Mã xác thực bản ghi hiện tại:
                  </span>
                  <button
                    onClick={() => handleCopy(log.hash, "currHash")}
                    className="text-slate-400 hover:text-indigo-600 font-sans text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Sao chép mã"
                  >
                    {copiedKey === "currHash" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-indigo-800 font-bold break-all select-all text-[10px] leading-relaxed">
                  {log.hash}
                </span>
              </div>
            </div>
          </div>

          {/* Before / After Diff Visualizer */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>So sánh thay đổi dữ liệu chi tiết (Before / After Diff)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Old Value */}
              <div className="flex flex-col border border-amber-200 rounded-2xl overflow-hidden bg-amber-50/20 shadow-2xs">
                <div className="px-3.5 py-2.5 bg-amber-100/80 border-b border-amber-200 text-amber-900 font-extrabold text-[11px] flex items-center justify-between">
                  <span>Dữ liệu cũ (Old Value / Trước thay đổi)</span>
                </div>
                <pre className="p-3.5 font-mono text-[11px] text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-60 leading-relaxed">
                  {formatJson(log.oldValue)}
                </pre>
              </div>

              {/* New Value */}
              <div className="flex flex-col border border-emerald-200 rounded-2xl overflow-hidden bg-emerald-50/20 shadow-2xs">
                <div className="px-3.5 py-2.5 bg-emerald-100/80 border-b border-emerald-200 text-emerald-900 font-extrabold text-[11px] flex items-center justify-between">
                  <span>Dữ liệu mới (New Value / Sau thay đổi)</span>
                </div>
                <pre className="p-3.5 font-mono text-[11px] text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-60 leading-relaxed">
                  {formatJson(log.newValue)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 app-modal-footer">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
};
