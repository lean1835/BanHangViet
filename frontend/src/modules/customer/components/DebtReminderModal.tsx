import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Mail, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { CUSTOMER_UI } from "@/constants/customer";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { useGetDebtHistoryQuery } from "../services/customerApi";
import type { ICustomer } from "../types/ICustomer";

interface DebtReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: ICustomer | null;
  onConfirmReminder: (customer: ICustomer, message?: string) => Promise<void> | void;
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

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(customer),
    onClose,
  });

  const { data: debtHistory = [] } = useGetDebtHistoryQuery(
    customer?.id || "",
    { skip: !isOpen || !customer },
  );

  const activeDebts = useMemo(() => {
    return debtHistory.filter(
      (d) =>
        d.type === "DEBT_CREATED" &&
        (d.status === "PENDING" || d.status === "OVERDUE") &&
        d.remainingAmount > 0,
    );
  }, [debtHistory]);

  useEffect(() => {
    if (customer) {
      const formattedTotal = formatCurrency(customer.debt);
      if (activeDebts.length > 0) {
        const breakdownLines = activeDebts.map((d) => {
          let orderTitle = d.orderNumber ? `Mã ${d.orderNumber}` : "Khoản nợ";
          if (d.items && d.items.length > 0) {
            const productNames = d.items.map((i) => i.productName).filter(Boolean);
            if (productNames.length > 0) {
              orderTitle = productNames.join(", ");
            }
          }

          const isOverdue =
            d.status === "OVERDUE" ||
            (d.dueDate && new Date(d.dueDate).getTime() < Date.now());
          const statusTag = isOverdue ? "🔴 [ĐÃ QUÁ HẠN]" : "🟢 [CHƯA QUÁ HẠN]";

          const orderHeader = `🛒 Đơn hàng ${orderTitle} ${statusTag}`;
          const dueText = d.dueDate ? ` (Hạn trả: ${formatDateOnly(d.dueDate)})` : "";
          const amountText = ` - Dư nợ đơn: ${formatCurrency(d.remainingAmount)} đ`;

          let productListText = "";
          if (d.items && d.items.length > 0) {
            const itemLines = d.items.map(
              (item) =>
                `   + ${item.productName} (${item.quantity} x ${formatCurrency(item.unitPrice)} đ) = ${formatCurrency(item.subtotal || item.unitPrice * item.quantity)} đ`,
            );
            productListText = "\n" + itemLines.join("\n");
          }

          return `${orderHeader}${dueText}${amountText}${productListText}`;
        });

        const msg = `Kính gửi ${customer.name},\nCửa hàng Bán Hàng Việt xin thông báo chi tiết danh sách các sản phẩm và trạng thái nợ chưa thanh toán của Quý khách:\n\n${breakdownLines.join("\n\n")}\n\n👉 Tổng dư nợ cần thanh toán: ${formattedTotal} đ.\n\nRất mong Quý khách sắp xếp thanh toán sớm. Trân trọng cảm ơn!`;
        setMessage(msg);
      } else {
        const defaultMessage = CUSTOMER_UI.REMINDER_MODAL.TEMPLATE_BUILDER(
          customer.name,
          formattedTotal,
        );
        setMessage(defaultMessage);
      }
      setIsCopied(false);
    }
  }, [customer, activeDebts, isOpen]);

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

  const handleSendReminder = () => {
    if (!customer.email || !customer.email.trim()) {
      showError(`Khách hàng "${customer.name}" chưa có địa chỉ Email để gửi nhắc nợ!`);
      return;
    }

    showSuccess(`Đã ghi nhận gửi nhắc công nợ cho khách hàng "${customer.name}".`);
    onConfirmReminder(customer, message);
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
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

          {/* Active Debt Orders Breakdown */}
          {activeDebts.length > 0 && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <FileText size={14} className="text-amber-700" /> Chi tiết các đơn nợ & sản phẩm ({activeDebts.length} đơn):
              </span>
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                {activeDebts.map((d) => {
                  let orderTitle = d.orderNumber ? `Mã ${d.orderNumber}` : "Khoản nợ";
                  if (d.items && d.items.length > 0) {
                    const productNames = d.items.map((i) => i.productName).filter(Boolean);
                    if (productNames.length > 0) {
                      orderTitle = productNames.join(", ");
                    }
                  }

                  const isOverdue =
                    d.status === "OVERDUE" ||
                    (d.dueDate && new Date(d.dueDate).getTime() < Date.now());

                  return (
                    <div
                      key={d.id}
                      className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-amber-200/60 shadow-2xs text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          Đơn hàng {orderTitle}
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                              isOverdue
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isOverdue ? "Đã quá hạn" : "Chưa quá hạn"}
                          </span>
                        </span>
                        <span className="font-bold text-rose-600 font-mono text-xs">
                          Nợ đơn: {formatCurrency(d.remainingAmount)} đ
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Tạo ngày: {formatDateOnly(d.createdAt)} | Hạn trả:{" "}
                        <strong className={isOverdue ? "text-rose-600 font-bold" : "text-slate-700"}>
                          {formatDateOnly(d.dueDate)}
                        </strong>
                      </span>

                      {/* Products list inside order */}
                      {d.items && d.items.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-slate-100 flex flex-col gap-0.5">
                          {d.items.map((item, idx) => (
                            <div key={item.id || idx} className="flex justify-between text-[11px] text-slate-600">
                              <span>• {item.productName} <span className="text-slate-400">({item.quantity} x {formatCurrency(item.unitPrice)}đ)</span></span>
                              <span className="font-semibold text-slate-700">{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}đ</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
            >
              {isCopied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {isCopied ? "Đã sao chép!" : CUSTOMER_UI.REMINDER_MODAL.COPY_BUTTON}
            </button>

            {/* Send Email Button (BLUE) SECOND */}
            <button
              type="button"
              onClick={handleSendReminder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Mail size={14} />
              {CUSTOMER_UI.REMINDER_MODAL.EMAIL_BUTTON}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              {CUSTOMER_UI.REMINDER_MODAL.CANCEL_BUTTON}
            </button>
            <button
              type="button"
              onClick={handleSendReminder}
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
