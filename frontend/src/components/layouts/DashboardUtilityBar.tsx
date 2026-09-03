import { BrandLogo } from "@/components/common/BrandLogo";
import type { TDemoRole } from "@/constants/roles";

interface DashboardUtilityBarProps {
  currentRole: TDemoRole;
  isOnline?: boolean;
  simConflict: boolean;
  pendingCount?: number;
  onRoleChange: (role: TDemoRole) => void;
  onToggleOnline?: () => void;
  onConflictChange: (isEnabled: boolean) => void;
  onSync?: () => void;
}

export const DashboardUtilityBar = ({
  pendingCount = 0,
  onSync,
}: DashboardUtilityBarProps) => {
  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <BrandLogo size="md" />
      </div>

      <div className="flex min-w-0 basis-full flex-wrap items-center justify-end gap-1.5 sm:basis-auto sm:flex-1 sm:flex-nowrap sm:gap-2 lg:gap-4">
        {pendingCount > 0 && (
          <button
            onClick={onSync}
            className="flex min-h-11 items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 font-extrabold text-amber-800 hover:bg-amber-100 transition-colors lg:min-h-0 text-[11px]"
            title="Số lượng đơn hàng ngoại tuyến đang chờ đồng bộ"
          >
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>{pendingCount} đơn chờ đồng bộ</span>
          </button>
        )}
      </div>
    </div>
  );
};
