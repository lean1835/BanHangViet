import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IPromotion, IPromotionDetail } from "../types/IPromotion";
import type {
  ICreatePromotionPayload,
  IUpdatePromotionPayload,
  IPromotionPageResponse,
  IPromotionQueryParams,
} from "../types/IPromotionPayload";

const getResponseResult = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "result" in response) {
    return (response as { result: T }).result;
  }
  return response as T;
};

export const promotionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPromotions: builder.query<IPromotionPageResponse, IPromotionQueryParams | void>({
      query: (params) => ({
        url: "/promotions",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<IPromotionPageResponse>(response),
      providesTags: (result) =>
        result?.content
          ? [
              ...result.content.map(({ id }) => ({
                type: API_TAG_TYPES.PROMOTION,
                id,
              })),
              { type: API_TAG_TYPES.PROMOTION, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.PROMOTION, id: "LIST" }],
    }),

    getPromotionById: builder.query<IPromotionDetail, string>({
      query: (id) => ({
        url: `/promotions/${id}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<IPromotionDetail>(response),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.PROMOTION, id },
      ],
    }),

    createPromotion: builder.mutation<IPromotion, ICreatePromotionPayload>({
      query: (body) => ({
        url: "/promotions",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<IPromotion>(response),
      invalidatesTags: [{ type: API_TAG_TYPES.PROMOTION, id: "LIST" }],
    }),

    updatePromotion: builder.mutation<
      IPromotion,
      { id: string; body: IUpdatePromotionPayload }
    >({
      query: ({ id, body }) => ({
        url: `/promotions/${id}`,
        method: HTTP_METHODS.PUT,
        body,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<IPromotion>(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.PROMOTION, id: "LIST" },
        { type: API_TAG_TYPES.PROMOTION, id },
      ],
    }),

    deletePromotion: builder.mutation<void, string>({
      query: (id) => ({
        url: `/promotions/${id}`,
        method: HTTP_METHODS.DELETE,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<void>(response),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.PROMOTION, id: "LIST" },
        { type: API_TAG_TYPES.PROMOTION, id },
      ],
    }),

    togglePromotionStatus: builder.mutation<IPromotion, string>({
      query: (id) => ({
        url: `/promotions/${id}/status`,
        method: HTTP_METHODS.PATCH,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<IPromotion>(response),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.PROMOTION, id: "LIST" },
        { type: API_TAG_TYPES.PROMOTION, id },
      ],
    }),

    autoApplyPromotions: builder.mutation<
      import("../types/IPromotionPayload").IAutoApplyPromotionResponse,
      import("../types/IPromotionPayload").IAutoApplyPromotionRequest
    >({
      query: (body) => ({
        url: "/promotions/auto-apply",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<
          import("../types/IPromotionPayload").IAutoApplyPromotionResponse
        >(response),
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetPromotionsQuery,
  useGetPromotionByIdQuery,
  useLazyGetPromotionByIdQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useTogglePromotionStatusMutation,
  useAutoApplyPromotionsMutation,
} = promotionApi;
