import React from "react";
import { INVOICE_STATUS_OPTIONS, E_INVOICE_UI } from "@/constants/eInvoice";
import type { TInvoiceStatus } from "../types/IInvoice";

interface InvoiceSidebarProps {
  statusFilter: TInvoiceStatus[];
  setStatusFilter: React.Dispatch<React.SetStateAction<TInvoiceStatus[]>>;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const InvoiceSidebar: React.FC<InvoiceSidebarProps> = ({
  statusFilter,
  setStatusFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  searchQuery,
  setSearchQuery,
}) => {
  const selectedStatus = statusFilter.length === 0 ? "ALL" : statusFilter[0];

  const handleStatusRadioChange = (val: string) => {
    if (val === "ALL") {
      setStatusFilter([]);
    } else {
      setStatusFilter([val as TInvoiceStatus]);
    }
  };

  return (
    <>
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {E_INVOICE_UI.SIDEBAR.TITLE}
      </div>

      {/* Tìm kiếm */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {E_INVOICE_UI.SIDEBAR.QUICK_SEARCH_LABEL}
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={E_INVOICE_UI.SIDEBAR.SEARCH_PLACEHOLDER}
          className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold"
        />
      </div>

      {/* Bộ lọc thời gian */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Thời gian lập
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 h-8 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-700"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 h-8 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Trạng thái hóa đơn
        </span>
        <select
          value={selectedStatus}
          onChange={(e) => handleStatusRadioChange(e.target.value)}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 cursor-pointer"
        >
          {INVOICE_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};
