import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  ITaxPeriodQueryParams,
  ISalesInvoiceListingResponse,
} from "../types/salesInvoiceListing.types";

export const salesInvoiceListingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSalesInvoiceListing: builder.query<
      IApiResponse<ISalesInvoiceListingResponse>,
      ITaxPeriodQueryParams
    >({
      query: (params) => ({
        url: "/tax-reports/sales-invoices",
        method: HTTP_METHODS.GET,
        params: {
          periodType: params.periodType,
          periodValue: params.periodValue,
          year: params.year,
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || undefined,
        },
      }),
      providesTags: (result) =>
        result?.result?.items
          ? [
              ...result.result.items.map(({ id }) => ({
                type: API_TAG_TYPES.REPORT,
                id,
              })),
              { type: API_TAG_TYPES.REPORT, id: "SALES_INVOICE_LISTING" },
            ]
          : [{ type: API_TAG_TYPES.REPORT, id: "SALES_INVOICE_LISTING" }],
    }),

    exportSalesInvoiceListing: builder.mutation<
      Blob,
      ITaxPeriodQueryParams & { format?: "excel" | "pdf" }
    >({
      query: (params) => ({
        url: "/tax-reports/sales-invoices/export",
        method: HTTP_METHODS.POST,
        body: params,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSalesInvoiceListingQuery,
  useExportSalesInvoiceListingMutation,
} = salesInvoiceListingApi;
