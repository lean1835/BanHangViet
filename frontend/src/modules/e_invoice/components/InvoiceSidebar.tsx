import React from "react";
import { E_INVOICE_STATUS } from "@/constants/eInvoice";
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

const INVOICE_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: E_INVOICE_STATUS.DRAFT, label: "Nháp (DRAFT)" },
  { value: E_INVOICE_STATUS.WAITING_TAX_CODE, label: "Chờ cấp mã (WAITING)" },
  { value: E_INVOICE_STATUS.ISSUED, label: "Đã cấp mã (ISSUED)" },
  { value: E_INVOICE_STATUS.SEND_ERROR, label: "Lỗi gửi thuế (SEND_ERROR)" },
  { value: E_INVOICE_STATUS.ADJUSTED, label: "Điều chỉnh (ADJUSTED)" },
  { value: E_INVOICE_STATUS.CANCELED, label: "Đã hủy (CANCELED)" },
];

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
        Bộ lọc Hóa đơn
      </div>

      {/* Tìm kiếm */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Tìm kiếm nhanh
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Mã tra cứu, khách hàng..."
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
      <div className="flex flex-col gap-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Trạng thái hóa đơn
        </span>
        <div className="flex flex-col gap-2 font-medium text-slate-700">
          {INVOICE_STATUS_OPTIONS.map((status) => (
            <label key={status.value} className="flex min-h-11 cursor-pointer items-center gap-2 lg:min-h-0 text-xs">
              <input
                type="radio"
                name="invoiceStatusFilter"
                value={status.value}
                checked={selectedStatus === status.value}
                onChange={() => handleStatusRadioChange(status.value)}
                className="border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
              />
              <span>{status.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
};
