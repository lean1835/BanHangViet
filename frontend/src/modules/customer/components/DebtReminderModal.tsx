import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { CUSTOMER_UI } from "@/constants/customer";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useRemindCustomerDebtMutation } from "../services/customerApi";
import type { ICustomer } from "../types/ICustomer";

interface DebtReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: ICustomer | null;
  onConfirmReminder: (customer: ICustomer) => void;
}

export const DebtReminderModal: React.FC<DebtReminderModalProps> = ({
  isOpen,
  onClose,
  customer,
  onConfirmReminder,
}) => {
  const [message, setMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const { showSuccess, showError } = useNotification();
  const [remindCustomerDebt, { isLoading: isSendingApi }] = useRemindCustomerDebtMutation();

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(customer),
    onClose,
    canClose: !isSendingApi,
  });

  useEffect(() => {
    if (customer) {
      const formattedDebt = formatCurrency(customer.debt);
      const defaultMessage = CUSTOMER_UI.REMINDER_MODAL.TEMPLATE_BUILDER(
        customer.name,
        formattedDebt,
      );
      setMessage(defaultMessage);
      setIsCopied(false);
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const availableDebt = customer.creditLimit - customer.debt;
  const isExceeded = customer.debt > customer.creditLimit;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      showSuccess("Đã sao chép nội dung tin nhắn nhắc nợ vào bộ nhớ tạm!");
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setIsCopied(true);
      showSuccess("Đã sao chép nội dung tin nhắn nhắc nợ!");
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleSendEmail = async () => {
    if (!customer.email || !customer.email.trim()) {
      showError(`Khách hàng "${customer.name}" chưa có địa chỉ Email để gửi nhắc nợ!`);
      return;
    }

    try {
      // Call real API endpoint /customers/{id}/remind
      await remindCustomerDebt({
        customerId: customer.id,
        messageContent: message,
      }).unwrap();

      showSuccess(`Đã gửi email nhắc nợ thành công cho khách hàng "${customer.name}".`);
      onConfirmReminder(customer);
      onClose();
    } catch (error) {
      // Show explicit error message when API call fails before mailto fallback
      const apiErrText = getApiErrorMessage(
        error,
        "Không thể kết nối đến máy chủ để gửi email tự động.",
      );
      showError(`${apiErrText} Chuyển sang ứng dụng Email mặc định.`);

      // Fallback: Open mailto link if API fails or backend is not connected yet
      const subject = encodeURIComponent(`[BÁN HÀNG VIỆT] Thông báo công nợ khách hàng - ${customer.name}`);
      const body = encodeURIComponent(message);
      const mailtoUrl = `mailto:${customer.email.trim()}?subject=${subject}&body=${body}`;
      window.open(mailtoUrl, "_blank");

      onConfirmReminder(customer);
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirmReminder(customer);
    onClose();
  };

  return createPortal(
    <div
      onClick={() => {
        if (!isSendingApi) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/40 p-2 sm:p-4 backdrop-blur-sm animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-modal-title"
        className="app-modal-panel w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 id="reminder-modal-title" className="text-base font-extrabold text-slate-800">
                {CUSTOMER_UI.REMINDER_MODAL.TITLE}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                {CUSTOMER_UI.REMINDER_MODAL.SUBTITLE}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSendingApi}
            aria-label="Đóng modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Customer Debt Info Cards */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Khách hàng
              </span>
              <span className="font-extrabold text-slate-800 text-sm block truncate">
                {customer.name}
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                {customer.phone}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dư nợ hiện tại
              </span>
              <span className="font-black text-rose-600 text-sm block">
                {formatCurrency(customer.debt)}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  isExceeded ? "text-rose-600 font-extrabold" : "text-emerald-600"
                }`}
              >
                {isExceeded ? "⚠️ Vượt hạn mức nợ" : `Còn lại: ${formatCurrency(availableDebt)}`}
              </span>
            </div>
          </div>

          {/* Editable Textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              {CUSTOMER_UI.REMINDER_MODAL.LABEL_MESSAGE}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-3.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:border-kv-blue-primary resize-none bg-white shadow-inner"
            />
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2.5 flex-wrap pt-1">
            {/* Copy Button FIRST */}
            <button
              type="button"
              onClick={handleCopyMessage}
              disabled={isSendingApi}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
            >
              {isCopied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {isCopied ? "Đã sao chép!" : CUSTOMER_UI.REMINDER_MODAL.COPY_BUTTON}
            </button>

            {/* Send Email Button (BLUE) SECOND */}
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSendingApi}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Mail size={14} />
              {isSendingApi ? "Đang gửi email..." : CUSTOMER_UI.REMINDER_MODAL.EMAIL_BUTTON}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSendingApi}
              className="h-9 px-4 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              {CUSTOMER_UI.REMINDER_MODAL.CANCEL_BUTTON}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSendingApi}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-all"
            >
              <CheckCircle2 size={15} />
              {CUSTOMER_UI.REMINDER_MODAL.CONFIRM_BUTTON}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
