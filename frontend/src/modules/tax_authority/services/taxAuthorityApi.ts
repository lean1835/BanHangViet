import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/modules/order/types/IOrder";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";
import type { IPageResponse } from "@/modules/e_invoice/services/eInvoiceApi";

export const taxAuthorityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWaitingInvoices: builder.query<IApiResponse<IPageResponse<IInvoice>>, { page?: number; size?: number }>({
      query: (params) => ({
        url: "/tax-authority/invoices/waiting",
        method: HTTP_METHODS.GET,
        params,
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({ type: API_TAG_TYPES.INVOICE, id })),
              { type: API_TAG_TYPES.INVOICE, id: "TAX_LIST" },
            ]
          : [{ type: API_TAG_TYPES.INVOICE, id: "TAX_LIST" }],
    }),
    getProcessedInvoices: builder.query<IApiResponse<IPageResponse<IInvoice>>, { page?: number; size?: number }>({
      query: (params) => ({
        url: "/tax-authority/invoices/history",
        method: HTTP_METHODS.GET,
        params,
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({ type: API_TAG_TYPES.INVOICE, id })),
              { type: API_TAG_TYPES.INVOICE, id: "TAX_HISTORY_LIST" },
            ]
          : [{ type: API_TAG_TYPES.INVOICE, id: "TAX_HISTORY_LIST" }],
    }),
    approveInvoiceByTax: builder.mutation<IApiResponse<IInvoice>, { invoiceId: string; taxAuthorityCode?: string }>({
      query: ({ invoiceId, taxAuthorityCode }) => ({
        url: `/tax-authority/invoices/${invoiceId}/approve`,
        method: HTTP_METHODS.POST,
        body: taxAuthorityCode ? { taxAuthorityCode } : undefined,
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "TAX_LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "TAX_HISTORY_LIST" },
      ],
    }),
    rejectInvoiceByTax: builder.mutation<IApiResponse<IInvoice>, { invoiceId: string; errorMessage: string }>({
      query: ({ invoiceId, errorMessage }) => ({
        url: `/tax-authority/invoices/${invoiceId}/reject`,
        method: HTTP_METHODS.POST,
        body: { errorMessage },
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "TAX_LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "TAX_HISTORY_LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWaitingInvoicesQuery,
  useGetProcessedInvoicesQuery,
  useApproveInvoiceByTaxMutation,
  useRejectInvoiceByTaxMutation,
} = taxAuthorityApi;
