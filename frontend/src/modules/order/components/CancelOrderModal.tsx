import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  X,
  CheckCircle2,
  UserCheck,
  PackageX,
  HelpCircle,
} from "lucide-react";
import {
  ORDER_CANCEL_DEFAULT_REASONS,
  ORDER_CANCEL_MESSAGES,
  ORDER_CANCEL_REASON_CODES,
} from "@/constants/order";
import {
  useCancelOrderMutation,
  useGetCancelReasonsQuery,
} from "@/modules/order/services/orderApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import type { IOrderResponse } from "@/modules/order/types/IOrder";

interface ICancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: IOrderResponse | null;
  onSuccess?: (canceledOrder: IOrderResponse) => void;
}

export const CancelOrderModal: React.FC<ICancelOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: reasonsData, isLoading: isLoadingReasons } =
    useGetCancelReasonsQuery(undefined, { skip: !isOpen });
  const [cancelOrder, { isLoading: isCanceling }] = useCancelOrderMutation();

  const reasons = reasonsData?.result || ORDER_CANCEL_DEFAULT_REASONS;

  const [selectedReason, setSelectedReason] = useState<string>("");
  const [reasonNote, setReasonNote] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal opens with new order
  useEffect(() => {
    if (isOpen) {
      setSelectedReason("");
      setReasonNote("");
      setValidationError(null);
    }
  }, [isOpen, order?.id]);

  // Focus textarea when "OTHER" reason is selected
  useEffect(() => {
    if (selectedReason === ORDER_CANCEL_REASON_CODES.OTHER) {
      setTimeout(() => {
        noteInputRef.current?.focus();
      }, 100);
    }
  }, [selectedReason]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isCanceling) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCanceling, onClose]);

  if (!isOpen || !order) return null;

  const handleReasonSelect = (code: string) => {
    setSelectedReason(code);
    setValidationError(null);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // TC-02: Bắt buộc chọn lý do trước khi hủy
    if (!selectedReason) {
      setValidationError(ORDER_CANCEL_MESSAGES.REASON_REQUIRED);
      return;
    }

    // TC-02: Nếu chọn lý do "Khác" (OTHER), bắt buộc nhập ghi chú
    const currentReasonObj = reasons.find((r) => r.code === selectedReason);
    const requiresNote =
      currentReasonObj?.requiresNote ||
      selectedReason === ORDER_CANCEL_REASON_CODES.OTHER;

    if (requiresNote && (!reasonNote || reasonNote.trim().length === 0)) {
      setValidationError(ORDER_CANCEL_MESSAGES.NOTE_REQUIRED);
      noteInputRef.current?.focus();
      return;
    }

    try {
      const response = await cancelOrder({
        orderId: order.id,
        data: {
          cancelReason: selectedReason,
          cancelReasonNote: reasonNote.trim() || undefined,
        },
      }).unwrap();

      if (response?.result) {
        onSuccess?.(response.result);
      }
      onClose();
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(
        err,
        "Không thể hủy đơn hàng. Vui lòng thử lại sau."
      );
      setValidationError(errMsg);
    }
  };

  const getReasonIcon = (code: string) => {
    switch (code) {
      case ORDER_CANCEL_REASON_CODES.CUSTOMER_CHANGED_MIND:
        return <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />;
      case ORDER_CANCEL_REASON_CODES.OUT_OF_STOCK:
        return <PackageX className="w-5 h-5 text-amber-600 shrink-0" />;
      case ORDER_CANCEL_REASON_CODES.STAFF_INPUT_ERROR:
        return <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />;
      case ORDER_CANCEL_REASON_CODES.OTHER:
      default:
        return <HelpCircle className="w-5 h-5 text-purple-600 shrink-0" />;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 animate-backdrop-fade-in backdrop-blur-xs overflow-y-auto"
      onClick={!isCanceling ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-modal-bounce-in text-slate-800"
      >
        {/* Header */}
        <div className="bg-rose-600 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                id="cancel-order-modal-title"
                className="text-sm sm:text-base font-extrabold uppercase tracking-wide"
              >
                {ORDER_CANCEL_MESSAGES.MODAL_TITLE}
              </h2>
              <p className="text-[11px] text-rose-100 font-medium">
                Mã đơn: <span className="font-mono font-bold text-white">{order.orderNumber}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isCanceling}
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleConfirmCancel} className="p-5 flex flex-col gap-4">
          {/* Order Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Khách hàng
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {order.customerName || "Khách vãng lai"}
              </span>
              <span className="text-[11px] text-slate-400">
                Số mặt hàng: <strong className="text-slate-600">{order.items?.length || 0}</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                Tổng tiền đơn
              </span>
              <span className="text-sm sm:text-base font-extrabold text-rose-600">
                {formatCurrency(order.finalAmount || order.totalAmount || 0)}
              </span>
            </div>
          </div>

          {/* Business Rule Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] sm:text-xs leading-relaxed">
              <strong>Quy tắc nghiệp vụ:</strong> {ORDER_CANCEL_MESSAGES.STOCK_NEUTRALITY_NOTICE}
            </div>
          </div>

          {/* Validation / Server Error Alert */}
          {validationError && (
            <div
              role="alert"
              className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Reason Selection Section - Big Accessible Cards */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
              Chọn lý do hủy đơn hàng <span className="text-rose-500">*</span>
            </label>

            {isLoadingReasons ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                Đang tải danh mục lý do...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reasons.map((reason) => {
                  const isSelected = selectedReason === reason.code;
                  return (
                    <button
                      key={reason.code}
                      type="button"
                      onClick={() => handleReasonSelect(reason.code)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-rose-50/80 border-rose-500 text-rose-900 shadow-xs ring-2 ring-rose-300 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {getReasonIcon(reason.code)}
                        <span className="text-xs sm:text-[13px]">{reason.description}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-rose-600 bg-rose-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Note Field (Required if OTHER) */}
          {selectedReason === ORDER_CANCEL_REASON_CODES.OTHER && (
            <div className="animate-fade-in flex flex-col gap-1">
              <label
                htmlFor="cancel-reason-note"
                className="text-xs font-bold text-slate-700 flex items-center justify-between"
              >
                <span>
                  Ghi chú lý do chi tiết <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {reasonNote.length}/500 ký tự
                </span>
              </label>
              <textarea
                id="cancel-reason-note"
                ref={noteInputRef}
                value={reasonNote}
                maxLength={500}
                rows={3}
                onChange={(e) => {
                  setReasonNote(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Nhập chi tiết lý do hủy đơn (ví dụ: khách không đủ tiền, hẹn quay lại sau)..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-500 font-medium placeholder-slate-400"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              disabled={isCanceling}
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 text-center"
            >
              {ORDER_CANCEL_MESSAGES.CANCEL_BUTTON}
            </button>
            <button
              type="submit"
              disabled={isCanceling}
              className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-center"
            >
              {isCanceling ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý hủy...</span>
                </>
              ) : (
                <span>{ORDER_CANCEL_MESSAGES.CONFIRM_BUTTON}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CancelOrderModal;
