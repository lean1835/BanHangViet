import React from "react";
import { Monitor, Smartphone, Tablet, Globe } from "lucide-react";

interface DeviceBadgeProps {
  deviceType?: string;
  deviceName?: string;
  className?: string;
}

export const DeviceBadge: React.FC<DeviceBadgeProps> = ({
  deviceType = "DESKTOP",
  deviceName,
  className = "",
}) => {
  const normalizedType = (deviceType || "DESKTOP").toUpperCase();

  let Icon = Monitor;
  let bgClass = "bg-blue-50 text-blue-700 border-blue-200";
  let label = "Máy tính / Laptop";

  if (normalizedType.includes("MOBILE") || normalizedType.includes("PHONE")) {
    Icon = Smartphone;
    bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    label = "Điện thoại";
  } else if (normalizedType.includes("TABLET") || normalizedType.includes("IPAD")) {
    Icon = Tablet;
    bgClass = "bg-amber-50 text-amber-700 border-amber-200";
    label = "Máy tính bảng";
  } else if (normalizedType.includes("UNKNOWN")) {
    Icon = Globe;
    bgClass = "bg-slate-50 text-slate-700 border-slate-200";
    label = "Thiết bị khác";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${bgClass} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{deviceName || label}</span>
    </div>
  );
};
