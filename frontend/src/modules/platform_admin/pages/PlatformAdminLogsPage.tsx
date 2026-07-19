import React from "react";
import {
  PLATFORM_ADMIN_LOG_ACTOR,
  PLATFORM_ADMIN_LOGS,
  PLATFORM_ADMIN_UI,
  type TPlatformAdminLogActor,
} from "@/constants/platformAdmin";

const getActorClassName = (actorType: TPlatformAdminLogActor): string => {
  if (actorType === PLATFORM_ADMIN_LOG_ACTOR.ADMIN) {
    return "p-3 font-bold text-indigo-600";
  }

  if (actorType === PLATFORM_ADMIN_LOG_ACTOR.TAX_AUTHORITY) {
    return "p-3 font-bold text-emerald-600";
  }

  return "p-3 font-bold text-slate-800";
};

const getActionClassName = (actorType: TPlatformAdminLogActor): string => {
  if (actorType === PLATFORM_ADMIN_LOG_ACTOR.ADMIN) {
    return "p-3 text-slate-800";
  }

  if (actorType === PLATFORM_ADMIN_LOG_ACTOR.TAX_AUTHORITY) {
    return "p-3 text-emerald-700";
  }

  return "p-3 text-slate-500";
};

export const PlatformAdminLogsPage: React.FC = () => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-2">
        {PLATFORM_ADMIN_UI.LOGS.TITLE}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th className="p-3">{PLATFORM_ADMIN_UI.LOGS.COLUMNS.TIME}</th>
              <th className="p-3">{PLATFORM_ADMIN_UI.LOGS.COLUMNS.ACTOR}</th>
              <th className="p-3">{PLATFORM_ADMIN_UI.LOGS.COLUMNS.ACTION}</th>
              <th className="p-3">{PLATFORM_ADMIN_UI.LOGS.COLUMNS.IP_ADDRESS}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {PLATFORM_ADMIN_LOGS.map((log) => (
              <tr key={log.id}>
                <td className="p-3">{log.time}</td>
                <td className={getActorClassName(log.actorType)}>{log.actor}</td>
                <td className={getActionClassName(log.actorType)}>{log.action}</td>
                <td className="p-3">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlatformAdminLogsPage;
