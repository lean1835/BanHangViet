import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type { IOrderResponse } from "@/modules/order/types/IOrder";
import type {
  ISyncCheckRequest,
  ISyncCheckResponse,
  IOfflineOrderRequest,
  ISyncResolveRequest,
  ISyncSession,
  ISyncReconciliationSummary,
  ISyncSessionFilterParams,
} from "../types/ISync";
import { notifyOrderCompleted } from "@/utils/orderEvents";

export const syncApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkConflicts: builder.mutation<IApiResponse<ISyncCheckResponse>, ISyncCheckRequest>({
      query: (body) => ({
        url: "/sync/check",
        method: HTTP_METHODS.POST,
        body,
      }),
    }),
    bulkUpload: builder.mutation<IApiResponse<IOrderResponse[]>, IOfflineOrderRequest[]>({
      query: (body) => ({
        url: "/sync/bulk-upload",
        method: HTTP_METHODS.POST,
        body,
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          notifyOrderCompleted();
        } catch (e) {
          void e;
        }
      },
      invalidatesTags: [
        { type: API_TAG_TYPES.ORDER, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.ACTIVE_SHIFT, id: "ACTIVE" },
        { type: API_TAG_TYPES.SYNC, id: "STATUS" },
        { type: API_TAG_TYPES.SYNC, id: "SESSIONS" },
        { type: API_TAG_TYPES.SYNC, id: "SUMMARY" },
        API_TAG_TYPES.REPORT,
        API_TAG_TYPES.SALES_ANALYTICS,
      ],
    }),
    resolveConflict: builder.mutation<IApiResponse<IOrderResponse>, ISyncResolveRequest>({
      query: (body) => ({
        url: "/sync/resolve",
        method: HTTP_METHODS.POST,
        body,
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          notifyOrderCompleted();
        } catch (e) {
          void e;
        }
      },
      invalidatesTags: [
        { type: API_TAG_TYPES.ORDER, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.ACTIVE_SHIFT, id: "ACTIVE" },
        { type: API_TAG_TYPES.SYNC, id: "STATUS" },
        { type: API_TAG_TYPES.SYNC, id: "SESSIONS" },
        { type: API_TAG_TYPES.SYNC, id: "SUMMARY" },
        API_TAG_TYPES.REPORT,
        API_TAG_TYPES.SALES_ANALYTICS,
      ],
    }),
    getSyncSessions: builder.query<IApiResponse<IPageResponse<ISyncSession>>, ISyncSessionFilterParams | void>({
      query: (params) => ({
        url: "/sync/sessions",
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      providesTags: [{ type: API_TAG_TYPES.SYNC, id: "SESSIONS" }],
    }),
    getSyncSessionDetail: builder.query<IApiResponse<ISyncSession>, string>({
      query: (sessionId) => ({
        url: `/sync/sessions/${sessionId}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_res, _err, sessionId) => [{ type: API_TAG_TYPES.SYNC, id: sessionId }],
    }),
    getSyncReconciliationSummary: builder.query<IApiResponse<ISyncReconciliationSummary>, ISyncSessionFilterParams | void>({
      query: (params) => ({
        url: "/sync/reconciliation-summary",
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      providesTags: [{ type: API_TAG_TYPES.SYNC, id: "SUMMARY" }],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useCheckConflictsMutation,
  useBulkUploadMutation,
  useResolveConflictMutation,
  useGetSyncSessionsQuery,
  useGetSyncSessionDetailQuery,
  useGetSyncReconciliationSummaryQuery,
} = syncApi;
