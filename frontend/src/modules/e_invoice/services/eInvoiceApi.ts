import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/app";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IAdjustInvoiceParams,
  IBulkIssueInvoiceRequest,
  IBulkIssueInvoiceResult,
  ICancelInvoiceRequest,
  ICustomerTaxLookupResponse,
  IExportInvoicesParams,
  IGetInvoicesParams,
  IInvoice,
  IInvoiceRepresentationResponse,
  IInvoiceStatusLog,
  IUpdateInvoiceRequest,
} from "../types/IInvoice";

export const eInvoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    bulkIssueInvoices: builder.mutation<IApiResponse<IBulkIssueInvoiceResult>, IBulkIssueInvoiceRequest>({
      query: (body) => ({
        url: "/invoices/bulk-issue",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.INVOICE, id: "LIST" }],
    }),
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
        { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
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
    getInvoiceLogs: builder.query<IApiResponse<IInvoiceStatusLog[]>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/logs`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [{ type: API_TAG_TYPES.INVOICE, id }],
    }),
    lookupBuyerInfo: builder.query<IApiResponse<ICustomerTaxLookupResponse>, string>({
      query: (taxCode) => ({
        url: `/invoices/buyer-info/lookup`,
        method: HTTP_METHODS.GET,
        params: { taxCode },
      }),
    }),
    getInvoiceRepresentation: builder.query<IApiResponse<IInvoiceRepresentationResponse>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/representation`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [{ type: API_TAG_TYPES.INVOICE, id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useBulkIssueInvoicesMutation,
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
  useLookupBuyerInfoQuery,
  useLazyLookupBuyerInfoQuery,
  useGetInvoiceRepresentationQuery,
  useLazyGetInvoiceRepresentationQuery,
} = eInvoiceApi;

/**
 * NCL-05-CN-006: Xuất danh sách hóa đơn tra cứu ra tệp Excel
 */
export const exportInvoicesToExcel = async (params?: IExportInvoicesParams): Promise<void> => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";

  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "ALL") searchParams.append("status", params.status);
  if (params?.fromDate) searchParams.append("fromDate", params.fromDate);
  if (params?.toDate) searchParams.append("toDate", params.toDate);
  if (params?.search?.trim()) searchParams.append("search", params.search.trim());

  const queryStr = searchParams.toString();
  const url = `${baseUrl}/invoices/export${queryStr ? `?${queryStr}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let errMsg = "Không thể xuất danh sách hóa đơn ra Excel.";
    try {
      const errJson = await response.json();
      if (errJson.code === 1042 || errJson.message?.includes("không có dữ liệu") || errJson.message?.includes("NO_DATA_TO_EXPORT")) {
        errMsg = "Không có dữ liệu hóa đơn phù hợp với bộ lọc để xuất tệp Excel.";
      } else if (errJson.message) {
        errMsg = errJson.message;
      }
    } catch {
      // response might not be JSON
    }
    throw new Error(errMsg);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "Danh_sach_hoa_don.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

/**
 * NCL-05-CN-007: Tải bản thể hiện hóa đơn điện tử dạng HTML/PDF
 */
export const downloadInvoiceRepresentationPdf = async (invoiceId: string, invoiceNumber?: string): Promise<void> => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
  const url = `${baseUrl}/invoices/${invoiceId}/representation/pdf`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tải bản thể hiện hóa đơn điện tử.");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `Hoa_don_${invoiceNumber || invoiceId}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

