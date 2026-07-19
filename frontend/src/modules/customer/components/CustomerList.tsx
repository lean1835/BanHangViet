import React from "react";
import { CUSTOMER_DEBT_STATUS, CUSTOMER_UI } from "@/constants/customer";
import { formatCurrency } from "@/utils/formatCurrency";
import type { ICustomer } from "../types/ICustomer";

interface CustomerListProps {
  customers: ICustomer[];
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers }) => {
  return (
    <div className="xl:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
        {CUSTOMER_UI.LIST.TITLE}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th className="p-3">{CUSTOMER_UI.LIST.COLUMNS.NAME}</th>
              <th className="p-3">{CUSTOMER_UI.LIST.COLUMNS.PHONE}</th>
              <th className="p-3">{CUSTOMER_UI.LIST.COLUMNS.EMAIL}</th>
              <th className="p-3 text-right">{CUSTOMER_UI.LIST.COLUMNS.CREDIT_LIMIT}</th>
              <th className="p-3 text-right">{CUSTOMER_UI.LIST.COLUMNS.CURRENT_DEBT}</th>
              <th className="p-3 text-right">{CUSTOMER_UI.LIST.COLUMNS.AVAILABLE_DEBT}</th>
              <th className="p-3 text-center">{CUSTOMER_UI.LIST.COLUMNS.DEBT_STATUS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-slate-800">{customer.name}</td>
                <td className="p-3 font-mono font-semibold">{customer.phone}</td>
                <td className="p-3 text-slate-500">
                  {customer.email || CUSTOMER_UI.LIST.EMPTY_EMAIL}
                </td>
                <td className="p-3 text-right">{formatCurrency(customer.creditLimit)}</td>
                <td className="p-3 text-right font-bold text-rose-600">
                  {formatCurrency(customer.debt)}
                </td>
                <td className="p-3 text-right font-bold text-emerald-600">
                  {formatCurrency(customer.creditLimit - customer.debt)}
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      customer.debt > CUSTOMER_DEBT_STATUS.THRESHOLD
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {customer.debt > CUSTOMER_DEBT_STATUS.THRESHOLD
                      ? CUSTOMER_DEBT_STATUS.HAS_DEBT
                      : CUSTOMER_DEBT_STATUS.CLEAR}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
