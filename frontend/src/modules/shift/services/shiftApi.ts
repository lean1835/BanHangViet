import { baseApi } from "../../../stores/baseApi";

export const shiftApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveShift: builder.query<any, void>({
      query: () => ({
        url: "/shifts/active",
        method: "GET",
      }),
      providesTags: ["Shift"],
    }),
    openShift: builder.mutation<any, { openingCash: number }>({
      query: (body) => ({
        url: "/shifts/open",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shift"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetActiveShiftQuery,
  useOpenShiftMutation,
} = shiftApi;
