import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IPriceAdjustmentPreviewRequest,
  IPriceAdjustmentPreviewResponse,
  IApplyPriceAdjustmentRequest,
  IRevertPriceAdjustmentRequest,
  IPriceAdjustmentBatch,
  IPriceAdjustmentBatchQueryParams,
} from "../types/IPriceAdjustment";

export const priceAdjustmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    previewPriceAdjustment: builder.mutation<
      IApiResponse<IPriceAdjustmentPreviewResponse>,
      IPriceAdjustmentPreviewRequest
    >({
      query: (body) => ({
        url: "/price-adjustments/preview",
        method: HTTP_METHODS.POST,
        body,
      }),
    }),

    applyPriceAdjustment: builder.mutation<
      IApiResponse<IPriceAdjustmentBatch>,
      IApplyPriceAdjustmentRequest
    >({
      query: (body) => ({
        url: "/price-adjustments/apply",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.PRICE_ADJUSTMENT, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
      ],
    }),

    revertPriceAdjustment: builder.mutation<
      IApiResponse<IPriceAdjustmentBatch>,
      { batchId: string; body: IRevertPriceAdjustmentRequest }
    >({
      query: ({ batchId, body }) => ({
        url: `/price-adjustments/${batchId}/revert`,
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: (_result, _error, { batchId }) => [
        { type: API_TAG_TYPES.PRICE_ADJUSTMENT, id: batchId },
        { type: API_TAG_TYPES.PRICE_ADJUSTMENT, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
      ],
    }),

    getPriceAdjustmentBatches: builder.query<
      IApiResponse<IPageResponse<IPriceAdjustmentBatch>>,
      IPriceAdjustmentBatchQueryParams | void
    >({
      query: (params) => ({
        url: "/price-adjustments",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.PRICE_ADJUSTMENT, id: "LIST" }],
    }),

    getPriceAdjustmentBatchById: builder.query<
      IApiResponse<IPriceAdjustmentBatch>,
      string
    >({
      query: (batchId) => ({
        url: `/price-adjustments/${batchId}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, batchId) => [
        { type: API_TAG_TYPES.PRICE_ADJUSTMENT, id: batchId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  usePreviewPriceAdjustmentMutation,
  useApplyPriceAdjustmentMutation,
  useRevertPriceAdjustmentMutation,
  useGetPriceAdjustmentBatchesQuery,
  useGetPriceAdjustmentBatchByIdQuery,
} = priceAdjustmentApi;
