import React from "react";
import { NavLink } from "react-router-dom";
import { SETTINGS_NAVIGATION_ITEMS, SETTINGS_UI } from "@/constants/settings";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useAppSelector } from "@/hooks/useRedux";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-xs font-bold transition-all lg:min-h-0 ${
    isActive
      ? "bg-kv-blue-light text-kv-blue-primary"
      : "hover:bg-slate-50 text-slate-600"
  }`;

export const SettingsSidebar: React.FC = () => {
  const user = useAppSelector((state) => state?.auth?.user);
  let currentRole: TDemoRole = (user?.roleId as TDemoRole) || USER_ROLES.OWNER;
  try {
    const demoContext = useDashboardDemo();
    if (demoContext?.currentRole) {
      currentRole = demoContext.currentRole;
    }
  } catch {
    // In case component is rendered outside DashboardDemoProvider
  }

  const visibleItems = SETTINGS_NAVIGATION_ITEMS.filter((item) =>
    item.allowedRoles.includes(currentRole)
  );

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
          {visibleItems.map((item) => (
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
