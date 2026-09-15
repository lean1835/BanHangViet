import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Sliders, ShieldAlert, Check, Loader2 } from "lucide-react";
import { useUpdateWarningThresholdMutation } from "../services/annualRevenueApi";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { warningThresholdSchema } from "../schemas/periodLockSchemas";

interface WarningThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPercentage: number;
  isOwner: boolean;
  onSuccess?: () => void;
}

const formatCurrency = (val: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(val);

const QUICK_OPTIONS = [60, 70, 75, 80, 85, 90];

export const WarningThresholdConfigModal: React.FC<
  WarningThresholdConfigModalProps
> = ({ isOpen, onClose, currentPercentage, isOwner, onSuccess }) => {
  const [percentageInput, setPercentageInput] = useState<string>(
    currentPercentage ? currentPercentage.toString() : "80"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [updateThreshold, { isLoading }] = useUpdateWarningThresholdMutation();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      setPercentageInput(currentPercentage ? currentPercentage.toString() : "80");
      setErrorMsg(null);
    }
  }, [isOpen, currentPercentage]);

  // Hỗ trợ đóng modal bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const numericValue = parseFloat(percentageInput) || 0;
  const calculatedAmount = (numericValue / 100) * 1_000_000_000;

  const handleQuickSelect = (val: number) => {
    if (!isOwner) return;
    setPercentageInput(val.toString());
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setErrorMsg("Chỉ Chủ hộ kinh doanh mới có quyền thay đổi cấu hình này.");
      return;
    }

    const parseResult = warningThresholdSchema.safeParse({
      warningThresholdPercentage: percentageInput,
    });
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      setErrorMsg(issue?.message || "Tỷ lệ cảnh báo hợp lệ phải từ 50.0% đến 99.0%.");
      return;
    }

    const val = parseResult.data.warningThresholdPercentage;

    try {
      await updateThreshold({
        warningThresholdPercentage: Math.round(val * 100) / 100,
      }).unwrap();

      showSuccess(
        `Đã cập nhật mức cảnh báo ngưỡng doanh thu năm thành ${val.toFixed(1)}% (${formatCurrency(
          (val / 100) * 1_000_000_000
        )}).`
      );
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Không thể cập nhật mức cảnh báo.");
      showError(msg);
      setErrorMsg(msg);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="warning-threshold-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden transition-all animate-modal-scale">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shadow-2xs border border-blue-100/60">
              <Sliders className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3
                id="warning-threshold-modal-title"
                className="text-sm font-extrabold text-slate-800"
              >
                Cấu hình mức cảnh báo ngưỡng
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Ngưỡng bắt buộc pháp lý: 1.000.000.000 đ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          {!isOwner && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Bạn đang đăng nhập với quyền Kế toán. Theo quy tắc nghiệp vụ, chỉ Chủ hộ (VT-01) mới có quyền chỉnh sửa tỷ lệ cảnh báo.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="threshold-percentage-input"
              className="text-xs font-bold text-slate-700 block"
            >
              Tỷ lệ phần trăm cảnh báo (%):
            </label>
            <div className="relative">
              <input
                id="threshold-percentage-input"
                type="number"
                step="0.5"
                min="50"
                max="99"
                disabled={!isOwner || isLoading}
                value={percentageInput}
                onChange={(e) => {
                  setPercentageInput(e.target.value);
                  setErrorMsg(null);
                }}
                className={`w-full h-11 px-4 pr-12 rounded-xl border text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400 transition-all ${
                  errorMsg
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-300"
                }`}
                placeholder="Nhập từ 50 đến 99"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                %
              </span>
            </div>
            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Chọn nhanh */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              Chọn nhanh tỷ lệ phổ biến:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_OPTIONS.map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={!isOwner || isLoading}
                  onClick={() => handleQuickSelect(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    numericValue === val
                      ? "bg-blue-600 text-white shadow-xs shadow-blue-600/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Preview Giá trị tiền kích hoạt cảnh báo */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/80 space-y-1">
            <span className="text-[11px] font-medium text-blue-700 block">
              Mức doanh thu lũy kế sẽ kích hoạt cảnh báo:
            </span>
            <div className="text-lg font-black text-blue-950">
              {formatCurrency(calculatedAmount)}
            </div>
            <p className="text-[10px] text-blue-600/90 leading-tight">
              Khi tổng doanh thu trước thuế của các hóa đơn đã cấp mã từ 01/01 chạm mức này, hệ thống sẽ đẩy thông báo cảnh báo và hướng dẫn vào Trung tâm thông báo.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Đóng
            </button>
            {isOwner && (
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:bg-blue-800 transition-all shadow-xs shadow-blue-600/20 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Lưu cấu hình</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
