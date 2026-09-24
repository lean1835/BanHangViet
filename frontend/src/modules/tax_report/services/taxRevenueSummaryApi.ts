import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type { ITaxRevenueSummaryResponse } from "../types/taxRevenueSummary.types";

export const taxRevenueSummaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaxRevenueSummary: builder.query<
      IApiResponse<ITaxRevenueSummaryResponse>,
      string
    >({
      query: (periodId) => ({
        url: `/tax-periods/${periodId}/tax-summary`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, periodId) => [
        { type: API_TAG_TYPES.REPORT, id: `TAX_REVENUE_SUMMARY_${periodId}` },
        { type: API_TAG_TYPES.REPORT, id: "TAX_REVENUE_SUMMARY" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useGetTaxRevenueSummaryQuery } = taxRevenueSummaryApi;
