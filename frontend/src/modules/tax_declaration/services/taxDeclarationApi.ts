import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  ITaxDeclarationSummary,
  ITaxAnnexInvoice,
  ITaxExportPayload,
} from "../types/ITaxDeclaration";

export const taxDeclarationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaxDeclarationSummary: builder.query<
      IApiResponse<ITaxDeclarationSummary>,
      { periodCode: string; year: number; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: "/reports/tax-declaration/summary",
        method: HTTP_METHODS.GET,
        params,
      }),
      providesTags: (_result, _error, { periodCode, year }) => [
        { type: API_TAG_TYPES.REPORT, id: `TAX_SUMMARY_${periodCode}_${year}` },
      ],
    }),

    getTaxAnnexInvoices: builder.query<
      IApiResponse<ITaxAnnexInvoice[]>,
      { periodCode: string; year: number; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: "/reports/tax-declaration/annex-invoices",
        method: HTTP_METHODS.GET,
        params,
      }),
      providesTags: [{ type: API_TAG_TYPES.INVOICE, id: "ANNEX_LIST" }],
    }),

    logTaxExportAudit: builder.mutation<IApiResponse<void>, ITaxExportPayload>({
      query: (body) => ({
        url: "/reports/tax-declaration/export-audit",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.REPORT, id: "ACTIVITY_LOGS" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTaxDeclarationSummaryQuery,
  useGetTaxAnnexInvoicesQuery,
  useLogTaxExportAuditMutation,
} = taxDeclarationApi;
