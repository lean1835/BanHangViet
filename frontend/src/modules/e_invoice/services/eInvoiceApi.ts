import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/modules/order/types/IOrder";
import type { IInvoice } from "../types/IInvoice";

export interface IPageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
}

export const eInvoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<
      IApiResponse<IPageResponse<IInvoice>>,
      { status?: string; fromDate?: string; toDate?: string; page?: number; size?: number }
    >({
      query: (params) => ({
        url: "/invoices",
        method: HTTP_METHODS.GET,
        params,
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
    cancelInvoice: builder.mutation<IApiResponse<IInvoice>, { invoiceId: string; cancelReason: string }>({
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
    updateInvoice: builder.mutation<
      IApiResponse<IInvoice>,
      {
        invoiceId: string;
        buyerName?: string;
        buyerTaxCode?: string;
        buyerAddress?: string;
        buyerPhone?: string;
        buyerEmail?: string;
      }
    >({
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
    adjustInvoice: builder.mutation<
      IApiResponse<IInvoice>,
      {
        invoiceId: string;
        body: {
          adjustmentReason: string;
          buyerName?: string;
          buyerTaxCode?: string;
          buyerAddress?: string;
          buyerPhone?: string;
          buyerEmail?: string;
          items: Array<{
            productId?: string;
            productName: string;
            unit: string;
            quantity: number;
            unitPrice: number;
            taxRatePercentage: number;
            discountAmount: number;
          }>;
        };
      }
    >({
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
  }),
  overrideExisting: false,
});

export const {
  useGetInvoicesQuery,
  useLazyGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceDraftMutation,
  useSubmitToTaxMutation,
  useResendInvoiceMutation,
  useCancelInvoiceMutation,
  useUpdateInvoiceMutation,
  useAdjustInvoiceMutation,
} = eInvoiceApi;
