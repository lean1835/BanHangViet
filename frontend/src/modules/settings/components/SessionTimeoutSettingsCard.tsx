import React, { useState, useEffect } from "react";
import { Clock, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  useGetSessionSettingsQuery,
  useUpdateSessionSettingsMutation,
} from "../services/sessionApi";

const TIMEOUT_PRESETS = [
  { label: "15 phút", value: 15 },
  { label: "30 phút", value: 30 },
  { label: "1 giờ", value: 60 },
  { label: "4 giờ", value: 240 },
  { label: "8 giờ", value: 480 },
  { label: "24 giờ", value: 1440 },
];

export const SessionTimeoutSettingsCard: React.FC = () => {
  const { data, isLoading: isFetching } = useGetSessionSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSessionSettingsMutation();

  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(60);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (data?.result?.sessionTimeoutMinutes) {
      setTimeoutMinutes(data.result.sessionTimeoutMinutes);
    }
  }, [data]);

  const handleSave = async () => {
    if (timeoutMinutes < 5 || timeoutMinutes > 1440) {
      setFeedback({
        type: "error",
        message: "Thời gian chờ phải từ 5 phút đến 1440 phút (24 giờ)",
      });
      return;
    }

    try {
      await updateSettings({ sessionTimeoutMinutes: timeoutMinutes }).unwrap();
      setFeedback({
        type: "success",
        message: "Đã lưu cài đặt thời gian hết hạn phiên thành công!",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({
        type: "error",
        message: "Không thể lưu cài đặt. Vui lòng thử lại sau.",
      });
    }
  };

  const formatHours = (minutes: number) => {
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-kv-blue-primary flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Thời gian tự động hết hạn phiên không hoạt động
            </h3>
            <p className="text-xs text-slate-500">
              Tự động đăng xuất thiết bị nếu không có bất kỳ thao tác nào sau khoảng thời gian này
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isUpdating || isFetching}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-kv-blue-primary hover:bg-kv-blue-dark active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Lưu cấu hình</span>
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">Chọn nhanh:</span>
        {TIMEOUT_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setTimeoutMinutes(p.value)}
            className={`px-3 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
              timeoutMinutes === p.value
                ? "bg-kv-blue-primary text-white border-kv-blue-primary font-bold shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Slider and Manual Input */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex-1">
          <input
            type="range"
            min={5}
            max={1440}
            step={5}
            value={timeoutMinutes}
            onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-kv-blue-primary"
            aria-label="Thời gian tự hết hạn phiên"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Tối thiểu: 5 phút</span>
            <span>Tối đa: 24 giờ (1440 phút)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            min={5}
            max={1440}
            value={timeoutMinutes}
            onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
            className="w-20 px-2.5 py-1.5 text-xs text-center font-bold text-slate-800 rounded-lg border border-slate-300 focus:border-kv-blue-primary focus:ring-1 focus:ring-kv-blue-primary outline-none"
          />
          <span className="text-xs font-bold text-kv-blue-primary min-w-[70px]">
            ({formatHours(timeoutMinutes)})
          </span>
        </div>
      </div>
    </div>
  );
};
