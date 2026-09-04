import { useNavigate } from "react-router-dom";
import { ChevronRight, ShoppingCart, FileText, Users, Clock } from "lucide-react";
import { DASHBOARD_SECTIONS, getQuickAccessItems } from "@/constants/dashboard";
import type { TDemoRole } from "@/constants/roles";

interface QuickAccessPanelProps {
  currentRole: TDemoRole;
}

export const QuickAccessPanel = ({ currentRole }: QuickAccessPanelProps) => {
  const navigate = useNavigate();
  const items = getQuickAccessItems(currentRole);

  const renderIcon = (icon: string) => {
    switch (icon) {
      case "pos":
        return <ShoppingCart className="w-4 h-4 text-kv-blue-primary" />;
      case "orders":
      case "invoices":
        return <FileText className="w-4 h-4 text-slate-600" />;
      case "customers":
        return <Users className="w-4 h-4 text-emerald-600" />;
      case "shifts":
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

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
            <span className="flex items-center gap-2.5">
              {renderIcon(item.icon)}
              <span>{item.label}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
};
