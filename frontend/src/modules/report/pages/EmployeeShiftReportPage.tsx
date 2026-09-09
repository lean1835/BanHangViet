import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Loader2,
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  Clock,
} from "lucide-react";
import { useGetEmployeeShiftRevenueReportQuery } from "../services/shiftRevenueReportApi";
import type {
  IShiftRevenueItem,
  IShiftRevenueReportResponse,
} from "../types/IShiftRevenueReport";
import { ShiftRevenueKpiCards } from "../components/ShiftRevenueKpiCards";
import { ShiftRevenueTable } from "../components/ShiftRevenueTable";
import { EmployeeShiftAggregateTable } from "../components/EmployeeShiftAggregateTable";
import { ShiftDetailDrawer } from "../components/ShiftDetailDrawer";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { useOptionalReportFilter } from "../context/ReportFilterContext";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import { useNotification } from "@/hooks/useNotification";

type TReportViewMode = "shifts" | "employees";

export const EmployeeShiftReportPage: React.FC = () => {
  const { currentRole } = useDashboardDemo();
  const { showSuccess } = useNotification();
  const reportFilterCtx = useOptionalReportFilter();

  const [viewMode, setViewMode] = useState<TReportViewMode>("shifts");
  const [selectedShift, setSelectedShift] = useState<IShiftRevenueItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lấy bộ lọc từ context
  const defaultFilterState = useMemo(
    () => ({
      fromDate: new Date().toISOString().substring(0, 10),
      toDate: new Date().toISOString().substring(0, 10),
      employeeId: "",
      threshold: 50000,
      onlyDiscrepancy: false,
      activePreset: "thisMonth" as const,
    }),
    []
  );

  const filterState = reportFilterCtx?.employeeShiftFilter ?? defaultFilterState;

  // Gọi RTK Query với mock fallback tự động
  const {
    data: reportData,
    isLoading,
    isFetching,
    refetch,
  } = useGetEmployeeShiftRevenueReportQuery(
    {
      fromDate: filterState.fromDate,
      toDate: filterState.toDate,
      employeeId: filterState.employeeId || undefined,
      threshold: filterState.threshold,
      onlyDiscrepancy: filterState.onlyDiscrepancy,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Tự động làm mới khi có đơn hàng hoàn thành
  useOnOrderCompleted(refetch);

  const reportSummary: IShiftRevenueReportResponse = useMemo(() => {
    if (reportData) {
      return reportData;
    }
    return {
      fromDate: filterState.fromDate,
      toDate: filterState.toDate,
      threshold: filterState.threshold,
      totalShifts: 0,
      totalRevenue: 0,
      totalCashRevenue: 0,
      totalTransferRevenue: 0,
      totalOrders: 0,
      totalCanceledOrders: 0,
      totalDiscrepancyAmount: 0,
      overThresholdCount: 0,
      shifts: [],
      employeeSummaries: [],
    };
  }, [reportData, filterState]);

  const handleOpenDetail = (shift: IShiftRevenueItem) => {
    setSelectedShift(shift);
    setIsDrawerOpen(true);
  };

  const handleExportExcel = () => {
    showSuccess("Đang xuất tệp Excel báo cáo doanh thu ca...");
  };

  const handlePrint = () => {
    window.print();
  };

  // RBAC Guard: QTN-10 & Acceptance Criteria TC-03 (Chặn vai trò thu ngân VT-02)
  const isCashier = currentRole === USER_ROLES.CASHIER;
  if (isCashier) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 animate-fade-in my-12 bg-white rounded-2xl border border-rose-200 shadow-xs">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Không có quyền truy cập báo cáo
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tài khoản của bạn với vai trò <strong>Thu ngân (VT-02)</strong> không có quyền xem báo cáo doanh thu tổng theo nhân viên và ca làm việc (theo quy tắc nghiệp vụ <strong>QTN-10</strong>). Vui lòng đăng nhập với vai trò <strong>Chủ hộ (VT-01)</strong> hoặc <strong>Kế toán (VT-03)</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full animate-auth-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Báo Cáo Doanh Thu Theo Nhân Viên & Theo Ca
            </h1>
            {isFetching && (
              <Loader2 className="w-4 h-4 text-kv-blue-primary animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp hiệu quả bán hàng, cơ cấu doanh thu tiền mặt / chuyển khoản và kiểm soát mức chênh lệch két tiền
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* Thông tin khoảng thời gian đang lọc */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/70 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Calendar className="w-4 h-4 text-kv-blue-primary" />
          <span>
            Khoảng thời gian: <strong className="text-slate-800">{filterState.fromDate}</strong> đến{" "}
            <strong className="text-slate-800">{filterState.toDate}</strong>
          </span>
          {filterState.employeeId && (
            <span className="ml-2 pl-2 border-l border-slate-200 text-kv-blue-primary font-bold">
              Lọc theo 1 nhân viên
            </span>
          )}
          {filterState.onlyDiscrepancy && (
            <span className="ml-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
              Chỉ xem ca lệch
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode("shifts")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "shifts"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chi tiết từng ca ({reportSummary.shifts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("employees")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "employees"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tổng hợp nhân viên ({reportSummary.employeeSummaries.length})</span>
          </button>
        </div>
      </div>


      {/* 4 KPI Cards */}
      <ShiftRevenueKpiCards
        summary={reportSummary}
        viewMode={viewMode}
        isLoading={isLoading}
      />

      {/* Main Table Content based on View Mode */}
      {viewMode === "shifts" ? (
        <ShiftRevenueTable
          shifts={reportSummary.shifts}
          threshold={filterState.threshold}
          isLoading={isLoading}
          onViewDetail={handleOpenDetail}
        />
      ) : (
        <EmployeeShiftAggregateTable
          summaries={reportSummary.employeeSummaries}
          isLoading={isLoading}
        />
      )}

      {/* Drawer Chi Tiết Ca */}
      <ShiftDetailDrawer
        shift={selectedShift}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default EmployeeShiftReportPage;
