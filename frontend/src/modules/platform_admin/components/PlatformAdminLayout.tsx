import React from "react";
import { Outlet } from "react-router-dom";
import { PlatformAdminHeader } from "./PlatformAdminHeader";

export const PlatformAdminLayout: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <PlatformAdminHeader />
      <Outlet />
    </div>
  );
};

export default PlatformAdminLayout;
