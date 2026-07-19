import { NavLink, useNavigate } from "react-router-dom";
import {
  HIDDEN_NAVIGATION_BY_ROLE,
  NAVIGATION_ITEM_IDS,
  PRIMARY_NAVIGATION_ACTION,
  PRIMARY_NAVIGATION_ITEMS,
} from "@/constants/navigation";
import { USER_ROLES } from "@/constants/roles";
import type { TDemoRole } from "@/constants/roles";

interface DashboardNavigationProps {
  currentRole: TDemoRole;
}

const isNavigationItemVisible = (itemId: string, currentRole: TDemoRole): boolean => {
  const hiddenItems = HIDDEN_NAVIGATION_BY_ROLE[currentRole] || [];
  return !hiddenItems.includes(itemId);
};

export const DashboardNavigation = ({ currentRole }: DashboardNavigationProps) => {
  const navigate = useNavigate();

  return (
    <div className="h-10 bg-kv-blue-primary text-white flex items-center px-4 justify-between shadow-md shrink-0">
      <div className="flex items-center h-full">
        {PRIMARY_NAVIGATION_ITEMS.filter((item) =>
          isNavigationItemVisible(item.id, currentRole)
        ).map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.id === NAVIGATION_ITEM_IDS.DASHBOARD}
            className={({ isActive }) => {
              const isPortalOverview =
                (currentRole === USER_ROLES.PLATFORM_ADMIN ||
                  currentRole === USER_ROLES.TAX_AUTHORITY) &&
                item.id === NAVIGATION_ITEM_IDS.DASHBOARD;

              return `h-full px-5 flex items-center gap-1.5 font-bold hover:bg-kv-blue-dark transition-colors border-b-2 text-xs leading-none ${
                isActive || isPortalOverview
                  ? "bg-white text-kv-blue-primary border-white"
                  : "border-transparent text-white/95"
              }`;
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <button
        onClick={() => navigate(PRIMARY_NAVIGATION_ACTION.PATH)}
        className="bg-kv-green hover:bg-emerald-600 transition-colors px-4 h-7 text-[11px] font-bold text-white rounded-md flex items-center gap-1.5 shadow-sm"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M2.57 7.57a2 2 0 0 1 1.44-.57H20a2 2 0 0 1 1.94 2.5l-2 8A2 2 0 0 1 18 19H6a2 2 0 0 1-1.94-1.5l-2-8A2 2 0 0 1 2.57 7.57zM16 11a4 4 0 0 1-8 0" />
        </svg>
        {PRIMARY_NAVIGATION_ACTION.LABEL}
      </button>
    </div>
  );
};
