import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IReturnTicket,
  IInvoiceReturnableCheckResponse,
  ICreateReturnTicketRequest,
  IRejectReturnTicketRequest,
  IGetReturnTicketsParams,
  IGetReturnTicketStatisticsParams,
  IReturnTicketStatisticsResponse,
  IReturnItemRankingResponse,
} from "../types/IReturnTicket";

export const returnTicketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkInvoiceReturnable: builder.query<
      IApiResponse<IInvoiceReturnableCheckResponse>,
      string
    >({
      query: (invoiceId) => ({
        url: `/return-tickets/check-invoice/${invoiceId}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, invoiceId) => [
        { type: API_TAG_TYPES.RETURN_TICKET, id: `CHECK_${invoiceId}` },
      ],
    }),

    getReturnTickets: builder.query<
      IApiResponse<IPageResponse<IReturnTicket>>,
      IGetReturnTicketsParams | void
    >({
      query: (params) => ({
        url: "/return-tickets",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.RETURN_TICKET,
                id,
              })),
              { type: API_TAG_TYPES.RETURN_TICKET, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.RETURN_TICKET, id: "LIST" }],
    }),

    getReturnTicketDetail: builder.query<IApiResponse<IReturnTicket>, string>({
      query: (ticketId) => ({
        url: `/return-tickets/${ticketId}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.RETURN_TICKET, id },
      ],
    }),

    createReturnTicket: builder.mutation<
      IApiResponse<IReturnTicket>,
      ICreateReturnTicketRequest
    >({
      query: (body) => ({
        url: "/return-tickets",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.RETURN_TICKET, id: "LIST" },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "STATISTICS" },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "TOP_PRODUCTS" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
      ],
    }),

    approveReturnTicket: builder.mutation<
      IApiResponse<IReturnTicket>,
      string
    >({
      query: (ticketId) => ({
        url: `/return-tickets/${ticketId}/approve`,
        method: HTTP_METHODS.PUT,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.RETURN_TICKET, id },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "LIST" },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "STATISTICS" },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "TOP_PRODUCTS" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
        { type: API_TAG_TYPES.DEBT, id: "LIST" },
      ],
    }),

    rejectReturnTicket: builder.mutation<
      IApiResponse<IReturnTicket>,
      { ticketId: string; body: IRejectReturnTicketRequest }
    >({
      query: ({ ticketId, body }) => ({
        url: `/return-tickets/${ticketId}/reject`,
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: API_TAG_TYPES.RETURN_TICKET, id: ticketId },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "LIST" },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "STATISTICS" },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "TOP_PRODUCTS" },
      ],
    }),

    createDecreaseAdjustmentInvoice: builder.mutation<
      IApiResponse<IReturnTicket>,
      string
    >({
      query: (ticketId) => ({
        url: `/return-tickets/${ticketId}/create-adjustment-invoice`,
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.RETURN_TICKET, id },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "LIST" },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "STATISTICS" },
        { type: API_TAG_TYPES.RETURN_TICKET, id: "TOP_PRODUCTS" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.REPORT, id: "LIST" },
      ],
    }),

    getReturnTicketStatistics: builder.query<
      IApiResponse<IReturnTicketStatisticsResponse>,
      IGetReturnTicketStatisticsParams | void
    >({
      query: (params) => ({
        url: "/return-tickets/statistics",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.RETURN_TICKET, id: "STATISTICS" }],
    }),

    getTopReturnedProducts: builder.query<
      IApiResponse<IReturnItemRankingResponse[]>,
      IGetReturnTicketStatisticsParams | void
    >({
      query: (params) => ({
        url: "/return-tickets/top-returned-products",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.RETURN_TICKET, id: "TOP_PRODUCTS" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCheckInvoiceReturnableQuery,
  useLazyCheckInvoiceReturnableQuery,
  useGetReturnTicketsQuery,
  useLazyGetReturnTicketsQuery,
  useGetReturnTicketDetailQuery,
  useCreateReturnTicketMutation,
  useApproveReturnTicketMutation,
  useRejectReturnTicketMutation,
  useCreateDecreaseAdjustmentInvoiceMutation,
  useGetReturnTicketStatisticsQuery,
  useGetTopReturnedProductsQuery,
} = returnTicketApi;
