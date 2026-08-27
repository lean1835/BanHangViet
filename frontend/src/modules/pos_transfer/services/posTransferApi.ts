import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type {
  IPosTransfer,
  ICreatePosTransferRequest,
  ICancelPosTransferRequest,
  TPosTransferStatus,
} from "../types/IPosTransfer";
import type { IPageResult } from "@/modules/point_of_sale/services/pointOfSaleApi";

export interface IGetPosTransfersParams {
  fromPosId?: string;
  toPosId?: string;
  status?: TPosTransferStatus;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export const posTransferApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransfers: builder.query<
      IPageResult<IPosTransfer>,
      IGetPosTransfersParams | void
    >({
      query: (params) => ({
        url: "/pos-transfers",
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: (response: { result: IPageResult<IPosTransfer> }) =>
        response.result,
      providesTags: (result) =>
        result?.content
          ? [
            ...result.content.map(({ id }) => ({
              type: API_TAG_TYPES.POS_TRANSFER,
              id,
            })),
            { type: API_TAG_TYPES.POS_TRANSFER, id: "LIST" },
          ]
          : [{ type: API_TAG_TYPES.POS_TRANSFER, id: "LIST" }],
    }),

    getTransferById: builder.query<IPosTransfer, string>({
      query: (id) => ({
        url: `/pos-transfers/${id}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: { result: IPosTransfer }) =>
        response.result,
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.POS_TRANSFER, id },
      ],
    }),

    createTransfer: builder.mutation<IPosTransfer, ICreatePosTransferRequest>({
      query: (body) => ({
        url: "/pos-transfers",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: { result: IPosTransfer }) =>
        response.result,
      invalidatesTags: (_result, _error, body) => [
        { type: API_TAG_TYPES.POS_TRANSFER, id: "LIST" },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
        ...(body.fromPointOfSaleId
          ? [
              { type: API_TAG_TYPES.POS_INVENTORY, id: body.fromPointOfSaleId },
              { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${body.fromPointOfSaleId}` },
            ]
          : []),
        ...(body.toPointOfSaleId
          ? [
              { type: API_TAG_TYPES.POS_INVENTORY, id: body.toPointOfSaleId },
              { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${body.toPointOfSaleId}` },
            ]
          : []),
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
      ],
    }),

    receiveTransfer: builder.mutation<IPosTransfer, string>({
      query: (id) => ({
        url: `/pos-transfers/${id}/receive`,
        method: HTTP_METHODS.POST,
      }),
      transformResponse: (response: { result: IPosTransfer }) =>
        response.result,
      invalidatesTags: (result, _error, id) => [
        { type: API_TAG_TYPES.POS_TRANSFER, id },
        { type: API_TAG_TYPES.POS_TRANSFER, id: "LIST" },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
        ...(result?.fromPointOfSaleId
          ? [
              { type: API_TAG_TYPES.POS_INVENTORY, id: result.fromPointOfSaleId },
              { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${result.fromPointOfSaleId}` },
            ]
          : []),
        ...(result?.toPointOfSaleId
          ? [
              { type: API_TAG_TYPES.POS_INVENTORY, id: result.toPointOfSaleId },
              { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${result.toPointOfSaleId}` },
            ]
          : []),
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
      ],
    }),

    cancelTransfer: builder.mutation<
      IPosTransfer,
      { id: string; body: ICancelPosTransferRequest }
    >({
      query: ({ id, body }) => ({
        url: `/pos-transfers/${id}/cancel`,
        method: HTTP_METHODS.POST,
        body: {
          cancelReason: body.cancelReason || body.reason || "",
        },
      }),
      transformResponse: (response: { result: IPosTransfer }) =>
        response.result,
      invalidatesTags: (result, _error, { id }) => [
        { type: API_TAG_TYPES.POS_TRANSFER, id },
        { type: API_TAG_TYPES.POS_TRANSFER, id: "LIST" },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
        ...(result?.fromPointOfSaleId
          ? [
              { type: API_TAG_TYPES.POS_INVENTORY, id: result.fromPointOfSaleId },
              { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${result.fromPointOfSaleId}` },
            ]
          : []),
        ...(result?.toPointOfSaleId
          ? [
              { type: API_TAG_TYPES.POS_INVENTORY, id: result.toPointOfSaleId },
              { type: API_TAG_TYPES.POS_INVENTORY, id: `WARNINGS_${result.toPointOfSaleId}` },
            ]
          : []),
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetTransfersQuery,
  useGetTransferByIdQuery,
  useCreateTransferMutation,
  useReceiveTransferMutation,
  useCancelTransferMutation,
} = posTransferApi;
