import React from "react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface IMissingSupplierWarningBannerProps {
  missingCount: number;
  missingAmount: number;
  customMessage?: string | null;
  isFilterActive?: boolean;
  onToggleFilter?: () => void;
}

export const MissingSupplierWarningBanner: React.FC<
  IMissingSupplierWarningBannerProps
> = ({
  missingCount,
  missingAmount,
  customMessage,
  isFilterActive = false,
  onToggleFilter,
}) => {
  if (missingCount <= 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="h-4 w-4 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800">
                Cảnh báo chứng từ không đủ điều kiện kê khai thuế
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                {missingCount} phiếu
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {customMessage || (
                <>
                  Phát hiện {missingCount} phiếu nhập kho (tổng giá trị{" "}
                  {formatCurrency(missingAmount)}) không có thông tin Nhà cung
                  cấp hoặc MST. Khoản này được gom riêng và không đưa vào hồ sơ
                  khấu trừ chi phí hợp lệ.
                </>
              )}
            </p>
          </div>
        </div>

        {onToggleFilter && (
          <button
            type="button"
            onClick={onToggleFilter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
          >
            {isFilterActive ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Xem tất cả</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Lọc phiếu thiếu</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
