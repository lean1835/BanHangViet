import React from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  ShieldCheck,
  Play,
} from "lucide-react";
import { ANOMALY_UI } from "@/constants/anomalyAlert";
import type { IAnomalyAlertSummary } from "../types/IAnomalyAlert";

interface AnomalyAlertSummaryCardsProps {
  summary?: IAnomalyAlertSummary | null;
  isLoading: boolean;
  onOpenScanModal: () => void;
  onOpenRulesModal: () => void;
}

export const AnomalyAlertSummaryCards: React.FC<AnomalyAlertSummaryCardsProps> = ({
  summary,
  isLoading,
  onOpenScanModal,
}) => {
  const isCleanDay = summary?.isCleanDay ?? false;

  return (
    <div className="space-y-4">
      {/* Clean Day Banner (TC-02) */}
      {isCleanDay && !isLoading && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-emerald-950 text-sm">
                  {ANOMALY_UI.OVERVIEW.CLEAN_DAY_TITLE}
                </h4>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  An toàn 100%
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                {ANOMALY_UI.OVERVIEW.CLEAN_DAY_DESC}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenScanModal}
            className="shrink-0 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{ANOMALY_UI.OVERVIEW.SCAN_NOW_BTN}</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
              {ANOMALY_UI.OVERVIEW.TOTAL_ALERTS}
            </span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-7 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
              <span className="text-xl font-black text-slate-900">
                {summary?.totalAlerts ?? 0}
              </span>
            )}
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Toàn bộ vi phạm đã phát hiện
            </p>
          </div>
        </div>

        {/* 2. Pending Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
              {ANOMALY_UI.OVERVIEW.PENDING_ALERTS}
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-7 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-amber-600">
                  {summary?.pendingAlerts ?? 0}
                </span>
                <span className="text-xs font-bold text-slate-400">cần xử lý</span>
              </div>
            )}
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Cần chủ hộ xem xét và xác nhận
            </p>
          </div>
        </div>

        {/* 3. Critical Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
              {ANOMALY_UI.OVERVIEW.CRITICAL_ALERTS}
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-7 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
              <span className="text-xl font-black text-rose-600">
                {summary?.criticalAlerts ?? 0}
              </span>
            )}
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Rủi ro cao hoặc đứt gãy kiểm toán
            </p>
          </div>
        </div>

        {/* 4. Warning Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
              {ANOMALY_UI.OVERVIEW.WARNING_ALERTS}
            </span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-7 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
              <span className="text-xl font-black text-orange-600">
                {summary?.warningAlerts ?? 0}
              </span>
            )}
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Vượt ngưỡng nhẹ hoặc cần lưu ý
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
