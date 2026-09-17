import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useCurrentScreenGuide } from "../hooks/useCurrentScreenGuide";
import { useScreenGuideTracking } from "../hooks/useScreenGuideTracking";
import { getModuleGroupForScreen } from "../data/moduleGroups";

export const ScreenGuideDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    isOpen,
    activeScreenCode,
    currentStepIndex,
    isHighlightEnabled,
    openGuide,
    closeGuide,
    nextStep,
    prevStep,
    goToStep,
    toggleHighlight,
    openDirectory,
    guide,
    isLoading,
    isError,
  } = useCurrentScreenGuide();

  const { markCompleted } = useScreenGuideTracking({
    screenCode: activeScreenCode,
    isOpen,
  });

  const steps = guide?.steps || [];
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  // Tìm phân hệ chứa màn hình hiện tại (để hiển thị các tab con)
  const currentGroup = guide ? getModuleGroupForScreen(guide.screenCode) : null;

  // Lắng nghe phím ESC hoặc phím mũi tên Trái / Phải để chuyển bước tiện lợi
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeGuide();
      } else if (e.key === "ArrowRight") {
        if (!isLastStep) nextStep(totalSteps);
      } else if (e.key === "ArrowLeft") {
        if (!isFirstStep) prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLastStep, isFirstStep, totalSteps, nextStep, prevStep, closeGuide]);

  if (!isOpen) {
    return null;
  }

  const handleFinish = () => {
    markCompleted();
    closeGuide();
  };

  const handleOpenTargetScreen = () => {
    if (guide?.actionUrl) {
      navigate(guide.actionUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Nền mờ bấm vào để đóng */}
      <div
        className="fixed inset-0"
        onClick={closeGuide}
        aria-hidden="true"
      />

      {/* Drawer Panel trượt từ phải sang */}
      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:max-w-lg border-l border-slate-200 animate-in slide-in-from-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="screen-guide-title"
      >
        {/* Header Drawer */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3.5 text-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Hướng dẫn tại chỗ
                </span>
                {guide?.targetRole && guide.targetRole !== "ALL" && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/60">
                    {guide.targetRole}
                  </span>
                )}
              </div>
              <h2
                id="screen-guide-title"
                className="truncate text-base font-bold text-slate-900"
              >
                {guide?.screenName || "Hướng dẫn sử dụng"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Nút bật/tắt highlight phần tử */}
            {guide && totalSteps > 0 && (
              <button
                type="button"
                onClick={toggleHighlight}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isHighlightEnabled
                    ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs hover:bg-amber-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200/70 hover:bg-slate-200/80 hover:text-slate-800"
                }`}
                title={
                  isHighlightEnabled
                    ? "Đang bật vòng sáng chỉ vị trí nút bấm (Bấm để tắt)"
                    : "Bật vòng sáng chỉ vị trí nút bấm trên màn hình"
                }
                aria-label="Chuyển chế độ làm nổi bật nút bấm"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            )}

            {/* Nút mở danh bạ tất cả hướng dẫn */}
            <button
              type="button"
              onClick={openDirectory}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200/70 hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
              title="Tra cứu tất cả hướng dẫn hệ thống"
              aria-label="Danh bạ hướng dẫn"
            >
              <BookOpen className="h-4 w-4" />
            </button>

            {/* Nút đóng Drawer */}
            <button
              type="button"
              onClick={closeGuide}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200/70 hover:bg-slate-200/80 hover:text-slate-800 active:scale-95 transition-all cursor-pointer"
              title="Đóng hướng dẫn (ESC)"
              aria-label="Đóng hướng dẫn"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thanh chuyển nhanh các tab nhỏ trong phân hệ (Sub-tabs Navigation) */}
        {currentGroup && currentGroup.tabs.length > 1 && (
          <div className="shrink-0 border-b border-slate-200/70 bg-slate-50/70 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-0.5">
                Mục:
              </span>
              {currentGroup.tabs.map((tab) => {
                const isActive = tab.screenCode === guide?.screenCode;
                return (
                  <button
                    key={tab.screenCode}
                    type="button"
                    onClick={() => openGuide(tab.screenCode)}
                    aria-label={`Xem hướng dẫn: ${tab.tabName}`}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs transition-all cursor-pointer select-none whitespace-nowrap ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 font-medium"
                    }`}
                    title={`Xem hướng dẫn: ${tab.tabName}`}
                  >
                    {tab.tabName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nội dung chính Drawer */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {isLoading && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Đang tải nội dung hướng dẫn...</p>
            </div>
          )}

          {isError && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/50 p-6 text-center text-rose-700">
              <AlertTriangle className="h-10 w-10 text-rose-500" />
              <h3 className="text-base font-bold">Chưa có hướng dẫn cho màn hình này</h3>
              <p className="text-xs text-rose-600 leading-relaxed max-w-xs font-normal">
                Màn hình này hiện chưa được cấu hình hướng dẫn tại chỗ hoặc bạn chưa có quyền truy cập theo vai trò.
              </p>
              <button
                type="button"
                onClick={openDirectory}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
              >
                <BookOpen className="h-4 w-4" />
                <span>Xem danh sách hướng dẫn khác</span>
              </button>
            </div>
          )}

          {/* Trạng thái không có guide hoặc chưa có bước hướng dẫn */}
          {!isLoading && !isError && (!guide || totalSteps === 0) && (
            <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 text-center text-slate-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Chưa có hướng dẫn cho màn hình này
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs font-normal">
                Màn hình này hiện chưa có bài hướng dẫn thao tác tại chỗ. Bạn có thể tra cứu các bài hướng dẫn có sẵn từ danh mục.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={openDirectory}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Xem danh mục hướng dẫn</span>
                </button>
                <button
                  type="button"
                  onClick={closeGuide}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Đóng lại</span>
                </button>
              </div>
            </div>
          )}

          {guide && totalSteps > 0 && currentStep && (
            <div className="space-y-4">
              {/* Stepper Navigation: Dạng Segmented Control siêu gọn */}
              <nav aria-label="Các bước hướng dẫn" className="my-1">
                <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                  {steps.map((step, idx) => {
                    const isActive = idx === currentStepIndex;
                    const isPassed = idx < currentStepIndex;

                    return (
                      <button
                        key={step.id || idx}
                        type="button"
                        onClick={() => goToStep(idx)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer select-none ${
                          isActive
                            ? "bg-blue-600 text-white font-medium shadow-xs"
                            : isPassed
                            ? "bg-white text-emerald-700 font-medium hover:bg-emerald-50 border border-emerald-100 shadow-2xs"
                            : "text-slate-600 font-medium hover:text-slate-900 hover:bg-white/60"
                        }`}
                        title={`Bước ${step.stepNumber}: ${step.title}`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isActive
                              ? "bg-white/25 text-white"
                              : isPassed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200/80 text-slate-600"
                          }`}
                        >
                          {isPassed ? "✓" : step.stepNumber}
                        </span>
                        <span className="truncate text-[11px]">{step.title}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Thẻ nội dung bước hiện tại (Current Step Card) - Tinh gọn, thoáng mắt */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
                {/* Tiêu đề bước & Gợi ý nút bấm */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 px-2 items-center justify-center rounded-md bg-blue-50 text-blue-700 border border-blue-200/70 text-[10px] font-bold shrink-0">
                      BƯỚC {currentStep.stepNumber}/{totalSteps}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {currentStep.title}
                    </h3>
                  </div>
                  {currentStep.buttonLabel && (
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/70 shrink-0">
                      [{currentStep.buttonLabel}]
                    </span>
                  )}
                </div>

                {/* Nội dung thao tác: Gạch đầu dòng cô đọng */}
                {currentStep.details && currentStep.details.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    {currentStep.details.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <span className="flex-1 font-normal leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {currentStep.content}
                  </p>
                )}

                {/* Lưu ý thực tế ngắn 1 dòng nếu có */}
                {currentStep.tips && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50/70 border border-amber-200/60 px-2.5 py-1.5 text-[11px] text-amber-800">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="font-normal truncate">{currentStep.tips}</span>
                  </div>
                )}
              </div>

              {/* Phần Câu hỏi thường gặp dạng Thu gọn (Collapsible Accordion) */}
              {guide.faqs && guide.faqs.length > 0 && (
                <details className="group rounded-xl border border-slate-200/80 bg-white overflow-hidden transition-all shadow-2xs">
                  <summary className="flex items-center justify-between p-3 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 select-none">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span>Câu hỏi & Tình huống thường gặp ({guide.faqs.length})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2.5 divide-y divide-slate-100 text-xs">
                    {guide.faqs.map((faq, fIdx) => (
                      <div key={fIdx} className="pt-2 first:pt-0 space-y-0.5">
                        <p className="font-medium text-slate-900 flex items-start gap-1">
                          <span className="text-blue-600 font-bold shrink-0">Hỏi:</span>
                          <span>{faq.question}</span>
                        </p>
                        <p className="text-slate-600 pl-5 leading-relaxed font-normal">
                          <strong className="text-emerald-600 mr-1 font-semibold">Trả lời:</strong>
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Nút liên kết chuyển trang nếu đang xem hướng dẫn màn hình khác */}
              {guide.actionUrl && (
                <button
                  type="button"
                  onClick={handleOpenTargetScreen}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-blue-600 transition-all cursor-pointer shadow-2xs"
                >
                  <span>Chuyển tới màn hình này</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer điều hướng bước */}
        {guide && totalSteps > 0 && (
          <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              {/* Nút Quay lại */}
              <button
                type="button"
                onClick={prevStep}
                disabled={isFirstStep}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
                  isFirstStep
                    ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200/60"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-2xs"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Trước</span>
              </button>

              {/* Thông tin số bước */}
              <div className="text-center">
                <span className="text-xs font-medium text-slate-500">
                  Bước {currentStepIndex + 1}/{totalSteps}
                </span>
              </div>

              {/* Nút Tiếp tục hoặc Hoàn tất */}
              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã hiểu - Hoàn thành</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => nextStep(totalSteps)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Tiếp theo</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
