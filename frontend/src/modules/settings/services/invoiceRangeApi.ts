import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IInvoiceNumberRange,
  ICreateInvoiceNumberRangeRequest,
} from "../types/IInvoiceRange";

export const invoiceRangeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveInvoiceRange: builder.query<IApiResponse<IInvoiceNumberRange>, void>({
      query: () => ({
        url: "/invoice-ranges/active",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.INVOICE_RANGE, id: "ACTIVE" }],
    }),

    getAllInvoiceRanges: builder.query<
      IApiResponse<IPageResponse<IInvoiceNumberRange>>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: "/invoice-ranges",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.INVOICE_RANGE, id: "LIST" }],
    }),

    createInvoiceRange: builder.mutation<
      IApiResponse<IInvoiceNumberRange>,
      ICreateInvoiceNumberRangeRequest
    >({
      query: (body) => ({
        url: "/invoice-ranges",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.INVOICE_RANGE, id: "ACTIVE" },
        { type: API_TAG_TYPES.INVOICE_RANGE, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetActiveInvoiceRangeQuery,
  useGetAllInvoiceRangesQuery,
  useCreateInvoiceRangeMutation,
} = invoiceRangeApi;
