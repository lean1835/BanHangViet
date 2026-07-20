import React from "react";
import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import {
  PLATFORM_ADMIN_COPY,
  PLATFORM_ADMIN_NAV_ITEMS,
} from "@/constants/platformAdmin";

const getNavLinkClassName = ({ isActive }: NavLinkRenderProps): string =>
  `flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-xs font-bold transition-all lg:min-h-0 ${
    isActive
      ? "bg-kv-blue-light text-kv-blue-primary"
      : "hover:bg-slate-50 text-slate-600"
  }`;

export const PlatformAdminSidebar: React.FC = () => {
  return (
    <>
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {PLATFORM_ADMIN_COPY.SIDEBAR_TITLE}
      </div>
      <div className="flex flex-col gap-1">
        {PLATFORM_ADMIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={getNavLinkClassName}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </>
  );
};

export default PlatformAdminSidebar;
