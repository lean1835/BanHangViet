import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";

export interface ITaxRateResponse {
  id: string;
  householdId: string;
  name: string;
  ratePercentage: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITaxRateRequest {
  name: string;
  ratePercentage: number;
  isActive: boolean;
}

export interface ITaxRateStatusRequest {
  isActive: boolean;
}

const getResponseResult = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "result" in response) {
    return (response as { result: T }).result;
  }
  return response as T;
};

export const taxRateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaxRates: builder.query<ITaxRateResponse[], void>({
      query: () => ({
        url: "/tax-rates",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ITaxRateResponse[] => {
        const result = getResponseResult<ITaxRateResponse[]>(response);
        return Array.isArray(result) ? result : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.TAX_RATE,
                id,
              })),
              { type: API_TAG_TYPES.TAX_RATE, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.TAX_RATE, id: "LIST" }],
    }),

    createTaxRate: builder.mutation<ITaxRateResponse, ITaxRateRequest>({
      query: (body) => ({
        url: "/tax-rates",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown): ITaxRateResponse => {
        return getResponseResult<ITaxRateResponse>(response);
      },
      invalidatesTags: [{ type: API_TAG_TYPES.TAX_RATE, id: "LIST" }],
    }),

    updateTaxRate: builder.mutation<
      ITaxRateResponse,
      { id: string; data: ITaxRateRequest }
    >({
      query: ({ id, data }) => ({
        url: `/tax-rates/${id}`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      transformResponse: (response: unknown): ITaxRateResponse => {
        return getResponseResult<ITaxRateResponse>(response);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.TAX_RATE, id },
        { type: API_TAG_TYPES.TAX_RATE, id: "LIST" },
      ],
    }),

    updateTaxRateStatus: builder.mutation<
      ITaxRateResponse,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/tax-rates/${id}/status`,
        method: HTTP_METHODS.PATCH,
        body: { isActive },
      }),
      transformResponse: (response: unknown): ITaxRateResponse => {
        return getResponseResult<ITaxRateResponse>(response);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.TAX_RATE, id },
        { type: API_TAG_TYPES.TAX_RATE, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetTaxRatesQuery,
  useCreateTaxRateMutation,
  useUpdateTaxRateMutation,
  useUpdateTaxRateStatusMutation,
} = taxRateApi;
