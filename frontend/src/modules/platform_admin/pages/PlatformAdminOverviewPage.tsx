import React from "react";
import { PLATFORM_ADMIN_OVERVIEW } from "@/constants/platformAdmin";

export const PlatformAdminOverviewPage: React.FC = () => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {PLATFORM_ADMIN_OVERVIEW.HOUSEHOLDS.label}
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {PLATFORM_ADMIN_OVERVIEW.HOUSEHOLDS.value}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">
            {PLATFORM_ADMIN_OVERVIEW.HOUSEHOLDS.detail}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {PLATFORM_ADMIN_OVERVIEW.ACTIVE_USERS.label}
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {PLATFORM_ADMIN_OVERVIEW.ACTIVE_USERS.value}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            {PLATFORM_ADMIN_OVERVIEW.ACTIVE_USERS.detail}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {PLATFORM_ADMIN_OVERVIEW.TRANSMITTED_INVOICES.label}
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {PLATFORM_ADMIN_OVERVIEW.TRANSMITTED_INVOICES.value}
          </div>
          <div className="text-[10px] text-indigo-600 font-bold mt-1">
            {PLATFORM_ADMIN_OVERVIEW.TRANSMITTED_INVOICES.detail}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {PLATFORM_ADMIN_OVERVIEW.API_GATEWAY.label}
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {PLATFORM_ADMIN_OVERVIEW.API_GATEWAY.value}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">
            {PLATFORM_ADMIN_OVERVIEW.API_GATEWAY.detail}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4">
          {PLATFORM_ADMIN_OVERVIEW.CHART_TITLE}
        </h3>
        <div className="h-[200px] flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
          <span className="font-bold">
            {PLATFORM_ADMIN_OVERVIEW.CHART_PLACEHOLDER}
          </span>
        </div>
      </div>
    </>
  );
};

export default PlatformAdminOverviewPage;
