import { RotateCw, FileText, PlusCircle, AlertTriangle, Key, Activity, Trash2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import type { IActivityLog } from "@/modules/report/types/IActivityLog";

interface RecentActivityPanelProps {
  logs: IActivityLog[];
}

export const RecentActivityPanel = ({ logs }: RecentActivityPanelProps) => {
  const getIcon = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes("ĐĂNG_NHẬP") || actionUpper.includes("LOGIN")) {
      return <Key className="w-4 h-4 text-blue-600" />;
    }
    if (actionUpper.includes("PHÁT_HÀNH") || actionUpper.includes("INVOICE")) {
      return <FileText className="w-4 h-4 text-emerald-600" />;
    }
    if (actionUpper.includes("GỬI_LẠI")) {
      return <RotateCw className="w-4 h-4 text-violet-600" />;
    }
    if (actionUpper.includes("TẠO") || actionUpper.includes("THÊM")) {
      return <PlusCircle className="w-4 h-4 text-sky-600" />;
    }
    if (actionUpper.includes("CẬP_NHẬT") || actionUpper.includes("EDIT")) {
      return <RotateCw className="w-4 h-4 text-amber-600" />;
    }
    if (actionUpper.includes("HỦY") || actionUpper.includes("XÓA")) {
      return <Trash2 className="w-4 h-4 text-rose-600" />;
    }
    if (actionUpper.includes("LỖI") || actionUpper.includes("XUNG_ĐỘT")) {
      return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    }
    return <Activity className="w-4 h-4 text-slate-500" />;
  };

  const getBgColor = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes("ĐĂNG_NHẬP") || actionUpper.includes("LOGIN")) return "bg-blue-50";
    if (actionUpper.includes("PHÁT_HÀNH") || actionUpper.includes("INVOICE")) return "bg-emerald-50";
    if (actionUpper.includes("GỬI_LẠI")) return "bg-violet-50";
    if (actionUpper.includes("TẠO") || actionUpper.includes("THÊM")) return "bg-sky-50";
    if (actionUpper.includes("CẬP_NHẬT") || actionUpper.includes("EDIT")) return "bg-amber-50";
    if (actionUpper.includes("HỦY") || actionUpper.includes("XÓA")) return "bg-rose-50";
    if (actionUpper.includes("LỖI") || actionUpper.includes("XUNG_ĐỘT")) return "bg-orange-50";
    return "bg-slate-50";
  };

  const recentLogs = logs.slice(0, 15);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[420px] max-h-[440px]">
      <div className="p-4 border-b border-slate-100 font-extrabold text-slate-800 text-sm shrink-0 flex justify-between items-center bg-slate-50/50">
        <span>Nhật ký hoạt động</span>
        <Link to={APP_ROUTES.REPORT_ACTIVITY_LOGS} className="text-[10px] text-kv-blue-primary font-bold uppercase tracking-wider cursor-pointer hover:underline flex items-center gap-0.5">
          Xem tất cả <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 min-h-0">
        {recentLogs.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-center">
            <Activity className="w-10 h-10 text-slate-300 mb-2" />
            <span className="font-semibold text-xs">Không có nhật ký hoạt động nào gần đây.</span>
          </div>
        ) : (
          recentLogs.map((log) => {
            // Simplify timestamp if possible
            const timePart = log.time.split(" ")[1] || log.time;
            return (
              <div key={log.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full shrink-0 ${getBgColor(log.action)}`}>
                  {getIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-700 leading-tight">
                    {log.user} đã thực hiện: {log.action.replace(/_/g, " ")}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5" title={log.target}>
                    Đối tượng: {log.target}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-bold shrink-0">
                  {timePart}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
