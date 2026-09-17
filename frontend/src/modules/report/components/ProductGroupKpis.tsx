import React from "react";
import { Layers, Trophy, AlertCircle, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IProductGroupReportResponse } from "../types/IReport";

interface ProductGroupKpisProps {
  reportData?: IProductGroupReportResponse;
  isLoading?: boolean;
}

export const ProductGroupKpis: React.FC<ProductGroupKpisProps> = ({
  reportData,
  isLoading = false,
}) => {
  const totalRevenue = reportData?.totalRevenue ?? 0;
  const groups = reportData?.groups || [];
  const hasUnassigned = reportData?.hasUnassignedProducts ?? false;
  const unassignedRevenue = reportData?.unassignedSummary?.revenue ?? 0;

  // Nhóm dẫn đầu doanh thu
  const topGroup = groups.length > 0 ? groups[0] : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs animate-pulse space-y-3"
          >
            <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-6 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng doanh thu các nhóm */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Tổng doanh thu nhóm hàng
          </span>
          <div className="w-8 h-8 rounded-lg bg-kv-blue-light text-kv-blue-primary flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Toàn bộ các mặt hàng phát sinh doanh số
          </p>
        </div>
      </div>

      {/* 2. Số lượng nhóm hàng */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Số nhóm hàng có doanh thu
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {groups.length} nhóm
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Đã được phân loại trong danh mục
          </p>
        </div>
      </div>

      {/* 3. Nhóm hàng dẫn đầu */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Nhóm bán chạy nhất
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-lg font-black text-slate-900 tracking-tight truncate" title={topGroup?.groupName}>
            {topGroup ? topGroup.groupName : "---"}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {topGroup
              ? `${formatCurrency(topGroup.revenue)} (${topGroup.percentage.toFixed(1)}%)`
              : "Chưa có dữ liệu"}
          </p>
        </div>
      </div>

      {/* 4. Hàng chưa phân nhóm */}
      <div
        className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between transition-colors ${
          hasUnassigned
            ? "bg-amber-50/40 border-amber-200"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Hàng chưa phân nhóm
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              hasUnassigned
                ? "bg-amber-100 text-amber-600"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatCurrency(unassignedRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {hasUnassigned
              ? "Cần gán nhóm để quản lý khoa học"
              : "Tất cả sản phẩm đã được phân nhóm"}
          </p>
        </div>
      </div>
    </div>
  );
};
