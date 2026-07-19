import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import { ORDER_API_ENDPOINTS, ORDER_API_TAG_IDS } from "@/constants/order";
import type { IApiResponse, IOrderResponse } from "@/modules/order/types/IOrder";

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrdersHistory: builder.query<IApiResponse<IOrderResponse[]>, void>({
      query: () => ({
        url: ORDER_API_ENDPOINTS.LIST,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (result) =>
        result?.result
          ? [
              ...result.result.map(({ id }) => ({ type: API_TAG_TYPES.ORDER, id })),
              { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
            ]
          : [{ type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST }],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const { useGetOrdersHistoryQuery } = orderApi;
