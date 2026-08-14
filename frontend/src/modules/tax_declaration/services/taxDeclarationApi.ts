import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  ITaxDeclarationSummary,
  ITaxAnnexInvoice,
  ITaxExportPayload,
} from "../types/ITaxDeclaration";
import type {
  ILockPeriodRequest,
  IUnlockPeriodRequest,
  IPeriodLockAudit,
  IRolloverAdjustment,
} from "../types/ITaxPeriodLock";

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

    lockTaxPeriod: builder.mutation<IApiResponse<void>, ILockPeriodRequest>({
      query: (body) => ({
        url: "/reports/tax-declaration/lock",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: (_result, _error, { periodCode, year }) => [
        { type: API_TAG_TYPES.REPORT, id: `TAX_SUMMARY_${periodCode}_${year}` },
        { type: API_TAG_TYPES.REPORT, id: "ACTIVITY_LOGS" },
      ],
    }),

    unlockTaxPeriod: builder.mutation<IApiResponse<void>, IUnlockPeriodRequest>({
      query: (body) => ({
        url: "/reports/tax-declaration/unlock",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: (_result, _error, { periodCode, year }) => [
        { type: API_TAG_TYPES.REPORT, id: `TAX_SUMMARY_${periodCode}_${year}` },
        { type: API_TAG_TYPES.REPORT, id: "ACTIVITY_LOGS" },
      ],
    }),

    getPeriodLockHistory: builder.query<IApiResponse<IPeriodLockAudit[]>, void>({
      query: () => ({
        url: "/reports/tax-declaration/lock-history",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "LOCK_HISTORY" }],
    }),

    getRolloverAdjustments: builder.query<
      IApiResponse<IRolloverAdjustment[]>,
      { periodCode: string; year: number }
    >({
      query: (params) => ({
        url: "/reports/tax-declaration/rollover-adjustments",
        method: HTTP_METHODS.GET,
        params,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "ROLLOVER_ADJUSTMENTS" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTaxDeclarationSummaryQuery,
  useGetTaxAnnexInvoicesQuery,
  useLogTaxExportAuditMutation,
  useLockTaxPeriodMutation,
  useUnlockTaxPeriodMutation,
  useGetPeriodLockHistoryQuery,
  useGetRolloverAdjustmentsQuery,
} = taxDeclarationApi;
