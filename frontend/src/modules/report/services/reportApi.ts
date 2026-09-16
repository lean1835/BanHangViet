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
  IGrossProfitReportResponse,
  IEmployeeShiftReportResponse,
  IPaymentMethodReportResponse,
  IProductGroupReportResponse,
  IProductGroupRevenueDetailResponse,
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

    // NCL-07-CN-008: Báo cáo lãi gộp theo ngày và theo mặt hàng
    getGrossProfitReport: builder.query<
      IApiResponse<IGrossProfitReportResponse>,
      { fromDate?: string; toDate?: string; productId?: string } | void
    >({
      query: (params) => ({
        url: "/reports/gross-profit",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "GROSS_PROFIT" }],
    }),

    // NCL-07-CN-010: Báo cáo doanh thu theo nhân viên và theo ca
    getEmployeeShiftReport: builder.query<
      IApiResponse<IEmployeeShiftReportResponse>,
      { fromDate?: string; toDate?: string; userId?: string; threshold?: number } | void
    >({
      query: (params) => ({
        url: "/reports/employee-shifts",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "EMPLOYEE_SHIFTS" }],
    }),

    // NCL-07-CN-011: Báo cáo doanh thu theo hình thức thanh toán
    getPaymentMethodReport: builder.query<
      IApiResponse<IPaymentMethodReportResponse>,
      { fromDate?: string; toDate?: string; userId?: string; shiftId?: string } | void
    >({
      query: (params) => ({
        url: "/reports/payment-methods",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "PAYMENT_METHODS" }],
    }),

    // NCL-07-CN-012: Báo cáo doanh thu theo nhóm hàng
    getProductGroupReport: builder.query<
      IApiResponse<IProductGroupReportResponse>,
      { fromDate?: string; toDate?: string } | void
    >({
      query: (params) => ({
        url: "/reports/product-groups",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "PRODUCT_GROUPS" }],
    }),

    // NCL-07-CN-012: Drill-down chi tiết mặt hàng trong nhóm hàng
    getProductGroupDetail: builder.query<
      IApiResponse<IProductGroupRevenueDetailResponse>,
      { groupId: string; fromDate?: string; toDate?: string }
    >({
      query: ({ groupId, ...params }) => ({
        url: `/reports/product-groups/${groupId}/products`,
        method: HTTP_METHODS.GET,
        params,
      }),
      providesTags: (_result, _error, arg) => [
        { type: API_TAG_TYPES.REPORT, id: `GROUP_DETAIL_${arg.groupId}` },
      ],
    }),

    // NCL-07-CN-009: Xuất báo cáo ra file Excel (.xlsx)
    exportReport: builder.mutation<
      Blob,
      {
        reportType: string;
        fromDate?: string;
        toDate?: string;
        filter1?: string;
        filter2?: string;
      }
    >({
      query: (params) => ({
        url: "/reports/export",
        method: HTTP_METHODS.GET,
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: true,
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
  useGetGrossProfitReportQuery,
  useGetEmployeeShiftReportQuery,
  useGetPaymentMethodReportQuery,
  useGetProductGroupReportQuery,
  useGetProductGroupDetailQuery,
  useExportReportMutation,
} = reportApi;

