import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, HelpCircle, ArrowRight, X } from "lucide-react";
import { useGetContextualHelpQuery } from "../services/screenGuideApi";
import { useScreenGuide } from "../context/ScreenGuideContext";

interface ContextualErrorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorCode: number;
  customMessage?: string;
}

export const ContextualErrorGuideModal: React.FC<ContextualErrorGuideModalProps> = ({
  isOpen,
  onClose,
  errorCode,
  customMessage,
}) => {
  const navigate = useNavigate();
  const { openGuide } = useScreenGuide();

  const { data: helpResponse, isLoading: _isLoading } = useGetContextualHelpQuery(errorCode, {
    skip: !isOpen || !errorCode,
  });

  if (!isOpen) return null;

  const helpData = helpResponse?.result;
  const targetScreenCode = helpData?.guideScreenCode || "SCREEN_INVOICE_CONFIG";
  const actionUrl = helpData?.actionUrl || "/settings/invoice-template";
  const suggestedAction =
    helpData?.suggestedAction ||
    customMessage ||
    "Vui lòng hoàn thành bước thiết lập cần thiết để tiếp tục thao tác.";

  const handleOpenGuide = () => {
    onClose();
    openGuide(targetScreenCode);
  };

  const handleNavigateToSetting = () => {
    onClose();
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-amber-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="contextual-help-title"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
                Thao tác bị chặn • Cần cấu hình trước (TC-02)
              </span>
              <h3
                id="contextual-help-title"
                className="text-base font-black text-slate-900"
              >
                Chưa đủ điều kiện phát hành hóa đơn
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-amber-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Đóng cảnh báo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {suggestedAction}
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-800">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Gợi ý khắc phục nhanh:</span>
            </div>
            <p className="leading-relaxed">
              Bạn có thể xem hướng dẫn 4 bước ngắn gọn tại chỗ hoặc bấm mở thẳng màn hình Cấu hình mẫu hóa đơn để nhập ký hiệu theo thông báo của Cơ quan Thuế.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Để sau
          </button>

          <button
            type="button"
            onClick={handleOpenGuide}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Xem hướng dẫn từng bước</span>
          </button>

          <button
            type="button"
            onClick={handleNavigateToSetting}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
          >
            <span>Khai báo ký hiệu ngay</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
