import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  AlertOctagon,
  FileText,
  Save,
  Loader2,
} from "lucide-react";
import {
  ANOMALY_UI,
  ANOMALY_SEVERITY_STYLES,
  ANOMALY_ALERT_STATUSES,
  ANOMALY_ALERT_TYPE_INFO,
  type TAnomalyAlertStatus,
} from "@/constants/anomalyAlert";
import { formatDate } from "@/utils/dateFormatter";
import type { IAnomalyAlert } from "../types/IAnomalyAlert";

interface ReviewAnomalyAlertModalProps {
  alert: IAnomalyAlert | null;
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmitReview: (alertId: string, status: TAnomalyAlertStatus, reviewNotes: string) => void;
}

export const ReviewAnomalyAlertModal: React.FC<ReviewAnomalyAlertModalProps> = ({
  alert,
  isOpen,
  onClose,
  isSubmitting,
  onSubmitReview,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TAnomalyAlertStatus>(
    ANOMALY_ALERT_STATUSES.REVIEWED
  );
  const [reviewNotes, setReviewNotes] = useState<string>("");

  useEffect(() => {
    if (alert) {
      setSelectedStatus(
        alert.status === ANOMALY_ALERT_STATUSES.PENDING
          ? ANOMALY_ALERT_STATUSES.REVIEWED
          : alert.status
      );
      setReviewNotes(alert.reviewNotes || "");
    }
  }, [alert]);

  if (!isOpen || !alert) return null;

  const severityStyle = ANOMALY_SEVERITY_STYLES[alert.severity] || {
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    label: alert.severity,
  };
  const typeInfo = ANOMALY_ALERT_TYPE_INFO[alert.alertType] || {
    label: alert.alertType,
  };

  let formattedEvidence: string = alert.evidenceData || "";
  try {
    if (alert.evidenceData) {
      const parsed = JSON.parse(alert.evidenceData);
      formattedEvidence = JSON.stringify(parsed, null, 2);
    }
  } catch {
    formattedEvidence = alert.evidenceData || "";
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(alert.id, selectedStatus, reviewNotes);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-alert-title"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 app-modal-backdrop animate-backdrop-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="app-modal-panel w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-bounce-in flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 shadow-2xs">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 id="review-alert-title" className="text-base font-extrabold text-slate-800">
                {ANOMALY_UI.REVIEW_MODAL.TITLE}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {typeInfo.label} • Mã cảnh báo: #{alert.id.substring(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-extrabold text-sm text-slate-900">{alert.title}</h4>
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap inline-flex items-center justify-center leading-none ${severityStyle.bg}`}
              >
                {severityStyle.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                  {ANOMALY_UI.REVIEW_MODAL.ACTOR_INFO}
                </span>
                <span className="font-bold text-slate-800">
                  {alert.actorUsername || "Hệ thống"} ({alert.actorFullName || "N/A"})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                  {ANOMALY_UI.REVIEW_MODAL.DETECTED_TIME}
                </span>
                <span className="font-bold text-slate-800">
                  {formatDate(alert.detectedAt || alert.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Data Section */}
          {formattedEvidence && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-kv-blue-primary" />
                <span>{ANOMALY_UI.REVIEW_MODAL.EVIDENCE_TITLE}</span>
              </label>
              <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 border border-slate-800 whitespace-pre-wrap">
                {formattedEvidence}
              </pre>
            </div>
          )}

          {/* Review Form */}
          <form id="review-alert-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {ANOMALY_UI.REVIEW_MODAL.STATUS_SELECT_LABEL}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedStatus === ANOMALY_ALERT_STATUSES.REVIEWED
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="review-status"
                    value={ANOMALY_ALERT_STATUSES.REVIEWED}
                    checked={selectedStatus === ANOMALY_ALERT_STATUSES.REVIEWED}
                    onChange={() => setSelectedStatus(ANOMALY_ALERT_STATUSES.REVIEWED)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Đã xác nhận & Xử lý</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedStatus === ANOMALY_ALERT_STATUSES.DISMISSED
                      ? "bg-slate-100 border-slate-300 text-slate-900 font-bold"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="review-status"
                    value={ANOMALY_ALERT_STATUSES.DISMISSED}
                    checked={selectedStatus === ANOMALY_ALERT_STATUSES.DISMISSED}
                    onChange={() => setSelectedStatus(ANOMALY_ALERT_STATUSES.DISMISSED)}
                    className="text-slate-600 focus:ring-slate-500"
                  />
                  <span>Bỏ qua cảnh báo</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {ANOMALY_UI.REVIEW_MODAL.REVIEW_NOTES_LABEL}
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={ANOMALY_UI.REVIEW_MODAL.REVIEW_NOTES_PLACEHOLDER}
                disabled={isSubmitting}
                className="w-full border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary bg-white"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {ANOMALY_UI.REVIEW_MODAL.CLOSE_BTN}
          </button>

          <button
            type="submit"
            form="review-alert-form"
            disabled={isSubmitting}
            className="px-5 py-2 bg-kv-blue-primary hover:bg-kv-blue-dark text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{ANOMALY_UI.REVIEW_MODAL.SAVING_BTN}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{ANOMALY_UI.REVIEW_MODAL.SAVE_BTN}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
