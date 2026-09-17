import { baseApi } from "@/stores/baseApi";
import { API_TAG_TYPES } from "@/constants/api";
import type {
  IFaqItem,
  ISupportInfo,
  ISupportChannel,
  IFaqCategoryGroup,
  IGetFaqsParams,
  IApiResponse,
  IPageResponse,
} from "../types/faqSupport.types";

export const faqSupportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // TC-01, TC-02: Tra cứu câu hỏi thường gặp theo từ khóa hoặc nhóm category
    getFaqs: builder.query<
      IApiResponse<IPageResponse<IFaqItem>>,
      IGetFaqsParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.keyword) queryParams.append("keyword", params.keyword.trim());
        if (params?.category) queryParams.append("category", params.category);
        if (params?.page !== undefined) queryParams.append("page", params.page.toString());
        if (params?.size !== undefined) queryParams.append("size", params.size.toString());
        const qs = queryParams.toString();
        return `/faqs${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.FAQ,
                id,
              })),
              { type: API_TAG_TYPES.FAQ, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.FAQ, id: "LIST" }],
    }),

    // Lấy câu hỏi gom nhóm theo 4 category chuẩn (Hóa đơn, Bán hàng, Tài khoản, Dữ liệu)
    getFaqsGrouped: builder.query<IApiResponse<IFaqCategoryGroup[]>, void>({
      query: () => "/faqs/grouped",
      providesTags: [{ type: API_TAG_TYPES.FAQ, id: "GROUPED" }],
    }),

    // Xem chi tiết câu hỏi và tự động tăng view count
    getFaqDetail: builder.query<IApiResponse<IFaqItem>, string>({
      query: (id) => `/faqs/${id}`,
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.FAQ, id },
      ],
    }),

    // TC-03: Màn hình thông tin hỗ trợ kỹ thuật và định danh hộ kinh doanh
    getSupportInfo: builder.query<IApiResponse<ISupportInfo>, void>({
      query: () => "/faqs/support-info",
      providesTags: [
        { type: API_TAG_TYPES.SUPPORT_CHANNEL, id: "SUPPORT_INFO" },
      ],
    }),

    // Danh sách kênh liên hệ hỗ trợ kỹ thuật đang hoạt động
    getActiveSupportChannels: builder.query<IApiResponse<ISupportChannel[]>, void>({
      query: () => "/faqs/support-channels",
      providesTags: [
        { type: API_TAG_TYPES.SUPPORT_CHANNEL, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetFaqsQuery,
  useGetFaqsGroupedQuery,
  useGetFaqDetailQuery,
  useGetSupportInfoQuery,
  useGetActiveSupportChannelsQuery,
} = faqSupportApi;
