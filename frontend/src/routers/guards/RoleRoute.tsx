import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getRoleHomeRoute } from "@/constants/navigation";
import type { TDemoRole } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";

interface RoleRouteProps {
  allowedRoles: readonly TDemoRole[];
  children: ReactNode;
}

export const RoleRoute = ({ allowedRoles, children }: RoleRouteProps) => {
  const { currentRole } = useDashboardDemo();

  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={getRoleHomeRoute(currentRole)} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
