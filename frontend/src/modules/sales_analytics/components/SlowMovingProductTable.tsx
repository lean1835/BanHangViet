import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  Package,
  DollarSign,
  Lock,
  Tag,
  ClipboardList,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import type {
  ISlowMovingProduct,
  ISlowMovingSummary,
} from "../types/ISalesAnalytics";
import {
  SALES_ANALYTICS_COPY,
} from "@/constants/salesAnalytics";
import { APP_ROUTES } from "@/constants/routes";

interface SlowMovingProductTableProps {
  summary?: ISlowMovingSummary;
  products: ISlowMovingProduct[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  thresholdDays?: number;
  isAllowed: boolean; // VT-01 & VT-03 allowed
  hideSummaryCards?: boolean;
  onPageChange: (newPage: number) => void;
  onThresholdChange?: (newThreshold: number) => void;
  onPromoteProduct?: (product: ISlowMovingProduct) => void;
}

export const SlowMovingProductTable: React.FC<SlowMovingProductTableProps> = ({
  summary,
  products,
  isLoading,
  page,
  pageSize,
  totalPages,
  totalElements,
  isAllowed,
  hideSummaryCards = false,
  onPageChange,
  onPromoteProduct,
}) => {
  const navigate = useNavigate();

  // Permission Check (NCL-18-CN-003-TC-03)
  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm w-full animate-auth-fade-in">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          {SALES_ANALYTICS_COPY.SLOW_MOVING.PERMISSION_DENIED_TITLE}
        </h3>
        <p className="text-xs font-semibold text-slate-500 max-w-md">
          {SALES_ANALYTICS_COPY.SLOW_MOVING.PERMISSION_DENIED_DESC}
        </p>
      </div>
    );
  }

  const totalStagnantProducts = summary?.totalStagnantProducts ?? totalElements;
  const totalStagnantStockQuantity = summary?.totalStagnantStockQuantity ?? 0;
  const totalStagnantCapital = summary?.totalStagnantCapital ?? 0;
  const totalRetailValue = summary?.totalRetailValue ?? 0;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Chưa từng bán";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full animate-auth-fade-in">
      {/* 4 Summary KPI Cards */}
      {!hideSummaryCards && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Stagnant Products */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {SALES_ANALYTICS_COPY.SLOW_MOVING.KPI.TOTAL_PRODUCTS}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-rose-600">
                {formatNumber(totalStagnantProducts)}
              </span>
              <span className="text-xs font-semibold text-slate-400">mặt hàng</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Stagnant Quantity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {SALES_ANALYTICS_COPY.SLOW_MOVING.KPI.TOTAL_STOCK}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-800">
                {formatNumber(totalStagnantStockQuantity)}
              </span>
              <span className="text-xs font-semibold text-slate-400">sản phẩm</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Stagnant Capital */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {SALES_ANALYTICS_COPY.SLOW_MOVING.KPI.TOTAL_CAPITAL}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black text-red-700 truncate">
                {formatCurrency(totalStagnantCapital)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Retail Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {SALES_ANALYTICS_COPY.SLOW_MOVING.KPI.TOTAL_RETAIL}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black text-slate-800 truncate">
                {formatCurrency(totalRetailValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Main Table Block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[450px] w-full">
        {/* Block Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <span>{SALES_ANALYTICS_COPY.SLOW_MOVING.TITLE}</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">
              {SALES_ANALYTICS_COPY.SLOW_MOVING.SUBTITLE}
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {totalElements} mặt hàng
          </span>
        </div>

        {/* Content Table or Empty State */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-bold text-slate-500">
              Đang phân tích số ngày không phát sinh bán hàng...
            </span>
          </div>
        ) : products.length === 0 ? (
          /* Empty State (NCL-18-CN-003-TC-02) */
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-slate-800 mb-1">
              {SALES_ANALYTICS_COPY.SLOW_MOVING.EMPTY_STATE_TITLE}
            </h4>
            <p className="text-xs font-semibold text-slate-500 max-w-md leading-relaxed">
              {SALES_ANALYTICS_COPY.SLOW_MOVING.EMPTY_STATE_DESC}
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-between">
            <div className="overflow-x-auto">
              <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                    <th className="p-3 text-center w-12">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.INDEX}
                    </th>
                    <th className="p-3 w-28">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.SKU}
                    </th>
                    <th className="p-3 min-w-[180px]">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.PRODUCT_NAME}
                    </th>
                    <th className="p-3 min-w-[120px]">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.GROUP}
                    </th>
                    <th className="p-3 text-center w-16">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.UNIT}
                    </th>
                    <th className="p-3 text-right w-20">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.STOCK}
                    </th>
                    <th className="p-3 text-center w-32">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.DAYS_WITHOUT_SALE}
                    </th>
                    <th className="p-3 text-right w-28">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.COST_PRICE}
                    </th>
                    <th className="p-3 text-right w-28">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.STAGNANT_CAPITAL}
                    </th>
                    <th className="p-3 text-center w-28">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.LAST_SALE_DATE}
                    </th>
                    <th className="p-3 text-center w-36">
                      {SALES_ANALYTICS_COPY.SLOW_MOVING.TABLE_HEADERS.ACTIONS}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
                  {products.map((item, index) => {
                    const isHighStagnant = item.daysWithoutSale >= 90;

                    return (
                      <tr
                        key={item.productId}
                        className="hover:bg-rose-50/20 transition-colors"
                      >
                        {/* Index */}
                        <td className="py-3 px-3 text-center text-slate-400 font-bold text-[11px]">
                          {page * pageSize + index + 1}
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 text-[11px]">
                          {item.sku}
                        </td>

                        {/* Product Name */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 line-clamp-2">
                            {item.productName}
                          </span>
                        </td>

                        {/* Group */}
                        <td className="py-3 px-3 text-slate-600">
                          {item.groupName ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {item.groupName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>

                        {/* Unit */}
                        <td className="py-3 px-3 text-center font-bold text-slate-600 text-[11px]">
                          {item.unit}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-3 text-right font-black text-slate-800">
                          {formatNumber(item.stockQuantity)}
                        </td>

                        {/* Days Without Sale Badge */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              isHighStagnant
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{item.daysWithoutSale} ngày</span>
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-3 text-right font-semibold text-slate-600">
                          {formatCurrency(item.costPrice || 0)}
                        </td>

                        {/* Stagnant Capital */}
                        <td className="py-3 px-3 text-right font-black text-rose-700">
                          {formatCurrency(item.stagnantCapital)}
                        </td>

                        {/* Last Sale Date */}
                        <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {formatDate(item.lastSaleDate)}
                        </td>

                        {/* Actions: Promotion / Audit */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (onPromoteProduct) {
                                  onPromoteProduct(item);
                                } else {
                                  navigate(APP_ROUTES.PROMOTIONS);
                                }
                              }}
                              title="Tạo chương trình khuyến mại xả hàng"
                              className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(APP_ROUTES.PRODUCT_INVENTORY_AUDITS)}
                              title="Kiểm kê mặt hàng này"
                              className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 text-xs font-semibold text-slate-600">
                <div>
                  Hiển thị từ <span className="font-bold text-slate-800">{page * pageSize + 1}</span> đến{" "}
                  <span className="font-bold text-slate-800">
                    {Math.min((page + 1) * pageSize, totalElements)}
                  </span>{" "}
                  trong tổng số <span className="font-bold text-slate-800">{totalElements}</span> mặt hàng
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => onPageChange(page - 1)}
                    className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700"
                  >
                    Trang trước
                  </button>
                  <span className="px-3 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-700">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() => onPageChange(page + 1)}
                    className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
