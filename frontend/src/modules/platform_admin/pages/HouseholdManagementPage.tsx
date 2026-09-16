import React, { useState, useMemo } from "react";
import {
  Search,
  Lock,
  Unlock,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  PLATFORM_HOUSEHOLD_STATUS,
  SUBSCRIPTION_PLAN_CODE,
  type IChangeSubscriptionRequest,
  type IHouseholdAdminItem,
} from "../types/platformAdminTypes";
import {
  useGetAdminHouseholdsQuery,
  useGetSubscriptionPlansQuery,
  useLockHouseholdMutation,
  useUnlockHouseholdMutation,
  useChangeHouseholdSubscriptionMutation,
} from "../services/platformAdminApi";
import { LockHouseholdModal } from "../components/LockHouseholdModal";
import { UnlockHouseholdModal } from "../components/UnlockHouseholdModal";
import { ChangePlanModal } from "../components/ChangePlanModal";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { formatNumber } from "@/utils/formatCurrency";
import { useNotification } from "@/hooks/useNotification";

export const HouseholdManagementPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const {
    data: households = [],
    isLoading,
    refetch,
  } = useGetAdminHouseholdsQuery();
  const { data: plans = [] } = useGetSubscriptionPlansQuery();

  const [lockHousehold, { isLoading: isLocking }] = useLockHouseholdMutation();
  const [unlockHousehold, { isLoading: isUnlocking }] =
    useUnlockHouseholdMutation();
  const [changePlan, { isLoading: isChangingPlan }] =
    useChangeHouseholdSubscriptionMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  // Modal states
  const [itemToLock, setItemToLock] = useState<IHouseholdAdminItem | null>(null);
  const [itemToUnlock, setItemToUnlock] =
    useState<IHouseholdAdminItem | null>(null);
  const [itemToChangePlan, setItemToChangePlan] =
    useState<IHouseholdAdminItem | null>(null);

  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      const matchSearch =
        !searchQuery.trim() ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.taxCode.includes(searchQuery) ||
        h.representative.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" || h.status === statusFilter;

      const matchPlan =
        planFilter === "ALL" || h.planCode === planFilter;

      return matchSearch && matchStatus && matchPlan;
    });
  }, [households, searchQuery, statusFilter, planFilter]);

  // Pagination state (8 records/page)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  React.useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, planFilter, households.length]);

  const paginatedHouseholds = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredHouseholds.slice(start, start + PAGE_SIZE);
  }, [filteredHouseholds, page]);

  const handleLockConfirm = async (id: string, reason: string) => {
    try {
      await lockHousehold({ id, reason }).unwrap();
      showSuccess("Đã khóa tài khoản hộ kinh doanh thành công");
      refetch();
    } catch (err: any) {
      showError(err?.data || "Khóa hộ thất bại");
      throw err;
    }
  };

  const handleUnlockConfirm = async (id: string) => {
    try {
      await unlockHousehold(id).unwrap();
      showSuccess("Đã mở khóa tài khoản hộ kinh doanh thành công");
      refetch();
    } catch (err: any) {
      showError(err?.data || "Mở khóa hộ thất bại");
      throw err;
    }
  };

  const handleChangePlanConfirm = async (req: IChangeSubscriptionRequest) => {
    try {
      await changePlan(req).unwrap();
      showSuccess("Đã cập nhật gói dịch vụ và hạn mức thành công");
      refetch();
    } catch (err: any) {
      showError(err?.data || "Cập nhật gói thất bại");
      throw err;
    }
  };

  const getPlanBadge = (code: string, label: string) => {
    if (!label || label === "Chưa gán gói" || code === SUBSCRIPTION_PLAN_CODE.NONE) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-dashed border-slate-300 px-2 py-0.5 rounded text-[10px] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Chưa gán gói
        </span>
      );
    }

    switch (code) {
      case SUBSCRIPTION_PLAN_CODE.ENTERPRISE:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {label}
          </span>
        );
      case SUBSCRIPTION_PLAN_CODE.PREMIUM:
        return (
          <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            {label}
          </span>
        );
      case SUBSCRIPTION_PLAN_CODE.STANDARD:
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {label}
          </span>
        );
      case SUBSCRIPTION_PLAN_CODE.STARTER:
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {label}
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">
            Quản Lý Hộ Kinh Doanh & Hạn Mức Gói
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Theo dõi vòng đời tài khoản, điều phối gói dịch vụ và quản lý tài nguyên toàn nền tảng
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo tên hộ, MST, người đại diện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden font-medium"
            />
          </div>

          {/* Status Segment */}
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
            {[
              { key: "ALL", label: "Tất cả" },
              { key: PLATFORM_HOUSEHOLD_STATUS.ACTIVE, label: "Đang hoạt động" },
              { key: PLATFORM_HOUSEHOLD_STATUS.LOCKED, label: "Bị khóa" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? "bg-white text-kv-blue-primary shadow-xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Plan filter dropdown */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">Tất cả gói dịch vụ</option>
            <option value={SUBSCRIPTION_PLAN_CODE.NONE}>Chưa gán gói</option>
            <option value={SUBSCRIPTION_PLAN_CODE.STARTER}>Gói Cơ Bản</option>
            <option value={SUBSCRIPTION_PLAN_CODE.STANDARD}>Gói Tiêu Chuẩn</option>
            <option value={SUBSCRIPTION_PLAN_CODE.PREMIUM}>Gói Nâng Cao</option>
            <option value={SUBSCRIPTION_PLAN_CODE.ENTERPRISE}>Gói Doanh Nghiệp</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Hiển thị: <strong>{filteredHouseholds.length}</strong> / {households.length} hộ
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <th className="p-3">Hộ kinh doanh</th>
              <th className="p-3">Mã số thuế</th>
              <th className="p-3">Gói dịch vụ</th>
              <th className="p-3">Tài khoản (Users)</th>
              <th className="p-3">Hóa đơn tháng này</th>
              <th className="p-3">Hạn sử dụng</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <span className="inline-block h-5 w-5 rounded-full border-2 border-kv-blue-primary border-t-transparent animate-spin mr-2" />
                  Đang tải dữ liệu hộ kinh doanh...
                </td>
              </tr>
            ) : filteredHouseholds.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Không tìm thấy hộ kinh doanh nào phù hợp.
                </td>
              </tr>
            ) : (
              paginatedHouseholds.map((household) => {
                const userRatio = Math.min(
                  100,
                  Math.round((household.userCount / household.maxUsers) * 100),
                );
                const isOverQuota =
                  household.invoiceCountMonth > household.maxInvoicesMonth;
                const invoiceRatio = Math.min(
                  100,
                  Math.round(
                    (household.invoiceCountMonth / household.maxInvoicesMonth) *
                      100,
                  ),
                );

                return (
                  <tr
                    key={household.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Household Name */}
                    <td className="p-3">
                      <div className="font-bold text-slate-900">
                        {household.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>Đại diện: {household.representative}</span>
                        <span>•</span>
                        <span>{household.phoneNumber}</span>
                      </div>
                    </td>

                    {/* Tax Code */}
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {household.taxCode}
                    </td>

                    {/* Plan */}
                    <td className="p-3">
                      {getPlanBadge(household.planCode, household.planName)}
                    </td>

                    {/* User quota */}
                    <td className="p-3">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                        <span>{formatNumber(household.userCount)} / {formatNumber(household.maxUsers)}</span>
                        <span className="text-slate-400">{userRatio}%</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            userRatio >= 100
                              ? "bg-amber-500"
                              : "bg-kv-blue-primary"
                          }`}
                          style={{ width: `${userRatio}%` }}
                        />
                      </div>
                    </td>

                    {/* Monthly Invoices quota */}
                    <td className="p-3">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                        <span>
                          {formatNumber(household.invoiceCountMonth)} /{" "}
                          {formatNumber(household.maxInvoicesMonth)}
                        </span>
                        {isOverQuota && (
                          <span className="text-amber-600 font-bold">
                            +{formatNumber(household.invoiceCountMonth - household.maxInvoicesMonth)}
                          </span>
                        )}
                      </div>
                      <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isOverQuota
                              ? "bg-amber-500"
                              : invoiceRatio >= 80
                              ? "bg-blue-400"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${invoiceRatio}%` }}
                        />
                      </div>
                      {isOverQuota && (
                        <div className="text-[9px] text-amber-700 font-extrabold mt-0.5">
                          Vượt hạn mức (GAP 48 cho phép xuất)
                        </div>
                      )}
                    </td>

                    {/* Expiry */}
                    <td className="p-3">
                      <span
                        className={
                          household.isExpired
                            ? "text-rose-600 font-bold"
                            : "font-semibold text-slate-700"
                        }
                      >
                        {household.planExpiry}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      {household.status === PLATFORM_HOUSEHOLD_STATUS.ACTIVE ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold" title={household.lockReason}>
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Bị khóa
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Change Plan Button */}
                        <button
                          onClick={() => setItemToChangePlan(household)}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                          title="Đổi gói dịch vụ hoặc gia hạn"
                        >
                          <Package size={12} />
                          <span>Đổi gói</span>
                        </button>

                        {/* Lock / Unlock Toggle Button */}
                        {household.status === PLATFORM_HOUSEHOLD_STATUS.ACTIVE ? (
                          <button
                            onClick={() => setItemToLock(household)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Lock size={12} />
                            <span>Khóa</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setItemToUnlock(household)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Unlock size={12} />
                            <span>Mở khóa</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredHouseholds.length > 0 && (
        <TablePaginationFooter
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalElements={filteredHouseholds.length}
          onPageChange={setPage}
          recordUnit="hộ kinh doanh"
        />
      )}

      {/* Modals */}
      <LockHouseholdModal
        isOpen={Boolean(itemToLock)}
        onClose={() => setItemToLock(null)}
        household={itemToLock}
        onConfirm={handleLockConfirm}
        isLoading={isLocking}
      />

      <UnlockHouseholdModal
        isOpen={Boolean(itemToUnlock)}
        onClose={() => setItemToUnlock(null)}
        household={itemToUnlock}
        onConfirm={handleUnlockConfirm}
        isLoading={isUnlocking}
      />

      <ChangePlanModal
        isOpen={Boolean(itemToChangePlan)}
        onClose={() => setItemToChangePlan(null)}
        household={itemToChangePlan}
        plans={plans}
        onConfirm={handleChangePlanConfirm}
        isLoading={isChangingPlan}
      />
    </div>
  );
};

export default HouseholdManagementPage;
