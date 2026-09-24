import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PlatformAdminHeader } from "./PlatformAdminHeader";
import { PageLoadingFallback } from "@/components/common/PageLoadingFallback";

export const PlatformAdminLayout: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <PlatformAdminHeader />
      <Suspense fallback={<PageLoadingFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default PlatformAdminLayout;

