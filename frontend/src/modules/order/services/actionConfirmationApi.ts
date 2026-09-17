import { baseApi } from "@/stores/baseApi";
import type { IApiResponse } from "@/types/api";
import { API_TAG_TYPES } from "@/constants/api";
import type {
  IActionConsequenceResponse,
  TActionType,
} from "@/modules/settings/types/IDisplaySetting";

export interface IGetActionConsequencesParams {
  actionType: TActionType;
  targetId: string;
}

export const actionConfirmationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActionConsequences: builder.query<
      IApiResponse<IActionConsequenceResponse>,
      IGetActionConsequencesParams
    >({
      query: ({ actionType, targetId }) => ({
        url: "/action-confirmations/consequences",
        method: "GET",
        params: {
          actionType,
          targetId,
        },
      }),
      providesTags: [API_TAG_TYPES.ACTION_CONFIRMATION],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetActionConsequencesQuery,
  useLazyGetActionConsequencesQuery,
} = actionConfirmationApi;
