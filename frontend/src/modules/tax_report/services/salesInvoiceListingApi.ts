import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IGenerateTaxRegisterRequest,
  ITaxPeriodResponse,
  ITaxSalesRegisterItem,
} from "../types/salesInvoiceListing.types";

export const salesInvoiceListingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateSalesRegister: builder.mutation<
      IApiResponse<ITaxPeriodResponse>,
      IGenerateTaxRegisterRequest
    >({
      query: (body) => ({
        url: "/tax-periods/generate-sales-register",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.REPORT, id: "TAX_PERIODS_LIST" },
        { type: API_TAG_TYPES.REPORT, id: "SALES_INVOICE_LISTING" },
        { type: API_TAG_TYPES.REPORT, id: "TAX_REVENUE_SUMMARY" },
      ],
    }),

    getSalesRegisterItems: builder.query<
      IApiResponse<IPageResponse<ITaxSalesRegisterItem>>,
      { periodId: string; page?: number; size?: number }
    >({
      query: ({ periodId, page = 0, size = 20 }) => ({
        url: `/tax-periods/${periodId}/sales-register`,
        method: HTTP_METHODS.GET,
        params: { page, size },
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.REPORT,
                id,
              })),
              { type: API_TAG_TYPES.REPORT, id: "SALES_INVOICE_LISTING" },
            ]
          : [{ type: API_TAG_TYPES.REPORT, id: "SALES_INVOICE_LISTING" }],
    }),

    // Lấy tất cả các kỳ kê khai thuế của hộ kinh doanh
    getAllTaxPeriods: builder.query<IApiResponse<ITaxPeriodResponse[]>, void>({
      query: () => ({
        url: "/tax-periods",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "TAX_PERIODS_LIST" }],
    }),

    // Lấy thông tin chi tiết một kỳ kê khai thuế
    getTaxPeriodDetail: builder.query<IApiResponse<ITaxPeriodResponse>, string>({
      query: (periodId) => ({
        url: `/tax-periods/${periodId}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, periodId) => [
        { type: API_TAG_TYPES.REPORT, id: periodId },
      ],
    }),

    exportTaxDeclaration: builder.mutation<Blob, string>({
      query: (periodId) => ({
        url: `/tax-periods/${periodId}/export-declaration`,
        method: HTTP_METHODS.GET,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGenerateSalesRegisterMutation,
  useGetSalesRegisterItemsQuery,
  useGetAllTaxPeriodsQuery,
  useGetTaxPeriodDetailQuery,
  useExportTaxDeclarationMutation,
} = salesInvoiceListingApi;
