import React from "react";
import {
  REPORT_UI,
  REVENUE_COMPARISON_DEFAULT_PERIODS,
} from "@/constants/report";

export const RevenueComparison: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-4">
          {REPORT_UI.COMPARISON.TITLE}
        </h3>
        <p className="text-slate-500 font-medium mb-5">
          {REPORT_UI.COMPARISON.DESCRIPTION}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
            <span className="font-bold text-kv-blue-primary block mb-3 text-xs uppercase tracking-wide">
              {REPORT_UI.COMPARISON.BASE_PERIOD_LABEL}
            </span>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600">
                  {REPORT_UI.COMPARISON.START_DATE_LABEL}
                </label>
                <input
                  type="date"
                  defaultValue={
                    REVENUE_COMPARISON_DEFAULT_PERIODS.BASE.START_DATE
                  }
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600">
                  {REPORT_UI.COMPARISON.END_DATE_LABEL}
                </label>
                <input
                  type="date"
                  defaultValue={
                    REVENUE_COMPARISON_DEFAULT_PERIODS.BASE.END_DATE
                  }
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50/50">
            <span className="font-bold text-kv-orange block mb-3 text-xs uppercase tracking-wide">
              {REPORT_UI.COMPARISON.COMPARISON_PERIOD_LABEL}
            </span>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600">
                  {REPORT_UI.COMPARISON.START_DATE_LABEL}
                </label>
                <input
                  type="date"
                  defaultValue={
                    REVENUE_COMPARISON_DEFAULT_PERIODS.COMPARISON.START_DATE
                  }
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-600">
                  {REPORT_UI.COMPARISON.END_DATE_LABEL}
                </label>
                <input
                  type="date"
                  defaultValue={
                    REVENUE_COMPARISON_DEFAULT_PERIODS.COMPARISON.END_DATE
                  }
                  className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button className="bg-slate-200 hover:bg-slate-300 transition-colors font-bold px-4 h-9 rounded-lg">
            {REPORT_UI.COMPARISON.RESET_ACTION}
          </button>
          <button className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-4 h-9 rounded-lg transition-colors">
            {REPORT_UI.COMPARISON.ANALYZE_ACTION}
          </button>
        </div>
      </div>
    </div>
  );
};
