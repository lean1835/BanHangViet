import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/redux";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default PublicRoute;
