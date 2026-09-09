import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type { IInvoice } from "../types/IInvoice";
import type {
  ICreateInvoiceErrorNoticeRequest,
  IGetErrorNoticesParams,
  IInvoiceErrorNotice,
} from "../types/IInvoiceErrorNotice";

export const invoiceErrorNoticeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEligibleInvoices: builder.query<IApiResponse<IInvoice[]>, void>({
      query: () => ({
        url: "/invoice-error-notices/eligible-invoices",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [
        { type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id: "ELIGIBLE" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
      ],
    }),

    getErrorNotices: builder.query<
      IApiResponse<IPageResponse<IInvoiceErrorNotice>>,
      IGetErrorNoticesParams | void
    >({
      query: (params) => ({
        url: "/invoice-error-notices",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.INVOICE_ERROR_NOTICE,
                id,
              })),
              { type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id: "LIST" }],
    }),

    getErrorNotice: builder.query<IApiResponse<IInvoiceErrorNotice>, string>({
      query: (id) => ({
        url: `/invoice-error-notices/${id}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id },
      ],
    }),

    createErrorNotice: builder.mutation<
      IApiResponse<IInvoiceErrorNotice>,
      ICreateInvoiceErrorNoticeRequest
    >({
      query: (body) => ({
        url: "/invoice-error-notices",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id: "ELIGIBLE" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
      ],
    }),

    sendErrorNoticeToTax: builder.mutation<IApiResponse<IInvoiceErrorNotice>, string>({
      query: (id) => ({
        url: `/invoice-error-notices/${id}/send`,
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id },
        { type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE_ERROR_NOTICE, id: "ELIGIBLE" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEligibleInvoicesQuery,
  useLazyGetEligibleInvoicesQuery,
  useGetErrorNoticesQuery,
  useLazyGetErrorNoticesQuery,
  useGetErrorNoticeQuery,
  useCreateErrorNoticeMutation,
  useSendErrorNoticeToTaxMutation,
} = invoiceErrorNoticeApi;
