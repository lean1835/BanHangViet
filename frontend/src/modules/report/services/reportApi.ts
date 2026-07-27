import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IDashboardOverviewResponse,
  IDailyRevenueProjection,
  IProductRevenueProjection,
  IReconciliationResponse,
  ICompareRevenueResponse,
  IActivityLogResponse,
} from "../types/IReport";

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<
      IApiResponse<IDashboardOverviewResponse>,
      { fromDate?: string; toDate?: string } | void
    >({
      query: (params) => ({
        url: "/reports/dashboard",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "OVERVIEW" }],
    }),
    getDailyRevenue: builder.query<
      IApiResponse<IDailyRevenueProjection[]>,
      { fromDate?: string; toDate?: string } | void
    >({
      query: (params) => ({
        url: "/reports/daily",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "DAILY" }],
    }),
    getProductRevenue: builder.query<
      IApiResponse<IProductRevenueProjection[]>,
      { fromDate?: string; toDate?: string } | void
    >({
      query: (params) => ({
        url: "/reports/products",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "PRODUCTS" }],
    }),
    getTopSellingProducts: builder.query<
      IApiResponse<IProductRevenueProjection[]>,
      { fromDate?: string; toDate?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: "/reports/top-selling",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "TOP_SELLING" }],
    }),
    getReconciliation: builder.query<
      IApiResponse<IReconciliationResponse>,
      { date: string }
    >({
      query: (params) => ({
        url: "/reports/reconciliation",
        method: HTTP_METHODS.GET,
        params,
      }),
      providesTags: (_result, _error, arg) => [
        { type: API_TAG_TYPES.REPORT, id: `RECON_${arg.date}` },
        { type: API_TAG_TYPES.REPORT, id: "RECON_LIST" },
      ],
    }),
    lockReconciliation: builder.mutation<
      IApiResponse<void>,
      { date: string; notes?: string }
    >({
      query: (body) => ({
        url: "/reports/reconciliation/lock",
        method: HTTP_METHODS.POST,
        params: { date: body.date, notes: body.notes },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: API_TAG_TYPES.REPORT, id: `RECON_${arg.date}` },
        { type: API_TAG_TYPES.REPORT, id: "RECON_LIST" },
        { type: API_TAG_TYPES.REPORT, id: "LOGS" },
        { type: API_TAG_TYPES.REPORT, id: "OVERVIEW" },
        { type: API_TAG_TYPES.REPORT, id: "DAILY" },
        { type: API_TAG_TYPES.REPORT, id: "PRODUCTS" },
        { type: API_TAG_TYPES.REPORT, id: "TOP_SELLING" },
      ],
    }),
    compareRevenue: builder.query<
      IApiResponse<ICompareRevenueResponse>,
      {
        period1Start: string;
        period1End: string;
        period2Start: string;
        period2End: string;
      }
    >({
      query: (params) => ({
        url: "/reports/comparison",
        method: HTTP_METHODS.GET,
        params,
      }),
    }),
    getActivityLogs: builder.query<
      IApiResponse<IPageResponse<IActivityLogResponse>>,
      {
        targetUsername?: string;
        fromDate?: string;
        toDate?: string;
        page?: number;
        size?: number;
      } | void
    >({
      query: (params) => ({
        url: "/reports/activity-logs",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "LOGS" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDashboardOverviewQuery,
  useLazyGetDashboardOverviewQuery,
  useGetDailyRevenueQuery,
  useGetProductRevenueQuery,
  useGetTopSellingProductsQuery,
  useGetReconciliationQuery,
  useLazyGetReconciliationQuery,
  useLockReconciliationMutation,
  useCompareRevenueQuery,
  useGetActivityLogsQuery,
} = reportApi;
