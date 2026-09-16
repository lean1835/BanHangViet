import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import {
  ACCESS_SCOPES,
  INVITATION_STATUS,
  type IAccountantInvitation,
  type IAccountantInviteResult,
  type IAuthorizedHousehold,
  type ICreateAccountantInviteRequest,
  type IExtendAccountantAccessRequest,
  type IRevokeAccountantAccessRequest,
  type TAccessScope,
  type TInvitationStatus,
} from "../types/IAccountantInvitation";
import { isRecord } from "@/utils/typeGuards";

// Helper chuyển đổi Scope giữa FE và BE
export const mapScopeFeToScopeBe = (scope: string): string => {
  if (scope === ACCESS_SCOPES.E_INVOICES || scope === "INVOICE") return "INVOICE";
  if (scope === ACCESS_SCOPES.FINANCIAL_REPORTS || scope === "REPORT") return "REPORT";
  if (scope === ACCESS_SCOPES.TAX_DECLARATION || scope === "TAX_DECLARATION") return "TAX_DECLARATION";
  return scope;
};

export const mapScopeBeToScopeFe = (scope: string): TAccessScope => {
  if (scope === "INVOICE") return ACCESS_SCOPES.E_INVOICES;
  if (scope === "REPORT") return ACCESS_SCOPES.FINANCIAL_REPORTS;
  if (scope === "TAX_DECLARATION") return ACCESS_SCOPES.TAX_DECLARATION;
  return scope as TAccessScope;
};

// Tính số ngày chênh lệch từ hôm nay tới expiryDate
export const calculateDaysUntil = (expiryDateStr: string): number => {
  if (!expiryDateStr) return 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

const getResponseResult = <T>(response: unknown): T => {
  if (!isRecord(response)) {
    throw new Error("Phản hồi máy chủ không hợp lệ");
  }
  return response.result as T;
};

interface IAccountantInvitationResponse {
  id: string;
  householdId: string;
  householdName?: string;
  householdTaxCode?: string;
  invitationToken: string;
  accountantPhone: string;
  accountantEmail?: string;
  invitedByUsername?: string;
  accessDurationDays: number;
  scopePermissions: string[];
  status: string;
  invitationExpiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
}

interface IAccountantAssignmentResponse {
  id: string;
  householdId: string;
  householdName?: string;
  householdTaxCode?: string;
  accountantUserId: string;
  accountantUsername: string;
  accountantFullName?: string;
  accountantPhone?: string;
  accountantEmail?: string;
  scopePermissions: string[];
  status: string;
  accessExpiresAt: string;
  revokedAt?: string;
  revokeReason?: string;
  createdAt: string;
}

interface IAssignedHouseholdResponse {
  assignmentId: string;
  householdId: string;
  householdName: string;
  householdTaxCode: string;
  representativeName?: string;
  phoneNumber?: string;
  address?: string;
  scopePermissions: string[];
  accessExpiresAt: string;
  isCurrentActive: boolean;
}

export const accountantInvitationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccountantInvitations: builder.query<IAccountantInvitation[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const [invRes, assignRes] = await Promise.all([
            fetchWithBQ({ url: "/accountant/invitations", method: HTTP_METHODS.GET }),
            fetchWithBQ({ url: "/accountant/assignments", method: HTTP_METHODS.GET }),
          ]);

          const resultList: IAccountantInvitation[] = [];

          // 1. Phân tích các phân công (Assignments: ACTIVE, REVOKED, EXPIRED)
          if (assignRes.data) {
            const assignments = getResponseResult<IAccountantAssignmentResponse[]>(assignRes.data);
            if (Array.isArray(assignments)) {
              for (const a of assignments) {
                resultList.push({
                  id: a.id,
                  householdId: a.householdId,
                  householdName: a.householdName,
                  taxCode: a.householdTaxCode,
                  accountantName: a.accountantFullName || a.accountantUsername || "Kế toán viên",
                  phoneNumber: a.accountantPhone || "",
                  email: a.accountantEmail || "",
                  scopes: (a.scopePermissions || []).map(mapScopeBeToScopeFe),
                  status: (a.status || INVITATION_STATUS.ACTIVE) as TInvitationStatus,
                  inviteDate: a.createdAt ? a.createdAt.substring(0, 10) : "",
                  expiryDate: a.accessExpiresAt ? a.accessExpiresAt.substring(0, 10) : "",
                  revokedAt: a.revokedAt ? a.revokedAt.substring(0, 19).replace("T", " ") : undefined,
                  revokeReason: a.revokeReason || undefined,
                  createdBy: "",
                });
              }
            }
          }

          // 2. Phân tích các lời mời (Invitations: PENDING, EXPIRED - loại bỏ ACCEPTED vì đã có trong assignments)
          if (invRes.data) {
            const invitations = getResponseResult<IAccountantInvitationResponse[]>(invRes.data);
            if (Array.isArray(invitations)) {
              for (const inv of invitations) {
                if (inv.status === "ACCEPTED") continue;
                resultList.push({
                  id: inv.id,
                  householdId: inv.householdId,
                  householdName: inv.householdName,
                  taxCode: inv.householdTaxCode,
                  accountantName: inv.accountantEmail
                    ? `Kế toán (${inv.accountantEmail})`
                    : `Kế toán (${inv.accountantPhone})`,
                  phoneNumber: inv.accountantPhone || "",
                  email: inv.accountantEmail || "",
                  scopes: (inv.scopePermissions || []).map(mapScopeBeToScopeFe),
                  status: (inv.status || INVITATION_STATUS.PENDING) as TInvitationStatus,
                  inviteDate: inv.createdAt ? inv.createdAt.substring(0, 10) : "",
                  expiryDate: inv.invitationExpiresAt ? inv.invitationExpiresAt.substring(0, 10) : "",
                  createdBy: inv.invitedByUsername || "Chủ hộ",
                });
              }
            }
          }

          return { data: resultList };
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "Lỗi lấy danh sách kế toán thuê ngoài";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.ACCOUNTANT_INVITATION,
                id,
              })),
              {
                type: API_TAG_TYPES.ACCOUNTANT_INVITATION,
                id: "LIST",
              },
            ]
          : [{ type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id: "LIST" }],
    }),

    inviteAccountant: builder.mutation<
      IAccountantInviteResult,
      ICreateAccountantInviteRequest
    >({
      query: (body) => ({
        url: "/accountant/invitations",
        method: HTTP_METHODS.POST,
        body: {
          accountantName: body.accountantName || undefined,
          accountantPhone: body.phoneNumber,
          accountantEmail: body.email || undefined,
          accessDurationDays: calculateDaysUntil(body.expiryDate),
          scopePermissions: body.scopes.map(mapScopeFeToScopeBe),
          createAccountMode: body.createAccountMode || "AUTO_GENERATE",
          initialPassword: body.initialPassword || undefined,
        },
      }),
      transformResponse: (response: unknown) => {
        return getResponseResult<IAccountantInviteResult>(response);
      },
      invalidatesTags: [{ type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id: "LIST" }],
    }),

    revokeAccountantAccess: builder.mutation<
      void,
      IRevokeAccountantAccessRequest
    >({
      query: ({ id, reason }) => ({
        url: `/accountant/assignments/${id}/revoke`,
        method: HTTP_METHODS.POST,
        body: {
          reason: reason || "Chủ hộ chủ động thu hồi quyền truy cập",
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id: "LIST" },
        { type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id },
      ],
    }),

    extendAccountantAccess: builder.mutation<
      unknown,
      IExtendAccountantAccessRequest & {
        phoneNumber?: string;
        email?: string;
        scopes?: TAccessScope[];
      }
    >({
      query: ({ newExpiryDate, phoneNumber, email, scopes }) => ({
        url: "/accountant/invitations",
        method: HTTP_METHODS.POST,
        body: {
          accountantPhone: phoneNumber || "0988776655",
          accountantEmail: email || undefined,
          accessDurationDays: calculateDaysUntil(newExpiryDate),
          scopePermissions: (scopes || [ACCESS_SCOPES.E_INVOICES]).map(mapScopeFeToScopeBe),
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id: "LIST" },
        { type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id },
      ],
    }),

    resendAccountantInvitation: builder.mutation<
      unknown,
      IAccountantInvitation | string
    >({
      query: (arg) => {
        const phone = typeof arg === "string" ? arg : arg.phoneNumber;
        const email = typeof arg === "string" ? undefined : arg.email;
        const scopes = typeof arg === "string" ? [ACCESS_SCOPES.E_INVOICES] : arg.scopes;
        const duration = typeof arg === "string" ? 30 : calculateDaysUntil(arg.expiryDate);

        return {
          url: "/accountant/invitations",
          method: HTTP_METHODS.POST,
          body: {
            accountantPhone: phone,
            accountantEmail: email || undefined,
            accessDurationDays: duration,
            scopePermissions: scopes.map(mapScopeFeToScopeBe),
          },
        };
      },
      invalidatesTags: [{ type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id: "LIST" }],
    }),

    getAuthorizedHouseholds: builder.query<IAuthorizedHousehold[], void>({
      query: () => ({
        url: "/accountant/assigned-households",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IAuthorizedHousehold[] => {
        const list = getResponseResult<IAssignedHouseholdResponse[]>(response);
        if (!Array.isArray(list)) return [];
        return list.map((h) => ({
          id: h.householdId,
          name: h.householdName,
          taxCode: h.householdTaxCode,
          address: h.address || "",
          representativeName: h.representativeName || "",
          scopes: (h.scopePermissions || []).map(mapScopeBeToScopeFe),
          expiryDate: h.accessExpiresAt ? h.accessExpiresAt.substring(0, 10) : "",
          isCurrent: Boolean(h.isCurrentActive),
        }));
      },
      providesTags: [{ type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id: "HOUSEHOLDS" }],
    }),

    switchHousehold: builder.mutation<unknown, string>({
      query: (householdId) => ({
        url: `/accountant/switch-household/${householdId}`,
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.ACCOUNTANT_INVITATION, id: "HOUSEHOLDS" },
        { type: API_TAG_TYPES.ORDER, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.REPORT, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetAccountantInvitationsQuery,
  useInviteAccountantMutation,
  useRevokeAccountantAccessMutation,
  useExtendAccountantAccessMutation,
  useResendAccountantInvitationMutation,
  useGetAuthorizedHouseholdsQuery,
  useSwitchHouseholdMutation,
} = accountantInvitationApi;
