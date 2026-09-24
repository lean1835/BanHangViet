import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import {
  SUBSCRIPTION_PLAN_CODE,
  type IChangeSubscriptionRequest,
  type IHouseholdAdminItem,
  type ILockHouseholdRequest,
  type ISubscriptionPlan,
  type ISystemAuditLog,
  type ISystemIncidentAlert,
  type ISystemLogFilter,
  type IServicePackageItem,
  type ICreatePackagePayload,
  type IUpdatePackagePayload,
  type TPlatformHouseholdStatus,
  type TSubscriptionPlanCode,
  type TSystemLogCategory,
  type TSystemLogSeverity,
} from "../types/platformAdminTypes";
import { isRecord } from "@/utils/typeGuards";

const getResponseResult = <T>(response: unknown): T => {
  if (!isRecord(response)) {
    throw new Error("Phản hồi máy chủ không hợp lệ");
  }
  return response.result as T;
};

interface IPageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface IPlatformHouseholdSummaryResponse {
  id: string;
  taxCode: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  representativeName?: string;
  status: string;
  lockReason?: string;
  lockedAt?: string;
  userCount?: number;
  lastActiveAt?: string;
  currentPackageCode?: string;
  currentPackageName?: string;
  packageEndDate?: string;
  maxUsers?: number;
  maxInvoicesMonth?: number;
  invoiceCountMonth?: number;
  createdAt: string;
}

interface IServicePackageResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  maxUsers?: number;
  maxPosPoints?: number;
  maxInvoicesPerMonth?: number;
  dataRetentionDays?: number;
  price?: number;
  isActive?: boolean;
}

interface IPlatformSystemLogResponse {
  id: string;
  eventType: string;
  severity: string;
  householdId?: string;
  householdName?: string;
  householdTaxCode?: string;
  errorCode?: string;
  technicalMessage?: string;
  technicalMetadata?: string;
  isWidespreadIncident?: boolean;
  incidentId?: string;
  createdAt: string;
}

interface IPlatformIncidentResponse {
  id: string;
  title: string;
  eventType: string;
  severity: string;
  status: string;
  affectedHouseholdsCount: number;
  errorThresholdCount: number;
  description?: string;
  startedAt: string;
  resolvedAt?: string;
}

export const platformAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminHouseholds: builder.query<IHouseholdAdminItem[], void>({
      query: () => ({
        url: "/platform/households",
        method: HTTP_METHODS.GET,
        params: { page: 1, size: 100 },
      }),
      transformResponse: (response: unknown): IHouseholdAdminItem[] => {
        const result = getResponseResult<IPageResponse<IPlatformHouseholdSummaryResponse>>(response);
        const list = result?.content || [];
        return list.map((h) => {
          const hasPackage = Boolean(h.currentPackageName && h.currentPackageName !== "Chưa gán gói");
          let code: TSubscriptionPlanCode = SUBSCRIPTION_PLAN_CODE.NONE;
          const pkgCode = (h.currentPackageCode || "").toUpperCase();
          const pkgName = (h.currentPackageName || "").toUpperCase();

          if (!hasPackage) {
            code = SUBSCRIPTION_PLAN_CODE.NONE;
          } else if (pkgCode.includes("STARTER") || pkgCode.includes("BASIC") || pkgName.includes("KHỞI") || pkgName.includes("CƠ BẢN")) {
            code = SUBSCRIPTION_PLAN_CODE.STARTER;
          } else if (pkgCode.includes("PREMIUM") || pkgCode.includes("PRO") || pkgName.includes("NÂNG CAO")) {
            code = SUBSCRIPTION_PLAN_CODE.PREMIUM;
          } else if (pkgCode.includes("ENTERPRISE") || pkgName.includes("DOANH NGHIỆP")) {
            code = SUBSCRIPTION_PLAN_CODE.ENTERPRISE;
          } else {
            code = SUBSCRIPTION_PLAN_CODE.STANDARD;
          }
          let planExpiry = "Chưa gán gói";
          let isExpired = false;

          if (hasPackage && h.packageEndDate) {
            const parts = h.packageEndDate.split("-");
            if (parts.length === 3) {
              planExpiry = `${parts[2]}/${parts[1]}/${parts[0]}`;
            } else {
              planExpiry = h.packageEndDate;
            }
            const todayStr = new Date().toISOString().split("T")[0];
            isExpired = h.packageEndDate < todayStr;
          } else if (hasPackage) {
            planExpiry = "Không giới hạn";
          }

          return {
            id: h.id,
            name: h.name,
            taxCode: h.taxCode,
            representative: h.representativeName || "Chủ hộ",
            phoneNumber: h.phoneNumber || "",
            address: h.address || "",
            status: (h.status || "ACTIVE") as TPlatformHouseholdStatus,
            lockReason: h.lockReason || undefined,
            lockedAt: h.lockedAt ? h.lockedAt.substring(0, 19).replace("T", " ") : undefined,
            planCode: code,
            planName: h.currentPackageName || "Chưa gán gói",
            planExpiry,
            isExpired,
            userCount: Number(h.userCount || 0),
            maxUsers: h.maxUsers || (code === "ENTERPRISE" ? 999 : code === "PREMIUM" ? 50 : code === "STANDARD" ? 10 : 3),
            invoiceCountMonth: Number(h.invoiceCountMonth || 0),
            maxInvoicesMonth: h.maxInvoicesMonth || (code === "ENTERPRISE" ? 99999 : code === "PREMIUM" ? 5000 : code === "STANDARD" ? 1000 : 300),
            lastActiveAt: h.lastActiveAt ? h.lastActiveAt.substring(0, 19).replace("T", " ") : "Chưa hoạt động",
          };
        });
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.PLATFORM_HOUSEHOLD,
                id,
              })),
              { type: API_TAG_TYPES.PLATFORM_HOUSEHOLD, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.PLATFORM_HOUSEHOLD, id: "LIST" }],
    }),

    lockHousehold: builder.mutation<unknown, ILockHouseholdRequest>({
      query: (req) => ({
        url: `/platform/households/${req.id}/lock`,
        method: HTTP_METHODS.POST,
        body: { reason: req.reason },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: API_TAG_TYPES.PLATFORM_HOUSEHOLD, id: "LIST" },
        { type: API_TAG_TYPES.PLATFORM_HOUSEHOLD, id },
        { type: API_TAG_TYPES.PLATFORM_LOG, id: "LIST" },
      ],
    }),

    unlockHousehold: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/platform/households/${id}/unlock`,
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: API_TAG_TYPES.PLATFORM_HOUSEHOLD, id: "LIST" },
        { type: API_TAG_TYPES.PLATFORM_HOUSEHOLD, id },
        { type: API_TAG_TYPES.PLATFORM_LOG, id: "LIST" },
      ],
    }),

    getSubscriptionPlans: builder.query<ISubscriptionPlan[], void>({
      query: () => ({
        url: "/platform/packages",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ISubscriptionPlan[] => {
        const list = getResponseResult<IServicePackageResponse[]>(response);
        if (!Array.isArray(list)) return [];
        return list
          .filter((pkg) => pkg.isActive !== false)
          .map((pkg) => {
            let planCode: TSubscriptionPlanCode = "STANDARD";
            const c = pkg.code.toUpperCase();
            if (c.includes("STARTER") || c.includes("BASIC") || c.includes("KHỞI")) planCode = "STARTER";
            else if (c.includes("PREMIUM") || c.includes("PRO") || c.includes("NÂNG")) planCode = "PREMIUM";
            else if (c.includes("ENTERPRISE") || c.includes("DOANH")) planCode = "ENTERPRISE";
            else planCode = "STANDARD";

            return {
              id: pkg.id,
              code: planCode,
              name: pkg.name,
              maxUsers: pkg.maxUsers || 5,
              maxPos: pkg.maxPosPoints || 2,
              maxMonthlyInvoices: pkg.maxInvoicesPerMonth || 1000,
              dataRetentionMonths: Math.round((pkg.dataRetentionDays || 365) / 30),
              pricePerMonth: Number(pkg.price || 0),
              description: pkg.description || "",
              isPopular: planCode === "STANDARD",
            };
          });
      },
      providesTags: [{ type: API_TAG_TYPES.SUBSCRIPTION_PLAN, id: "LIST" }],
    }),

    changeHouseholdSubscription: builder.mutation<
      unknown,
      IChangeSubscriptionRequest
    >({
      async queryFn(req, _queryApi, _extraOptions, fetchWithBQ) {
        let packageId = req.packageId;
        if (!packageId) {
          const pkgsRes = await fetchWithBQ({ url: "/platform/packages", method: HTTP_METHODS.GET });
          if (pkgsRes.data) {
            const pkgs = getResponseResult<IServicePackageResponse[]>(pkgsRes.data);
            const activePkgs = pkgs.filter((p) => p.isActive !== false);
            const found = activePkgs.find(
              (p) =>
                p.code.toUpperCase().includes(req.planCode) ||
                (req.planCode === "STARTER" && p.code.toUpperCase().includes("BASIC"))
            );
            if (found) packageId = found.id;
            else if (activePkgs.length > 0) packageId = activePkgs[0].id;
          }
        }

        const today = new Date().toISOString().split("T")[0];
        const assignRes = await fetchWithBQ({
          url: `/platform/households/${req.householdId}/subscriptions`,
          method: HTTP_METHODS.POST,
          body: {
            packageId: packageId || "pkg-002",
            startDate: req.startDate || today,
            endDate: req.expiryDate,
          },
        });

        if (assignRes.error) {
          return { error: assignRes.error };
        }
        return { data: assignRes.data };
      },
      invalidatesTags: (_res, _err, { householdId }) => [
        { type: API_TAG_TYPES.PLATFORM_HOUSEHOLD, id: "LIST" },
        { type: API_TAG_TYPES.PLATFORM_HOUSEHOLD, id: householdId },
        { type: API_TAG_TYPES.PLATFORM_LOG, id: "LIST" },
      ],
    }),

    getPlatformSystemLogs: builder.query<
      ISystemAuditLog[],
      ISystemLogFilter | void
    >({
      query: (filter) => {
        const params: Record<string, string | number> = { page: 1, size: 50 };
        if (filter) {
          if (filter.severity && filter.severity !== "ALL") params.severity = filter.severity;
          if (filter.householdId && filter.householdId !== "ALL") params.householdId = filter.householdId;
          if (filter.category && filter.category !== "ALL") params.eventType = filter.category;
        }
        return {
          url: "/platform/system-logs",
          method: HTTP_METHODS.GET,
          params,
        };
      },
      transformResponse: (response: unknown, _meta, filter): ISystemAuditLog[] => {
        const pageRes = getResponseResult<IPageResponse<IPlatformSystemLogResponse>>(response);
        const content = pageRes?.content || [];
        let mapped: ISystemAuditLog[] = content.map((l) => ({
          id: l.id,
          timestamp: l.createdAt ? l.createdAt.substring(0, 19).replace("T", " ") : "",
          severity: (l.severity || "INFO") as TSystemLogSeverity,
          category: (l.eventType || "SYSTEM_ERROR") as TSystemLogCategory,
          householdId: l.householdId || undefined,
          householdName: l.householdName || (l.householdTaxCode ? `Hộ MST ${l.householdTaxCode}` : undefined),
          taxCode: l.householdTaxCode || undefined,
          action: l.technicalMessage || l.eventType || "Hệ thống ghi nhận sự kiện",
          errorCode: l.errorCode || undefined,
          latencyMs: undefined,
          ipAddress: "Nội bộ nền tảng",
          technicalDetails: l.technicalMetadata || l.technicalMessage || "",
        }));

        if (filter?.searchQuery && filter.searchQuery.trim()) {
          const q = filter.searchQuery.toLowerCase();
          mapped = mapped.filter(
            (item) =>
              item.action.toLowerCase().includes(q) ||
              (item.errorCode && item.errorCode.toLowerCase().includes(q)) ||
              (item.householdName && item.householdName.toLowerCase().includes(q)) ||
              (item.taxCode && item.taxCode.includes(q))
          );
        }

        return mapped;
      },
      providesTags: [{ type: API_TAG_TYPES.PLATFORM_LOG, id: "LIST" }],
    }),

    getActiveIncident: builder.query<ISystemIncidentAlert | null, void>({
      query: () => ({
        url: "/platform/incidents",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ISystemIncidentAlert | null => {
        const list = getResponseResult<IPlatformIncidentResponse[]>(response);
        if (!Array.isArray(list)) return null;
        const activeInc = list.find((inc) => inc.status !== "RESOLVED");
        if (!activeInc) return null;
        return {
          id: activeInc.id,
          title: activeInc.title,
          description: activeInc.description || "",
          detectedAt: activeInc.startedAt ? activeInc.startedAt.substring(0, 19).replace("T", " ") : "",
          severity: (activeInc.severity || "CRITICAL") as TSystemLogSeverity,
          impactedHouseholdsCount: activeInc.affectedHouseholdsCount || 0,
          active: true,
          suggestion: "Đề xuất: Kiểm tra hàng đợi hệ thống hoặc đường truyền tới đối tác.",
        };
      },
      providesTags: [{ type: API_TAG_TYPES.PLATFORM_LOG, id: "INCIDENT" }],
    }),

    dismissIncident: builder.mutation<void, string | void>({
      async queryFn(incidentId, _queryApi, _extraOptions, fetchWithBQ) {
        let id = incidentId;
        if (!id) {
          const incRes = await fetchWithBQ({ url: "/platform/incidents", method: HTTP_METHODS.GET });
          if (incRes.data) {
            const list = getResponseResult<IPlatformIncidentResponse[]>(incRes.data);
            const active = list.find((i) => i.status !== "RESOLVED");
            if (active) id = active.id;
          }
        }
        if (id) {
          await fetchWithBQ({
            url: `/platform/incidents/${id}/resolve`,
            method: HTTP_METHODS.POST,
          });
        }
        return { data: undefined };
      },
      invalidatesTags: [{ type: API_TAG_TYPES.PLATFORM_LOG, id: "INCIDENT" }],
    }),

    getServicePackages: builder.query<IServicePackageItem[], void>({
      query: () => ({
        url: "/platform/packages",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IServicePackageItem[] => {
        const list = getResponseResult<IServicePackageResponse[]>(response);
        if (!Array.isArray(list)) return [];
        return list.map((pkg) => ({
          id: pkg.id,
          code: pkg.code,
          name: pkg.name,
          description: pkg.description || "",
          maxUsers: pkg.maxUsers ?? 1,
          maxPosPoints: pkg.maxPosPoints ?? 1,
          maxInvoicesPerMonth: pkg.maxInvoicesPerMonth ?? 100,
          dataRetentionDays: pkg.dataRetentionDays ?? 365,
          price: Number(pkg.price ?? 0),
          isActive: pkg.isActive ?? true,
        }));
      },
      providesTags: [{ type: API_TAG_TYPES.SUBSCRIPTION_PLAN, id: "LIST" }],
    }),

    createServicePackage: builder.mutation<IServicePackageItem, ICreatePackagePayload>({
      query: (body) => ({
        url: "/platform/packages",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown): IServicePackageItem => {
        const pkg = getResponseResult<IServicePackageResponse>(response);
        return {
          id: pkg.id,
          code: pkg.code,
          name: pkg.name,
          description: pkg.description || "",
          maxUsers: pkg.maxUsers ?? 1,
          maxPosPoints: pkg.maxPosPoints ?? 1,
          maxInvoicesPerMonth: pkg.maxInvoicesPerMonth ?? 100,
          dataRetentionDays: pkg.dataRetentionDays ?? 365,
          price: Number(pkg.price ?? 0),
          isActive: pkg.isActive ?? true,
        };
      },
      invalidatesTags: [{ type: API_TAG_TYPES.SUBSCRIPTION_PLAN, id: "LIST" }],
    }),

    updateServicePackage: builder.mutation<IServicePackageItem, IUpdatePackagePayload>({
      query: ({ id, ...body }) => ({
        url: `/platform/packages/${id}`,
        method: HTTP_METHODS.PUT,
        body,
      }),
      transformResponse: (response: unknown): IServicePackageItem => {
        const pkg = getResponseResult<IServicePackageResponse>(response);
        return {
          id: pkg.id,
          code: pkg.code,
          name: pkg.name,
          description: pkg.description || "",
          maxUsers: pkg.maxUsers ?? 1,
          maxPosPoints: pkg.maxPosPoints ?? 1,
          maxInvoicesPerMonth: pkg.maxInvoicesPerMonth ?? 100,
          dataRetentionDays: pkg.dataRetentionDays ?? 365,
          price: Number(pkg.price ?? 0),
          isActive: pkg.isActive ?? true,
        };
      },
      invalidatesTags: [{ type: API_TAG_TYPES.SUBSCRIPTION_PLAN, id: "LIST" }],
    }),

    deleteServicePackage: builder.mutation<void, string>({
      query: (id) => ({
        url: `/platform/packages/${id}`,
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.SUBSCRIPTION_PLAN, id: "LIST" }],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetAdminHouseholdsQuery,
  useLockHouseholdMutation,
  useUnlockHouseholdMutation,
  useGetSubscriptionPlansQuery,
  useChangeHouseholdSubscriptionMutation,
  useGetPlatformSystemLogsQuery,
  useGetActiveIncidentQuery,
  useDismissIncidentMutation,
  useGetServicePackagesQuery,
  useCreateServicePackageMutation,
  useUpdateServicePackageMutation,
  useDeleteServicePackageMutation,
} = platformAdminApi;

