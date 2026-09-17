import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useGetProductGroupReportQuery } from "../services/reportApi";
import { useReportFilter } from "../context/ReportFilterContext";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import { ProductGroupKpis } from "./ProductGroupKpis";
import { ProductGroupTable } from "./ProductGroupTable";
import { ProductGroupDetailDrawer } from "./ProductGroupDetailDrawer";
import { ReportExportButton } from "./ReportExportButton";

export const ProductGroupReport: React.FC = () => {
  const { productGroupFilter } = useReportFilter();
  const { fromDate, toDate } = productGroupFilter;

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const {
    data: apiResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetProductGroupReportQuery(
    {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  useOnOrderCompleted(refetch);

  const reportData = apiResponse?.result;

  return (
    <div className="flex flex-col gap-6 w-full animate-auth-fade-in">
      {/* Top Header & Universal Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Báo cáo Doanh thu theo Nhóm hàng
            </h1>
            {isFetching && (
              <Loader2 className="w-4 h-4 text-kv-blue-primary animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi đóng góp doanh số và tỷ lệ tăng trưởng theo từng nhóm ngành hàng kinh doanh
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ReportExportButton
            reportType="PRODUCT_GROUP"
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      </div>

      {/* 1. KPIs Summary */}
      <ProductGroupKpis reportData={reportData} isLoading={isLoading} />

      {/* 2. Product Groups Data Table */}
      <ProductGroupTable
        groups={reportData?.groups || []}
        unassignedSummary={reportData?.unassignedSummary}
        hasUnassignedProducts={reportData?.hasUnassignedProducts}
        onSelectGroup={(groupId) => setSelectedGroupId(groupId)}
        isLoading={isLoading}
      />

      {/* 3. Drill-down Drawer for Items in Group */}
      <ProductGroupDetailDrawer
        isOpen={Boolean(selectedGroupId)}
        onClose={() => setSelectedGroupId(null)}
        groupId={selectedGroupId}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  );
};
