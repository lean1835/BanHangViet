import React from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import type { ISystemIncidentAlert } from "../types/platformAdminTypes";

interface WideIncidentBannerProps {
  incident: ISystemIncidentAlert | null;
  onDismiss: () => void;
  isDismissing?: boolean;
}

export const WideIncidentBanner: React.FC<WideIncidentBannerProps> = ({
  incident,
  onDismiss,
  isDismissing,
}) => {
  if (!incident || !incident.active) return null;

  return (
    <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white p-4 rounded-2xl shadow-lg border border-rose-400/40 relative overflow-hidden animate-fade-in mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0 mt-0.5 sm:mt-0 animate-bounce">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-white text-rose-700 text-[10px] font-black uppercase tracking-wider shadow-xs">
                CẢNH BÁO SỰ CỐ DIỆN RỘNG (AC-TC-02)
              </span>
              <span className="text-[11px] text-rose-100 font-medium">
                Phát hiện lúc: {incident.detectedAt}
              </span>
            </div>
            <h4 className="font-extrabold text-sm sm:text-base mt-1 text-white leading-snug">
              {incident.title}
            </h4>
            <p className="text-xs text-rose-50 font-medium mt-0.5 max-w-3xl leading-relaxed">
              {incident.description}
            </p>
            <div className="text-[11px] text-amber-200 mt-1 font-semibold flex items-center gap-1.5">
              <ShieldAlert size={14} />
              <span>{incident.suggestion}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={onDismiss}
            disabled={isDismissing}
            className="px-3.5 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Đã xử lý / Ẩn cảnh báo
          </button>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Đóng thông báo"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
