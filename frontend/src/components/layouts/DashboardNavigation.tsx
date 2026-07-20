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
    <div className="flex h-11 shrink-0 items-center justify-between gap-2 bg-kv-blue-primary px-2 text-white shadow-md sm:px-4">
      <nav aria-label="Điều hướng chính" className="flex h-full min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

              return `h-full shrink-0 px-3 sm:px-5 flex items-center gap-1.5 font-bold hover:bg-kv-blue-dark transition-colors border-b-2 text-xs leading-none ${
                isActive || isPortalOverview
                  ? "bg-white text-kv-blue-primary border-white"
                  : "border-transparent text-white/95"
              }`;
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => navigate(PRIMARY_NAVIGATION_ACTION.PATH)}
        aria-label={PRIMARY_NAVIGATION_ACTION.LABEL}
        title={PRIMARY_NAVIGATION_ACTION.LABEL}
        className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-kv-green px-2 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-4"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M2.57 7.57a2 2 0 0 1 1.44-.57H20a2 2 0 0 1 1.94 2.5l-2 8A2 2 0 0 1 18 19H6a2 2 0 0 1-1.94-1.5l-2-8A2 2 0 0 1 2.57 7.57zM16 11a4 4 0 0 1-8 0" />
        </svg>
        <span className="hidden sm:inline">{PRIMARY_NAVIGATION_ACTION.LABEL}</span>
      </button>
    </div>
  );
};
