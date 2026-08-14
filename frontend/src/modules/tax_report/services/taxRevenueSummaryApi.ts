import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type { ITaxPeriodQueryParams } from "../types/salesInvoiceListing.types";
import type { ITaxRevenueSummaryResponse } from "../types/taxRevenueSummary.types";

// Mock Fallback Data cho môi trường Demo / Testing
export const MOCK_TAX_REVENUE_SUMMARY: ITaxRevenueSummaryResponse = {
  periodTitle: "Quý 3 năm 2026",
  periodType: "QUARTER",
  periodValue: 3,
  year: 2026,
  summary: {
    totalTaxableRevenue: 184_000_000, // Doanh thu chịu thuế net (bám TC-01 PTYC)
    totalTaxAmount: 12_820_000,      // Thuế GTGT 8% (9,600,000) + Thuế GTGT 5% (3,220,000)
    totalAmount: 196_820_000,
    activeTaxRateGroupsCount: 3,
    hasExpiredTaxRateWarning: true,  // Bám TC-02 PTYC cảnh báo SP001
  },
  taxRateGroups: [
    {
      id: "trg-8",
      taxRateLabel: "Thuế suất 8%",
      taxRateValue: 8,
      taxableRevenue: 120_000_000,
      taxAmount: 9_600_000,
      totalPayment: 129_600_000,
      revenueSharePercent: 65.22,
      invoiceItemCount: 142,
      status: "ACTIVE",
      note: "Hàng hóa dịch vụ được giảm 2% thuế GTGT theo Nghị định",
    },
    {
      id: "trg-5",
      taxRateLabel: "Thuế suất 5%",
      taxRateValue: 5,
      taxableRevenue: 64_400_000,
      taxAmount: 3_220_000,
      totalPayment: 67_620_000,
      revenueSharePercent: 34.78,
      invoiceItemCount: 78,
      status: "ACTIVE",
      note: "Nông sản chế biến, thiết bị y tế, dịch vụ liên quan",
    },
    {
      id: "trg-0",
      taxRateLabel: "Thuế suất 0%",
      taxRateValue: 0,
      taxableRevenue: 0,
      taxAmount: 0,
      totalPayment: 0,
      revenueSharePercent: 0,
      invoiceItemCount: 0,
      status: "ACTIVE",
      note: "Hàng hóa xuất khẩu hoặc dịch vụ quốc tế",
    },
    {
      id: "trg-10-expired",
      taxRateLabel: "Thuế suất 10% (Hết hiệu lực)",
      taxRateValue: 10,
      taxableRevenue: 15_000_000,
      taxAmount: 1_500_000,
      totalPayment: 16_500_000,
      revenueSharePercent: 0,
      invoiceItemCount: 1,
      status: "EXPIRED",
      note: "Phát sinh mặt hàng gán thuế suất cũ đã ngừng áp dụng",
    },
  ],
  invalidTaxRateItems: [
    {
      id: "inv-warn-1",
      productCode: "SP001",
      productName: "Cà phê gói đóng hộp đặc biệt",
      invoiceSymbolNumber: "1/001 - C26TNV - 00000452",
      assignedTaxRate: "10%",
      reason: "Mặt hàng SP001 đang gán mức thuế suất 10% đã ngưng hiệu lực từ 31/12/2025. Vui lòng chuyển về 8% hoặc 5% trước khi chốt tổng hợp.",
    },
  ],
};

export const taxRevenueSummaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaxRevenueSummary: builder.query<
      IApiResponse<ITaxRevenueSummaryResponse>,
      ITaxPeriodQueryParams
    >({
      query: (params) => ({
        url: "/tax-reports/revenue-summary",
        method: HTTP_METHODS.GET,
        params: {
          periodType: params.periodType,
          periodValue: params.periodValue,
          year: params.year,
        },
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "TAX_REVENUE_SUMMARY" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetTaxRevenueSummaryQuery } = taxRevenueSummaryApi;
