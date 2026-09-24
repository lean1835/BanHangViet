import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IProductExchangeTicket,
  ICheckExchangeEligibilityRequest,
  IExchangeEligibilityResponse,
  ICreateProductExchangeRequest,
  IGetExchangeTicketsParams,
} from "../types/IProductExchange";

export const productExchangeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkExchangeEligibility: builder.mutation<
      IApiResponse<IExchangeEligibilityResponse>,
      ICheckExchangeEligibilityRequest
    >({
      query: (body) => ({
        url: "/product-exchanges/check-eligibility",
        method: HTTP_METHODS.POST,
        body,
      }),
    }),

    createProductExchange: builder.mutation<
      IApiResponse<IProductExchangeTicket>,
      ICreateProductExchangeRequest
    >({
      query: (body) => ({
        url: "/product-exchanges",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.PRODUCT_EXCHANGE, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.STOCK_CARD, id: "LIST" },
        { type: API_TAG_TYPES.ORDER, id: "LIST" },
      ],
    }),

    getExchangeTickets: builder.query<
      IApiResponse<IPageResponse<IProductExchangeTicket>>,
      IGetExchangeTicketsParams | void
    >({
      query: (params) => ({
        url: "/product-exchanges",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.PRODUCT_EXCHANGE,
                id,
              })),
              { type: API_TAG_TYPES.PRODUCT_EXCHANGE, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.PRODUCT_EXCHANGE, id: "LIST" }],
    }),

    getExchangeTicketById: builder.query<
      IApiResponse<IProductExchangeTicket>,
      string
    >({
      query: (id) => ({
        url: `/product-exchanges/${id}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.PRODUCT_EXCHANGE, id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCheckExchangeEligibilityMutation,
  useCreateProductExchangeMutation,
  useGetExchangeTicketsQuery,
  useGetExchangeTicketByIdQuery,
} = productExchangeApi;
