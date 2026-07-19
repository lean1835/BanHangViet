import React from "react";
import {
  createTaxAuthorityCode,
  TAX_AUTHORITY_APPROVAL_CONFIG,
  TAX_AUTHORITY_INVOICE_STATUS,
  TAX_AUTHORITY_LOG_ACTIONS,
  TAX_AUTHORITY_LOG_TARGETS,
  TAX_AUTHORITY_MESSAGES,
  TAX_AUTHORITY_STATUS_LABELS,
  TAX_AUTHORITY_UI,
} from "@/constants/taxAuthority";
import type {
  IInvoice,
  TInvoiceStatus,
} from "@/modules/e_invoice/types/IInvoice";
import { formatCurrency } from "@/utils/formatCurrency";

const getStatusClassName = (status: TInvoiceStatus): string => {
  if (status === TAX_AUTHORITY_INVOICE_STATUS.ISSUED) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === TAX_AUTHORITY_INVOICE_STATUS.WAITING) {
    return "bg-amber-100 text-amber-700";
  }

  if (status === TAX_AUTHORITY_INVOICE_STATUS.SEND_ERROR) {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-slate-600";
};

const getStatusLabel = (status: TInvoiceStatus): string => {
  if (status === TAX_AUTHORITY_INVOICE_STATUS.ISSUED) {
    return TAX_AUTHORITY_STATUS_LABELS.ISSUED;
  }

  if (status === TAX_AUTHORITY_INVOICE_STATUS.WAITING) {
    return TAX_AUTHORITY_STATUS_LABELS.WAITING;
  }

  if (status === TAX_AUTHORITY_INVOICE_STATUS.SEND_ERROR) {
    return TAX_AUTHORITY_STATUS_LABELS.SEND_ERROR;
  }

  return TAX_AUTHORITY_STATUS_LABELS.DEFAULT;
};

interface TaxInvoiceApprovalPageProps {
  invoices: IInvoice[];
  setInvoices: React.Dispatch<React.SetStateAction<IInvoice[]>>;
  addLogEntry: (action: string, target: string) => void;
}

export const TaxInvoiceApprovalPage: React.FC<TaxInvoiceApprovalPageProps> = ({
  invoices,
  setInvoices,
  addLogEntry,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {TAX_AUTHORITY_UI.SUMMARY.RECEIVED_TITLE}
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {invoices.length} {TAX_AUTHORITY_UI.SUMMARY.INVOICE_SUFFIX}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">
            {TAX_AUTHORITY_UI.SUMMARY.RECEIVED_DETAIL}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {TAX_AUTHORITY_UI.SUMMARY.ISSUED_TITLE}
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {
              invoices.filter(
                (invoice) =>
                  invoice.status === TAX_AUTHORITY_INVOICE_STATUS.ISSUED,
              ).length
            }{" "}
            {TAX_AUTHORITY_UI.SUMMARY.INVOICE_SUFFIX}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">
            {TAX_AUTHORITY_UI.SUMMARY.ISSUED_RATE_PREFIX}{" "}
            {TAX_AUTHORITY_APPROVAL_CONFIG.APPROVAL_RATE}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {TAX_AUTHORITY_UI.SUMMARY.WAITING_TITLE}
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {
              invoices.filter(
                (invoice) =>
                  invoice.status === TAX_AUTHORITY_INVOICE_STATUS.WAITING,
              ).length
            }{" "}
            {TAX_AUTHORITY_UI.SUMMARY.INVOICE_SUFFIX}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">
            {TAX_AUTHORITY_UI.SUMMARY.WAITING_DETAIL}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-2">
          {TAX_AUTHORITY_UI.APPROVAL.TITLE}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="p-3">{TAX_AUTHORITY_UI.APPROVAL.COLUMNS.INVOICE_CODE}</th>
                <th className="p-3">{TAX_AUTHORITY_UI.APPROVAL.COLUMNS.CUSTOMER}</th>
                <th className="p-3 text-right">
                  {TAX_AUTHORITY_UI.APPROVAL.COLUMNS.TOTAL}
                </th>
                <th className="p-3 text-center">
                  {TAX_AUTHORITY_UI.APPROVAL.COLUMNS.STATUS}
                </th>
                <th className="p-3">{TAX_AUTHORITY_UI.APPROVAL.COLUMNS.TAX_CODE}</th>
                <th className="p-3 text-center">
                  {TAX_AUTHORITY_UI.APPROVAL.COLUMNS.ACTIONS}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-slate-800">
                    {invoice.lookupCode}
                  </td>
                  <td className="p-3 text-slate-700 font-bold">{invoice.customer}</td>
                  <td className="p-3 text-right font-bold text-kv-blue-primary">
                    {formatCurrency(invoice.finalAmount)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusClassName(invoice.status)}`}
                    >
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-xs text-slate-500">
                    {invoice.taxAuthorityCode}
                  </td>
                  <td className="p-3 text-center">
                    {invoice.status === TAX_AUTHORITY_INVOICE_STATUS.WAITING ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setInvoices((previousInvoices) =>
                              previousInvoices.map((item) => {
                                if (item.id === invoice.id) {
                                  return {
                                    ...item,
                                    status: TAX_AUTHORITY_INVOICE_STATUS.ISSUED,
                                    taxAuthorityCode: createTaxAuthorityCode(),
                                  };
                                }
                                return item;
                              }),
                            );
                            addLogEntry(
                              TAX_AUTHORITY_LOG_ACTIONS.APPROVE,
                              TAX_AUTHORITY_LOG_TARGETS.approve(invoice.lookupCode),
                            );
                            alert(TAX_AUTHORITY_MESSAGES.APPROVE_SUCCESS);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px]"
                        >
                          {TAX_AUTHORITY_UI.APPROVAL.APPROVE_ACTION}
                        </button>
                        <button
                          onClick={() => {
                            setInvoices((previousInvoices) =>
                              previousInvoices.map((item) => {
                                if (item.id === invoice.id) {
                                  return {
                                    ...item,
                                    status: TAX_AUTHORITY_INVOICE_STATUS.SEND_ERROR,
                                    taxAuthorityCode:
                                      TAX_AUTHORITY_APPROVAL_CONFIG.EMPTY_TAX_CODE,
                                  };
                                }
                                return item;
                              }),
                            );
                            addLogEntry(
                              TAX_AUTHORITY_LOG_ACTIONS.REJECT,
                              TAX_AUTHORITY_LOG_TARGETS.reject(invoice.lookupCode),
                            );
                            alert(TAX_AUTHORITY_MESSAGES.REJECT_SUCCESS);
                          }}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-[10px]"
                        >
                          {TAX_AUTHORITY_UI.APPROVAL.REJECT_ACTION}
                        </button>
                      </div>
                    ) : invoice.status === TAX_AUTHORITY_INVOICE_STATUS.ISSUED ? (
                      <span className="text-emerald-600 text-[10px] font-bold">
                        {TAX_AUTHORITY_MESSAGES.APPROVED_STATE}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-semibold italic">
                        {TAX_AUTHORITY_MESSAGES.NO_ACTION}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export type { TaxInvoiceApprovalPageProps };
export default TaxInvoiceApprovalPage;
