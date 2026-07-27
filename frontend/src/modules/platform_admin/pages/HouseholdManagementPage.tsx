import React from "react";
import {
  PLATFORM_ADMIN_HOUSEHOLD_ACTION,
  PLATFORM_ADMIN_HOUSEHOLD_STATUS,
  PLATFORM_ADMIN_HOUSEHOLDS,
  PLATFORM_ADMIN_MESSAGES,
  PLATFORM_ADMIN_PLAN,
  PLATFORM_ADMIN_UI,
  type TPlatformAdminHouseholdAction,
  type TPlatformAdminHouseholdStatus,
  type TPlatformAdminPlan,
} from "@/constants/platformAdmin";
import { useNotification } from "@/hooks/useNotification";

const getPlanBadgeClassName = (plan: TPlatformAdminPlan): string => {
  if (plan === PLATFORM_ADMIN_PLAN.PREMIUM) {
    return "bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold";
  }
  if (plan === PLATFORM_ADMIN_PLAN.STANDARD) {
    return "bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold";
  }
  return "bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold";
};

const getStatusBadgeClassName = (
  status: TPlatformAdminHouseholdStatus,
): string =>
  status === PLATFORM_ADMIN_HOUSEHOLD_STATUS.ACTIVE
    ? "bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold"
    : "bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold";

const getActionClassName = (action: TPlatformAdminHouseholdAction): string =>
  action === PLATFORM_ADMIN_HOUSEHOLD_ACTION.LOCK
    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold text-[10px]"
    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold text-[10px]";

export const HouseholdManagementPage: React.FC = () => {
  const { showInfo } = useNotification();
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-2">
        {PLATFORM_ADMIN_UI.HOUSEHOLDS.TITLE}
      </h3>
      <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th className="p-3">{PLATFORM_ADMIN_UI.HOUSEHOLDS.COLUMNS.HOUSEHOLD}</th>
              <th className="p-3">{PLATFORM_ADMIN_UI.HOUSEHOLDS.COLUMNS.TAX_CODE}</th>
              <th className="p-3">{PLATFORM_ADMIN_UI.HOUSEHOLDS.COLUMNS.REPRESENTATIVE}</th>
              <th className="p-3">{PLATFORM_ADMIN_UI.HOUSEHOLDS.COLUMNS.PLAN}</th>
              <th className="p-3">{PLATFORM_ADMIN_UI.HOUSEHOLDS.COLUMNS.EXPIRY}</th>
              <th className="p-3 text-center">
                {PLATFORM_ADMIN_UI.HOUSEHOLDS.COLUMNS.STATUS}
              </th>
              <th className="p-3 text-center">
                {PLATFORM_ADMIN_UI.HOUSEHOLDS.COLUMNS.ACTIONS}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {PLATFORM_ADMIN_HOUSEHOLDS.map((household) => (
              <tr key={household.id}>
                <td className="p-3 font-bold text-slate-800">{household.name}</td>
                <td className="p-3 font-mono font-bold">{household.taxCode}</td>
                <td className="p-3">{household.representative}</td>
                <td className="p-3">
                  <span className={getPlanBadgeClassName(household.plan)}>
                    {household.planLabel}
                  </span>
                </td>
                <td
                  className={
                    household.isExpired ? "p-3 text-rose-500 font-bold" : "p-3"
                  }
                >
                  {household.expiry}
                </td>
                <td className="p-3 text-center">
                  <span className={getStatusBadgeClassName(household.status)}>
                    {household.statusLabel}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() =>
                      showInfo(
                        PLATFORM_ADMIN_MESSAGES.householdActionUnavailable(
                          household.actionLabel,
                        ),
                      )
                    }
                    className={getActionClassName(household.action)}
                  >
                    {household.actionLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HouseholdManagementPage;
