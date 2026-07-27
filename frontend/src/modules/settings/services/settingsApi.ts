import { baseApi } from "@/stores/baseApi";
import type { IApiResponse as ApiResponse } from "@/types/api";
import type {
  IHouseholdInfo,
  IUpdateHouseholdRequest,
  IInvoiceTemplate,
  IUpdateInvoiceTemplateRequest,
  ITaxRate,
  ICreateTaxRateRequest,
  IUpdateTaxRateRequest,
  ITaxRateStatusRequest,
} from "../types/ISettings";
import { API_TAG_TYPES } from "@/constants/api";

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Household Info
    getMyHousehold: builder.query<ApiResponse<IHouseholdInfo>, void>({
      query: () => ({
        url: "/households/my-household",
        method: "GET",
      }),
      providesTags: [API_TAG_TYPES.HOUSEHOLD],
    }),
    updateMyHousehold: builder.mutation<ApiResponse<IHouseholdInfo>, IUpdateHouseholdRequest>({
      query: (body) => ({
        url: "/households/my-household",
        method: "PUT",
        body,
      }),
      invalidatesTags: [API_TAG_TYPES.HOUSEHOLD, API_TAG_TYPES.USER],
    }),

    // Invoice Template
    getInvoiceTemplate: builder.query<ApiResponse<IInvoiceTemplate>, void>({
      query: () => ({
        url: "/invoice-templates",
        method: "GET",
      }),
      providesTags: [API_TAG_TYPES.INVOICE_TEMPLATE],
    }),
    updateInvoiceTemplate: builder.mutation<ApiResponse<IInvoiceTemplate>, IUpdateInvoiceTemplateRequest>({
      query: (body) => ({
        url: "/invoice-templates",
        method: "PUT",
        body,
      }),
      invalidatesTags: [API_TAG_TYPES.INVOICE_TEMPLATE],
    }),

    // Tax Rates
    getAllTaxRates: builder.query<ApiResponse<ITaxRate[]>, void>({
      query: () => ({
        url: "/tax-rates",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.result
          ? [
              ...result.result.map((item) => ({ type: API_TAG_TYPES.TAX_RATE, id: item.id })),
              { type: API_TAG_TYPES.TAX_RATE, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.TAX_RATE, id: "LIST" }],
    }),
    createTaxRate: builder.mutation<ApiResponse<ITaxRate>, ICreateTaxRateRequest>({
      query: (body) => ({
        url: "/tax-rates",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.TAX_RATE, id: "LIST" }],
    }),
    updateTaxRate: builder.mutation<ApiResponse<ITaxRate>, { id: string; body: IUpdateTaxRateRequest }>({
      query: ({ id, body }) => ({
        url: `/tax-rates/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.TAX_RATE, id },
        { type: API_TAG_TYPES.TAX_RATE, id: "LIST" },
      ],
    }),
    updateTaxRateStatus: builder.mutation<ApiResponse<ITaxRate>, { id: string; body: ITaxRateStatusRequest }>({
      query: ({ id, body }) => ({
        url: `/tax-rates/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.TAX_RATE, id },
        { type: API_TAG_TYPES.TAX_RATE, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyHouseholdQuery,
  useUpdateMyHouseholdMutation,
  useGetInvoiceTemplateQuery,
  useUpdateInvoiceTemplateMutation,
  useGetAllTaxRatesQuery,
  useCreateTaxRateMutation,
  useUpdateTaxRateMutation,
  useUpdateTaxRateStatusMutation,
} = settingsApi;
