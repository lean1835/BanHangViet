import React from "react";
import { NavLink } from "react-router-dom";
import { REPORT_NAVIGATION_ITEMS, REPORT_UI } from "@/constants/report";

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-xs font-bold transition-all lg:min-h-0 ${
    isActive
      ? "bg-kv-blue-light text-kv-blue-primary"
      : "hover:bg-slate-50 text-slate-600"
  }`;

export const ReportSidebar: React.FC = () => {
  return (
    <>
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {REPORT_UI.SIDEBAR.TITLE}
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {REPORT_UI.SIDEBAR.SECTION_LABEL}
        </span>
        <div className="flex flex-col gap-1">
          {REPORT_NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={getNavLinkClassName}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};
