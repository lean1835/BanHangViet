import React from "react";
import { NavLink } from "react-router-dom";
import { CUSTOMER_FILTER_OPTIONS, CUSTOMER_UI } from "@/constants/customer";
import { APP_ROUTES } from "@/constants/routes";

export const CustomerSidebar: React.FC = () => {
  return (
    <>
      <NavLink
        to={APP_ROUTES.CUSTOMERS}
        end
        className="font-extrabold text-sm text-slate-800 border-b pb-2"
      >
        {CUSTOMER_UI.SIDEBAR.TITLE}
      </NavLink>
      <div className="flex flex-col gap-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {CUSTOMER_UI.SIDEBAR.TYPE_FILTER}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CUSTOMER_FILTER_OPTIONS.TYPES.map((type) => (
            <span
              key={type}
              className={
                type === CUSTOMER_FILTER_OPTIONS.DEFAULT_TYPE
                  ? "rounded bg-kv-blue-light px-2 py-1 font-bold text-kv-blue-primary"
                  : "rounded bg-slate-100 px-2 py-1 font-bold text-slate-700"
              }
            >
              {type}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {CUSTOMER_UI.SIDEBAR.GENDER_FILTER}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CUSTOMER_FILTER_OPTIONS.GENDERS.map((gender) => (
            <span
              key={gender}
              className={
                gender === CUSTOMER_FILTER_OPTIONS.DEFAULT_GENDER
                  ? "rounded bg-kv-blue-light px-2 py-1 font-bold text-kv-blue-primary"
                  : "rounded bg-slate-100 px-2 py-1 font-bold text-slate-700"
              }
            >
              {gender}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};
