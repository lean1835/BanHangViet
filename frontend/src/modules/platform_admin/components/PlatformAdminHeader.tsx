import React from "react";
import { PLATFORM_ADMIN_COPY } from "@/constants/platformAdmin";

export const PlatformAdminHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold text-slate-800">
          {PLATFORM_ADMIN_COPY.HEADER_TITLE}
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          {PLATFORM_ADMIN_COPY.HEADER_DESCRIPTION}
        </p>
      </div>
      <div className="shrink-0 rounded-lg border border-blue-200 bg-kv-blue-light px-3 py-1.5 text-xs font-bold text-kv-blue-primary">
        {PLATFORM_ADMIN_COPY.ROLE_BADGE}
      </div>
    </div>
  );
};

export default PlatformAdminHeader;
