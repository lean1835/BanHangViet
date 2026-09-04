import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Sliders, Save, Loader2 } from "lucide-react";
import {
  ANOMALY_UI,
  ANOMALY_SEVERITIES,
  ANOMALY_SEVERITY_STYLES,
  ANOMALY_ALERT_TYPE_INFO,
  type TAnomalySeverity,
} from "@/constants/anomalyAlert";
import { useNotification } from "@/hooks/useNotification";
import {
  useGetRuleConfigsQuery,
  useUpdateRuleConfigMutation,
} from "../services/anomalyAlertApi";
import type { IAnomalyRuleConfig } from "../types/IAnomalyAlert";

interface AnomalyRuleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnomalyRuleConfigModal: React.FC<AnomalyRuleConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSuccess, showError } = useNotification();
  const { data: rulesData, isLoading } = useGetRuleConfigsQuery(undefined, {
    skip: !isOpen,
  });
  const [updateRule, { isLoading: isSaving }] = useUpdateRuleConfigMutation();

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState<number>(0);
  const [timeWindowMinutes, setTimeWindowMinutes] = useState<number>(10);
  const [severity, setSeverity] = useState<TAnomalySeverity>(ANOMALY_SEVERITIES.CRITICAL);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  if (!isOpen) return null;

  const rules = rulesData?.result || [];

  const handleStartEdit = (rule: IAnomalyRuleConfig) => {
    setEditingRuleId(rule.id);
    setThresholdValue(rule.thresholdValue);
    setTimeWindowMinutes(rule.timeWindowMinutes);
    setSeverity(rule.severity);
    setIsEnabled(rule.isEnabled);
  };

  const handleSaveRule = async (ruleId: string) => {
    if (thresholdValue <= 0) {
      showError("Ngưỡng kích hoạt phải lớn hơn 0!");
      return;
    }
    if (timeWindowMinutes < 1) {
      showError("Khung thời gian tối thiểu là 1 phút!");
      return;
    }

    try {
      await updateRule({
        id: ruleId,
        body: {
          thresholdValue: Number(thresholdValue),
          timeWindowMinutes: Number(timeWindowMinutes),
          severity,
          isEnabled,
        },
      }).unwrap();

      showSuccess("Cập nhật quy tắc cảnh báo thành công!");
      setEditingRuleId(null);
    } catch {
      showError("Không thể cập nhật quy tắc. Vui lòng thử lại!");
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-config-title"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 app-modal-backdrop animate-backdrop-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="app-modal-panel w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-bounce-in flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-kv-blue-primary shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 id="rules-config-title" className="text-base font-extrabold text-slate-800">
                {ANOMALY_UI.RULES_MODAL.TITLE}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {ANOMALY_UI.RULES_MODAL.SUBTITLE}
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
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 text-kv-blue-primary animate-spin" />
              <p className="font-bold text-sm text-slate-700">Đang nạp cấu hình các quy tắc...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              Chưa có quy tắc nào được khởi tạo.
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((r) => {
                const isEditing = editingRuleId === r.id;
                const typeInfo = ANOMALY_ALERT_TYPE_INFO[r.ruleType] || {
                  label: r.ruleName,
                  description: "",
                  unit: "đơn vị",
                };
                const severityStyle = ANOMALY_SEVERITY_STYLES[r.severity];

                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isEditing
                        ? "bg-blue-50/40 border-kv-blue-primary/40 shadow-xs"
                        : "bg-slate-50/70 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs">{typeInfo.label}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center justify-center leading-none ${severityStyle?.bg}`}
                          >
                            {severityStyle?.label || r.severity}
                          </span>
                          {!r.isEnabled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 whitespace-nowrap inline-flex items-center justify-center leading-none">
                              Đang tắt
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {typeInfo.description}
                        </p>
                      </div>

                      {!isEditing ? (
                        <button
                          onClick={() => handleStartEdit(r)}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
                        >
                          Chỉnh sửa
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingRuleId(null)}
                            disabled={isSaving}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleSaveRule(r.id)}
                            disabled={isSaving}
                            className="px-3 py-1 bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {isSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>Lưu</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/80">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                            Ngưỡng kích hoạt ({typeInfo.unit}):
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={thresholdValue}
                            onChange={(e) => setThresholdValue(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                            Khung thời gian (phút):
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={timeWindowMinutes}
                            onChange={(e) => setTimeWindowMinutes(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                            Mức độ nghiêm trọng:
                          </label>
                          <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value as TAnomalySeverity)}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white"
                          >
                            {Object.entries(ANOMALY_SEVERITY_STYLES).map(([val, item]) => (
                              <option key={val} value={val}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 cursor-pointer pb-2">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => setIsEnabled(e.target.checked)}
                              className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4"
                            />
                            <span className="font-bold text-xs text-slate-800">Kích hoạt quy tắc</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-[11px] text-slate-600 font-semibold pt-1">
                        <span>
                          Ngưỡng: <strong>{r.thresholdValue} {typeInfo.unit}</strong>
                        </span>
                        <span>
                          Khung thời gian: <strong>{r.timeWindowMinutes} phút</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            {ANOMALY_UI.RULES_MODAL.CLOSE_BTN}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
