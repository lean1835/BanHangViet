import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Bell, AlertTriangle } from "lucide-react";
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

  if (!isOpen || !customer) return null;

  const currentDebt = customer.debt ?? customer.currentDebt ?? 0;
  const hasEmail = Boolean(customer.email && customer.email.trim());

  // Build full detailed breakdown for email notification sent to customer
  const buildDetailedMessage = () => {
    const formattedTotal = formatCurrency(currentDebt);
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
        const amountText = ` - Dư nợ đơn: ${formatCurrency(d.remainingAmount)}`;

        let productListText = "";
        if (d.items && d.items.length > 0) {
          const itemLines = d.items.map(
            (item) =>
              `   + ${item.productName} (${item.quantity} x ${formatCurrency(item.unitPrice)}) = ${formatCurrency(item.subtotal || item.unitPrice * item.quantity)}`,
          );
          productListText = "\n" + itemLines.join("\n");
        }

        return `${orderHeader}${dueText}${amountText}${productListText}`;
      });

      return `Kính gửi ${customer.name},\nCửa hàng Bán Hàng Việt xin thông báo chi tiết danh sách các sản phẩm và trạng thái nợ chưa thanh toán của Quý khách:\n\n${breakdownLines.join("\n\n")}\n\n👉 Tổng dư nợ cần thanh toán: ${formattedTotal}.\n\nRất mong Quý khách sắp xếp thanh toán sớm. Trân trọng cảm ơn!`;
    }

    return CUSTOMER_UI.REMINDER_MODAL.TEMPLATE_BUILDER(customer.name, formattedTotal);
  };

  const handleSendEmail = () => {
    if (!hasEmail) {
      showError(`Khách hàng "${customer.name}" chưa có địa chỉ Email để gửi nhắc nợ!`);
      return;
    }

    const detailedMessage = buildDetailedMessage();
    showSuccess(`Đã ghi nhận gửi email nhắc công nợ chi tiết cho "${customer.name}".`);
    onConfirmReminder(customer, detailedMessage);
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-3 backdrop-blur-sm animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-modal-title"
        className="app-modal-panel w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Bell size={18} />
            </div>
            <div>
              <h2 id="reminder-modal-title" className="text-sm font-extrabold text-slate-800">
                {CUSTOMER_UI.REMINDER_MODAL.TITLE}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Gửi email thông báo nhắc nợ cho khách hàng
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
        <div className="p-5 flex flex-col gap-4">
          {/* Customer Minimal Info Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Khách hàng
              </span>
              <span className="font-extrabold text-slate-800 text-sm block">
                {customer.name}
              </span>
              <span className="font-mono text-slate-500 text-[11px]">
                {customer.phone}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dư nợ hiện tại
              </span>
              <span className="font-black text-rose-600 text-sm block">
                {formatCurrency(currentDebt)}
              </span>
              {customer.dueDate && (
                <span className="text-[10px] text-slate-500 block font-mono">
                  Hạn: {formatDateOnly(customer.dueDate)}
                </span>
              )}
            </div>
          </div>

          {/* Email Info Card / Warning */}
          {hasEmail ? (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Địa chỉ Email nhận tin:</span>
                <span className="font-bold text-blue-900 font-mono">{customer.email}</span>
              </div>
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed border-t border-blue-100/60 pt-2 mt-1">
                👉 Hệ thống sẽ gửi email tổng hợp đầy đủ chi tiết các đơn hàng nợ & danh sách sản phẩm chưa thanh toán tới khách hàng.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertTriangle size={18} className="shrink-0 text-rose-600" />
              <span>Khách hàng chưa đăng ký địa chỉ Email trong hệ thống. Vui lòng bổ sung Email trước khi gửi nhắc nợ!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={!hasEmail}
              className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-xs font-bold text-white shadow-sm transition-all"
            >
              <Mail size={15} />
              Gửi Email
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};




