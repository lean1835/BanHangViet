import React from "react";
import { REPORT_UI } from "@/constants/report";
import type { IActivityLog } from "../types/IActivityLog";

interface ActivityLogTableProps {
  logs: IActivityLog[];
}

export const ActivityLogTable: React.FC<ActivityLogTableProps> = ({ logs }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-2">
          {REPORT_UI.ACTIVITY_LOG.TITLE}
        </h3>

        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="p-3">{REPORT_UI.ACTIVITY_LOG.COLUMNS.TIME}</th>
                <th className="p-3">{REPORT_UI.ACTIVITY_LOG.COLUMNS.USER}</th>
                <th className="p-3">{REPORT_UI.ACTIVITY_LOG.COLUMNS.ACTION}</th>
                <th className="p-3">{REPORT_UI.ACTIVITY_LOG.COLUMNS.TARGET}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-slate-500 font-mono">{log.time}</td>
                  <td className="p-3 font-bold text-slate-800">{log.user}</td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-700 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-600">{log.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
