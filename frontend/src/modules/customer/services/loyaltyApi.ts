import { baseApi } from "@/stores/baseApi";
import { API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type {
  ILoyaltyProgramConfig,
  ILoyaltyProgramConfigRequest,
  ICustomerLoyaltySummary,
  IPointTransaction,
  IPointTransactionPageResponse,
  IPointTransactionQueryParams,
  IAdjustPointsRequest,
  IApplyLoyaltyPointsRequest,
} from "../types/ILoyalty";

const getResponseResult = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "result" in response) {
    return (response as { result: T }).result;
  }
  return response as T;
};

export const loyaltyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLoyaltyConfig: builder.query<ILoyaltyProgramConfig, void>({
      query: () => ({
        url: "/loyalty-program/config",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (res: unknown) =>
        getResponseResult<ILoyaltyProgramConfig>(res),
      providesTags: [API_TAG_TYPES.LOYALTY_CONFIG],
    }),

    updateLoyaltyConfig: builder.mutation<
      ILoyaltyProgramConfig,
      ILoyaltyProgramConfigRequest
    >({
      query: (body) => ({
        url: "/loyalty-program/config",
        method: HTTP_METHODS.PUT,
        body,
      }),
      transformResponse: (res: unknown) =>
        getResponseResult<ILoyaltyProgramConfig>(res),
      invalidatesTags: [
        API_TAG_TYPES.LOYALTY_CONFIG,
        API_TAG_TYPES.LOYALTY_SUMMARY,
      ],
    }),

    getCustomerLoyaltySummary: builder.query<
      ICustomerLoyaltySummary,
      string
    >({
      query: (customerId) => ({
        url: `/customers/${customerId}/loyalty-summary`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (res: unknown) =>
        getResponseResult<ICustomerLoyaltySummary>(res),
      providesTags: (_res, _err, customerId) => [
        { type: API_TAG_TYPES.LOYALTY_SUMMARY, id: customerId },
        { type: API_TAG_TYPES.LOYALTY_SUMMARY, id: "LIST" },
        API_TAG_TYPES.LOYALTY_SUMMARY,
      ],
    }),

    getCustomerPointTransactions: builder.query<
      IPointTransactionPageResponse,
      { customerId: string; params?: IPointTransactionQueryParams }
    >({
      query: ({ customerId, params }) => ({
        url: `/customers/${customerId}/loyalty-transactions`,
        method: HTTP_METHODS.GET,
        params,
      }),
      transformResponse: (res: unknown) =>
        getResponseResult<IPointTransactionPageResponse>(res),
      providesTags: (_res, _err, { customerId }) => [
        { type: API_TAG_TYPES.LOYALTY_TRANSACTIONS, id: customerId },
        { type: API_TAG_TYPES.LOYALTY_TRANSACTIONS, id: "LIST" },
        API_TAG_TYPES.LOYALTY_TRANSACTIONS,
      ],
    }),

    adjustCustomerPoints: builder.mutation<
      IPointTransaction,
      { customerId: string; body: IAdjustPointsRequest }
    >({
      query: ({ customerId, body }) => ({
        url: `/customers/${customerId}/adjust-points`,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (res: unknown) =>
        getResponseResult<IPointTransaction>(res),
      invalidatesTags: (_res, _err, { customerId }) => [
        { type: API_TAG_TYPES.LOYALTY_SUMMARY, id: customerId },
        { type: API_TAG_TYPES.LOYALTY_TRANSACTIONS, id: customerId },
        API_TAG_TYPES.CUSTOMER,
      ],
    }),

    applyPointsToOrder: builder.mutation<
      unknown,
      { orderId: string; body: IApplyLoyaltyPointsRequest }
    >({
      query: ({ orderId, body }) => ({
        url: `/orders/${orderId}/apply-points`,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (res: unknown) => getResponseResult<unknown>(res),
      invalidatesTags: [
        API_TAG_TYPES.ORDER,
        API_TAG_TYPES.LOYALTY_SUMMARY,
      ],
    }),

    removePointsFromOrder: builder.mutation<unknown, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/remove-points`,
        method: HTTP_METHODS.DELETE,
      }),
      transformResponse: (res: unknown) => getResponseResult<unknown>(res),
      invalidatesTags: [
        API_TAG_TYPES.ORDER,
        API_TAG_TYPES.LOYALTY_SUMMARY,
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLoyaltyConfigQuery,
  useUpdateLoyaltyConfigMutation,
  useGetCustomerLoyaltySummaryQuery,
  useGetCustomerPointTransactionsQuery,
  useAdjustCustomerPointsMutation,
  useApplyPointsToOrderMutation,
  useRemovePointsFromOrderMutation,
} = loyaltyApi;
