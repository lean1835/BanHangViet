import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IAdjustInvoiceParams,
  ICancelInvoiceRequest,
  IGetInvoicesParams,
  IInvoice,
  IUpdateInvoiceRequest,
} from "../types/IInvoice";

export const eInvoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<IApiResponse<IPageResponse<IInvoice>>, IGetInvoicesParams | void>({
      query: (params) => ({
        url: "/invoices",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({ type: API_TAG_TYPES.INVOICE, id })),
              { type: API_TAG_TYPES.INVOICE, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.INVOICE, id: "LIST" }],
    }),
    getInvoice: builder.query<IApiResponse<IInvoice>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [{ type: API_TAG_TYPES.INVOICE, id }],
    }),
    createInvoiceDraft: builder.mutation<IApiResponse<IInvoice>, { orderId: string }>({
      query: ({ orderId }) => ({
        url: "/invoices/draft",
        method: HTTP_METHODS.POST,
        params: { orderId },
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.INVOICE, id: "LIST" }],
    }),
    submitToTax: builder.mutation<IApiResponse<IInvoice>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/submit`,
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.INVOICE, id },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
      ],
    }),
    resendInvoice: builder.mutation<IApiResponse<IInvoice>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/resend`,
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.INVOICE, id },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
      ],
    }),
    cancelInvoice: builder.mutation<IApiResponse<IInvoice>, ICancelInvoiceRequest>({
      query: ({ invoiceId, cancelReason }) => ({
        url: `/invoices/${invoiceId}/cancel`,
        method: HTTP_METHODS.POST,
        body: { cancelReason },
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
      ],
    }),
    updateInvoice: builder.mutation<IApiResponse<IInvoice>, IUpdateInvoiceRequest>({
      query: ({ invoiceId, ...body }) => ({
        url: `/invoices/${invoiceId}`,
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
      ],
    }),
    adjustInvoice: builder.mutation<IApiResponse<IInvoice>, IAdjustInvoiceParams>({
      query: ({ invoiceId, body }) => ({
        url: `/invoices/${invoiceId}/adjust`,
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
      ],
    }),
    getInvoiceLogs: builder.query<IApiResponse<import("../types/IInvoice").IInvoiceStatusLog[]>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/logs`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [{ type: API_TAG_TYPES.INVOICE, id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInvoicesQuery,
  useLazyGetInvoicesQuery,
  useGetInvoiceQuery,
  useGetInvoiceLogsQuery,
  useCreateInvoiceDraftMutation,
  useSubmitToTaxMutation,
  useResendInvoiceMutation,
  useCancelInvoiceMutation,
  useUpdateInvoiceMutation,
  useAdjustInvoiceMutation,
} = eInvoiceApi;
