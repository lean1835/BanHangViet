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
    createOrder: builder.mutation<IApiResponse<IOrderResponse>, { customerId?: string }>({
      query: (body) => ({
        url: ORDER_API_ENDPOINTS.LIST,
        method: HTTP_METHODS.POST,
        body,
      }),
    }),
    addOrderItem: builder.mutation<IApiResponse<IOrderResponse>, { orderId: string; productId: string; quantity: number }>({
      query: ({ orderId, productId, quantity }) => ({
        url: `/orders/${orderId}/items`,
        method: HTTP_METHODS.POST,
        body: { productId, quantity },
      }),
    }),
    applyDiscount: builder.mutation<IApiResponse<IOrderResponse>, { orderId: string; discountType: "PERCENTAGE" | "CASH"; discountValue: number }>({
      query: ({ orderId, discountType, discountValue }) => ({
        url: `/orders/${orderId}/discount`,
        method: HTTP_METHODS.POST,
        body: { discountType, discountValue },
      }),
    }),
    setPaymentMethod: builder.mutation<IApiResponse<IOrderResponse>, { orderId: string; paymentMethod: "CASH" | "BANK_TRANSFER" | "DEBT"; amountGiven: number }>({
      query: ({ orderId, paymentMethod, amountGiven }) => ({
        url: `/orders/${orderId}/payment`,
        method: HTTP_METHODS.POST,
        body: { paymentMethod, amountGiven },
      }),
    }),
    completeOrder: builder.mutation<IApiResponse<IOrderResponse>, { orderId: string; amountGiven: number }>({
      query: ({ orderId, amountGiven }) => ({
        url: `/orders/${orderId}/complete`,
        method: HTTP_METHODS.POST,
        body: { amountGiven },
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.ACTIVE_SHIFT, id: "ACTIVE" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetOrdersHistoryQuery,
  useCreateOrderMutation,
  useAddOrderItemMutation,
  useApplyDiscountMutation,
  useSetPaymentMethodMutation,
  useCompleteOrderMutation,
} = orderApi;
