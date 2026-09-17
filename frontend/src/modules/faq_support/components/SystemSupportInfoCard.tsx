import React, { useState } from "react";
import { Copy, Check, Server, Store, ShieldCheck, User } from "lucide-react";
import type { ISupportInfo } from "../types/faqSupport.types";

interface SystemSupportInfoCardProps {
  supportInfo?: ISupportInfo;
  isLoading?: boolean;
}

export const SystemSupportInfoCard: React.FC<SystemSupportInfoCardProps> = ({
  supportInfo,
  isLoading = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopySummary = async () => {
    if (!supportInfo?.quickSupportSummary) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(supportInfo.quickSupportSummary);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = supportInfo.quickSupportSummary;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error("Không thể sao chép thông tin:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-4 bg-slate-100 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!supportInfo) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Định danh kỹ thuật
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Thông tin báo lỗi cho tổng đài
            </h3>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          {supportInfo.systemVersion || "v1.2.0"}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3.5 leading-relaxed font-normal">
        Khi liên hệ tổng đài hoặc kỹ thuật viên, vui lòng cung cấp thông tin dưới đây để được tra cứu hồ sơ nhanh chóng:
      </p>

      {/* Lưới thông tin chi tiết */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs mb-3.5">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 p-2.5 border border-slate-100">
          <Store className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-slate-400">Mã hộ kinh doanh</div>
            <div className="font-semibold text-slate-800 truncate" title={supportInfo.householdCode}>
              {supportInfo.householdCode || "N/A"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 p-2.5 border border-slate-100">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-slate-400">Mã số thuế</div>
            <div className="font-semibold text-slate-800 truncate" title={supportInfo.taxCode}>
              {supportInfo.taxCode || "N/A"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 p-2.5 border border-slate-100 sm:col-span-2">
          <Store className="h-4 w-4 text-slate-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-slate-400">Tên hộ kinh doanh</div>
            <div className="font-semibold text-slate-800 truncate" title={supportInfo.householdName}>
              {supportInfo.householdName || "N/A"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 p-2.5 border border-slate-100 sm:col-span-2">
          <User className="h-4 w-4 text-indigo-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-slate-400">Người dùng hiện tại</div>
            <div className="font-semibold text-slate-800 truncate">
              {supportInfo.currentUserFullName || supportInfo.currentUsername}{" "}
              <span className="text-slate-400 font-normal">({supportInfo.currentUserRole})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nút sao chép 1 chạm định dạng sẵn */}
      <button
        type="button"
        onClick={handleCopySummary}
        className={`flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer ${
          isCopied
            ? "bg-emerald-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-98"
        }`}
        aria-label="Sao chép toàn bộ thông tin định danh báo lỗi"
      >
        {isCopied ? (
          <>
            <Check className="h-4 w-4" />
            <span>Đã sao chép thông tin báo lỗi vào bộ nhớ tạm!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Sao chép thông tin báo lỗi (1 chạm)</span>
          </>
        )}
      </button>
    </div>
  );
};
