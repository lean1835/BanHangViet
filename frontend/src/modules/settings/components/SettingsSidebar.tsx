import React from "react";
import { NavLink } from "react-router-dom";
import { SETTINGS_NAVIGATION_ITEMS, SETTINGS_UI } from "@/constants/settings";

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `w-full text-left py-2 px-3 rounded-md font-bold transition-all text-xs ${
    isActive
      ? "bg-kv-blue-light text-kv-blue-primary"
      : "hover:bg-slate-50 text-slate-600"
  }`;

export const SettingsSidebar: React.FC = () => {
  return (
    <>
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {SETTINGS_UI.SIDEBAR.TITLE}
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {SETTINGS_UI.SIDEBAR.SECTION_LABEL}
        </span>
        <div className="flex flex-col gap-1">
          {SETTINGS_NAVIGATION_ITEMS.map((item) => (
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
