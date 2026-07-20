import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import { SHIFT_API_ENDPOINTS, SHIFT_API_TAG_IDS } from "@/constants/shift";
import type {
  IApiResponse,
  ICloseShiftRequest,
  IOpenShiftRequest,
  IShiftResponse,
} from "@/modules/shift/types/IShift";

const ACTIVE_SHIFT_NOT_FOUND_STATUS = 404;
const ACTIVE_SHIFT_NOT_FOUND_CODE = 3006;

const NO_ACTIVE_SHIFT_RESPONSE: IApiResponse<null> = {
  code: ACTIVE_SHIFT_NOT_FOUND_CODE,
  message: "Không tìm thấy ca bán hàng hoạt động của nhân viên",
  result: null,
};

interface IShiftAuthState {
  auth?: {
    user?: {
      id?: string;
    } | null;
  };
}

const getApiResponseCode = (data: unknown): number | null => {
  if (typeof data !== "object" || data === null || !("code" in data)) {
    return null;
  }

  return typeof data.code === "number" ? data.code : null;
};

const getAuthenticatedUserId = (state: unknown): string | null => {
  if (typeof state !== "object" || state === null) {
    return null;
  }

  return (state as IShiftAuthState).auth?.user?.id ?? null;
};

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
    getActiveShift: builder.query<IApiResponse<IShiftResponse | null>, void>({
      queryFn: async (_argument, _queryApi, _extraOptions, baseQuery) => {
        const response = await baseQuery({
          url: SHIFT_API_ENDPOINTS.ACTIVE,
          method: HTTP_METHODS.GET,
        });

        if (response.error) {
          const isNoActiveShift =
            response.error.status === ACTIVE_SHIFT_NOT_FOUND_STATUS &&
            getApiResponseCode(response.error.data) === ACTIVE_SHIFT_NOT_FOUND_CODE;

          if (isNoActiveShift) {
            return { data: NO_ACTIVE_SHIFT_RESPONSE };
          }

          return { error: response.error };
        }

        return {
          data: response.data as IApiResponse<IShiftResponse>,
        };
      },
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
      async onQueryStarted(_request, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const authenticatedUserId = getAuthenticatedUserId(getState());

          if (data.result.userId === authenticatedUserId) {
            dispatch(
              shiftApi.util.upsertQueryData("getActiveShift", undefined, data),
            );
          }
        } catch {
          // The component displays the mutation error.
        }
      },
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
      async onQueryStarted(_request, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const authenticatedUserId = getAuthenticatedUserId(getState());

          if (data.result.userId === authenticatedUserId) {
            dispatch(
              shiftApi.util.upsertQueryData(
                "getActiveShift",
                undefined,
                NO_ACTIVE_SHIFT_RESPONSE,
              ),
            );
          }
        } catch {
          // The component displays the mutation error.
        }
      },
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
