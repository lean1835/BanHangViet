import React from "react";
import {
  Edit,
  Trash2,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import type { IProductPriceTier } from "@/modules/product/types/IProductPriceTier";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { PRICE_TIER_COPY } from "@/constants/product";

interface PriceTierTableProps {
  tiers: IProductPriceTier[];
  baseUnit: string;
  baseRetailPrice: number;
  costPrice?: number;
  isOwner?: boolean;
  isLoading?: boolean;
  onEdit?: (tier: IProductPriceTier) => void;
  onDelete?: (tier: IProductPriceTier) => void;
  onAddNew?: () => void;
}

export const PriceTierTable: React.FC<PriceTierTableProps> = ({
  tiers,
  baseUnit,
  baseRetailPrice,
  costPrice = 0,
  isOwner = false,
  isLoading = false,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-slate-200 gap-3 text-slate-500">
        <div className="w-7 h-7 border-3 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Đang tải danh sách bậc giá...</p>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-kv-blue-primary flex items-center justify-center mb-3">
          <TrendingDown size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">
          {PRICE_TIER_COPY.EMPTY_TIERS_TITLE}
        </h4>
        <p className="text-xs text-slate-500 max-w-md mb-4">
          {PRICE_TIER_COPY.EMPTY_TIERS_DESC}
        </p>
        {isOwner && onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white text-xs font-bold shadow-xs transition-all"
          >
            <span>{PRICE_TIER_COPY.ADD_TIER_BUTTON}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold text-[11px]">
              <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
              <th className="py-2.5 px-3 min-w-[150px]">Tên bậc giá</th>
              <th className="py-2.5 px-3 min-w-[100px]">Đơn vị tính</th>
              <th className="py-2.5 px-3 min-w-[150px]">Mức số lượng</th>
              <th className="py-2.5 px-3 min-w-[120px] text-right">Đơn giá bậc</th>
              <th className="py-2.5 px-3 min-w-[130px] text-right">Mức ưu đãi</th>
              <th className="py-2.5 px-3 min-w-[120px] text-right">Giá vốn</th>
              <th className="py-2.5 px-3 min-w-[100px] text-center">Trạng thái</th>
              {isOwner && <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tiers.map((tier, index) => {
              const unit = tier.unitName || baseUnit;
              const hasMax = tier.maxQuantity !== null && tier.maxQuantity !== undefined;
              const savingPerUnit = Math.max(0, baseRetailPrice - tier.price);
              const savingPct =
                baseRetailPrice > 0
                  ? Math.round((savingPerUnit / baseRetailPrice) * 100)
                  : 0;
              const effectiveCost = tier.costPrice ?? costPrice;
              const isBelowCost = tier.isBelowCost || (effectiveCost > 0 && tier.price < effectiveCost);

              return (
                <tr
                  key={tier.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-800">{tier.tierName}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-slate-600 font-medium">{unit}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800">
                      {hasMax ? (
                        <span>Từ {formatNumber(tier.minQuantity)} - {formatNumber(tier.maxQuantity!)} {unit}</span>
                      ) : (
                        <span>Từ {formatNumber(tier.minQuantity)} {unit} trở lên</span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {formatCurrency(tier.price)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {savingPerUnit > 0 ? (
                      <span className="font-semibold text-emerald-700 text-xs">
                        -{formatCurrency(savingPerUnit)}{" "}
                        <span className="font-normal text-slate-500 text-[11px]">(-{savingPct}%)</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {isBelowCost ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs" title="Bán dưới giá vốn bình quân">
                        <AlertTriangle size={12} />
                        <span>Bán lỗ ({formatCurrency(effectiveCost)})</span>
                      </span>
                    ) : effectiveCost > 0 ? (
                      <span className="text-xs text-slate-600 font-mono">
                        {formatCurrency(effectiveCost)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {tier.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Áp dụng</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Tạm dừng</span>
                      </span>
                    )}
                  </td>
                  {isOwner && (
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(tier)}
                            title="Chỉnh sửa bậc giá"
                            aria-label={`Chỉnh sửa bậc giá ${tier.tierName}`}
                            className="p-1 rounded-md hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(tier)}
                            title="Xóa bậc giá"
                            aria-label={`Xóa bậc giá ${tier.tierName}`}
                            className="p-1 rounded-md hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
