import React, { ReactNode } from "react";

export interface TableCardHeaderProps {
  title: string;
  totalElements?: number;
  unit?: string;
  badgeLabel?: string;
  actionElement?: ReactNode;
  icon?: ReactNode;
}

export const TableCardHeader: React.FC<TableCardHeaderProps> = ({
  title,
  totalElements,
  unit = "bản ghi",
  badgeLabel,
  actionElement,
  icon,
}) => {
  const displayBadge =
    badgeLabel ?? (totalElements !== undefined ? `${totalElements} ${unit}` : null);

  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-kv-blue-primary">{icon}</span>}
        <h3 className="font-extrabold text-slate-800 text-sm">
          {title}
        </h3>
        {/* Subtitle is explicitly omitted per user requirements */}
      </div>

      <div className="flex items-center gap-3">
        {displayBadge && (
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {displayBadge}
          </span>
        )}
        {actionElement}
      </div>
    </div>
  );
};
