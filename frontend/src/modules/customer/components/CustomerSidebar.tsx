import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CUSTOMER_FILTER_OPTIONS, CUSTOMER_UI } from "@/constants/customer";
import { APP_ROUTES } from "@/constants/routes";

export interface CustomerSidebarProps {
  selectedDebtStatus: string;
  onSelectDebtStatus: (status: string) => void;
  debtFrom?: string;
  debtTo?: string;
  onDebtFromChange?: (val: string) => void;
  onDebtToChange?: (val: string) => void;
}

const getNavLinkClass = (isActive: boolean): string =>
  `flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-bold transition-all lg:min-h-0 ${
    isActive
      ? "bg-kv-blue-light text-kv-blue-primary"
      : "hover:bg-slate-50 text-slate-600"
  }`;

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  selectedDebtStatus,
  onSelectDebtStatus,
  debtFrom = "",
  debtTo = "",
  onDebtFromChange,
  onDebtToChange,
}) => {
  const location = useLocation();
  const isCustomerActive =
    location.pathname === APP_ROUTES.CUSTOMERS ||
    location.pathname.startsWith("/customers");

  return (
    <div className="flex flex-col gap-4">
      {/* Header Title */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {CUSTOMER_UI.SIDEBAR.TITLE || "Khách hàng"}
      </div>

      {/* DANH MỤC CHỨC NĂNG */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          DANH MỤC CHỨC NĂNG
        </span>
        <div className="flex flex-col gap-1">
          <NavLink
            to={APP_ROUTES.CUSTOMERS}
            className={() => getNavLinkClass(isCustomerActive)}
          >
            <span>Quản lý Khách hàng</span>
          </NavLink>
        </div>
      </div>

      {/* BỘ LỌC KHÁCH HÀNG */}
      <div className="border-t pt-4 flex flex-col gap-4 w-full text-xs font-semibold text-slate-700">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          BỘ LỌC KHÁCH HÀNG
        </span>

        {/* Nợ hiện tại (Từ - Tới) */}
        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-slate-700">Nợ hiện tại</span>
          <div className="space-y-2">
            <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-kv-blue-primary">
              <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-medium shrink-0">
                Từ
              </span>
              <input
                type="text"
                placeholder="Nhập giá trị"
                value={debtFrom}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  onDebtFromChange?.(val);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-kv-blue-primary">
              <span className="bg-slate-50 border-r border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-medium shrink-0">
                Tới
              </span>
              <input
                type="text"
                placeholder="Nhập giá trị"
                value={debtTo}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  onDebtToChange?.(val);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Trạng thái */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="customer-debt-status-filter" className="font-bold text-slate-700">
            Trạng thái
          </label>
          <select
            id="customer-debt-status-filter"
            value={selectedDebtStatus}
            onChange={(e) => onSelectDebtStatus(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-normal text-slate-700 text-xs focus:outline-none focus:border-kv-blue-primary cursor-pointer"
          >
            {CUSTOMER_FILTER_OPTIONS.DEBT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
export default CustomerSidebar;
