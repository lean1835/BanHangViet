import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  Bell,
  Edit,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Package,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useGetDebtHistoryQuery } from "../services/customerApi";
import type { ICustomer } from "../types/ICustomer";

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: ICustomer | null;
  onOpenEditModal: (customer: ICustomer) => void;
  onOpenPayDebtModal: (customer: ICustomer) => void;
  onOpenRemindModal: (customer: ICustomer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onOpenEditModal,
  onOpenPayDebtModal,
  onOpenRemindModal,
}) => {
  const [activeTab, setActiveTab] = useState<"DEBT_ORDERS" | "HISTORY">("DEBT_ORDERS");

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(customer),
    onClose,
  });

  const { data: debtHistory = [], isLoading: isDebtLoading } = useGetDebtHistoryQuery(
    customer?.id || "",
    { skip: !isOpen || !customer },
  );

  if (!isOpen || !customer) return null;

  const currentDebt = customer.debt ?? customer.currentDebt ?? 0;
  const creditLimit = customer.creditLimit ?? 0;
  const availableCredit = creditLimit - currentDebt;
  const isExceeded = currentDebt > creditLimit;
  const hasDebt = currentDebt > 0;
  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue = Boolean(hasDebt && customer.dueDate && customer.dueDate < todayStr);

  // Active debt orders (unpaid or partially paid DEBT_CREATED records)
  const activeDebtOrders = debtHistory.filter(
    (d) =>
      d.type === "DEBT_CREATED" &&
      (d.status === "PENDING" || d.status === "OVERDUE") &&
      d.remainingAmount > 0,
  );

  return createPortal(
    <div
      onClick={onClose}
      className="app-modal-backdrop fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-modal-title"
        className="fixed inset-y-0 right-0 w-full max-w-2xl sm:max-w-3xl bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col h-full animate-slide-in-right overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
              title="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 id="customer-detail-modal-title" className="text-sm sm:text-base font-extrabold text-slate-800">
              Chi tiết khách hàng
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEditModal(customer);
              }}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-kv-blue-primary hover:bg-slate-100 transition-all text-xs font-bold flex items-center gap-1 border border-slate-200 bg-white shadow-2xs"
              title="Sửa thông tin khách hàng"
            >
              <Edit size={14} />
              <span>Sửa</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex flex-col gap-4 sm:gap-5">
          {/* Customer Profile Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-kv-blue-primary/10 text-kv-blue-primary font-black flex items-center justify-center text-base sm:text-lg uppercase shrink-0 border border-kv-blue-primary/20 mt-0.5">
              {customer.name ? customer.name.charAt(0) : "K"}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 break-words leading-snug">
                  {customer.name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold whitespace-nowrap inline-block shrink-0 ${
                    isOverdue
                      ? "bg-rose-600 text-white animate-pulse"
                      : isExceeded
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : hasDebt
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {isOverdue
                    ? "QUÁ HẠN NỢ"
                    : isExceeded
                      ? "Vượt hạn mức"
                      : hasDebt
                        ? "Đang ghi nợ"
                        : "Không có nợ"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold pt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={12} className="text-slate-400 shrink-0" />
                  {customer.phone || customer.phoneNumber || "Chưa có SĐT"}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1 font-mono break-all">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Customer Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-0.5 sm:gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Hạn mức nợ
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                {formatCurrency(creditLimit)}
              </span>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex flex-col gap-0.5 sm:gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                Dư nợ hiện tại
              </span>
              <span className="text-xs sm:text-sm font-black text-rose-600 truncate">
                {formatCurrency(currentDebt)}
              </span>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-0.5 sm:gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Nợ còn lại
              </span>
              <span
                className={`text-xs sm:text-sm font-extrabold truncate ${
                  availableCredit < 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(availableCredit)}
              </span>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-0.5 sm:gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Hạn trả
              </span>
              <span
                className={`text-xs sm:text-sm font-mono font-bold truncate ${
                  isOverdue ? "text-rose-600" : "text-slate-800"
                }`}
              >
                {customer.dueDate ? formatDateOnly(customer.dueDate) : "Chưa hạn"}
              </span>
            </div>
          </div>

          {/* Customer Address & Notes */}
          {customer.address && (
            <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] sm:text-xs text-slate-600">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">
                <strong>Địa chỉ:</strong> {customer.address}
              </span>
            </div>
          )}

          {/* Quick Actions Bar */}
          {hasDebt && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl gap-2.5">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-amber-900">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Khách hàng đang có dư nợ chưa thanh toán.</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPayDebtModal(customer);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Wallet size={13} />
                  Thu nợ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRemindModal(customer);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Bell size={13} />
                  Nhắc nợ
                </button>
              </div>
            </div>
          )}

          {/* Detail Tabs Header */}
          <div className="border-b border-slate-200 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("DEBT_ORDERS")}
              className={`pb-2 text-[11px] sm:text-xs font-extrabold transition-all relative shrink-0 ${
                activeTab === "DEBT_ORDERS"
                  ? "text-kv-blue-primary border-b-2 border-kv-blue-primary"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Đơn hàng nợ ({activeDebtOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`pb-2 text-[11px] sm:text-xs font-extrabold transition-all relative shrink-0 ${
                activeTab === "HISTORY"
                  ? "text-kv-blue-primary border-b-2 border-kv-blue-primary"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Lịch sử phát sinh & Thu nợ ({debtHistory.length})
            </button>
          </div>

          {/* Tab 1: Active Debt Orders with Product Details */}
          {activeTab === "DEBT_ORDERS" && (
            <div className="flex flex-col gap-3 sm:gap-4">
              {isDebtLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Đang tải danh sách đơn nợ...
                </div>
              ) : activeDebtOrders.length === 0 ? (
                <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-1">
                  <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                  <p className="text-xs font-bold text-slate-700">Khách hàng không có đơn nợ tồn đọng</p>
                  <p className="text-[11px] text-slate-400">Tất cả các khoản nợ đơn hàng đã được thanh toán hoàn tất.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeDebtOrders.map((order) => {
                    const isOrderOverdue =
                      order.status === "OVERDUE" ||
                      (order.dueDate && new Date(order.dueDate).getTime() < Date.now());

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col gap-2.5 sm:gap-3"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-1.5 sm:gap-2">
                          <div className="flex items-center justify-between sm:justify-start gap-2">
                            <span className="font-extrabold text-slate-800 text-xs break-all">
                              Đơn hàng #{order.orderNumber || order.id.substring(0, 8)}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shrink-0 ${
                                isOrderOverdue
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {isOrderOverdue ? "Đã quá hạn" : "Trong hạn"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-bold">
                            <span className="text-slate-500 text-[11px] sm:text-xs">
                              Tổng: {formatCurrency(order.amount)}
                            </span>
                            <span className="text-rose-600 font-black text-xs">
                              Còn nợ: {formatCurrency(order.remainingAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Dates info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400 shrink-0" />
                            Ngày tạo nợ: {formatDateOnly(order.createdAt)}
                          </span>
                          {order.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400 shrink-0" />
                              Hạn thanh toán:{" "}
                              <strong className={isOrderOverdue ? "text-rose-600 font-bold" : "text-slate-700"}>
                                {formatDateOnly(order.dueDate)}
                              </strong>
                            </span>
                          )}
                        </div>

                        {/* Purchased Products Breakdown Table */}
                        {order.items && order.items.length > 0 ? (
                          <div className="mt-0.5 bg-slate-50/80 rounded-lg p-2.5 sm:p-3 border border-slate-200/70">
                            <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                              <Package size={12} className="text-slate-400 shrink-0" />
                              Danh sách mặt hàng nợ trong đơn ({order.items.length} món):
                            </div>
                            <div className="divide-y divide-slate-200/60">
                              {order.items.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className="py-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-medium text-slate-700 gap-1"
                                >
                                  <span className="font-semibold text-slate-800 break-words">
                                    • {item.productName}
                                  </span>
                                  <div className="flex items-center justify-between sm:justify-end gap-3 text-slate-600 pl-3 sm:pl-0">
                                    <span className="text-[11px] text-slate-500 font-mono">
                                      {item.quantity} × {formatCurrency(item.unitPrice)}
                                    </span>
                                    <span className="font-bold text-slate-800 text-xs text-right font-mono min-w-[70px]">
                                      = {formatCurrency(item.subtotal || item.unitPrice * item.quantity)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            (Không có thông tin chi tiết từng mặt hàng)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Full Debt & Collection History Timeline */}
          {activeTab === "HISTORY" && (
            <div className="flex flex-col gap-3">
              {isDebtLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Đang tải lịch sử công nợ...
                </div>
              ) : debtHistory.length === 0 ? (
                <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs font-medium">Chưa có lịch sử biến động công nợ</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
                  {debtHistory.map((item) => {
                    const isPayment = item.type === "DEBT_PAID";
                    return (
                      <div key={item.id} className="p-3 sm:p-3.5 flex items-start sm:items-center justify-between gap-2.5 hover:bg-slate-50/50">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <div
                            className={`p-1.5 sm:p-2 rounded-full shrink-0 ${
                              isPayment
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-rose-100 text-rose-600"
                            }`}
                          >
                            <FileText size={14} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-800">
                                {isPayment ? "Thu nợ khách hàng" : `Ghi nợ đơn #${item.orderNumber || ""}`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatDateOnly(item.createdAt)}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                                Ghi chú: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-black text-xs block ${
                              isPayment ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isPayment ? "-" : "+"}{formatCurrency(item.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Còn lại: {formatCurrency(item.remainingAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

