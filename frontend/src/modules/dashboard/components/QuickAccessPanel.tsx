import { useNavigate } from "react-router-dom";
import { APP_SYMBOLS } from "@/constants/app";
import { DASHBOARD_SECTIONS, getQuickAccessItems } from "@/constants/dashboard";
import type { TDemoRole } from "@/constants/roles";

interface QuickAccessPanelProps {
  currentRole: TDemoRole;
}

export const QuickAccessPanel = ({ currentRole }: QuickAccessPanelProps) => {
  const navigate = useNavigate();
  const items = getQuickAccessItems(currentRole);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 font-extrabold text-slate-800">
        {DASHBOARD_SECTIONS.QUICK_ACCESS}
      </div>
      <div className="p-4 flex flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center justify-between border border-slate-200 hover:bg-slate-50 transition-colors p-3 rounded-lg font-bold text-slate-700"
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </span>
            <span className="text-slate-400">{APP_SYMBOLS.CHEVRON_RIGHT}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
