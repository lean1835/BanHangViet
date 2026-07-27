import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type { IOrderResponse } from "@/modules/order/types/IOrder";
import type {
  ISyncCheckRequest,
  ISyncCheckResponse,
  IOfflineOrderRequest,
  ISyncResolveRequest,
} from "../types/ISync";

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
      invalidatesTags: [
        { type: API_TAG_TYPES.ORDER, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.ACTIVE_SHIFT, id: "ACTIVE" },
        { type: API_TAG_TYPES.SYNC, id: "STATUS" },
      ],
    }),
    resolveConflict: builder.mutation<IApiResponse<IOrderResponse>, ISyncResolveRequest>({
      query: (body) => ({
        url: "/sync/resolve",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.ORDER, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.ACTIVE_SHIFT, id: "ACTIVE" },
        { type: API_TAG_TYPES.SYNC, id: "STATUS" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useCheckConflictsMutation,
  useBulkUploadMutation,
  useResolveConflictMutation,
} = syncApi;
