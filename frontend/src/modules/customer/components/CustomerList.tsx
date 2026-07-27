import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Edit, Trash2, AlertTriangle, Bell, Wallet } from "lucide-react";
import { CUSTOMER_UI } from "@/constants/customer";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { DebtReminderModal } from "./DebtReminderModal";
import { DebtPaymentModal, type DebtPaymentData } from "./DebtPaymentModal";
import type { ICustomer } from "../types/ICustomer";

interface CustomerListProps {
  customers: ICustomer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (customer: ICustomer) => void;
  onDeleteCustomer: (id: string) => void;
  onConfirmReminder: (customer: ICustomer) => void;
  onConfirmPayDebt: (data: DebtPaymentData) => void | Promise<void>;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteCustomer,
  onConfirmReminder,
  onConfirmPayDebt,
}) => {
  const [customerToDelete, setCustomerToDelete] = useState<ICustomer | null>(null);
  const [customerToRemind, setCustomerToRemind] = useState<ICustomer | null>(null);
  const [customerToPayDebt, setCustomerToPayDebt] = useState<ICustomer | null>(null);

  const isDeleteOpen = Boolean(customerToDelete);
  const deleteDialogRef = useAccessibleDialog({
    isOpen: isDeleteOpen,
    onClose: () => setCustomerToDelete(null),
    canClose: true,
  });

  const confirmDelete = () => {
    if (customerToDelete) {
      onDeleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full animate-auth-fade-in">
      {/* Top action row: Search bar and Create button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder={CUSTOMER_UI.LIST.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 text-xs font-semibold text-slate-700 shadow-sm transition-all focus:border-kv-blue-primary focus:outline-none lg:h-9"
          />
        </div>

        {/* Create button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex h-11 items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-kv-blue-dark lg:h-9"
          >
            <Plus size={14} />
            {CUSTOMER_UI.LIST.CREATE_BUTTON}
          </button>
        </div>
      </div>

      {/* Main Customer table card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
          {CUSTOMER_UI.LIST.TITLE} ({customers.length})
        </h3>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-400 gap-2">
            <p className="text-xs font-medium">{CUSTOMER_UI.LIST.EMPTY_MESSAGE}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                  <th className="p-3">{CUSTOMER_UI.LIST.COLUMNS.NAME}</th>
                  <th className="p-3">{CUSTOMER_UI.LIST.COLUMNS.PHONE}</th>
                  <th className="p-3">{CUSTOMER_UI.LIST.COLUMNS.ADDRESS}</th>
                  <th className="p-3 text-right">{CUSTOMER_UI.LIST.COLUMNS.CREDIT_LIMIT}</th>
                  <th className="p-3 text-right">{CUSTOMER_UI.LIST.COLUMNS.CURRENT_DEBT}</th>
                  <th className="p-3 text-center">{CUSTOMER_UI.LIST.COLUMNS.DEBT_STATUS}</th>
                  <th className="p-3 text-center">{CUSTOMER_UI.LIST.COLUMNS.REMIND_COLUMN}</th>
                  <th className="p-3 text-center">{CUSTOMER_UI.LIST.COLUMNS.ACTIONS}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
                {customers.map((customer) => {
                  const isExceeded = customer.debt > customer.creditLimit;
                  const hasDebt = customer.debt > 0;
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isOverdue = Boolean(
                    hasDebt && customer.dueDate && customer.dueDate < todayStr
                  );

                  return (
                    <tr key={customer.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="p-3 font-bold text-slate-800">
                        {customer.name}
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-800">
                        {customer.phone}
                      </td>
                      <td className="p-3 text-slate-600 max-w-[220px] truncate" title={customer.address}>
                        {customer.address || CUSTOMER_UI.LIST.EMPTY_ADDRESS}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(customer.creditLimit)}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600">
                        {formatCurrency(customer.debt)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            isOverdue
                              ? "bg-rose-600 text-white animate-pulse"
                              : isExceeded
                                ? "bg-rose-100 text-rose-700"
                                : hasDebt
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isOverdue
                            ? "QUÁ HẠN NỢ ⚠️"
                            : isExceeded
                              ? "Vượt hạn mức"
                              : hasDebt
                                ? "Đang ghi nợ"
                                : "Không có nợ"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {hasDebt ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setCustomerToPayDebt(customer)}
                              title="Ghi nhận thu nợ"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-all border border-emerald-200/80 shadow-sm"
                            >
                              <Wallet size={12} />
                              {CUSTOMER_UI.LIST.PAY_DEBT_BUTTON}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomerToRemind(customer)}
                              title="Nhắc công nợ đến hạn"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs transition-all border border-amber-200/80 shadow-sm"
                            >
                              <Bell size={12} />
                              {CUSTOMER_UI.LIST.REMIND_BUTTON}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium">--</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(customer)}
                            title="Sửa thông tin khách hàng"
                            className="p-1 rounded text-slate-500 hover:text-kv-blue-primary hover:bg-slate-100 transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(customer)}
                            title="Xóa khách hàng"
                            className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Debt Payment Modal */}
      <DebtPaymentModal
        isOpen={Boolean(customerToPayDebt)}
        onClose={() => setCustomerToPayDebt(null)}
        customer={customerToPayDebt}
        onConfirmPayment={onConfirmPayDebt}
      />

      {/* Debt Reminder Modal */}
      <DebtReminderModal
        isOpen={Boolean(customerToRemind)}
        onClose={() => setCustomerToRemind(null)}
        customer={customerToRemind}
        onConfirmReminder={onConfirmReminder}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && customerToDelete && createPortal(
        <div
          onClick={() => setCustomerToDelete(null)}
          className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-backdrop-fade-in"
        >
          <div
            ref={deleteDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-customer-modal-title"
            className="app-modal-panel w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 animate-modal-bounce-in"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-full bg-rose-100">
                <AlertTriangle size={24} />
              </div>
              <h3 id="delete-customer-modal-title" className="text-base font-extrabold text-slate-800">
                {CUSTOMER_UI.DELETE_MODAL.TITLE}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {CUSTOMER_UI.DELETE_MODAL.CONFIRM_MESSAGE(customerToDelete.name)}
            </p>
            {customerToDelete.debt > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex flex-col gap-1">
                <span>⚠️ CẢNH BÁO CÔNG NỢ:</span>
                <span>
                  Khách hàng hiện còn dư nợ chưa thanh toán:{" "}
                  <strong className="text-rose-800">{formatCurrency(customerToDelete.debt)} đ</strong>.
                  Xóa khách hàng này sẽ làm mất lịch sử theo dõi dư nợ!
                </span>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="h-9 px-4 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                {CUSTOMER_UI.DELETE_MODAL.CANCEL_BUTTON}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm transition-all"
              >
                {CUSTOMER_UI.DELETE_MODAL.CONFIRM_BUTTON}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
