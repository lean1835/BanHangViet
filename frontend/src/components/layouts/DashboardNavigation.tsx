import { useState, useLayoutEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import {
  HIDDEN_NAVIGATION_BY_ROLE,
  NAVIGATION_ITEM_IDS,
  PRIMARY_NAVIGATION_ACTION,
  PRIMARY_NAVIGATION_ITEMS,
  type IPrimaryNavigationItem,
} from "@/constants/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import type { TDemoRole } from "@/constants/roles";

interface DashboardNavigationProps {
  currentRole: TDemoRole;
  pendingCount?: number;
  onSync?: () => void;
}

const isNavigationItemVisible = (itemId: string, currentRole: TDemoRole): boolean => {
  const hiddenItems = HIDDEN_NAVIGATION_BY_ROLE[currentRole] || [];
  return !hiddenItems.includes(itemId);
};

export const DashboardNavigation = ({
  currentRole,
  pendingCount = 0,
  onSync,
}: DashboardNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [hasRendered, setHasRendered] = useState(false);

  const isPosScreen =
    location.pathname === APP_ROUTES.POS ||
    location.pathname.startsWith(APP_ROUTES.POS);

  const visibleItems = PRIMARY_NAVIGATION_ITEMS.filter((item) =>
    isNavigationItemVisible(item.id, currentRole)
  );

  const isItemActive = (item: IPrimaryNavigationItem) => {
    const isPortalOverview =
      (currentRole === USER_ROLES.PLATFORM_ADMIN ||
        currentRole === USER_ROLES.TAX_AUTHORITY) &&
      item.id === NAVIGATION_ITEM_IDS.DASHBOARD;

    if (isPortalOverview) return true;

    if (item.id === NAVIGATION_ITEM_IDS.DASHBOARD) {
      return (
        location.pathname === item.path ||
        location.pathname === APP_ROUTES.ROOT ||
        location.pathname === ""
      );
    }
    return (
      location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`)
    );
  };

  const activeItem = visibleItems.find(isItemActive);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      if (activeItem && itemRefs.current[activeItem.id]) {
        const el = itemRefs.current[activeItem.id];
        if (el) {
          setIndicatorStyle({
            left: el.offsetLeft,
            width: el.offsetWidth,
            opacity: 1,
          });
          requestAnimationFrame(() => {
            setHasRendered(true);
          });
        }
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [location.pathname, activeItem]);

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-3 bg-kv-blue-primary px-3 text-white shadow-md sm:px-4 select-none">
      <nav
        ref={navRef}
        aria-label="Điều hướng chính"
        className="relative flex h-full min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Sliding Active Indicator với animation lướt mượt mà */}
        <div
          className="absolute top-0 bottom-0 bg-white border-b-2 border-white shadow-inner pointer-events-none z-0"
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
            transition: hasRendered
              ? "transform 320ms cubic-bezier(0.25, 1, 0.5, 1), width 320ms cubic-bezier(0.25, 1, 0.5, 1), opacity 150ms ease"
              : "opacity 150ms ease",
            willChange: "transform, width",
          }}
        />

        {visibleItems.map((item) => {
          const isActive = isItemActive(item);

          return (
            <NavLink
              key={item.id}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              to={item.path}
              end={item.id === NAVIGATION_ITEM_IDS.DASHBOARD}
              className={`relative z-10 h-full shrink-0 px-3 sm:px-5 flex items-center gap-1.5 font-bold transition-colors duration-200 border-b-2 text-xs whitespace-nowrap leading-none ${
                isActive
                  ? "text-kv-blue-primary border-transparent"
                  : "text-white/95 hover:text-white hover:bg-kv-blue-dark transition-colors border-transparent"
              }`}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        {pendingCount > 0 && (
          <button
            onClick={onSync}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-500/20 px-2.5 font-bold text-amber-100 hover:bg-amber-500/30 transition-colors text-xs whitespace-nowrap cursor-pointer"
            title="Số lượng đơn hàng ngoại tuyến đang chờ đồng bộ"
          >
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>{pendingCount} đơn chờ đồng bộ</span>
          </button>
        )}

        {!isPosScreen && (
          <button
            onClick={() => navigate(PRIMARY_NAVIGATION_ACTION.PATH)}
            aria-label={PRIMARY_NAVIGATION_ACTION.LABEL}
            title={PRIMARY_NAVIGATION_ACTION.LABEL}
            className="my-auto flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#00b865] hover:bg-[#00a359] active:scale-95 px-3.5 text-xs font-bold text-white whitespace-nowrap shadow-sm shadow-emerald-900/30 transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ShoppingCart size={16} className="text-white shrink-0" />
            <span className="whitespace-nowrap">{PRIMARY_NAVIGATION_ACTION.LABEL}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardNavigation;
