import React, { useState, useEffect } from "react";
import {
  Type,
  Maximize2,
  CheckCircle2,
  Sparkles,
  Save,
  RotateCcw,
  Sliders,
  Eye,
  ShieldAlert,
} from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import { useAppSelector } from "@/hooks/useRedux";
import { applyDisplaySettingsToDom } from "@/stores/displaySettingsSlice";
import {
  useGetDisplaySettingsQuery,
  useUpdateDisplaySettingsMutation,
  useToggleSimpleModeMutation,
} from "../services/displaySettingApi";
import type {
  TButtonSizeLevel,
  TFontSizeLevel,
  IUpdateUserDisplaySettingRequest,
} from "../types/IDisplaySetting";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

export const DisplaySettingsPanel: React.FC = () => {
  const { showSuccess, showError } = useNotification();

  const { data: displayResponse, isLoading } = useGetDisplaySettingsQuery();
  const [updateDisplaySettings, { isLoading: isUpdating }] =
    useUpdateDisplaySettingsMutation();
  const [toggleSimpleMode, { isLoading: isToggling }] =
    useToggleSimpleModeMutation();

  const setting = displayResponse?.result;

  // Local form state
  const [simpleModeEnabled, setSimpleModeEnabled] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<TFontSizeLevel>("STANDARD");
  const [buttonSizeLevel, setButtonSizeLevel] =
    useState<TButtonSizeLevel>("STANDARD");
  const [showTextLabels, setShowTextLabels] = useState(true);
  const [requireConfirmationDialog, setRequireConfirmationDialog] =
    useState(true);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [simplifiedPosLayout, setSimplifiedPosLayout] = useState(true);

  // Sync state from server data
  useEffect(() => {
    if (setting) {
      const isSimple = Boolean(setting.simpleModeEnabled);
      setSimpleModeEnabled(isSimple);
      setFontSizeLevel(isSimple ? (setting.fontSizeLevel || "LARGE") : "STANDARD");
      setButtonSizeLevel(isSimple ? (setting.buttonSizeLevel || "LARGE") : "STANDARD");
      setShowTextLabels(setting.showTextLabels ?? true);
      setRequireConfirmationDialog(setting.requireConfirmationDialog ?? true);
      setHighContrastEnabled(Boolean(setting.highContrastEnabled));
      setSimplifiedPosLayout(setting.simplifiedPosLayout ?? true);
    }
  }, [setting]);

  // Quick toggle simple mode
  const handleQuickToggleSimpleMode = async (enabled: boolean) => {
    try {
      const res = await toggleSimpleMode({ enabled }).unwrap();
      if (res?.result) {
        setSimpleModeEnabled(res.result.simpleModeEnabled);
        setFontSizeLevel(res.result.fontSizeLevel);
        setButtonSizeLevel(res.result.buttonSizeLevel);
        setShowTextLabels(res.result.showTextLabels);
        setRequireConfirmationDialog(res.result.requireConfirmationDialog);
        setSimplifiedPosLayout(res.result.simplifiedPosLayout);
      }
      showSuccess(
        enabled
          ? "Đã bật chế độ chữ lớn và thao tác đơn giản!"
          : "Đã chuyển về chế độ hiển thị tiêu chuẩn."
      );
    } catch (err: unknown) {
      showError(
        getApiErrorMessage(err, "Không thể chuyển đổi chế độ hiển thị.")
      );
    }
  };

  // Full save configuration
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: IUpdateUserDisplaySettingRequest = {
        simpleModeEnabled,
        fontSizeLevel,
        buttonSizeLevel,
        showTextLabels,
        requireConfirmationDialog,
        highContrastEnabled,
        simplifiedPosLayout,
      };

      await updateDisplaySettings(payload).unwrap();
      showSuccess("Đã lưu cấu hình hiển thị cá nhân thành công!");
    } catch (err: unknown) {
      showError(
        getApiErrorMessage(err, "Không thể lưu cấu hình hiển thị cá nhân.")
      );
    }
  };

  const currentReduxSettings = useAppSelector((state) => state.displaySettings);

  const handleSelectFontSize = (level: TFontSizeLevel) => {
    setFontSizeLevel(level);
    const targetSimple = level !== "STANDARD";
    setSimpleModeEnabled(targetSimple);

    // Live preview: Áp dụng tức thì lên toàn màn hình để người dùng thấy ngay hiệu quả
    applyDisplaySettingsToDom({
      ...currentReduxSettings,
      simpleModeEnabled: targetSimple,
      fontSizeLevel: level,
      buttonSizeLevel:
        targetSimple && buttonSizeLevel === "STANDARD"
          ? "LARGE"
          : buttonSizeLevel,
      highContrastEnabled,
    });
    if (targetSimple && buttonSizeLevel === "STANDARD") {
      setButtonSizeLevel("LARGE");
    }
  };

  const handleSelectButtonSize = (level: TButtonSizeLevel) => {
    setButtonSizeLevel(level);
    const targetSimple = level !== "STANDARD" || fontSizeLevel !== "STANDARD";

    // Live preview: Áp dụng kích thước nút bấm tức thì
    applyDisplaySettingsToDom({
      ...currentReduxSettings,
      simpleModeEnabled: targetSimple,
      fontSizeLevel,
      buttonSizeLevel: level,
      highContrastEnabled,
    });
  };

  const handleResetToDefault = () => {
    setSimpleModeEnabled(false);
    setFontSizeLevel("STANDARD");
    setButtonSizeLevel("STANDARD");
    setShowTextLabels(true);
    setRequireConfirmationDialog(true);
    setHighContrastEnabled(false);
    setSimplifiedPosLayout(true);

    applyDisplaySettingsToDom({
      ...currentReduxSettings,
      simpleModeEnabled: false,
      fontSizeLevel: "STANDARD",
      buttonSizeLevel: "STANDARD",
      highContrastEnabled: false,
    });
  };

  return (
    <form
      onSubmit={handleSaveSettings}
      className="flex flex-col flex-1 w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 min-h-[580px] justify-between animate-auth-fade-in"
    >
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-50 text-kv-blue-primary border border-blue-200/80 mb-1">
              <Sparkles size={13} />
              <span>NCL-19-CN-001 • Trải nghiệm người dùng lớn tuổi</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-800">
              Chế độ hiển thị chữ lớn & Thao tác đơn giản
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cài đặt được lưu đồng bộ theo tài khoản, giúp chủ hộ lớn tuổi nhìn
              rõ, thao tác tự tin và tránh ấn nhầm
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs self-start sm:self-auto bg-slate-50 text-slate-700 border-slate-200">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                simpleModeEnabled
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-slate-400"
              }`}
            />
            <span>
              {simpleModeEnabled
                ? "Đang bật chế độ đơn giản"
                : "Chế độ tiêu chuẩn"}
            </span>
          </div>
        </div>

        {/* Master Switch: Chế độ đơn giản & Chữ lớn */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Eye size={22} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                Kích hoạt chế độ chữ lớn & thao tác đơn giản
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                Tự động nâng cỡ chữ, mở rộng diện tích phím bấm, thu gọn màn hình
                bán hàng vào 4 nút chính và bật cảnh báo xác nhận hậu quả khi thao
                tác một chiều.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <button
              type="button"
              disabled={isToggling || isLoading}
              onClick={() => handleQuickToggleSimpleMode(!simpleModeEnabled)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                simpleModeEnabled ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                  simpleModeEnabled ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Cấu hình chi tiết: Cỡ chữ & Kích thước nút */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card: Cỡ chữ (Font Size Level) */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-700 mb-1">
                <Type size={16} className="text-kv-blue-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Mức cỡ chữ hiển thị (Font Size)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Điều chỉnh kích thước phông chữ toàn hệ thống để mắt nhìn rõ số
                tiền và tên mặt hàng
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    level: "STANDARD" as TFontSizeLevel,
                    label: "Tiêu chuẩn",
                    desc: "14px • 100%",
                  },
                  {
                    level: "LARGE" as TFontSizeLevel,
                    label: "Lớn (Khuyên dùng)",
                    desc: "18px • 125%",
                  },
                  {
                    level: "EXTRA_LARGE" as TFontSizeLevel,
                    label: "Rất lớn",
                    desc: "22px • 150%",
                  },
                ].map((opt) => {
                  const isSelected = fontSizeLevel === opt.level;
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => handleSelectFontSize(opt.level)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                        isSelected
                          ? "bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/40 text-blue-900 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 size={14} className="text-blue-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Cỡ chữ */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Xem trước cỡ chữ:
              </span>
              <div
                style={{
                  fontSize:
                    fontSizeLevel === "EXTRA_LARGE"
                      ? "22px"
                      : fontSizeLevel === "LARGE"
                      ? "18px"
                      : "14px",
                  lineHeight: "1.3",
                }}
                className="font-extrabold text-slate-900"
              >
                Gạo thơm Lài Miên: 185.000 đ
              </div>
            </div>
          </div>

          {/* Card: Kích thước nút bấm (Button Size / Touch Target) */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-700 mb-1">
                <Maximize2 size={16} className="text-kv-blue-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Kích thước nút bấm (Touch Target)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Mở rộng chiều cao phím bấm cảm ứng để tránh bấm trượt hoặc ấn
                nhầm nút
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    level: "STANDARD" as TButtonSizeLevel,
                    label: "Tiêu chuẩn",
                    desc: "Cao 40px",
                  },
                  {
                    level: "LARGE" as TButtonSizeLevel,
                    label: "Lớn (52px)",
                    desc: "Chạm dễ dàng",
                  },
                  {
                    level: "EXTRA_LARGE" as TButtonSizeLevel,
                    label: "Rất lớn (64px)",
                    desc: "Chạm siêu to",
                  },
                ].map((opt) => {
                  const isSelected = buttonSizeLevel === opt.level;
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => handleSelectButtonSize(opt.level)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                        isSelected
                          ? "bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/40 text-blue-900 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 size={14} className="text-blue-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Nút bấm */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2 justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Xem trước nút bấm:
              </span>
              <div
                style={{
                  minHeight:
                    buttonSizeLevel === "EXTRA_LARGE"
                      ? "64px"
                      : buttonSizeLevel === "LARGE"
                      ? "52px"
                      : "40px",
                }}
                className="inline-flex items-center justify-center px-4 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Thanh toán (F9)
              </div>
            </div>
          </div>
        </div>

        {/* Nhóm tùy chọn trợ năng nâng cao */}
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-slate-700 mb-1">
            <Sliders size={16} className="text-kv-blue-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Tùy chọn thao tác và trợ năng chuyên biệt
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Tùy chọn 1: Hiển thị nhãn chữ */}
            <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={showTextLabels}
                onChange={(e) => setShowTextLabels(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">
                  Hiển thị nhãn chữ trên các nút hành động
                </span>
                <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                  Bắt buộc hiển thị tên thao tác bằng chữ đi kèm biểu tượng (tránh
                  người dùng nhìn mỗi icon không hiểu nghĩa).
                </span>
              </div>
            </label>

            {/* Tùy chọn 2: Bước xác nhận hậu quả */}
            <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={requireConfirmationDialog}
                onChange={(e) => setRequireConfirmationDialog(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                  <span>Xác nhận nêu rõ hậu quả thao tác một chiều</span>
                  <ShieldAlert size={14} className="text-rose-500" />
                </span>
                <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                  Khi bấm Hủy đơn hoặc Hủy hóa đơn, hiện bảng phân tích hậu quả
                  thực tế từ máy chủ trước khi thực hiện (TC-03).
                </span>
              </div>
            </label>

            {/* Tùy chọn 3: Chế độ tương phản cao */}
            <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={highContrastEnabled}
                onChange={(e) => setHighContrastEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">
                  Chế độ tương phản cao (High Contrast)
                </span>
                <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                  Tăng độ đậm của đường viền, phân biệt rõ các ô nhập liệu và bảng
                  sản phẩm giúp người mắt kém dễ nhận biết.
                </span>
              </div>
            </label>

            {/* Tùy chọn 4: Bố cục POS rút gọn */}
            <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={simplifiedPosLayout}
                onChange={(e) => setSimplifiedPosLayout(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">
                  Bố cục rút gọn màn hình POS
                </span>
                <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                  Chỉ giữ 4 nút chính (Tìm hàng, Thêm hàng, Thanh toán, Xuất hóa
                  đơn); các chức năng phụ được thu vào mục Xem thêm.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Action Bar (Lưu & Khôi phục) */}
      <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleResetToDefault}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Đặt lại chuẩn</span>
        </button>

        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex items-center gap-2 bg-kv-blue-primary hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Save size={15} />
          <span>{isUpdating ? "Đang lưu..." : "Lưu cấu hình hiển thị"}</span>
        </button>
      </div>
    </form>
  );
};

export default DisplaySettingsPanel;
