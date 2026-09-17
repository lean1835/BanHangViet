import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  IInventoryValuationReport,
  IGetInventoryValuationQueryParams,
} from "../types/IInventoryValuation";

const getResponseResult = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "result" in response) {
    return (response as IApiResponse<T>).result;
  }
  return response as T;
};

export const inventoryValuationApi = baseApi.injectEndpoints({
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
  endpoints: (builder) => ({
    getInventoryValuationReport: builder.query<
      IInventoryValuationReport,
      IGetInventoryValuationQueryParams | void
    >({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params?.asOfDate) queryParams.asOfDate = params.asOfDate;
        if (params?.groupId) queryParams.groupId = params.groupId;
        if (params?.search) queryParams.search = params.search;
        if (params?.sortBy) queryParams.sortBy = params.sortBy;
        if (params?.sortDir) queryParams.sortDir = params.sortDir;

        return {
          url: "/reports/inventory-valuation",
          method: HTTP_METHODS.GET,
          params: queryParams,
        };
      },
      transformResponse: (response: unknown) =>
        getResponseResult<IInventoryValuationReport>(response),
      providesTags: () => [
        { type: API_TAG_TYPES.INVENTORY_VALUATION, id: "REPORT" },
      ],
    }),

    exportInventoryValuationExcel: builder.mutation<
      Blob,
      IGetInventoryValuationQueryParams | void
    >({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params?.asOfDate) queryParams.asOfDate = params.asOfDate;
        if (params?.groupId) queryParams.groupId = params.groupId;
        if (params?.search) queryParams.search = params.search;

        return {
          url: "/reports/inventory-valuation/export",
          method: HTTP_METHODS.GET,
          params: queryParams,
          responseHandler: (response) => response.blob(),
        };
      },
    }),
  }),
});

export const {
  useGetInventoryValuationReportQuery,
  useLazyGetInventoryValuationReportQuery,
  useExportInventoryValuationExcelMutation,
} = inventoryValuationApi;
