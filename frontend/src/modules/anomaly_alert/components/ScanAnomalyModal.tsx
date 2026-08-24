import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Calendar,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { ANOMALY_UI } from "@/constants/anomalyAlert";
import { useNotification } from "@/hooks/useNotification";
import { useScanAnomaliesMutation } from "../services/anomalyAlertApi";
import type { IScanAnomalyResult } from "../types/IAnomalyAlert";

import { getLocalAnomalyAlerts } from "../utils/anomalyStorage";

interface ScanAnomalyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: () => void;
}

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const ScanAnomalyModal: React.FC<ScanAnomalyModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
}) => {
  const { showSuccess, showError } = useNotification();
  const [scanDate, setScanDate] = useState<string>(getTodayDateString());
  const [scanAnomalies, { isLoading }] = useScanAnomaliesMutation();
  const [scanResult, setScanResult] = useState<IScanAnomalyResult | null>(null);

  if (!isOpen) return null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanResult(null);

    try {
      const res = await scanAnomalies({ scanDate }).unwrap();
      const localAlerts = getLocalAnomalyAlerts();
      const localAlertsForDate = localAlerts.filter((a) => {
        const detectedDate = (a.detectedAt || a.createdAt || "").substring(0, 10);
        return detectedDate === scanDate;
      });

      const serverNew = res.result?.newAlertsDetected ?? 0;
      const totalNew = serverNew + localAlertsForDate.length;
      const isClean = totalNew === 0 && (res.result?.isCleanDay ?? true);

      const mergedResult: IScanAnomalyResult = {
        ...res.result,
        newAlertsDetected: totalNew,
        isCleanDay: isClean,
        summaryMessage: isClean
          ? `Ghi nhận ngày an toàn (ngày sạch), không có thao tác vượt ngưỡng bất thường nào trong ngày ${scanDate}`
          : `Phát hiện ${totalNew} thao tác bất thường trong ngày ${scanDate}`,
      };

      setScanResult(mergedResult);
      showSuccess(mergedResult.summaryMessage);
      onScanComplete?.();
    } catch {
      showError("Không thể hoàn tất tác vụ quét phân tích. Vui lòng thử lại!");
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 app-modal-backdrop animate-backdrop-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="app-modal-panel w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-bounce-in flex flex-col cursor-default"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 id="scan-modal-title" className="text-base font-extrabold text-slate-800">
                {ANOMALY_UI.SCAN_MODAL.TITLE}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {ANOMALY_UI.SCAN_MODAL.SUBTITLE}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Đóng modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-kv-blue-primary" />
                <span>{ANOMALY_UI.SCAN_MODAL.DATE_LABEL}</span>
              </label>
              <input
                type="date"
                value={scanDate}
                onChange={(e) => setScanDate(e.target.value)}
                disabled={isLoading}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !scanDate}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{ANOMALY_UI.SCAN_MODAL.SCANNING_BTN}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{ANOMALY_UI.SCAN_MODAL.SCAN_BTN}</span>
                </>
              )}
            </button>
          </form>

          {/* Scan Results Banner */}
          {scanResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-2xs ${
                scanResult.isCleanDay
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              {scanResult.isCleanDay ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-sm">
                  {scanResult.isCleanDay
                    ? "Hoàn tất: Ngày làm việc an toàn!"
                    : `Phát hiện ${scanResult.newAlertsDetected} cảnh báo mới!`}
                </h4>
                <p className="text-xs leading-relaxed font-medium">
                  {scanResult.summaryMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
