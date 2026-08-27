import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IPosRevenueSummary } from "../types/IPosRevenue";

export interface IGetPosRevenueReportParams {
  fromDate?: string;
  toDate?: string;
  posId?: string;
}

export const posRevenueReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosRevenueReport: builder.query<
      IPosRevenueSummary,
      IGetPosRevenueReportParams | void
    >({
      query: (params) => ({
        url: "/points-of-sale/reports/revenue",
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: (response: { result: any }) => {
        const data = response?.result;
        if (!data) return data;
        const items = (data.posSummaries || []).map((s: any) => ({
          posId: s.posId,
          posName: s.posName,
          posCode: s.posCode,
          address: s.address || "",
          orderCount: Number(s.orderCount ?? 0),
          invoiceCount: Number(s.invoiceCount ?? 0),
          totalAmount: Number(s.grossSales ?? 0),
          discountAmount: Number(s.totalDiscount ?? 0),
          netRevenue: Number(s.netRevenue ?? 0),
          revenueProportion: Number(s.revenuePercentage ?? 0),
          isDefault: Boolean(s.isDefault),
          isActive: s.isActive !== false,
        }));
        const topPerforming = [...items].sort((a, b) => b.netRevenue - a.netRevenue)[0]?.posName;
        return {
          fromDate: data.fromDate || "",
          toDate: data.toDate || "",
          totalRevenue: Number(data.householdSummary?.totalNetRevenue ?? 0),
          totalOrders: Number(data.householdSummary?.totalOrders ?? 0),
          totalInvoices: Number(data.householdSummary?.totalInvoices ?? 0),
          topPerformingPosName: topPerforming,
          items,
        };
      },
      providesTags: [{ type: API_TAG_TYPES.POS_REVENUE, id: "SUMMARY" }],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const { useGetPosRevenueReportQuery } = posRevenueReportApi;
