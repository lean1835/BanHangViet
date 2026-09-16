import React, { useState } from "react";
import { AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { useGetGrossProfitReportQuery } from "../services/reportApi";
import { useReportFilter } from "../context/ReportFilterContext";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import { GrossProfitKpis } from "./GrossProfitKpis";
import { GrossProfitDailyChart } from "./GrossProfitDailyChart";
import { GrossProfitTable } from "./GrossProfitTable";
import { MissingCostItemsModal } from "./MissingCostItemsModal";
import { ReportExportButton } from "./ReportExportButton";

export const GrossProfitReport: React.FC = () => {
  const { grossProfitFilter } = useReportFilter();
  const { fromDate, toDate, productId } = grossProfitFilter;

  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);

  const {
    data: apiResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetGrossProfitReportQuery(
    {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      productId: productId || undefined,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Tự động làm mới khi có đơn hàng hoàn thành
  useOnOrderCompleted(refetch);

  const reportData = apiResponse?.result;
  const missingItems = reportData?.missingCostPriceItems || [];

  return (
    <div className="flex flex-col gap-6 w-full animate-auth-fade-in">
      {/* Top Header & Universal Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Báo cáo Lãi gộp theo Ngày & Mặt hàng
            </h1>
            {isFetching && (
              <Loader2 className="w-4 h-4 text-kv-blue-primary animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp doanh thu thuần, tiền vốn nhập kho và tỷ suất lợi nhuận gộp theo từng sản phẩm
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ReportExportButton
            reportType="GROSS_PROFIT"
            fromDate={fromDate}
            toDate={toDate}
            filter1={productId}
          />
        </div>
      </div>

      {/* Warning Banner: Missing Cost Items */}
      {missingItems.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Lưu ý:</strong> Có <strong>{missingItems.length} mặt hàng</strong> chưa được thiết lập giá vốn. Lợi nhuận gộp của các mặt hàng này đang tạm tính với giá vốn = 0đ.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMissingModalOpen(true)}
            className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
          >
            <span>Xem danh sách</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. KPIs Summary Cards */}
      <GrossProfitKpis summary={reportData?.summary} isLoading={isLoading} />

      {/* 2. Daily Trends Chart */}
      {reportData?.dailyReports && reportData.dailyReports.length > 0 && (
        <GrossProfitDailyChart
          dailyReports={reportData.dailyReports}
          isLoading={isLoading}
        />
      )}

      {/* 3. Items Detail Data Table */}
      <GrossProfitTable
        items={reportData?.itemReports || []}
        isLoading={isLoading}
      />

      {/* Modal Missing Cost Price Items */}
      <MissingCostItemsModal
        isOpen={isMissingModalOpen}
        onClose={() => setIsMissingModalOpen(false)}
        items={missingItems}
      />
    </div>
  );
};
