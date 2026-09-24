import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
// Native SVG Icons
interface SvgIconProps {
  size?: number;
  className?: string;
}

const SparklesIcon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
  </svg>
);

const CheckCircle2Icon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ArrowRightIcon: React.FC<SvgIconProps> = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const XIcon: React.FC<SvgIconProps> = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const StoreIcon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
  </svg>
);

const FileCheck2Icon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m3 15 2 2 4-4" />
  </svg>
);

const PercentIcon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const PackageIcon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m16.5 9.4-9-5.19" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const UsersIcon: React.FC<SvgIconProps> = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckIcon: React.FC<SvgIconProps> = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);


const ShoppingBagIcon: React.FC<SvgIconProps> = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

import { useSetupGuide } from "../hooks/useSetupGuide";
import { type SetupStepKey } from "../types/ISetupGuide";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { APP_ROUTES } from "@/constants/routes";

interface FirstTimeSetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_ICONS: Record<SetupStepKey, React.ReactNode> = {
  HOUSEHOLD_INFO: <StoreIcon size={20} />,
  INVOICE_TEMPLATE: <FileCheck2Icon size={20} />,
  TAX_RATE: <PercentIcon size={20} />,
  INITIAL_PRODUCT: <PackageIcon size={20} />,
  EMPLOYEE_ACCOUNT: <UsersIcon size={20} />,
};

export const FirstTimeSetupWizardModal: React.FC<FirstTimeSetupWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const dialogRef = useAccessibleDialog({ isOpen, onClose });

  const {
    progress,
    steps,
    isReadyForInvoice,
    skipStep,
    unskipStep,
    skipGuideAsync,
    completeGuideAsync,
    markModalAutoOpened,
  } = useSetupGuide();

  if (!isOpen) return null;

  const completedOrSkipped = progress.completedRequired + (progress.skippedRequired || 0);
  const percentCompleted = Math.min(
    100,
    Math.round((completedOrSkipped / Math.max(progress.totalRequired, 1)) * 100)
  );

  const handleStepClick = (path: string) => {
    markModalAutoOpened();
    onClose();
    navigate(path);
  };

  const handleSkip = () => {
    skipGuideAsync();
    markModalAutoOpened();
    onClose();
  };

  const handleSkipAll = () => {
    skipGuideAsync();
    markModalAutoOpened();
    onClose();
  };

  const handleClose = () => {
    markModalAutoOpened();
    onClose();
  };

  const handleGoToPos = () => {
    if (isReadyForInvoice) {
      completeGuideAsync();
    }
    markModalAutoOpened();
    onClose();
    navigate(APP_ROUTES.POS);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-wizard-title"
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kv-blue-primary text-white shadow-md shadow-blue-500/20">
                <SparklesIcon size={20} />
              </div>
              <div>
                <h2
                  id="setup-wizard-title"
                  className="text-base font-bold text-slate-800 flex items-center gap-2"
                >
                  Trình hướng dẫn thiết lập cửa hàng
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-kv-blue-primary">
                    Lần đầu đăng nhập
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hoàn thành 4 bước cấu hình bắt buộc để cửa hàng đủ điều kiện phát hành hóa đơn điện tử hợp lệ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <XIcon size={18} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
              <span className="text-slate-700">
                Tiến độ: {completedOrSkipped}/{progress.totalRequired} bước bắt buộc
              </span>
              <span
                className={
                  isReadyForInvoice ? "text-emerald-600" : "text-kv-blue-primary"
                }
              >
                {percentCompleted}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isReadyForInvoice
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-kv-blue-primary to-blue-400"
                }`}
                style={{ width: `${percentCompleted}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modal Body - Step list */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {/* Success Banner if all 4 required steps completed or skipped */}
          {isReadyForInvoice && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 animate-fade-in">
              <CheckCircle2Icon size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs flex-1">
                <p className="font-bold text-emerald-950 text-sm mb-0.5">
                  🎉 Chúc mừng! Cửa hàng đã sẵn sàng phát hành hóa đơn!
                </p>
                <p className="text-emerald-800">
                  Tất cả các điều kiện bắt buộc (Thông tin hộ, Ký hiệu mẫu số QTN-02, Thuế suất QTN-17 và Danh mục hàng) đã hoàn tất. Bạn có thể bắt đầu tạo đơn và xuất hóa đơn ngay.
                </p>
                <button
                  type="button"
                  onClick={handleGoToPos}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <ShoppingBagIcon size={14} />
                  Vào quầy bán hàng (POS) ngay
                </button>
              </div>
            </div>
          )}

          {/* List of 5 steps */}
          {steps.map((step) => {
            const isCompleted = step.isCompleted;
            const isSkipped = step.isSkipped;
            const isRequired = step.isRequired;

            return (
              <div
                key={step.key}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? "bg-emerald-50/40 border-emerald-200"
                    : isSkipped
                    ? "bg-slate-50/70 border-slate-200 opacity-85 hover:opacity-100"
                    : isRequired
                    ? "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs"
                    : "bg-slate-50/60 border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : isSkipped
                        ? "bg-slate-200 text-slate-500"
                        : isRequired
                        ? "bg-blue-100 text-kv-blue-primary"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isCompleted ? <CheckIcon size={18} /> : STEP_ICONS[step.key]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">
                        Bước {step.stepNumber}: {step.title}
                      </span>
                      {isRequired ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-700"
                              : isSkipped
                              ? "bg-slate-200 text-slate-600"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isCompleted ? "ĐÃ XONG" : isSkipped ? "ĐÃ BỎ QUA" : "BẮT BUỘC"}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-700"
                              : isSkipped
                              ? "bg-slate-200 text-slate-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isCompleted ? "ĐÃ XONG" : isSkipped ? "ĐÃ BỎ QUA" : "TÙY CHỌN"}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>

                    <p className="text-[11px] text-slate-400 italic">
                      {step.whyImportant}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleStepClick(step.routePath)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs ${
                      isCompleted
                        ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        : isSkipped
                        ? "bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200"
                        : "bg-kv-blue-primary text-white hover:bg-kv-blue-dark"
                    }`}
                  >
                    {isCompleted ? "Xem lại" : isSkipped ? "Khai báo lại" : step.actionLabel}
                    <ArrowRightIcon size={12} />
                  </button>

                  {!isCompleted && (
                    isSkipped ? (
                      <button
                        type="button"
                        onClick={() => unskipStep(step.key)}
                        className="text-[11px] font-semibold text-kv-blue-primary hover:underline transition-colors cursor-pointer"
                      >
                        Khôi phục bước
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => skipStep(step.key)}
                        className="text-[11px] font-medium text-slate-500 hover:text-amber-700 hover:bg-slate-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        Bỏ qua bước này
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-normal">
              Các bước bắt buộc cần hoàn thiện để đảm bảo hóa đơn điện tử hợp lệ
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {!isReadyForInvoice && (
              <>
                <button
                  type="button"
                  onClick={handleSkipAll}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Bỏ qua tất cả các bước và ẩn hoàn toàn hướng dẫn này"
                >
                  Bỏ qua tất cả
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                  title="Đóng bảng để vào bán hàng ngay"
                >
                  Bỏ qua để vào bán ngay
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
