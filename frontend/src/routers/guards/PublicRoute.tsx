import React from "react";
import { Navigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/hooks/useRedux";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to={APP_ROUTES.DASHBOARD} replace />;
};

export default PublicRoute;
