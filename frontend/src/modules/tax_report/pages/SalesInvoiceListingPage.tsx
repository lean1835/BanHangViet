import React, { useState } from "react";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import type { ITaxPeriodQueryParams } from "../types/salesInvoiceListing.types";
import {
  useExportSalesInvoiceListingMutation,
  useGetSalesInvoiceListingQuery,
} from "../services/salesInvoiceListingApi";
import {
  useGetTaxRevenueSummaryQuery,
  MOCK_TAX_REVENUE_SUMMARY,
} from "../services/taxRevenueSummaryApi";
import { TaxPeriodFilterBar } from "../components/TaxPeriodFilterBar";
import { SalesInvoiceSummaryCards } from "../components/SalesInvoiceSummaryCards";
import { SalesInvoiceListingTable } from "../components/SalesInvoiceListingTable";
import { ExportSalesInvoiceModal } from "../components/ExportSalesInvoiceModal";
import { TaxRevenueKPICards } from "../components/TaxRevenueKPICards";
import { TaxRevenueByRateTable } from "../components/TaxRevenueByRateTable";
import { InvalidTaxRateWarningBanner } from "../components/InvalidTaxRateWarningBanner";
import { ForbiddenTaxReportAccess } from "../components/ForbiddenTaxReportAccess";

export const SalesInvoiceListingPage: React.FC = () => {
  // Check security role for TC-03
  const { currentRole } = useDashboardDemo();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

  // Mode Switcher: "LISTING" (NCL-12-CN-001) | "SUMMARY" (NCL-12-CN-002)
  const [activeTab, setActiveTab] = useState<"LISTING" | "SUMMARY">("SUMMARY");

  const [filters, setFilters] = useState<ITaxPeriodQueryParams>({
    periodType: "QUARTER",
    periodValue: currentQuarter,
    year: currentYear,
    page: 1,
    limit: 20,
    search: "",
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // RTK Query hooks for NCL-12-CN-001 (Listing)
  const { data: listingData, isLoading: isListingLoading, refetch: refetchListing } =
    useGetSalesInvoiceListingQuery(filters, { skip: currentRole === USER_ROLES.CASHIER });
  const [exportMutation, { isLoading: isExporting }] = useExportSalesInvoiceListingMutation();

  // RTK Query hooks for NCL-12-CN-002 (Tax Revenue Summary)
  const { data: summaryApiData, isLoading: isSummaryLoading, refetch: refetchSummary } =
    useGetTaxRevenueSummaryQuery(filters, { skip: currentRole === USER_ROLES.CASHIER });

  // TC-03: Security Check - Chặn vai trò Nhân viên bán hàng (VT-02)
  if (currentRole === USER_ROLES.CASHIER) {
    return <ForbiddenTaxReportAccess />;
  }

  const handleFilterChange = (newFilters: Partial<ITaxPeriodQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleRefreshAll = () => {
    refetchListing();
    refetchSummary();
  };

  const handleConfirmExport = async (format: "excel" | "pdf") => {
    try {
      const blob = await exportMutation({ ...filters, format }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bang_Ke_Hoa_Don_Ban_Ra_${filters.periodType}_${filters.periodValue}_${filters.year}.${
        format === "excel" ? "xlsx" : "pdf"
      }`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Đã bắt đầu tải xuống tệp bảng kê hóa đơn bán ra!");
      setIsExportModalOpen(false);
    }
  };

  // Data processing for Listing (NCL-12-CN-001)
  const listingResponse = listingData?.result;
  const listingItems = listingResponse?.items || [];
  const listingSummary = listingResponse?.summary;
  const listingMeta = listingResponse?.meta || {
    total: 0,
    page: filters.page || 1,
    limit: filters.limit || 20,
    totalPages: 1,
  };

  // Data processing for Tax Revenue Summary (NCL-12-CN-002) with Mock fallback
  const revenueSummaryData = summaryApiData?.result || MOCK_TAX_REVENUE_SUMMARY;
  const taxSummary = revenueSummaryData.summary;
  const taxRateGroups = revenueSummaryData.taxRateGroups || [];
  const invalidTaxRateItems = revenueSummaryData.invalidTaxRateItems || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Báo cáo</span>
            <span>&rsaquo;</span>
            <span>Sổ sách thuế theo kỳ</span>
            <span>&rsaquo;</span>
            <span className="text-blue-600 font-bold">
              {activeTab === "SUMMARY"
                ? "Tổng hợp doanh thu chịu thuế (CN-002)"
                : "Bảng kê hóa đơn bán ra (CN-001)"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Sổ sách & Báo cáo thuế theo kỳ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tập trung Bảng kê hóa đơn bán ra và Tổng hợp doanh thu chịu thuế phân tách theo từng mức thuế suất.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "LISTING" && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={isListingLoading || listingItems.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Xuất file Bảng kê
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("SUMMARY")}
          className={`pb-3 px-4 text-xs font-extrabold transition flex items-center gap-2 border-b-2 ${
            activeTab === "SUMMARY"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          1. Tổng hợp doanh thu chịu thuế theo kỳ (CN-002)
          {invalidTaxRateItems.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("LISTING")}
          className={`pb-3 px-4 text-xs font-extrabold transition flex items-center gap-2 border-b-2 ${
            activeTab === "LISTING"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          2. Bảng kê hóa đơn bán ra (CN-001)
        </button>
      </div>

      {/* Shared Filter Bar */}
      <TaxPeriodFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onRefresh={handleRefreshAll}
        isLoading={activeTab === "SUMMARY" ? isSummaryLoading : isListingLoading}
      />

      {/* Tab 1 Content: NCL-12-CN-002 (Tổng hợp doanh thu chịu thuế theo kỳ) */}
      {activeTab === "SUMMARY" && (
        <div className="space-y-6">
          {/* TC-02: Warning banner for expired tax rate items */}
          <InvalidTaxRateWarningBanner items={invalidTaxRateItems} />

          {/* TC-01: Summary KPI Cards */}
          <TaxRevenueKPICards summary={taxSummary} isLoading={isSummaryLoading} />

          {/* TC-01: Detailed Tax Rate Breakdown Table */}
          <TaxRevenueByRateTable items={taxRateGroups} isLoading={isSummaryLoading} />
        </div>
      )}

      {/* Tab 2 Content: NCL-12-CN-001 (Bảng kê hóa đơn bán ra) */}
      {activeTab === "LISTING" && (
        <div className="space-y-6">
          <SalesInvoiceSummaryCards summary={listingSummary} isLoading={isListingLoading} />

          <SalesInvoiceListingTable
            items={listingItems}
            isLoading={isListingLoading}
            page={listingMeta.page}
            limit={listingMeta.limit}
            totalElements={listingMeta.total}
            totalPages={listingMeta.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal Xuất file Bảng kê */}
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
