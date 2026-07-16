import { baseApi } from "../../../stores/baseApi";
import { IProduct, IProductGroup } from "../types/product";

interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<
      PageResponse<IProduct>,
      { search?: string; groupId?: string; status?: string; stockFilter?: string; page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: "/products",
        method: "GET",
        params: params || {},
      }),
      transformResponse: (response: any): PageResponse<IProduct> => {
        const result = response.result || {};
        const content = result.content || [];
        return {
          content: content.map((prod: any) => ({
            id: prod.id,
            sku: prod.sku,
            name: prod.name,
            unit: prod.unit,
            price: Number(prod.price || 0),
            stockQuantity: Number(prod.stockQuantity || 0),
            status: prod.status,
            groupId: prod.groupId,
            groupName: prod.groupName,
            taxRateId: prod.taxRateId,
            taxRateName: prod.taxRateName,
            taxRatePercentage: Number(prod.taxRatePercentage || 0),
            createdAt: prod.createdAt,
            updatedAt: prod.updatedAt,
          })),
          pageNumber: result.pageNumber || 0,
          pageSize: result.pageSize || 10,
          totalElements: result.totalElements || 0,
          totalPages: result.totalPages || 0,
          last: result.last !== false,
        };
      },
      providesTags: (result) =>
        result?.content
          ? [
              ...result.content.map(({ id }) => ({ type: "Product" as const, id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),
    createProduct: builder.mutation<IProduct, Partial<IProduct> & { taxRateId: string }>({
      query: (productData) => ({
        url: "/products",
        method: "POST",
        body: {
          sku: productData.sku,
          name: productData.name,
          unit: productData.unit,
          price: productData.price,
          stockQuantity: productData.stockQuantity,
          status: productData.status || "ACTIVE",
          groupId: productData.groupId || undefined,
          taxRateId: productData.taxRateId,
        },
      }),
      transformResponse: (response: any): IProduct => {
        const prod = response.result;
        return {
          id: prod.id,
          sku: prod.sku,
          name: prod.name,
          unit: prod.unit,
          price: Number(prod.price || 0),
          stockQuantity: Number(prod.stockQuantity || 0),
          status: prod.status,
          groupId: prod.groupId,
          groupName: prod.groupName,
          taxRateId: prod.taxRateId,
          taxRateName: prod.taxRateName,
          taxRatePercentage: Number(prod.taxRatePercentage || 0),
          createdAt: prod.createdAt,
          updatedAt: prod.updatedAt,
        };
      },
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: builder.mutation<IProduct, { id: string; data: Partial<IProduct> & { taxRateId: string } }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: {
          sku: data.sku,
          name: data.name,
          unit: data.unit,
          price: data.price,
          stockQuantity: data.stockQuantity,
          status: data.status || "ACTIVE",
          groupId: data.groupId || undefined,
          taxRateId: data.taxRateId,
        },
      }),
      transformResponse: (response: any): IProduct => {
        const prod = response.result;
        return {
          id: prod.id,
          sku: prod.sku,
          name: prod.name,
          unit: prod.unit,
          price: Number(prod.price || 0),
          stockQuantity: Number(prod.stockQuantity || 0),
          status: prod.status,
          groupId: prod.groupId,
          groupName: prod.groupName,
          taxRateId: prod.taxRateId,
          taxRateName: prod.taxRateName,
          taxRatePercentage: Number(prod.taxRatePercentage || 0),
          createdAt: prod.createdAt,
          updatedAt: prod.updatedAt,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id },
      ],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id },
      ],
    }),
    getProductGroups: builder.query<IProductGroup[], void>({
      query: () => ({
        url: "/product-groups",
        method: "GET",
      }),
      transformResponse: (response: any): IProductGroup[] => response.result || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "ProductGroup" as const, id })),
              { type: "ProductGroup", id: "LIST" },
            ]
          : [{ type: "ProductGroup", id: "LIST" }],
    }),
    createProductGroup: builder.mutation<IProductGroup, { name: string }>({
      query: (data) => ({
        url: "/product-groups",
        method: "POST",
        body: {
          name: data.name,
        },
      }),
      transformResponse: (response: any): IProductGroup => response.result,
      invalidatesTags: [{ type: "ProductGroup", id: "LIST" }],
    }),
    updateProductGroup: builder.mutation<IProductGroup, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/product-groups/${id}`,
        method: "PUT",
        body: {
          name,
        },
      }),
      transformResponse: (response: any): IProductGroup => response.result,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ProductGroup", id: "LIST" },
        { type: "ProductGroup", id },
      ],
    }),
    deleteProductGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/product-groups/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "ProductGroup", id: "LIST" },
        { type: "ProductGroup", id },
        { type: "Product", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductGroupsQuery,
  useCreateProductGroupMutation,
  useUpdateProductGroupMutation,
  useDeleteProductGroupMutation,
} = productApi;
