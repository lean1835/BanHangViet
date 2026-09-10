import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  IDiningTable,
  ICreateDiningTableRequest,
  IUpdateDiningTableRequest,
  IDiningTableFilterParams,
} from "../types/IDiningTable";

export const diningTableApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDiningTables: builder.query<IApiResponse<IDiningTable[]>, IDiningTableFilterParams | void>({
      query: (params) => ({
        url: "/dining-tables",
        method: HTTP_METHODS.GET,
        params: {
          ...(params?.area ? { area: params.area } : {}),
          ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
        },
      }),
      providesTags: (result) =>
        result?.result
          ? [
              ...result.result.map(({ id }) => ({ type: API_TAG_TYPES.DINING_TABLE, id })),
              { type: API_TAG_TYPES.DINING_TABLE, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.DINING_TABLE, id: "LIST" }],
    }),

    getDiningTableById: builder.query<IApiResponse<IDiningTable>, string>({
      query: (id) => ({
        url: `/dining-tables/${id}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [{ type: API_TAG_TYPES.DINING_TABLE, id }],
    }),

    createDiningTable: builder.mutation<IApiResponse<IDiningTable>, ICreateDiningTableRequest>({
      query: (body) => ({
        url: "/dining-tables",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.DINING_TABLE, id: "LIST" },
        API_TAG_TYPES.ORDER,
        API_TAG_TYPES.HELD_ORDER,
      ],
    }),

    updateDiningTable: builder.mutation<
      IApiResponse<IDiningTable>,
      { id: string; data: IUpdateDiningTableRequest }
    >({
      query: ({ id, data }) => ({
        url: `/dining-tables/${id}`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.DINING_TABLE, id },
        { type: API_TAG_TYPES.DINING_TABLE, id: "LIST" },
        API_TAG_TYPES.ORDER,
        API_TAG_TYPES.HELD_ORDER,
      ],
    }),

    deleteDiningTable: builder.mutation<IApiResponse<void>, string>({
      query: (id) => ({
        url: `/dining-tables/${id}`,
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.DINING_TABLE, id: "LIST" },
        API_TAG_TYPES.ORDER,
        API_TAG_TYPES.HELD_ORDER,
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetDiningTablesQuery,
  useLazyGetDiningTablesQuery,
  useGetDiningTableByIdQuery,
  useCreateDiningTableMutation,
  useUpdateDiningTableMutation,
  useDeleteDiningTableMutation,
} = diningTableApi;
