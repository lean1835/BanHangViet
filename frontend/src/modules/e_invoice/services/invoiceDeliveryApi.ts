import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  IDeliveryLog,
  ISendEmailRequest,
  ISendZaloRequest,
  IPublicInvoiceResponse,
} from "../types/IInvoiceDelivery";

export const invoiceDeliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendInvoiceViaZalo: builder.mutation<IApiResponse<IDeliveryLog>, ISendZaloRequest>({
      query: ({ invoiceId, phoneNumber, customerName, note }) => ({
        url: `/invoices/${invoiceId}/deliver/zalo`,
        method: HTTP_METHODS.POST,
        body: { phoneNumber, customerName, note },
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
      ],
    }),

    sendInvoiceViaEmail: builder.mutation<IApiResponse<IDeliveryLog>, ISendEmailRequest>({
      query: ({ invoiceId, email, subject, content }) => ({
        url: `/invoices/${invoiceId}/deliver/email`,
        method: HTTP_METHODS.POST,
        body: { email, subject, content },
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
      ],
    }),

    getDeliveryLogs: builder.query<IApiResponse<IDeliveryLog[]>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/deliver/logs`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, invoiceId) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
      ],
    }),

    lookupInvoicePublic: builder.query<IApiResponse<IPublicInvoiceResponse>, { code: string }>({
      query: ({ code }) => ({
        url: "/public/invoices/lookup",
        method: HTTP_METHODS.GET,
        params: { code },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useSendInvoiceViaZaloMutation,
  useSendInvoiceViaEmailMutation,
  useGetDeliveryLogsQuery,
  useLookupInvoicePublicQuery,
  useLazyLookupInvoicePublicQuery,
} = invoiceDeliveryApi;
