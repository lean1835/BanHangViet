import React from "react";
import { Navigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/hooks/useRedux";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to={APP_ROUTES.LOGIN} replace />;
};

export default PrivateRoute;
