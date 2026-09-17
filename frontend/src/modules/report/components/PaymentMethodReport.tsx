import React from "react";
import { Loader2, CreditCard } from "lucide-react";
import { useGetPaymentMethodReportQuery } from "../services/reportApi";
import { useReportFilter } from "../context/ReportFilterContext";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import { PaymentMethodKpis } from "./PaymentMethodKpis";
import { PaymentMethodCharts } from "./PaymentMethodCharts";
import { PaymentMethodTable } from "./PaymentMethodTable";
import { ReportExportButton } from "./ReportExportButton";

export const PaymentMethodReport: React.FC = () => {
  const { paymentMethodFilter } = useReportFilter();
  const { fromDate, toDate, userId, shiftId } = paymentMethodFilter;

  const {
    data: apiResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetPaymentMethodReportQuery(
    {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      userId: userId || undefined,
      shiftId: shiftId || undefined,
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-kv-blue-light text-kv-blue-primary flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Báo cáo Doanh thu theo Hình thức thanh toán
            </h1>
            {isFetching && (
              <Loader2 className="w-4 h-4 text-kv-blue-primary animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi dòng tiền thu từ Tiền mặt, Chuyển khoản ngân hàng/QR và đối soát nợ khách hàng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ReportExportButton
            reportType="PAYMENT_METHOD"
            fromDate={fromDate}
            toDate={toDate}
            filter1={userId}
            filter2={shiftId}
          />
        </div>
      </div>

      {/* 1. KPIs Cards */}
      <PaymentMethodKpis reportData={reportData} isLoading={isLoading} />

      {/* 2. Visual Charts */}
      <PaymentMethodCharts
        methods={reportData?.methods || []}
        dailyTrends={reportData?.dailyTrends || []}
        totalRevenue={reportData?.totalRevenue ?? 0}
        isLoading={isLoading}
      />

      {/* 3. Detailed Data Table & Debt Box */}
      <PaymentMethodTable
        methods={reportData?.methods || []}
        debtDetails={reportData?.debtDetails}
        isLoading={isLoading}
      />
    </div>
  );
};
