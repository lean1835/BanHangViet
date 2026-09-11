import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import { ORDER_API_ENDPOINTS, ORDER_API_TAG_IDS } from "@/constants/order";
import type { IApiResponse } from "@/types/api";
import type {
  IOrderResponse,
  ICalculateWeightRequest,
  ICalculateWeightResponse,
  ICancelOrderRequest,
  IOrderCancelReasonDto,
  ICanceledOrderStatisticsResponse,
  ICanceledOrderStatisticsParams,
  IHeldOrderSummaryResponse,
  IHoldOrderRequest,
  IUpdateOrderLabelRequest,
  ISwitchDiningTableRequest,
  IOrderPaymentResponse,
  IConfirmBankTransferRequest,
  ISwitchPaymentMethodRequest,
  ICompleteOrderRequest,
} from "@/modules/order/types/IOrder";
import { notifyOrderCompleted, notifyOrderCanceled } from "@/utils/orderEvents";

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
    getOrder: builder.query<IApiResponse<IOrderResponse>, string>({
      query: (orderId) => ({
        url: `${ORDER_API_ENDPOINTS.LIST}/${orderId}`,
        method: HTTP_METHODS.GET,
      }),
    }),
    createOrder: builder.mutation<IApiResponse<IOrderResponse>, { customerId?: string }>({
      query: (body) => ({
        url: ORDER_API_ENDPOINTS.LIST,
        method: HTTP_METHODS.POST,
        body,
      }),
    }),
    addOrderItem: builder.mutation<
      IApiResponse<IOrderResponse>,
      {
        orderId: string;
        productId: string;
        quantity?: number;
        buyAmount?: number;
        bypassPromotion?: boolean;
        unitConversionId?: string;
      }
    >({
      query: ({ orderId, productId, quantity, buyAmount, bypassPromotion, unitConversionId }) => ({
        url: `/orders/${orderId}/items`,
        method: HTTP_METHODS.POST,
        body: { productId, quantity, buyAmount, bypassPromotion, unitConversionId },
      }),
    }),
    updateOrderItem: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; itemId: string; quantity?: number; buyAmount?: number }
    >({
      query: ({ orderId, itemId, quantity, buyAmount }) => ({
        url: `/orders/${orderId}/items/${itemId}`,
        method: HTTP_METHODS.PUT,
        body: { quantity, buyAmount },
      }),
    }),
    calculateWeight: builder.mutation<
      IApiResponse<ICalculateWeightResponse>,
      ICalculateWeightRequest
    >({
      query: (body) => ({
        url: "/orders/calculate-weight",
        method: HTTP_METHODS.POST,
        body,
      }),
    }),
    deleteOrderItem: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; itemId: string }
    >({
      query: ({ orderId, itemId }) => ({
        url: `/orders/${orderId}/items/${itemId}`,
        method: HTTP_METHODS.DELETE,
      }),
    }),
    applyDiscount: builder.mutation<IApiResponse<IOrderResponse>, { orderId: string; discountType: "PERCENTAGE" | "CASH"; discountValue: number }>({
      query: ({ orderId, discountType, discountValue }) => ({
        url: `/orders/${orderId}/discount`,
        method: HTTP_METHODS.POST,
        body: { discountType, discountValue },
      }),
    }),
    setPaymentMethod: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; paymentMethod: "CASH" | "BANK_TRANSFER" | "DEBT" | "COMBINED"; amountGiven?: number }
    >({
      query: ({ orderId, paymentMethod, amountGiven }) => ({
        url: `/orders/${orderId}/payment`,
        method: HTTP_METHODS.POST,
        body: { paymentMethod, amountGiven },
      }),
    }),
    completeOrder: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; data?: ICompleteOrderRequest; amountGiven?: number }
    >({
      query: ({ orderId, data, amountGiven }) => ({
        url: `/orders/${orderId}/complete`,
        method: HTTP_METHODS.POST,
        body: data ? data : { amountGiven: amountGiven ?? 0 },
      }),
      async onQueryStarted({ orderId }, { queryFulfilled }) {
        try {
          const { data: resData } = await queryFulfilled;
          notifyOrderCompleted(orderId, resData?.result?.orderNumber);
        } catch (e) {
          void e;
        }
      },
      invalidatesTags: [
        API_TAG_TYPES.ORDER,
        API_TAG_TYPES.SHIFT,
        API_TAG_TYPES.ACTIVE_SHIFT,
        API_TAG_TYPES.REPORT,
        API_TAG_TYPES.CUSTOMER,
        API_TAG_TYPES.DEBT,
        API_TAG_TYPES.PRODUCT,
        API_TAG_TYPES.POS_INVENTORY,
        API_TAG_TYPES.INVENTORY_WARNING,
        API_TAG_TYPES.SALES_ANALYTICS,
        { type: API_TAG_TYPES.SALES_ANALYTICS, id: "PEAK_HOURS" },
        API_TAG_TYPES.POS_REVENUE,
        { type: API_TAG_TYPES.POS_REVENUE, id: "SUMMARY" },
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.HELD_ORDER, id: "LIST" },
        { type: API_TAG_TYPES.DINING_TABLE, id: "LIST" },
      ],
    }),
    // NCL-03-CN-011: Lấy chi tiết các hình thức thanh toán của đơn hàng
    getOrderPayments: builder.query<IApiResponse<IOrderPaymentResponse[]>, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/payments`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, orderId) => [
        { type: API_TAG_TYPES.ORDER, id: `${orderId}_PAYMENTS` },
        { type: API_TAG_TYPES.ORDER, id: orderId },
      ],
    }),
    // NCL-03-CN-012: Xác nhận đã nhận tiền chuyển khoản ngân hàng trước khi chốt đơn
    confirmBankTransfer: builder.mutation<
      IApiResponse<IOrderPaymentResponse>,
      { orderId: string; data: IConfirmBankTransferRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/orders/${orderId}/confirm-bank-transfer`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: API_TAG_TYPES.ORDER, id: orderId },
        { type: API_TAG_TYPES.ORDER, id: `${orderId}_PAYMENTS` },
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
      ],
    }),
    // NCL-03-CN-012: Xác nhận giao dịch chuyển khoản cho dòng thanh toán cụ thể
    confirmPaymentBankTransfer: builder.mutation<
      IApiResponse<IOrderPaymentResponse>,
      { orderId: string; paymentId: string; data: IConfirmBankTransferRequest }
    >({
      query: ({ orderId, paymentId, data }) => ({
        url: `/orders/${orderId}/payments/${paymentId}/confirm-bank-transfer`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: API_TAG_TYPES.ORDER, id: orderId },
        { type: API_TAG_TYPES.ORDER, id: `${orderId}_PAYMENTS` },
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
      ],
    }),
    // NCL-03-CN-012: Đổi phương thức thanh toán linh hoạt khi khách hủy chuyển khoản
    switchPaymentMethod: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; data: ISwitchPaymentMethodRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/orders/${orderId}/payment-method`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: API_TAG_TYPES.ORDER, id: orderId },
        { type: API_TAG_TYPES.ORDER, id: `${orderId}_PAYMENTS` },
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
      ],
    }),
    cancelOrder: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; data: ICancelOrderRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/orders/${orderId}/cancel`,
        method: HTTP_METHODS.POST,
        body: data,
      }),
      async onQueryStarted({ orderId }, { queryFulfilled }) {
        try {
          const { data: resData } = await queryFulfilled;
          if (resData?.result) {
            notifyOrderCanceled(orderId, resData.result.orderNumber);
          }
        } catch {
          // ignore error
        }
      },
      invalidatesTags: [
        API_TAG_TYPES.ORDER,
        API_TAG_TYPES.SHIFT,
        API_TAG_TYPES.ACTIVE_SHIFT,
        API_TAG_TYPES.REPORT,
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.HELD_ORDER, id: "LIST" },
        { type: API_TAG_TYPES.DINING_TABLE, id: "LIST" },
      ],
    }),
    getCancelReasons: builder.query<IApiResponse<IOrderCancelReasonDto[]>, void>({
      query: () => ({
        url: "/orders/cancel-reasons",
        method: HTTP_METHODS.GET,
      }),
    }),
    getCanceledOrderStatistics: builder.query<
      IApiResponse<ICanceledOrderStatisticsResponse>,
      ICanceledOrderStatisticsParams | void
    >({
      query: (params) => ({
        url: "/orders/canceled-statistics",
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      providesTags: [{ type: API_TAG_TYPES.ORDER, id: "CANCELED_STATISTICS" }],
    }),
    // NCL-03-CN-010: Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
    getHeldOrders: builder.query<IApiResponse<IHeldOrderSummaryResponse[]>, void>({
      query: () => ({
        url: "/orders/held",
        method: HTTP_METHODS.GET,
      }),
      providesTags: (result) =>
        result?.result
          ? [
              ...result.result.map(({ id }) => ({ type: API_TAG_TYPES.HELD_ORDER, id })),
              { type: API_TAG_TYPES.HELD_ORDER, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.HELD_ORDER, id: "LIST" }],
    }),
    holdOrder: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; data: IHoldOrderRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/orders/${orderId}/hold`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: API_TAG_TYPES.ORDER, id: orderId },
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.HELD_ORDER, id: "LIST" },
        { type: API_TAG_TYPES.DINING_TABLE, id: "LIST" },
      ],
    }),
    updateOrderLabel: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; data: IUpdateOrderLabelRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/orders/${orderId}/order-label`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: API_TAG_TYPES.ORDER, id: orderId },
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.HELD_ORDER, id: "LIST" },
      ],
    }),
    switchDiningTable: builder.mutation<
      IApiResponse<IOrderResponse>,
      { orderId: string; data: ISwitchDiningTableRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/orders/${orderId}/switch-table`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: API_TAG_TYPES.ORDER, id: orderId },
        { type: API_TAG_TYPES.ORDER, id: ORDER_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.HELD_ORDER, id: "LIST" },
        { type: API_TAG_TYPES.DINING_TABLE, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetOrdersHistoryQuery,
  useLazyGetOrdersHistoryQuery,
  useLazyGetOrderQuery,
  useCreateOrderMutation,
  useAddOrderItemMutation,
  useUpdateOrderItemMutation,
  useCalculateWeightMutation,
  useDeleteOrderItemMutation,
  useApplyDiscountMutation,
  useSetPaymentMethodMutation,
  useCompleteOrderMutation,
  useCancelOrderMutation,
  useGetCancelReasonsQuery,
  useLazyGetCancelReasonsQuery,
  useGetCanceledOrderStatisticsQuery,
  useLazyGetCanceledOrderStatisticsQuery,
  useGetHeldOrdersQuery,
  useLazyGetHeldOrdersQuery,
  useHoldOrderMutation,
  useUpdateOrderLabelMutation,
  useSwitchDiningTableMutation,
  // NCL-03-CN-011 & NCL-03-CN-012 hooks
  useGetOrderPaymentsQuery,
  useLazyGetOrderPaymentsQuery,
  useConfirmBankTransferMutation,
  useConfirmPaymentBankTransferMutation,
  useSwitchPaymentMethodMutation,
} = orderApi;
