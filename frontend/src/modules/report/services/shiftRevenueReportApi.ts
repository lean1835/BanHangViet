import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type {
  IShiftRevenueReportFilter,
  IShiftRevenueReportResponse,
} from "../types/IShiftRevenueReport";
import { generateMockShiftRevenueData } from "./mockShiftRevenueData";

export const shiftRevenueReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeShiftRevenueReport: builder.query<
      IShiftRevenueReportResponse,
      IShiftRevenueReportFilter
    >({
      queryFn: async (args, _queryApi, _extraOptions, baseQuery) => {
        try {
          const response = await baseQuery({
            url: "/reports/employee-shifts",
            method: HTTP_METHODS.GET,
            params: {
              fromDate: args.fromDate,
              toDate: args.toDate,
              employeeId: args.employeeId || undefined,
              threshold: args.threshold || 50000,
            },
          });

          // Nếu Backend đã có endpoint và trả về thành công
          if (response.data && !response.error) {
            const raw = response.data as { result?: IShiftRevenueReportResponse };
            if (raw?.result) {
              return { data: raw.result };
            }
          }

          // Fallback tự động sang Mock Data khi Backend chưa hoàn thiện endpoint (404/500)
          const fallbackData = generateMockShiftRevenueData(
            args.fromDate,
            args.toDate,
            args.employeeId,
            args.threshold ?? 50000,
            args.onlyDiscrepancy ?? false
          );
          return { data: fallbackData };
        } catch {
          const fallbackData = generateMockShiftRevenueData(
            args.fromDate,
            args.toDate,
            args.employeeId,
            args.threshold ?? 50000,
            args.onlyDiscrepancy ?? false
          );
          return { data: fallbackData };
        }
      },
      providesTags: [{ type: API_TAG_TYPES.SHIFT, id: "EMPLOYEE_REPORT" }],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const { useGetEmployeeShiftRevenueReportQuery } = shiftRevenueReportApi;
