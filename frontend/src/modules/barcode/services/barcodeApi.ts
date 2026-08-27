import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import { BARCODE_API_ENDPOINTS, BARCODE_API_TAG_IDS } from "@/constants/barcode";
import { PRODUCT_API_TAG_IDS } from "@/constants/product";
import type {
  IBarcodeScanRequest,
  IBarcodeScanResponse,
  IAssignBarcodeRequest,
  IBarcodeResponse,
  IBarcodePrintParams,
} from "@/modules/barcode/types/IBarcode";
import type { IApiResponse } from "@/types/api";

export const barcodeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    scanBarcode: builder.mutation<IBarcodeScanResponse, IBarcodeScanRequest>({
      query: (body) => ({
        url: BARCODE_API_ENDPOINTS.SCAN,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: IApiResponse<IBarcodeScanResponse>) => response.result,
      invalidatesTags: (result) =>
        result?.found && result?.order
          ? [{ type: API_TAG_TYPES.ORDER, id: result.order.id }]
          : [],
    }),

    generateInternalBarcode: builder.mutation<IBarcodeResponse, string>({
      query: (productId) => ({
        url: BARCODE_API_ENDPOINTS.GENERATE_INTERNAL(productId),
        method: HTTP_METHODS.POST,
      }),
      transformResponse: (response: IApiResponse<IBarcodeResponse>) => response.result,
      invalidatesTags: (_result, _error, productId) => [
        { type: API_TAG_TYPES.PRODUCT, id: productId },
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.BARCODE, id: BARCODE_API_TAG_IDS.LIST },
      ],
    }),

    assignBarcode: builder.mutation<
      IBarcodeResponse,
      { productId: string; data: IAssignBarcodeRequest }
    >({
      query: ({ productId, data }) => ({
        url: BARCODE_API_ENDPOINTS.ASSIGN(productId),
        method: HTTP_METHODS.POST,
        body: data,
      }),
      transformResponse: (response: IApiResponse<IBarcodeResponse>) => response.result,
      invalidatesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.PRODUCT, id: productId },
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.BARCODE, id: BARCODE_API_TAG_IDS.LIST },
      ],
    }),

    getBarcodePrintData: builder.query<
      IBarcodeResponse,
      { productId: string; params?: IBarcodePrintParams }
    >({
      query: ({ productId, params }) => ({
        url: BARCODE_API_ENDPOINTS.PRINT_DATA(productId),
        method: HTTP_METHODS.GET,
        params: {
          paperSize: params?.paperSize || "58mm",
          quantity: params?.quantity || 1,
        },
      }),
      transformResponse: (response: IApiResponse<IBarcodeResponse>) => response.result,
      providesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.BARCODE, id: productId },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useScanBarcodeMutation,
  useGenerateInternalBarcodeMutation,
  useAssignBarcodeMutation,
  useGetBarcodePrintDataQuery,
  useLazyGetBarcodePrintDataQuery,
} = barcodeApi;
