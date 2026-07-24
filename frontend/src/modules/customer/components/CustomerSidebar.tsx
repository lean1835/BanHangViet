import React from "react";
import { NavLink } from "react-router-dom";
import { CUSTOMER_FILTER_OPTIONS, CUSTOMER_UI } from "@/constants/customer";
import { APP_ROUTES } from "@/constants/routes";

interface CustomerSidebarProps {
  selectedDebtStatus: string;
  onSelectDebtStatus: (status: string) => void;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  selectedDebtStatus,
  onSelectDebtStatus,
}) => {
  return (
    <>
      <NavLink
        to={APP_ROUTES.CUSTOMERS}
        end
        className="font-extrabold text-sm text-slate-800 border-b pb-2 block"
      >
        {CUSTOMER_UI.SIDEBAR.TITLE}
      </NavLink>

      {/* Debt Status Dropdown */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="customer-debt-status-filter"
          className="font-bold text-slate-400 uppercase tracking-wide text-[10px]"
        >
          {CUSTOMER_UI.SIDEBAR.DEBT_FILTER}
        </label>
        <select
          id="customer-debt-status-filter"
          value={selectedDebtStatus}
          onChange={(e) => onSelectDebtStatus(e.target.value)}
          className="h-9 w-full px-3 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-kv-blue-primary shadow-sm transition-all cursor-pointer"
        >
          {CUSTOMER_FILTER_OPTIONS.DEBT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};
