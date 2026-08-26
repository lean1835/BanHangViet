import React from "react";
import {
  PROMOTION_CALCULATED_STATE,
  PROMOTION_STATE_BADGE_CLASSES,
  PROMOTION_STATE_LABELS,
  type TPromotionCalculatedState,
} from "@/constants/promotion";

interface PromotionStatusBadgeProps {
  state: TPromotionCalculatedState | string;
  className?: string;
}

export const PromotionStatusBadge: React.FC<PromotionStatusBadgeProps> = ({
  state,
  className = "",
}) => {
  const normalizedState = (
    Object.values(PROMOTION_CALCULATED_STATE).includes(
      state as TPromotionCalculatedState
    )
      ? state
      : PROMOTION_CALCULATED_STATE.INACTIVE
  ) as TPromotionCalculatedState;

  const label = PROMOTION_STATE_LABELS[normalizedState] || state;
  const colorClass =
    PROMOTION_STATE_BADGE_CLASSES[normalizedState] ||
    "bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ring-1 ring-inset ${colorClass} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          normalizedState === PROMOTION_CALCULATED_STATE.ACTIVE
            ? "bg-emerald-500 animate-pulse"
            : normalizedState === PROMOTION_CALCULATED_STATE.UPCOMING
              ? "bg-sky-500"
              : normalizedState === PROMOTION_CALCULATED_STATE.EXPIRED
                ? "bg-slate-400"
                : "bg-amber-500"
        }`}
      />
      {label}
    </span>
  );
};
