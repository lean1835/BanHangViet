import React from "react";
import { useNavigate } from "react-router-dom";
import { DASHBOARD_SECTIONS, getQuickAccessItems } from "@/constants/dashboard";
import type { TDemoRole } from "@/constants/roles";

// Native SVG Icons
interface SvgIconProps {
  size?: number;
  className?: string;
}

const ChevronRightIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ShoppingCartIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const FileTextIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const UsersIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ClockIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

interface QuickAccessPanelProps {
  currentRole: TDemoRole;
}

export const QuickAccessPanel = ({ currentRole }: QuickAccessPanelProps) => {
  const navigate = useNavigate();
  const items = getQuickAccessItems(currentRole);

  const renderIcon = (icon: string) => {
    switch (icon) {
      case "pos":
        return <ShoppingCartIcon size={16} className="w-4 h-4 text-kv-blue-primary" />;
      case "orders":
      case "invoices":
        return <FileTextIcon size={16} className="w-4 h-4 text-slate-600" />;
      case "customers":
        return <UsersIcon size={16} className="w-4 h-4 text-emerald-600" />;
      case "shifts":
        return <ClockIcon size={16} className="w-4 h-4 text-amber-600" />;
      default:
        return <FileTextIcon size={16} className="w-4 h-4 text-slate-500" />;
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
            <ChevronRightIcon size={16} className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
};
