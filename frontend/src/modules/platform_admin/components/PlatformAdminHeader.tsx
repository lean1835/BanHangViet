import React from "react";
import { PLATFORM_ADMIN_COPY } from "@/constants/platformAdmin";

export const PlatformAdminHeader: React.FC = () => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-slate-800">
          {PLATFORM_ADMIN_COPY.HEADER_TITLE}
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          {PLATFORM_ADMIN_COPY.HEADER_DESCRIPTION}
        </p>
      </div>
      <div className="bg-kv-blue-light text-kv-blue-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200">
        {PLATFORM_ADMIN_COPY.ROLE_BADGE}
      </div>
    </div>
  );
};

export default PlatformAdminHeader;
