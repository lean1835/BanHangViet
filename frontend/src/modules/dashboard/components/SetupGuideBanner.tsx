import React, { useState } from "react";

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
import { useSetupGuide } from "@/modules/settings/hooks/useSetupGuide";
import { FirstTimeSetupWizardModal } from "@/modules/settings/components/FirstTimeSetupWizardModal";

export const SetupGuideBanner: React.FC = () => {
  const { progress, isReadyForInvoice, isDismissed } = useSetupGuide();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const percentCompleted = Math.round(
    (progress.completedRequired / Math.max(progress.totalRequired, 1)) * 100
  );

  // Sau khi hoàn thành tất cả các bước bắt buộc hoặc đã bỏ qua, tự động ẩn trình hướng dẫn
  if (isReadyForInvoice || isDismissed) {
    return null;
  }

  const missingStepsCount = progress.totalRequired - progress.completedRequired;

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/50 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-xs hover:shadow-sm border border-blue-200/90 transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left Section: Compact Icon + Title + Description */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-kv-blue-primary text-white shadow-2xs">
              <SparklesIcon size={18} className="text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-slate-800">
                  Trình hướng dẫn thiết lập cửa hàng
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs tracking-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-kv-orange animate-pulse" />
                  Còn thiếu {missingStepsCount} bước bắt buộc
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 font-normal leading-normal mt-0.5">
                Hoàn thành các bước để kích hoạt xuất hóa đơn điện tử hợp lệ theo quy định Cơ quan Thuế
              </p>
            </div>
          </div>

          {/* Right Section: Compact Progress + Action Button */}
          <div className="flex items-center gap-3.5 sm:gap-4 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-100">
            {/* Progress Display */}
            <div className="flex flex-col items-start sm:items-end justify-center">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="hidden md:inline">Tiến độ:</span>
                <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                  {progress.completedRequired}/{progress.totalRequired} bước ({percentCompleted}%)
                </span>
              </div>
              {/* Mini progress bar track */}
              <div className="w-20 sm:w-24 h-1.5 bg-blue-100/80 rounded-full overflow-hidden p-0.5 border border-blue-200/70 mt-1">
                <div
                  className="h-full bg-gradient-to-r from-kv-blue-primary to-indigo-600 rounded-full transition-all duration-300 shadow-2xs"
                  style={{ width: `${percentCompleted}%` }}
                />
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 rounded-lg shadow-xs hover:shadow transition-all duration-150 shrink-0 group cursor-pointer"
            >
              <span>Tiếp tục thiết lập</span>
              <ArrowRightIcon
                size={13}
                className="text-white transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>
      </div>

      <FirstTimeSetupWizardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
