import { baseApi } from "@/stores/baseApi";
import { API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IScreenGuideResponse,
  ITrackScreenGuideViewRequest,
  IContextualGuideResponse,
  IScreenGuideTopViewedResponse,
  IScreenGuideSummaryResponse,
  IGetAllScreenGuidesParams,
} from "../types/screenGuide.types";

export const screenGuideApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // TC-01, TC-05: Lấy hướng dẫn ngắn tại chỗ theo mã màn hình
    getGuideByScreenCode: builder.query<IApiResponse<IScreenGuideResponse>, string>({
      query: (screenCode) => `/screen-guides/${screenCode}`,
      providesTags: (_result, _error, screenCode) => [
        { type: API_TAG_TYPES.SCREEN_GUIDE, id: screenCode },
      ],
    }),

    // TC-03: Ghi nhận lịch sử mở xem trợ giúp (durationSeconds, completed)
    trackGuideView: builder.mutation<
      IApiResponse<void>,
      { screenCode: string; data?: ITrackScreenGuideViewRequest }
    >({
      query: ({ screenCode, data }) => ({
        url: `/screen-guides/${screenCode}/track-view`,
        method: HTTP_METHODS.POST,
        body: data || { durationSeconds: 0, completed: false },
      }),
      invalidatesTags: (_result, _error, { screenCode }) => [
        { type: API_TAG_TYPES.SCREEN_GUIDE, id: screenCode },
        { type: API_TAG_TYPES.SCREEN_GUIDE, id: "STATISTICS" },
      ],
    }),

    // TC-02: Tra cứu liên kết hỗ trợ ngữ cảnh khi bị chặn thao tác (ErrorCode)
    getContextualHelp: builder.query<IApiResponse<IContextualGuideResponse>, number>({
      query: (errorCode) => `/screen-guides/contextual-help?errorCode=${errorCode}`,
    }),

    // TC-05: Lấy danh sách toàn bộ danh mục hướng dẫn màn hình hệ thống
    getAllGuides: builder.query<
      IApiResponse<IPageResponse<IScreenGuideSummaryResponse>>,
      IGetAllScreenGuidesParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append("search", params.search);
        if (params?.targetRole) queryParams.append("targetRole", params.targetRole);
        if (params?.page !== undefined) queryParams.append("page", params.page.toString());
        if (params?.size !== undefined) queryParams.append("size", params.size.toString());
        const qs = queryParams.toString();
        return `/screen-guides${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: API_TAG_TYPES.SCREEN_GUIDE, id: "LIST" }],
    }),

    // TC-03: Báo cáo Top màn hình mở trợ giúp nhiều nhất
    getTopViewedGuides: builder.query<
      IApiResponse<IScreenGuideTopViewedResponse[]>,
      number | void
    >({
      query: (limit = 10) => `/screen-guides/statistics/top-viewed?limit=${limit}`,
      providesTags: [{ type: API_TAG_TYPES.SCREEN_GUIDE, id: "STATISTICS" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGuideByScreenCodeQuery,
  useLazyGetGuideByScreenCodeQuery,
  useTrackGuideViewMutation,
  useGetContextualHelpQuery,
  useLazyGetContextualHelpQuery,
  useGetAllGuidesQuery,
  useGetTopViewedGuidesQuery,
} = screenGuideApi;
