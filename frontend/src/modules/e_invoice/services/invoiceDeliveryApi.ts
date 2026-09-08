import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  IDeliveryLog,
  ISendEmailRequest,
  ISendZaloRequest,
  IRetryDeliveryRequest,
  IFailedDeliveryItem,
  IPublicInvoiceResponse,
} from "../types/IInvoiceDelivery";
import {
  getStoredFailedDeliveries,
  recordFailedDeliveryAttempt,
} from "./mockFailedDeliveries";

export const invoiceDeliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendInvoiceViaEmail: builder.mutation<IApiResponse<void>, ISendEmailRequest>({
      query: ({ invoiceId, email }) => ({
        url: `/invoices/${invoiceId}/deliver/email`,
        method: HTTP_METHODS.POST,
        body: { email },
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
        { type: API_TAG_TYPES.INVOICE, id: "FAILED_LIST" },
      ],
    }),

    sendInvoiceViaZalo: builder.mutation<IApiResponse<void>, ISendZaloRequest>({
      queryFn: async ({ invoiceId, phoneNumber }, _queryApi, _extraOptions, baseQuery) => {
        // Attempt real API first
        try {
          const result = await baseQuery({
            url: `/invoices/${invoiceId}/deliver/zalo`,
            method: HTTP_METHODS.POST,
            body: { phoneNumber },
          });
          if (result.data) {
            return { data: result.data as IApiResponse<void> };
          }
        } catch {
          /* Fallback to mock */
        }

        // Mock response for frontend simulation
        await new Promise((resolve) => setTimeout(resolve, 600));
        return {
          data: {
            code: 1000,
            message: `Đã gửi liên kết hóa đơn thành công qua Zalo đến số ${phoneNumber}`,
            result: undefined,
          },
        };
      },
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
        { type: API_TAG_TYPES.INVOICE, id: "FAILED_LIST" },
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

    getFailedDeliveries: builder.query<IApiResponse<IFailedDeliveryItem[]>, void>({
      queryFn: async (_arg, _queryApi, _extraOptions, baseQuery) => {
        try {
          const res = await baseQuery({
            url: "/invoices/deliver/failed",
            method: HTTP_METHODS.GET,
          });
          if (res.data) {
            return { data: res.data as IApiResponse<IFailedDeliveryItem[]> };
          }
        } catch {
          /* ignore and fallback */
        }

        // Mock fallback
        const mockList = getStoredFailedDeliveries();
        return {
          data: {
            code: 1000,
            message: "Lấy danh sách hóa đơn giao khách thất bại thành công",
            result: mockList,
          },
        };
      },
      providesTags: () => [{ type: API_TAG_TYPES.INVOICE, id: "FAILED_LIST" }],
    }),

    retryDelivery: builder.mutation<IApiResponse<void>, IRetryDeliveryRequest>({
      queryFn: async (req, _queryApi, _extraOptions, baseQuery) => {
        try {
          const res = await baseQuery({
            url: `/invoices/${req.invoiceId}/deliver/retry`,
            method: HTTP_METHODS.POST,
            body: req,
          });
          if (res.data) {
            // Also clean from local storage
            recordFailedDeliveryAttempt(req, true);
            return { data: res.data as IApiResponse<void> };
          }
        } catch {
          /* fallback to local simulation */
        }

        await new Promise((resolve) => setTimeout(resolve, 800));

        // Test exception trigger: if recipient contains 'loi' or 'error'
        if (req.recipientAddress.includes("loi") || req.recipientAddress.includes("error")) {
          const updated = recordFailedDeliveryAttempt(req, false, "Địa chỉ nhận không phản hồi hoặc bị chặn");
          return {
            error: {
              status: 400,
              data: {
                code: 1099,
                message: `Giao lại thất bại! ${updated?.failureReason}`,
              },
            },
          };
        }

        // Success simulation
        recordFailedDeliveryAttempt(req, true);
        return {
          data: {
            code: 1000,
            message: `Đã gửi lại hóa đơn thành công tới ${req.recipientAddress} qua ${req.channel}`,
            result: undefined,
          },
        };
      },
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: API_TAG_TYPES.INVOICE, id: invoiceId },
        { type: API_TAG_TYPES.INVOICE, id: "FAILED_LIST" },
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
  overrideExisting: true,
});

export const {
  useSendInvoiceViaEmailMutation,
  useSendInvoiceViaZaloMutation,
  useGetDeliveryLogsQuery,
  useGetFailedDeliveriesQuery,
  useRetryDeliveryMutation,
  useLookupInvoicePublicQuery,
  useLazyLookupInvoicePublicQuery,
} = invoiceDeliveryApi;
