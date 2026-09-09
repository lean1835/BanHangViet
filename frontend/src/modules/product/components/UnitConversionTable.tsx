import React from "react";
import {
  Edit,
  Trash2,
  Lock,
  Layers,
  CheckCircle2,
  Barcode,
  ArrowRight,
} from "lucide-react";
import type { IProductUnitConversion } from "@/modules/product/types/IProductUnitConversion";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { UNIT_CONVERSION_COPY, UNIT_CONVERSION_MESSAGES } from "@/constants/product";

interface UnitConversionTableProps {
  conversions: IProductUnitConversion[];
  baseUnit: string;
  isOwner?: boolean;
  isLoading?: boolean;
  onEdit?: (conversion: IProductUnitConversion) => void;
  onDelete?: (conversion: IProductUnitConversion) => void;
}

export const UnitConversionTable: React.FC<UnitConversionTableProps> = ({
  conversions,
  baseUnit,
  isOwner = false,
  isLoading = false,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-slate-200 gap-3 text-slate-500">
        <div className="w-7 h-7 border-3 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Đang tải danh sách đơn vị quy đổi...</p>
      </div>
    );
  }

  if (conversions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-kv-blue-primary flex items-center justify-center mb-3">
          <Layers size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">
          {UNIT_CONVERSION_COPY.EMPTY_CONVERSIONS_TITLE}
        </h4>
        <p className="text-xs text-slate-500 max-w-md mb-2">
          {UNIT_CONVERSION_COPY.EMPTY_CONVERSIONS_DESC}
        </p>
        <span className="text-[11px] font-medium text-slate-400">
          Đơn vị cơ sở hiện tại: <strong className="text-slate-700">{baseUnit}</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-[11px]">
              <th className="py-3 px-4 w-12 text-center">STT</th>
              <th className="py-3 px-4 min-w-[140px]">Đơn vị quy đổi</th>
              <th className="py-3 px-4 min-w-[180px]">Công thức quy đổi</th>
              <th className="py-3 px-4 min-w-[130px] text-right">Giá bán riêng</th>
              <th className="py-3 px-4 min-w-[130px]">Mã vạch riêng</th>
              <th className="py-3 px-4 min-w-[150px]">Cấu hình mặc định</th>
              <th className="py-3 px-4 min-w-[150px]">Ràng buộc thẻ kho</th>
              {isOwner && <th className="py-3 px-4 w-24 text-center">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {conversions.map((item, index) => {
              const hasPrice = item.price !== undefined && item.price !== null && item.price > 0;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs">
                        {item.unitName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-100 text-xs font-semibold">
                      <span>1 {item.unitName}</span>
                      <ArrowRight size={12} className="text-sky-500" />
                      <span className="font-bold text-kv-blue-primary">
                        {formatNumber(item.conversionFactor)} {baseUnit}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {hasPrice ? (
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.price!)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">
                        Theo giá cơ sở × {formatNumber(item.conversionFactor)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {item.barcode ? (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Barcode size={13} className="text-slate-400" />
                        <span>{item.barcode}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      {item.isDefaultImport && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                          <CheckCircle2 size={10} />
                          Mặc định nhập
                        </span>
                      )}
                      {item.isDefaultSale && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full w-fit">
                          <CheckCircle2 size={10} />
                          Mặc định bán
                        </span>
                      )}
                      {!item.isDefaultImport && !item.isDefaultSale && (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {item.hasStockMovement ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold"
                        title={UNIT_CONVERSION_MESSAGES.LOCKED_FACTOR_WARNING}
                      >
                        <Lock size={11} className="text-amber-600 shrink-0" />
                        <span>{UNIT_CONVERSION_MESSAGES.LOCKED_FACTOR_SHORT}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Chưa phát sinh tồn
                      </span>
                    )}
                  </td>
                  {isOwner && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit?.(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-kv-blue-primary hover:bg-slate-100 transition-colors"
                          title="Chỉnh sửa đơn vị quy đổi"
                          aria-label={`Chỉnh sửa ${item.unitName}`}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa đơn vị quy đổi"
                          aria-label={`Xóa ${item.unitName}`}
                        >
                          <Trash2 size={14} />
                        </button>
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
