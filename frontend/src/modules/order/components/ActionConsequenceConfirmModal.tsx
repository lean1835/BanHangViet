import React from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ShieldAlert,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useGetActionConsequencesQuery } from "../services/actionConfirmationApi";
import type { TActionType } from "@/modules/settings/types/IDisplaySetting";

interface IActionConsequenceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  actionType: TActionType;
  targetId: string;
  isExecuting?: boolean;
}

export const ActionConsequenceConfirmModal: React.FC<
  IActionConsequenceConfirmModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  targetId,
  isExecuting = false,
}) => {
  const { data: consequenceResponse, isLoading } =
    useGetActionConsequencesQuery(
      { actionType, targetId },
      { skip: !isOpen || !targetId }
    );

  if (!isOpen) return null;

  const data = consequenceResponse?.result;

  const warningTitle =
    data?.warningTitle ||
    (actionType === "CANCEL_ORDER"
      ? "Xác nhận hủy đơn hàng đang bán"
      : "Cảnh báo hủy hóa đơn điện tử");

  const targetSummary =
    data?.targetSummary || `Mã đối tượng: ${targetId.substring(0, 10)}...`;

  const consequences = data?.consequences || [
    "Dữ liệu liên quan sẽ bị hủy bỏ hoàn toàn khỏi hệ thống.",
    "Thao tác này KHÔNG THỂ HOÀN TÁC sau khi đã xác nhận.",
  ];

  const confirmPrompt =
    data?.confirmPrompt ||
    "Bạn có chắc chắn muốn thực hiện thao tác một chiều này không?";

  const confirmButtonText =
    data?.confirmButtonText || "Tôi hiểu hậu quả, Tiếp tục thực hiện";

  const cancelButtonText = data?.cancelButtonText || "Quay lại";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-3 sm:p-4 animate-backdrop-fade-in backdrop-blur-xs overflow-y-auto"
      onClick={!isExecuting ? onClose : undefined}
      role="presentation"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-rose-200 overflow-hidden animate-modal-bounce-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consequence-modal-title"
      >
        {/* Warning Banner Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <ShieldAlert size={22} className="text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-900/60 px-2 py-0.5 rounded text-rose-200 inline-block mb-0.5">
                Cảnh báo thao tác một chiều
              </span>
              <h3
                id="consequence-modal-title"
                className="text-base font-extrabold text-white leading-snug"
              >
                {warningTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            disabled={isExecuting}
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Target Summary Card */}
          <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950">
              <span className="font-extrabold block text-rose-900 mb-0.5">
                Đối tượng chịu tác động:
              </span>
              <span className="font-bold font-mono text-sm block">
                {targetSummary}
              </span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 size={24} className="animate-spin text-rose-600" />
              <span className="text-xs font-semibold">
                Đang phân tích hậu quả từ máy chủ...
              </span>
            </div>
          )}

          {/* Consequences List */}
          {!isLoading && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <AlertCircle size={15} className="text-rose-600" />
                <span>Các hậu quả sẽ diễn ra ngay sau khi xác nhận:</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                {consequences.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prompt Message */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-950 text-xs font-bold leading-relaxed">
            ⚠️ {confirmPrompt}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isExecuting}
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            {cancelButtonText}
          </button>

          <button
            type="button"
            disabled={isExecuting || isLoading}
            onClick={() => onConfirm()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <ShieldAlert size={15} />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ActionConsequenceConfirmModal;
