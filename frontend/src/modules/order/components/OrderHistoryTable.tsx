import React, { useState } from "react";
import {
  DEFAULT_ORDER_PAYMENT_METHOD_LABEL,
  ORDER_FILTER_OPTIONS,
  ORDER_FILTER_STATUS,
  ORDER_PAYMENT_METHOD,
  ORDER_PAYMENT_METHOD_LABELS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_UI,
} from "@/constants/order";
import { USER_ROLES } from "@/constants/roles";
import { useGetOrdersHistoryQuery } from "@/modules/order/services/orderApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";

interface OrderHistoryTableProps {
  currentRole: string;
}

type TOrderFilterStatus =
  (typeof ORDER_FILTER_STATUS)[keyof typeof ORDER_FILTER_STATUS];

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({ currentRole }) => {
  const { data: ordersHistoryData, isLoading } = useGetOrdersHistoryQuery();
  const orders = ordersHistoryData?.result || [];

  const [orderFilterStatus, setOrderFilterStatus] = useState<TOrderFilterStatus>(
    ORDER_FILTER_STATUS.ALL
  );


  const translateStatus = (status: string) => {
    switch (status) {
      case ORDER_STATUS.CREATING:
        return ORDER_STATUS_LABELS[ORDER_STATUS.CREATING];
      case ORDER_STATUS.COMPLETED:
        return ORDER_STATUS_LABELS[ORDER_STATUS.COMPLETED];
      case ORDER_STATUS.CANCELED:
        return ORDER_STATUS_LABELS[ORDER_STATUS.CANCELED];
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case ORDER_STATUS.COMPLETED:
        return "bg-emerald-100 text-emerald-700";
      case ORDER_STATUS.CREATING:
        return "bg-slate-100 text-slate-600";
      case ORDER_STATUS.CANCELED:
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
        {ORDER_UI.HISTORY.LOADING_MESSAGE}
      </div>
    );
  }

  const filteredOrders = orders.filter(
    (order) =>
      orderFilterStatus === ORDER_FILTER_STATUS.ALL || order.status === orderFilterStatus
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-4 mb-2 flex-wrap gap-3">
        <span className="font-extrabold text-sm text-slate-800">
          {ORDER_UI.HISTORY.TITLE(filteredOrders.length)}
        </span>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">
            {ORDER_UI.HISTORY.STATUS_FILTER_LABEL}
          </span>
          <select
            value={orderFilterStatus}
            onChange={(e) => setOrderFilterStatus(e.target.value as TOrderFilterStatus)}
            className="border border-slate-300 h-8 px-2.5 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs bg-white font-bold text-slate-700"
          >
            {ORDER_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.ORDER_NUMBER}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CASHIER}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CREATED_AT}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.CUSTOMER}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.TOTAL_AMOUNT}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.DISCOUNT}</th>
              <th className="p-3 text-right">{ORDER_UI.HISTORY.COLUMNS.PAID_AMOUNT}</th>
              <th className="p-3">{ORDER_UI.HISTORY.COLUMNS.PAYMENT_METHOD}</th>
              <th className="p-3 text-center">{ORDER_UI.HISTORY.COLUMNS.STATUS}</th>
              <th className="p-3 text-center">{ORDER_UI.HISTORY.COLUMNS.ACTIONS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                  {ORDER_UI.HISTORY.EMPTY_MESSAGE}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-slate-800">{order.orderNumber}</td>
                  <td className="p-3 text-slate-700 font-semibold">{order.createdByUsername}</td>
                  <td className="p-3 text-slate-500">{formatDate(order.createdAt)}</td>
                  <td className="p-3 font-bold text-slate-700">
                    {order.customerName || ORDER_UI.HISTORY.WALK_IN_CUSTOMER_LABEL}
                  </td>
                  <td className="p-3 text-right">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-3 text-right text-rose-500 font-semibold">
                    -{formatCurrency(order.discountAmount)}
                  </td>
                  <td className="p-3 text-right font-bold text-kv-blue-primary">
                    {formatCurrency(order.finalAmount)}
                  </td>
                  <td className="p-3 text-slate-600 font-bold">
                    {order.paymentMethod === ORDER_PAYMENT_METHOD.CASH
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.CASH]
                      : order.paymentMethod === ORDER_PAYMENT_METHOD.BANK_TRANSFER
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.BANK_TRANSFER]
                      : order.paymentMethod === ORDER_PAYMENT_METHOD.DEBT
                      ? ORDER_PAYMENT_METHOD_LABELS[ORDER_PAYMENT_METHOD.DEBT]
                      : DEFAULT_ORDER_PAYMENT_METHOD_LABEL}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {translateStatus(order.status)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {currentRole !== USER_ROLES.OWNER ? (
                      <span className="bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1 select-none">
                        {ORDER_UI.HISTORY.READ_ONLY_LABEL}
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => alert(ORDER_UI.HISTORY.DETAILS_MESSAGE(order.orderNumber))}
                          className="bg-kv-blue-light hover:bg-blue-100 text-kv-blue-primary text-[10px] font-bold px-2 py-1 rounded transition-colors"
                        >
                          {ORDER_UI.HISTORY.DETAILS_LABEL}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
