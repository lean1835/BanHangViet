import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  IAnnualRevenueTrackingResponse,
  IUpdateWarningThresholdRequest,
  IUpdateWarningThresholdResponse,
} from "../types/IAnnualRevenueTracking";

export const annualRevenueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnnualRevenueTracking: builder.query<
      IApiResponse<IAnnualRevenueTrackingResponse>,
      { year?: number } | void
    >({
      query: (params) => ({
        url: "/tax-periods/annual-revenue-tracking",
        method: HTTP_METHODS.GET,
        params: params?.year ? { year: params.year } : undefined,
      }),
      providesTags: (result) => [
        {
          type: API_TAG_TYPES.ANNUAL_REVENUE,
          id: result?.result?.year ? `YEAR_${result.result.year}` : "CURRENT",
        },
        { type: API_TAG_TYPES.ANNUAL_REVENUE, id: "DETAILS" },
      ],
    }),

    updateWarningThreshold: builder.mutation<
      IApiResponse<IUpdateWarningThresholdResponse>,
      IUpdateWarningThresholdRequest
    >({
      query: (body) => ({
        url: "/tax-periods/annual-revenue-tracking/warning-threshold",
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.ANNUAL_REVENUE, id: "DETAILS" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "LIST" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "UNREAD_COUNT" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAnnualRevenueTrackingQuery,
  useUpdateWarningThresholdMutation,
} = annualRevenueApi;
