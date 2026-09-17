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
import {
  type IBusinessDeadlinesConfig,
  type IBackendAutoRetrySettings,
  mapBackendToUiDeadlines,
  mapUiToBackendDeadlines,
} from "../types/IBusinessDeadlines";
import type { IOnboardingStatusBackendResponse } from "../types/ISetupGuide";
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
      invalidatesTags: [
        API_TAG_TYPES.INVOICE_TEMPLATE,
        { type: API_TAG_TYPES.INVOICE_RANGE, id: "ACTIVE" },
        { type: API_TAG_TYPES.INVOICE_RANGE, id: "LIST" },
      ],
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

    // Household Settings & Auto Retry Deadlines (NCL-09-CN-008)
    getHouseholdSettings: builder.query<ApiResponse<IBusinessDeadlinesConfig>, void>({
      query: () => ({
        url: "/household/settings",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<Partial<IBackendAutoRetrySettings>>) => {
        let savedLocal: Partial<IBusinessDeadlinesConfig> = {};
        try {
          const raw = localStorage.getItem("bhv_household_deadlines_mock");
          if (raw) savedLocal = JSON.parse(raw);
        } catch {
          // ignore
        }

        const mappedBe = mapBackendToUiDeadlines(response?.result || {});
        const mergedResult: IBusinessDeadlinesConfig = {
          ...mappedBe,
          ...savedLocal,
        };

        return {
          ...response,
          result: mergedResult,
        };
      },
      providesTags: [API_TAG_TYPES.HOUSEHOLD],
    }),
    updateHouseholdSettings: builder.mutation<ApiResponse<IBusinessDeadlinesConfig>, Partial<IBusinessDeadlinesConfig>>({
      query: (body) => ({
        url: "/household/settings",
        method: "PUT",
        body: mapUiToBackendDeadlines(body),
      }),
      async onQueryStarted(patch, { queryFulfilled }) {
        try {
          // Always persist to localStorage for instant client fallback / offline / mock mode
          const raw = localStorage.getItem("bhv_household_deadlines_mock");
          const existing = raw ? JSON.parse(raw) : {};
          localStorage.setItem(
            "bhv_household_deadlines_mock",
            JSON.stringify({ ...existing, ...patch, updatedAt: new Date().toISOString() })
          );
        } catch {
          // ignore
        }
        try {
          await queryFulfilled;
        } catch {
          // Keep localStorage state active even if backend returns 404/500 during development
        }
      },
      invalidatesTags: [API_TAG_TYPES.HOUSEHOLD],
    }),

    // First-Time Setup Wizard Onboarding (NCL-09-CN-007)
    getOnboardingStatus: builder.query<ApiResponse<IOnboardingStatusBackendResponse>, void>({
      query: () => ({
        url: "/household/onboarding/status",
        method: "GET",
      }),
      providesTags: [API_TAG_TYPES.ONBOARDING, API_TAG_TYPES.HOUSEHOLD],
    }),
    skipOnboarding: builder.mutation<ApiResponse<IOnboardingStatusBackendResponse>, void>({
      query: () => ({
        url: "/household/onboarding/skip",
        method: "POST",
      }),
      invalidatesTags: [API_TAG_TYPES.ONBOARDING],
    }),
    completeOnboarding: builder.mutation<ApiResponse<IOnboardingStatusBackendResponse>, void>({
      query: () => ({
        url: "/household/onboarding/complete",
        method: "POST",
      }),
      invalidatesTags: [API_TAG_TYPES.ONBOARDING],
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
  useGetHouseholdSettingsQuery,
  useUpdateHouseholdSettingsMutation,
  useGetOnboardingStatusQuery,
  useSkipOnboardingMutation,
  useCompleteOnboardingMutation,
} = settingsApi;


