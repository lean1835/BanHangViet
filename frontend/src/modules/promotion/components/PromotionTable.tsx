import React from "react";
import { Eye, Edit, Trash2, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  DISCOUNT_TYPE,
  PROMOTION_APPLY_SCOPE,
  PROMOTION_APPLY_SCOPE_LABELS,
  PROMOTION_MESSAGES,
  PROMOTION_STATUS,
} from "@/constants/promotion";
import type { IPromotion } from "../types/IPromotion";
import { PromotionStatusBadge } from "./PromotionStatusBadge";

interface PromotionTableProps {
  promotions: IPromotion[];
  isLoading: boolean;
  canManage: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onViewDetail: (promo: IPromotion) => void;
  onEdit: (promo: IPromotion) => void;
  onDelete: (promo: IPromotion) => void;
  onToggleStatus: (promo: IPromotion) => void;
}

const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const PromotionTable: React.FC<PromotionTableProps> = ({
  promotions,
  isLoading,
  canManage,
  page,
  pageSize: _pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Đang tải danh sách chương trình khuyến mại...</p>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-400 gap-2">
        <Tag size={36} className="text-slate-300 stroke-[1.5]" />
        <p className="text-xs font-semibold text-slate-600">
          {PROMOTION_MESSAGES.NO_DATA}
        </p>
        <p className="text-[11px] text-slate-400 max-w-sm text-center">
          Tạo chương trình khuyến mại để tự động giảm giá khi bán hàng và quản lý các đợt ưu đãi hiệu quả.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 justify-between w-full">
      <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
              <th className="p-3">Tên chương trình</th>
              <th className="p-3">Mức giảm giá</th>
              <th className="p-3">Phạm vi áp dụng</th>
              <th className="p-3">Thời gian hiệu lực</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {promotions.map((promo) => {
              const isPercentage = promo.discountType === DISCOUNT_TYPE.PERCENTAGE;
              const formattedDiscount = isPercentage
                ? `${Number(promo.discountValue).toLocaleString("vi-VN", {
                    maximumFractionDigits: 2,
                  })}%`
                : `${formatCurrency(promo.discountValue)}`;

              return (
                <tr
                  key={promo.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer border-b border-slate-100"
                  onClick={() => onViewDetail(promo)}
                >
                  {/* Tên chương trình */}
                  <td className="p-3">
                    <div className="font-bold text-slate-900 group-hover:text-kv-blue-primary transition-colors">
                      {promo.name}
                    </div>
                    {promo.description && (
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                        {promo.description}
                      </div>
                    )}
                    {promo.createdByUserName && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tạo bởi: {promo.createdByUserName}
                      </div>
                    )}
                  </td>

                  {/* Mức giảm */}
                  <td className="p-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <Tag size={12} className="text-emerald-600" />
                      {formattedDiscount}
                    </span>
                  </td>

                  {/* Phạm vi */}
                  <td className="p-3 whitespace-nowrap">
                    <div className="text-slate-800 font-semibold">
                      {PROMOTION_APPLY_SCOPE_LABELS[promo.applyScope] || promo.applyScope}
                    </div>
                    {promo.applyScope === PROMOTION_APPLY_SCOPE.PRODUCT && (
                      <div className="text-[11px] text-slate-500">
                        {promo.totalProductsCount ?? 0} sản phẩm
                      </div>
                    )}
                    {promo.applyScope === PROMOTION_APPLY_SCOPE.PRODUCT_GROUP && (
                      <div className="text-[11px] text-slate-500">
                        {promo.totalProductGroupsCount ?? 0} nhóm hàng
                      </div>
                    )}
                  </td>

                  {/* Thời gian */}
                  <td className="p-3 whitespace-nowrap text-slate-600 text-[11px]">
                    <div>
                      <span className="text-slate-400">Từ:</span>{" "}
                      <span className="font-semibold text-slate-800">
                        {formatDateTime(promo.startDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Đến:</span>{" "}
                      <span className="font-semibold text-slate-800">
                        {formatDateTime(promo.endDate)}
                      </span>
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td
                    className="p-3 text-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex flex-col items-center gap-1">
                      <PromotionStatusBadge state={promo.calculatedState} />
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(promo)}
                          title={
                            promo.status === PROMOTION_STATUS.ACTIVE
                              ? "Tạm dừng chương trình"
                              : "Kích hoạt chương trình"
                          }
                          className={`text-[10px] font-bold transition-colors ${
                            promo.status === PROMOTION_STATUS.ACTIVE
                              ? "text-amber-600 hover:text-amber-700"
                              : "text-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {promo.status === PROMOTION_STATUS.ACTIVE
                            ? "Tắt khuyến mại"
                            : "Bật lại"}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Thao tác */}
                  <td
                    className="p-3 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(promo)}
                        title="Xem chi tiết"
                        className="p-1.5 text-slate-500 hover:text-kv-blue-primary hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye size={15} />
                      </button>

                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(promo)}
                            title="Chỉnh sửa"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(promo)}
                            title="Xóa chương trình"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs mt-4">
          <div className="text-slate-600 font-medium">
            Hiển thị <span className="font-bold text-slate-800">{promotions.length}</span> /{" "}
            <span className="font-bold text-slate-800">{totalElements}</span> chương trình
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Trước
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onPageChange(idx)}
                className={`min-w-7 px-2.5 py-1 rounded font-bold border text-xs transition-all ${
                  idx === page
                    ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
