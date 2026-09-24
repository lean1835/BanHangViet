import React, { useState, useEffect, useMemo, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { SETTINGS_GROUPS, SETTINGS_UI } from "@/constants/settings";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useAppSelector } from "@/hooks/useRedux";
import { USER_ROLES, type TDemoRole } from "@/constants/roles";

export const SettingsSidebar: React.FC = () => {
  const location = useLocation();
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

  const isItemActive = useCallback(
    (path: string): boolean => {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    },
    [location.pathname]
  );

  const visibleGroups = useMemo(() => {
    return SETTINGS_GROUPS.map((group) => {
      const filteredItems = group.items.filter((item) =>
        item.allowedRoles.includes(currentRole)
      );
      return {
        ...group,
        items: filteredItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [currentRole]);

  const activeGroupId = useMemo(() => {
    for (const group of visibleGroups) {
      if (group.items.some((item) => isItemActive(item.path))) {
        return group.id;
      }
    }
    return visibleGroups[0]?.id || "account";
  }, [isItemActive, visibleGroups]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    [activeGroupId]: true,
  });

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => ({
        ...prev,
        [activeGroupId]: true,
      }));
    }
  }, [activeGroupId]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {SETTINGS_UI.SIDEBAR.TITLE}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] mb-1">
          {SETTINGS_UI.SIDEBAR.SECTION_LABEL}
        </span>
        {visibleGroups.map((group) => {
          const isOpen = !!openGroups[group.id];
          const hasActiveItem = group.items.some((item) => isItemActive(item.path));

          return (
            <div key={group.id} className="flex flex-col min-w-0">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs font-bold transition-all cursor-pointer ${
                  hasActiveItem
                    ? "text-kv-blue-primary bg-slate-50"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{group.label}</span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-300 ease-in-out shrink-0 ${
                    isOpen ? "rotate-180 text-slate-600" : ""
                  }`}
                />
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-0.5 pl-3 pt-0.5 pb-1.5 min-w-0">
                    {group.items.map((item) => {
                      const active = isItemActive(item.path);

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`flex min-h-9 w-full items-center rounded-md px-3 py-1.5 text-left text-xs transition-all ${
                            active
                              ? "bg-kv-blue-light text-kv-blue-primary font-bold"
                              : "hover:bg-slate-50 text-slate-600 font-normal"
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsSidebar;
