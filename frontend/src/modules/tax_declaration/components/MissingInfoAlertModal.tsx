import React from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { REPORT_UI } from "@/constants/report";

interface IMissingInfoAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

export const MissingInfoAlertModal: React.FC<IMissingInfoAlertModalProps> = ({
  isOpen,
  onClose,
  missingFields,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigateToSettings = () => {
    onClose();
    navigate(APP_ROUTES.SETTINGS_BUSINESS_INFO);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header Modal */}
        <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-800">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-800">
              {REPORT_UI.TAX_DECLARATION.WARNING_MISSING_INFO_TITLE}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung cảnh báo & Danh sách trường thiếu (TC-02) */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {REPORT_UI.TAX_DECLARATION.WARNING_MISSING_INFO_DESC}
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Các thông tin còn thiếu bắt buộc:
            </span>
            <ul className="space-y-1.5">
              {missingFields.map((field, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-xs font-bold text-rose-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>{field} (Đang để trống)</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Theo quy định Thông tư 40/2021/TT-BTC, tờ khai thuế bắt buộc phải có đầy đủ Mã số thuế và Tên người đại diện để cơ quan thuế tiếp nhận.
          </p>
        </div>

        {/* Nút hành động */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={handleNavigateToSettings}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-kv-blue-primary hover:bg-blue-600 text-white font-bold text-xs transition shadow-sm"
          >
            <span>{REPORT_UI.TAX_DECLARATION.BTN_UPDATE_SETTINGS}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
