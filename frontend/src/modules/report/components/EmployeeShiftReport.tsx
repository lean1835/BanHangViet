import React, { useState } from "react";
import { Users, Clock, Loader2 } from "lucide-react";
import { useGetEmployeeShiftReportQuery } from "../services/reportApi";
import { useReportFilter } from "../context/ReportFilterContext";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import { EmployeeShiftKpis } from "./EmployeeShiftKpis";
import { EmployeeShiftSummaryTable } from "./EmployeeShiftSummaryTable";
import { ShiftDetailTable } from "./ShiftDetailTable";
import { ReportExportButton } from "./ReportExportButton";

export const EmployeeShiftReport: React.FC = () => {
  const { employeeShiftFilter } = useReportFilter();
  const { fromDate, toDate, userId, threshold } = employeeShiftFilter;

  const [activeTab, setActiveTab] = useState<"SUMMARY" | "SHIFTS">("SUMMARY");

  const {
    data: apiResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetEmployeeShiftReportQuery(
    {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      userId: userId || undefined,
      threshold: threshold || undefined,
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
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Báo cáo Doanh thu theo Nhân viên & Theo Ca
            </h1>
            {isFetching && (
              <Loader2 className="w-4 h-4 text-kv-blue-primary animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm soát hiệu suất thu ngân, đối soát chênh lệch tiền két và doanh số theo ca làm việc
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ReportExportButton
            reportType="EMPLOYEE_SHIFT"
            fromDate={fromDate}
            toDate={toDate}
            filter1={userId}
          />
        </div>
      </div>

      {/* 1. KPIs Cards */}
      <EmployeeShiftKpis reportData={reportData} isLoading={isLoading} />

      {/* 2. Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("SUMMARY")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "SUMMARY"
              ? "bg-kv-blue-primary text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Năng suất nhân viên ({reportData?.employeeSummaries?.length ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SHIFTS")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "SHIFTS"
              ? "bg-kv-blue-primary text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Nhật ký đối soát ca ({reportData?.shifts?.length ?? 0})</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "SUMMARY" ? (
        <EmployeeShiftSummaryTable
          summaries={reportData?.employeeSummaries || []}
          isLoading={isLoading}
        />
      ) : (
        <ShiftDetailTable
          shifts={reportData?.shifts || []}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
