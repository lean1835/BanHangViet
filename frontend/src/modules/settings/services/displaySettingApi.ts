import { baseApi } from "@/stores/baseApi";
import type { IApiResponse } from "@/types/api";
import { API_TAG_TYPES } from "@/constants/api";
import type {
  IUserDisplaySettingResponse,
  IUpdateUserDisplaySettingRequest,
  IToggleSimpleModeRequest,
  IPosSimplifiedLayoutResponse,
} from "../types/IDisplaySetting";

export const displaySettingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDisplaySettings: builder.query<IApiResponse<IUserDisplaySettingResponse>, void>({
      query: () => ({
        url: "/profile/display-settings",
        method: "GET",
      }),
      providesTags: [API_TAG_TYPES.DISPLAY_SETTINGS],
    }),

    updateDisplaySettings: builder.mutation<
      IApiResponse<IUserDisplaySettingResponse>,
      IUpdateUserDisplaySettingRequest
    >({
      query: (body) => ({
        url: "/profile/display-settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: [
        API_TAG_TYPES.DISPLAY_SETTINGS,
        API_TAG_TYPES.POS_LAYOUT,
        API_TAG_TYPES.USER,
      ],
    }),

    toggleSimpleMode: builder.mutation<
      IApiResponse<IUserDisplaySettingResponse>,
      IToggleSimpleModeRequest
    >({
      query: (body) => ({
        url: "/profile/display-settings/toggle-simple-mode",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        API_TAG_TYPES.DISPLAY_SETTINGS,
        API_TAG_TYPES.POS_LAYOUT,
        API_TAG_TYPES.USER,
      ],
    }),

    getPosLayout: builder.query<IApiResponse<IPosSimplifiedLayoutResponse>, void>({
      query: () => ({
        url: "/profile/display-settings/pos-layout",
        method: "GET",
      }),
      providesTags: [API_TAG_TYPES.POS_LAYOUT],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDisplaySettingsQuery,
  useLazyGetDisplaySettingsQuery,
  useUpdateDisplaySettingsMutation,
  useToggleSimpleModeMutation,
  useGetPosLayoutQuery,
  useLazyGetPosLayoutQuery,
} = displaySettingApi;
