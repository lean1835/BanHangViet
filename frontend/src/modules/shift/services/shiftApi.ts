import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import { SHIFT_API_ENDPOINTS, SHIFT_API_TAG_IDS } from "@/constants/shift";
import type {
  IApiResponse,
  ICloseShiftRequest,
  IOpenShiftRequest,
  IShiftResponse,
} from "@/modules/shift/types/IShift";

export const shiftApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShiftsHistory: builder.query<IApiResponse<IShiftResponse[]>, void>({
      query: () => ({
        url: SHIFT_API_ENDPOINTS.LIST,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (result) =>
        result?.result
          ? [
              ...result.result.map(({ id }) => ({ type: API_TAG_TYPES.SHIFT, id })),
              { type: API_TAG_TYPES.SHIFT, id: SHIFT_API_TAG_IDS.LIST },
            ]
          : [{ type: API_TAG_TYPES.SHIFT, id: SHIFT_API_TAG_IDS.LIST }],
    }),
    getActiveShift: builder.query<IApiResponse<IShiftResponse>, void>({
      query: () => ({
        url: SHIFT_API_ENDPOINTS.ACTIVE,
        method: HTTP_METHODS.GET,
      }),
      providesTags: [
        { type: API_TAG_TYPES.ACTIVE_SHIFT, id: SHIFT_API_TAG_IDS.ACTIVE },
      ],
    }),
    openShift: builder.mutation<IApiResponse<IShiftResponse>, IOpenShiftRequest>({
      query: (body) => ({
        url: SHIFT_API_ENDPOINTS.OPEN,
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.ACTIVE_SHIFT, id: SHIFT_API_TAG_IDS.ACTIVE },
        { type: API_TAG_TYPES.SHIFT, id: SHIFT_API_TAG_IDS.LIST },
      ],
    }),
    closeShift: builder.mutation<IApiResponse<IShiftResponse>, { id: string; body: ICloseShiftRequest }>({
      query: ({ id, body }) => ({
        url: SHIFT_API_ENDPOINTS.CLOSE(id),
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.ACTIVE_SHIFT, id: SHIFT_API_TAG_IDS.ACTIVE },
        { type: API_TAG_TYPES.SHIFT, id: SHIFT_API_TAG_IDS.LIST },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetShiftsHistoryQuery,
  useGetActiveShiftQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
} = shiftApi;
