import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import type { TDemoRole } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { DashboardNavigation } from "./DashboardNavigation";
import { DashboardUtilityBar } from "./DashboardUtilityBar";

export const AuthenticatedAppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentRole,
    setCurrentRole,
    isOnline,
    setIsOnline,
    simConflict,
    setSimConflict,
  } = useDashboardDemo();

  const handleRoleChange = (newRole: TDemoRole) => {
    setCurrentRole(newRole);

    if (newRole === USER_ROLES.PLATFORM_ADMIN) {
      navigate(APP_ROUTES.ADMIN_OVERVIEW);
      return;
    }

    if (newRole === USER_ROLES.TAX_AUTHORITY) {
      navigate(APP_ROUTES.TAX_AUTHORITY_INVOICES);
      return;
    }

    if (
      newRole === USER_ROLES.CASHIER ||
      location.pathname.startsWith(APP_ROUTES.ADMIN) ||
      location.pathname.startsWith(APP_ROUTES.TAX_AUTHORITY) ||
      (newRole === USER_ROLES.ACCOUNTANT &&
        location.pathname.startsWith(APP_ROUTES.SHIFTS))
    ) {
      navigate(APP_ROUTES.DASHBOARD);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 text-xs font-sans select-none">
      <DashboardUtilityBar
        currentRole={currentRole}
        isOnline={isOnline}
        simConflict={simConflict}
        onRoleChange={handleRoleChange}
        onToggleOnline={() => setIsOnline((currentValue) => !currentValue)}
        onConflictChange={setSimConflict}
      />
      <DashboardNavigation currentRole={currentRole} />
      <Outlet />
    </div>
  );
};

export default AuthenticatedAppLayout;
