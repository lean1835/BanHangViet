import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  HIDDEN_NAVIGATION_BY_ROLE,
  NAVIGATION_ITEM_IDS,
  PRIMARY_NAVIGATION_ACTION,
  PRIMARY_NAVIGATION_ITEMS,
} from "@/constants/navigation";
import { APP_ROUTES } from "@/constants/routes";
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
  const location = useLocation();

  const isPosScreen =
    location.pathname === APP_ROUTES.POS ||
    location.pathname.startsWith(APP_ROUTES.POS);

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

      {!isPosScreen && (
        <button
          onClick={() => navigate(PRIMARY_NAVIGATION_ACTION.PATH)}
          aria-label={PRIMARY_NAVIGATION_ACTION.LABEL}
          title={PRIMARY_NAVIGATION_ACTION.LABEL}
          className="my-auto flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#00b865] hover:bg-[#00a359] active:scale-95 px-3.5 text-xs font-black text-white shadow-sm shadow-emerald-900/30 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-4 h-4 text-white shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <span className="hidden sm:inline">{PRIMARY_NAVIGATION_ACTION.LABEL}</span>
        </button>
      )}
    </div>
  );
};

export default DashboardNavigation;
