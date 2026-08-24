import React, { useEffect, useState } from "react";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import type { ITaxPeriodQueryParams, ITaxPeriodResponse } from "../types/salesInvoiceListing.types";
import {
  useExportTaxDeclarationMutation,
  useGenerateSalesRegisterMutation,
  useGetAllTaxPeriodsQuery,
  useGetSalesRegisterItemsQuery,
  useGetTaxPeriodDetailQuery,
} from "../services/salesInvoiceListingApi";
import { useGetTaxRevenueSummaryQuery } from "../services/taxRevenueSummaryApi";
import { TaxPeriodFilterBar } from "../components/TaxPeriodFilterBar";
import { SalesInvoiceSummaryCards } from "../components/SalesInvoiceSummaryCards";
import { SalesInvoiceListingTable } from "../components/SalesInvoiceListingTable";
import { ExportSalesInvoiceModal } from "../components/ExportSalesInvoiceModal";
import { TaxRevenueKPICards } from "../components/TaxRevenueKPICards";
import { TaxRevenueByRateTable } from "../components/TaxRevenueByRateTable";
import { InvalidTaxRateWarningBanner } from "../components/InvalidTaxRateWarningBanner";
import { ForbiddenTaxReportAccess } from "../components/ForbiddenTaxReportAccess";

export const SalesInvoiceListingPage: React.FC = () => {
  const { currentRole } = useDashboardDemo();
  const { showSuccess, showError, showWarning } = useNotification();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Mode Switcher: "SUMMARY" (NCL-12-CN-002) | "LISTING" (NCL-12-CN-001)
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "LISTING">("SUMMARY");

  const [filters, setFilters] = useState<ITaxPeriodQueryParams>({
    periodType: "MONTHLY",
    periodNumber: currentMonth,
    year: currentYear,
    page: 0,
    size: 20,
    search: "",
  });

  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Lấy danh sách toàn bộ kỳ kê khai đã lập
  const { data: allPeriodsData, isLoading: isAllPeriodsLoading } = useGetAllTaxPeriodsQuery(
    undefined,
    { skip: currentRole === USER_ROLES.CASHIER }
  );

  // 2. Mutation để sinh/cập nhật kỳ kê khai (POST /api/v1/tax-periods/generate-sales-register)
  const [generateSalesRegister, { isLoading: isGenerating }] = useGenerateSalesRegisterMutation();

  // 3. Tự động khớp kỳ kê khai hiện tại từ danh mục các kỳ đã lập
  useEffect(() => {
    if (allPeriodsData?.result) {
      const matched = allPeriodsData.result.find(
        (p: ITaxPeriodResponse) =>
          p.periodType === filters.periodType &&
          p.year === filters.year &&
          p.periodNumber === filters.periodNumber
      );
      if (matched) {
        setActivePeriodId(matched.id);
        setErrorMessage(null);
      } else {
        setActivePeriodId(null);
      }
    }
  }, [allPeriodsData, filters.periodType, filters.year, filters.periodNumber]);

  // 4. Lấy chi tiết kỳ kê khai hiện tại
  const { data: periodDetailData, isLoading: isPeriodDetailLoading } = useGetTaxPeriodDetailQuery(
    activePeriodId!,
    { skip: !activePeriodId || currentRole === USER_ROLES.CASHIER }
  );

  // 5. Query lấy danh sách dòng bảng kê hóa đơn bán ra (NCL-12-CN-001)
  const {
    data: registerItemsData,
    isLoading: isRegisterItemsLoading,
  } = useGetSalesRegisterItemsQuery(
    { periodId: activePeriodId!, page: filters.page, size: filters.size },
    { skip: !activePeriodId || currentRole === USER_ROLES.CASHIER }
  );

  // 6. Query lấy tổng hợp doanh thu theo mức thuế suất (NCL-12-CN-002)
  const {
    data: revenueSummaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useGetTaxRevenueSummaryQuery(activePeriodId!, {
    skip: !activePeriodId || currentRole === USER_ROLES.CASHIER,
  });

  // 7. Mutation xuất file Excel tờ khai thuế & bảng kê (NCL-12-CN-003)
  const [exportTaxDeclaration, { isLoading: isExporting }] = useExportTaxDeclarationMutation();

  const handleFilterChange = (newFilters: Partial<ITaxPeriodQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 0 }));
    setErrorMessage(null);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleGeneratePeriod = async () => {
    setErrorMessage(null);
    try {
      const res = await generateSalesRegister({
        periodType: filters.periodType,
        year: filters.year,
        periodNumber: filters.periodNumber,
      }).unwrap();

      if (res?.result?.id) {
        setActivePeriodId(res.result.id);
        showSuccess("Lập / Cập nhật bảng kê hóa đơn bán ra theo kỳ thành công!");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; code?: number } };
      setErrorMessage(
        apiErr?.data?.message ||
        "Không thể lập bảng kê cho kỳ này. Vui lòng kiểm tra lại trạng thái cấp mã hóa đơn trong kỳ."
      );
    }
  };

  const handleConfirmExport = async () => {
    if (!activePeriodId) {
      showWarning("Vui lòng bấm 'Lập / Cập nhật bảng kê' cho kỳ này trước khi xuất tệp.");
      return;
    }
    try {
      const blob = await exportTaxDeclaration(activePeriodId).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `To_khai_thue_${filters.periodType}_${filters.year}_${filters.periodNumber}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
      showSuccess("Xuất tờ khai thuế và bảng kê hóa đơn bán ra thành công!");
    } catch (_err) {
      showError(
        "Không thể xuất tờ khai thuế. Vui lòng kiểm tra lại thông tin Mã số thuế và Người đại diện của hộ kinh doanh trong phần Cấu hình."
      );
      setIsExportModalOpen(false);
    }
  };

  // TC-03 & TC-04: Security Check - Chặn vai trò Nhân viên bán hàng (VT-02)
  if (currentRole === USER_ROLES.CASHIER) {
    return <ForbiddenTaxReportAccess />;
  }

  const currentPeriod = periodDetailData?.result;
  const pageResult = registerItemsData?.result;
  const rawItems = pageResult?.content || [];

  // Client-side search by buyer name, tax code or invoice number
  const filteredListingItems = filters.search
    ? rawItems.filter((item) => {
      const s = (filters.search || "").toLowerCase();
      return (
        item.buyerName?.toLowerCase().includes(s) ||
        item.buyerTaxCode?.toLowerCase().includes(s) ||
        item.invoiceNumber?.toLowerCase().includes(s) ||
        item.invoiceSymbol?.toLowerCase().includes(s)
      );
    })
    : rawItems;

  const isGlobalLoading =
    isAllPeriodsLoading ||
    isPeriodDetailLoading ||
    isRegisterItemsLoading ||
    isSummaryLoading ||
    isGenerating;

  const summaryResult = revenueSummaryData?.result;
  const taxRateSummaries = summaryResult?.taxRateSummaries || [];

  // Parse 400 error when tax rates are expired or deactivated (NCL-12-CN-002 TC-02)
  const isExpiredRateError =
    summaryError &&
    "status" in summaryError &&
    (summaryError.status === 400 || summaryError.status === "CUSTOM_ERROR");

  const expiredRateErrorMessage =
    isExpiredRateError &&
      "data" in summaryError &&
      typeof summaryError.data === "object" &&
      summaryError.data &&
      "message" in summaryError.data
      ? String(summaryError.data.message)
      : undefined;

  const hasExpiredRateWarning = Boolean(isExpiredRateError);

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Báo cáo</span>
            <span>&rsaquo;</span>
            <span>Sổ sách thuế theo kỳ</span>
            <span>&rsaquo;</span>
            <span className="text-blue-600 font-bold">
              {activeTab === "SUMMARY" ? "Tổng hợp doanh thu chịu thuế" : "Bảng kê hóa đơn bán ra"}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Sổ sách & Hỗ trợ kê khai thuế theo kỳ
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Quản lý tập trung Bảng kê hóa đơn bán ra và Tổng hợp doanh thu chịu thuế phân tách theo từng mức thuế suất.
          </p>
        </div>

        {/* Action Button: Xuất Excel (NCL-12-CN-003) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Xuất tờ khai & Bảng kê (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("SUMMARY")}
          className={`pb-3 px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 border-b-2 hover:-translate-y-0.5 active:scale-98 group ${activeTab === "SUMMARY"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          1. Tổng hợp doanh thu chịu thuế theo kỳ
          {hasExpiredRateWarning && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("LISTING")}
          className={`pb-3 px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 border-b-2 hover:-translate-y-0.5 active:scale-98 group ${activeTab === "LISTING"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          2. Bảng kê hóa đơn bán ra
        </button>
      </div>

      {/* Shared Filter Bar (Vị trí gốc ngay trên bảng) */}
      <TaxPeriodFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onGenerate={handleGeneratePeriod}
        isLoading={isGlobalLoading}
      />

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cảnh báo thuế ngưng hiệu lực (TC-02) */}
      {hasExpiredRateWarning && (
        <InvalidTaxRateWarningBanner errorMessage={expiredRateErrorMessage} />
      )}

      {/* Thông báo hướng dẫn nếu kỳ chưa được khởi tạo */}
      {!activePeriodId && !errorMessage && !isGlobalLoading && (
        <div className="p-8 bg-blue-50/60 rounded-3xl border border-blue-200 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-blue-900">
            Kỳ kê khai chưa được lập trên hệ thống
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Nhấn nút <strong>&quot;Lập / Cập nhật bảng kê&quot;</strong> phía trên để hệ thống tự động tổng hợp toàn bộ hóa đơn đã cấp mã trong kỳ và phân nhóm theo mức thuế suất.
          </p>
          <button
            onClick={handleGeneratePeriod}
            disabled={isGenerating}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            {isGenerating ? "Đang lập bảng kê..." : "Lập bảng kê kỳ này ngay"}
          </button>
        </div>
      )}

      {/* Tab 1 Content: NCL-12-CN-002 (Tổng hợp doanh thu chịu thuế theo kỳ) */}
      {activeTab === "SUMMARY" && activePeriodId && (
        <div className="space-y-6">
          {/* TC-01: Summary KPI Cards */}
          <TaxRevenueKPICards
            summary={summaryResult}
            hasExpiredWarning={hasExpiredRateWarning}
            isLoading={isSummaryLoading}
          />

          {/* TC-01: Detailed Tax Rate Breakdown Table */}
          <TaxRevenueByRateTable
            items={taxRateSummaries}
            grandTotalRevenue={summaryResult?.totalRevenue}
            grandTotalTax={summaryResult?.totalTaxAmount}
            isLoading={isSummaryLoading}
          />
        </div>
      )}

      {/* Tab 2 Content: NCL-12-CN-001 (Bảng kê hóa đơn bán ra) */}
      {activeTab === "LISTING" && activePeriodId && (
        <div className="space-y-6">
          <SalesInvoiceSummaryCards
            period={currentPeriod}
            isLoading={isPeriodDetailLoading}
          />

          <SalesInvoiceListingTable
            items={filteredListingItems}
            isLoading={isRegisterItemsLoading}
            page={pageResult?.pageNumber ?? filters.page ?? 0}
            size={pageResult?.pageSize ?? filters.size ?? 20}
            totalElements={pageResult?.totalElements ?? 0}
            totalPages={pageResult?.totalPages ?? 1}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal Xuất file Bảng kê & Tờ khai */}
      <ExportSalesInvoiceModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleConfirmExport}
        filters={filters}
        isExporting={isExporting}
      />
    </div>
  );
};

export default SalesInvoiceListingPage;
