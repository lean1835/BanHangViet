import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type {
  IPointOfSale,
  IPointOfSaleRequest,
  IPosEmployee,
  IAssignPosEmployeeRequest,
  IPosInventory,
  IInitPosInventoryRequest,
  IUpdatePosInventoryRequest,
} from "../types/IPointOfSale";

export interface IGetPointsOfSaleParams {
  keyword?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface IGetPosInventoriesParams {
  keyword?: string;
  groupId?: string;
  lowStockOnly?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface IPageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const pointOfSaleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Quản lý điểm bán (Point of Sale)
    getPointsOfSale: builder.query<
      IPageResult<IPointOfSale>,
      IGetPointsOfSaleParams | void
    >({
      query: (params) => ({
        url: "/points-of-sale",
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: (response: { result: IPageResult<IPointOfSale> }) =>
        response.result,
      providesTags: (result) =>
        result?.content
          ? [
            ...result.content.map(({ id }) => ({
              type: API_TAG_TYPES.POINT_OF_SALE,
              id,
            })),
            { type: API_TAG_TYPES.POINT_OF_SALE, id: "LIST" },
          ]
          : [{ type: API_TAG_TYPES.POINT_OF_SALE, id: "LIST" }],
    }),

    getActivePointsOfSale: builder.query<IPointOfSale[], void>({
      query: () => ({
        url: "/points-of-sale/active",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: { result: IPointOfSale[] }) =>
        response.result || [],
      providesTags: [{ type: API_TAG_TYPES.POINT_OF_SALE, id: "ACTIVE_LIST" }],
    }),

    getPointOfSaleById: builder.query<IPointOfSale, string>({
      query: (id) => ({
        url: `/points-of-sale/${id}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: { result: IPointOfSale }) =>
        response.result,
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.POINT_OF_SALE, id },
      ],
    }),

    createPointOfSale: builder.mutation<IPointOfSale, IPointOfSaleRequest>({
      query: (body) => ({
        url: "/points-of-sale",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: { result: IPointOfSale }) =>
        response.result,
      invalidatesTags: [
        { type: API_TAG_TYPES.POINT_OF_SALE, id: "LIST" },
        { type: API_TAG_TYPES.POINT_OF_SALE, id: "ACTIVE_LIST" },
      ],
    }),

    updatePointOfSale: builder.mutation<
      IPointOfSale,
      { id: string; body: IPointOfSaleRequest }
    >({
      query: ({ id, body }) => ({
        url: `/points-of-sale/${id}`,
        method: HTTP_METHODS.PUT,
        body,
      }),
      transformResponse: (response: { result: IPointOfSale }) =>
        response.result,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.POINT_OF_SALE, id },
        { type: API_TAG_TYPES.POINT_OF_SALE, id: "LIST" },
        { type: API_TAG_TYPES.POINT_OF_SALE, id: "ACTIVE_LIST" },
      ],
    }),

    setDefaultPointOfSale: builder.mutation<IPointOfSale, string>({
      query: (id) => ({
        url: `/points-of-sale/${id}/default`,
        method: HTTP_METHODS.PATCH,
      }),
      transformResponse: (response: { result: IPointOfSale }) =>
        response.result,
      invalidatesTags: [
        { type: API_TAG_TYPES.POINT_OF_SALE, id: "LIST" },
        { type: API_TAG_TYPES.POINT_OF_SALE, id: "ACTIVE_LIST" },
      ],
    }),

    deletePointOfSale: builder.mutation<void, string>({
      query: (id) => ({
        url: `/points-of-sale/${id}`,
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.POINT_OF_SALE, id: "LIST" },
        { type: API_TAG_TYPES.POINT_OF_SALE, id: "ACTIVE_LIST" },
      ],
    }),

    // 2. Gán nhân viên vào điểm bán (PosEmployee)
    getPosEmployees: builder.query<IPosEmployee[], string>({
      query: (posId) => ({
        url: `/points-of-sale/${posId}/employees`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: { result: IPosEmployee[] }) =>
        response.result || [],
      providesTags: (_result, _error, posId) => [
        { type: API_TAG_TYPES.POS_EMPLOYEE, id: posId },
      ],
    }),

    assignPosEmployees: builder.mutation<
      IPosEmployee[],
      { posId: string; body: IAssignPosEmployeeRequest }
    >({
      query: ({ posId, body }) => ({
        url: `/points-of-sale/${posId}/employees/assign`,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: { result: IPosEmployee[] }) =>
        response.result || [],
      invalidatesTags: (_result, _error, { posId }) => [
        { type: API_TAG_TYPES.POS_EMPLOYEE, id: posId },
        { type: API_TAG_TYPES.USER, id: "LIST" },
      ],
    }),

    unassignPosEmployee: builder.mutation<
      void,
      { posId: string; userId: string }
    >({
      query: ({ posId, userId }) => ({
        url: `/points-of-sale/${posId}/employees/${userId}`,
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, { posId }) => [
        { type: API_TAG_TYPES.POS_EMPLOYEE, id: posId },
        { type: API_TAG_TYPES.USER, id: "LIST" },
      ],
    }),

    // 3. Quản lý tồn kho theo điểm bán (PosInventory)
    getPosInventories: builder.query<
      IPageResult<IPosInventory>,
      { posId: string; params?: IGetPosInventoriesParams }
    >({
      query: ({ posId, params }) => ({
        url: `/points-of-sale/${posId}/inventories`,
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: (response: { result: IPageResult<IPosInventory> }) =>
        response.result,
      providesTags: (result, _error, { posId }) =>
        result?.content
          ? [
              ...result.content.map(({ id }) => ({
                type: API_TAG_TYPES.POS_INVENTORY,
                id,
              })),
              { type: API_TAG_TYPES.POS_INVENTORY, id: posId },
              { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
            ]
          : [
              { type: API_TAG_TYPES.POS_INVENTORY, id: posId },
              { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
            ],
    }),

    getPosInventoryProduct: builder.query<
      IPosInventory,
      { posId: string; productId: string }
    >({
      query: ({ posId, productId }) => ({
        url: `/points-of-sale/${posId}/inventories/${productId}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: { result: IPosInventory }) =>
        response.result,
      providesTags: (_result, _error, { posId, productId }) => [
        { type: API_TAG_TYPES.POS_INVENTORY, id: `${posId}_${productId}` },
      ],
    }),

    getPosLowStockWarnings: builder.query<IPosInventory[], string>({
      query: (posId) => ({
        url: `/points-of-sale/${posId}/inventories/warning`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: { result: IPosInventory[] }) =>
        response.result || [],
      providesTags: (_result, _error, posId) => [
        { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${posId}` },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "WARNINGS_LIST" },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
      ],
    }),

    initPosInventories: builder.mutation<
      IPosInventory[],
      { posId: string; body: IInitPosInventoryRequest }
    >({
      query: ({ posId, body }) => ({
        url: `/points-of-sale/${posId}/inventories/init`,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: { result: IPosInventory[] }) =>
        response.result || [],
      invalidatesTags: (_result, _error, { posId }) => [
        { type: API_TAG_TYPES.POS_INVENTORY, id: posId },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
        { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${posId}` },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "WARNINGS_LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
      ],
    }),

    updatePosInventory: builder.mutation<
      IPosInventory,
      { posId: string; productId: string; body: IUpdatePosInventoryRequest }
    >({
      query: ({ posId, productId, body }) => ({
        url: `/points-of-sale/${posId}/inventories/${productId}`,
        method: HTTP_METHODS.PUT,
        body,
      }),
      transformResponse: (response: { result: IPosInventory }) =>
        response.result,
      invalidatesTags: (_result, _error, { posId, productId }) => [
        { type: API_TAG_TYPES.POS_INVENTORY, id: posId },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
        { type: API_TAG_TYPES.POS_INVENTORY, id: `${posId}_${productId}` },
        { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${posId}` },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "WARNINGS_LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetPointsOfSaleQuery,
  useGetActivePointsOfSaleQuery,
  useGetPointOfSaleByIdQuery,
  useCreatePointOfSaleMutation,
  useUpdatePointOfSaleMutation,
  useSetDefaultPointOfSaleMutation,
  useDeletePointOfSaleMutation,
  useGetPosEmployeesQuery,
  useAssignPosEmployeesMutation,
  useUnassignPosEmployeeMutation,
  useGetPosInventoriesQuery,
  useGetPosInventoryProductQuery,
  useGetPosLowStockWarningsQuery,
  useInitPosInventoriesMutation,
  useUpdatePosInventoryMutation,
} = pointOfSaleApi;
