import React from "react";
import {
  Store,
  Users,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import { PLATFORM_ADMIN_OVERVIEW } from "@/constants/platformAdmin";
import { useGetAdminHouseholdsQuery } from "../services/platformAdminApi";
import { InvoiceTransmissionChart } from "../components/InvoiceTransmissionChart";
import { formatNumber } from "@/utils/formatCurrency";

export const PlatformAdminOverviewPage: React.FC = () => {
  const { data: households = [], isLoading } = useGetAdminHouseholdsQuery();

  // Dynamic metrics from actual database
  const totalHouseholds = households.length;
  const activeHouseholds = households.filter((h) => h.status === "ACTIVE").length;
  const lockedHouseholds = totalHouseholds - activeHouseholds;
  const totalUsers = households.reduce((sum, h) => sum + (h.userCount || 0), 0);
  const totalInvoicesMonth = households.reduce(
    (sum, h) => sum + (h.invoiceCountMonth || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* KPI Stats Top Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Households */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {PLATFORM_ADMIN_OVERVIEW.HOUSEHOLDS.label}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {isLoading ? (
                <span className="text-slate-300 animate-pulse">...</span>
              ) : totalHouseholds > 0 ? (
                `${totalHouseholds} hộ`
              ) : (
                PLATFORM_ADMIN_OVERVIEW.HOUSEHOLDS.value
              )}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              {totalHouseholds > 0
                ? `${activeHouseholds} đang hoạt động / ${lockedHouseholds} bị khóa`
                : PLATFORM_ADMIN_OVERVIEW.HOUSEHOLDS.detail}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-kv-blue-primary">
            <Store size={22} />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {PLATFORM_ADMIN_OVERVIEW.ACTIVE_USERS.label}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {isLoading ? (
                <span className="text-slate-300 animate-pulse">...</span>
              ) : totalUsers > 0 ? (
                `${totalUsers} users`
              ) : (
                PLATFORM_ADMIN_OVERVIEW.ACTIVE_USERS.value
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              {PLATFORM_ADMIN_OVERVIEW.ACTIVE_USERS.detail}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Users size={22} />
          </div>
        </div>

        {/* Transmitted Invoices */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {PLATFORM_ADMIN_OVERVIEW.TRANSMITTED_INVOICES.label}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalInvoicesMonth > 0
                ? `${formatNumber(totalInvoicesMonth)} HĐ`
                : PLATFORM_ADMIN_OVERVIEW.TRANSMITTED_INVOICES.value}
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-1">
              {PLATFORM_ADMIN_OVERVIEW.TRANSMITTED_INVOICES.detail}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <FileCheck size={22} />
          </div>
        </div>

        {/* API Gateway Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              {PLATFORM_ADMIN_OVERVIEW.API_GATEWAY.label}
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {PLATFORM_ADMIN_OVERVIEW.API_GATEWAY.value}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{PLATFORM_ADMIN_OVERVIEW.API_GATEWAY.detail}</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* Interactive Invoice Transmission Chart & Gateway Diagnostics */}
      <InvoiceTransmissionChart />
    </div>
  );
};

export default PlatformAdminOverviewPage;
