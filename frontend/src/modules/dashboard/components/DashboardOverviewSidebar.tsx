import { APP_FALLBACKS } from "@/constants/app";
import {
  DASHBOARD_FORM_FIELDS,
  DASHBOARD_SECTIONS,
  DASHBOARD_TIME_FILTERS,
} from "@/constants/dashboard";

interface DashboardOverviewSidebarProps {
  dashTimeFilter: string;
  onTimeFilterChange: (value: string) => void;
}

export const DashboardOverviewSidebar = ({
  dashTimeFilter,
  onTimeFilterChange,
}: DashboardOverviewSidebarProps) => (
  <>
    <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
      {DASHBOARD_SECTIONS.TITLE}
    </div>
    <div className="flex flex-col gap-3">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        {DASHBOARD_SECTIONS.RECONCILIATION_TIME}
      </span>
      <div className="flex flex-col gap-2 font-medium">
        {DASHBOARD_TIME_FILTERS.map((time) => (
          <label key={time} className="flex items-center gap-2 cursor-pointer text-slate-700">
            <input
              type="radio"
              name={DASHBOARD_FORM_FIELDS.TIME_FILTER}
              checked={dashTimeFilter === time}
              onChange={() => onTimeFilterChange(time)}
              className="text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
            />
            <span>{time}</span>
          </label>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
        {DASHBOARD_SECTIONS.BUSINESS_LOCATION}
      </span>
      <select className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 font-semibold text-slate-700 focus:outline-none focus:border-kv-blue-primary">
        <option>{APP_FALLBACKS.BRANCH_NAME}</option>
      </select>
    </div>
  </>
);
