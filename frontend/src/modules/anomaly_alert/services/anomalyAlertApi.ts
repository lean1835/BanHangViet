import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IAnomalyAlert,
  IAnomalyAlertFilterParams,
  IAnomalyAlertSummary,
  IReviewAnomalyAlertRequest,
  IAnomalyRuleConfig,
  IUpdateAnomalyRuleRequest,
  IScanAnomalyRequest,
  IScanAnomalyResult,
} from "../types/IAnomalyAlert";

export const anomalyAlertApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnomalyAlerts: builder.query<
      IApiResponse<IPageResponse<IAnomalyAlert>>,
      IAnomalyAlertFilterParams | void
    >({
      query: (params) => {
        const queryParams: Record<string, unknown> = {};
        if (params) {
          if (params.page !== undefined) queryParams.page = params.page;
          if (params.size !== undefined) queryParams.size = params.size;
          if (params.keyword && params.keyword.trim()) queryParams.keyword = params.keyword.trim();
          if (params.severity && params.severity.trim()) queryParams.severity = params.severity.trim();
          if (params.status && params.status.trim()) queryParams.status = params.status.trim();
          if (params.alertType && params.alertType.trim()) queryParams.alertType = params.alertType.trim();
          if (params.startDate) queryParams.startDate = params.startDate;
          if (params.endDate) queryParams.endDate = params.endDate;
        }
        return {
          url: "/anomaly-alerts",
          method: HTTP_METHODS.GET,
          params: queryParams,
        };
      },
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.ANOMALY_ALERT,
                id,
              })),
              { type: API_TAG_TYPES.ANOMALY_ALERT, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.ANOMALY_ALERT, id: "LIST" }],
    }),

    getSummary: builder.query<
      IApiResponse<IAnomalyAlertSummary>,
      { date?: string } | void
    >({
      query: (params) => ({
        url: "/anomaly-alerts/summary",
        method: HTTP_METHODS.GET,
        params: params?.date ? { date: params.date } : undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.ANOMALY_ALERT, id: "SUMMARY" }],
    }),

    getAlertById: builder.query<IApiResponse<IAnomalyAlert>, string>({
      query: (id) => ({
        url: `/anomaly-alerts/${id}`,
        method: HTTP_METHODS.GET,
      }),
    }),

    scanAnomalies: builder.mutation<
      IApiResponse<IScanAnomalyResult>,
      IScanAnomalyRequest | void
    >({
      query: (body) => ({
        url: "/anomaly-alerts/scan",
        method: HTTP_METHODS.POST,
        body: body || {},
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.ANOMALY_ALERT, id: "LIST" },
        { type: API_TAG_TYPES.ANOMALY_ALERT, id: "SUMMARY" },
      ],
    }),

    reviewAlert: builder.mutation<
      IApiResponse<IAnomalyAlert>,
      { id: string; body: IReviewAnomalyAlertRequest }
    >({
      query: ({ id, body }) => ({
        url: `/anomaly-alerts/${id}/review`,
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.ANOMALY_ALERT, id: "LIST" },
        { type: API_TAG_TYPES.ANOMALY_ALERT, id: "SUMMARY" },
      ],
    }),

    getRuleConfigs: builder.query<IApiResponse<IAnomalyRuleConfig[]>, void>({
      query: () => ({
        url: "/anomaly-alerts/rules",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.ANOMALY_ALERT, id: "RULES" }],
    }),

    updateRuleConfig: builder.mutation<
      IApiResponse<IAnomalyRuleConfig>,
      { id: string; body: IUpdateAnomalyRuleRequest }
    >({
      query: ({ id, body }) => ({
        url: `/anomaly-alerts/rules/${id}`,
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.ANOMALY_ALERT, id: "RULES" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAnomalyAlertsQuery,
  useGetSummaryQuery,
  useGetAlertByIdQuery,
  useScanAnomaliesMutation,
  useReviewAlertMutation,
  useGetRuleConfigsQuery,
  useUpdateRuleConfigMutation,
} = anomalyAlertApi;
