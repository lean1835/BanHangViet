import React, { useState, useMemo } from "react";
import {
  UserPlus,
  Search,
  Clock,
  UserX,
  Send,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  ACCESS_SCOPE_LABELS,
  INVITATION_STATUS,
  INVITATION_STATUS_LABELS,
  type IAccountantInvitation,
  type TInvitationStatus,
} from "../types/IAccountantInvitation";
import {
  useGetAccountantInvitationsQuery,
  useInviteAccountantMutation,
  useRevokeAccountantAccessMutation,
  useExtendAccountantAccessMutation,
  useResendAccountantInvitationMutation,
} from "../services/accountantInvitationApi";
import { InviteAccountantModal } from "./InviteAccountantModal";
import { RevokeAccountantModal } from "./RevokeAccountantModal";
import { ExtendAccountantModal } from "./ExtendAccountantModal";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { useNotification } from "@/hooks/useNotification";

interface AccountantInvitationListProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
}

export const AccountantInvitationList: React.FC<AccountantInvitationListProps> = ({
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  statusFilter: propStatusFilter,
  setStatusFilter: propSetStatusFilter,
}) => {
  const { showSuccess, showError } = useNotification();
  const { data: invitations = [], isLoading, refetch } =
    useGetAccountantInvitationsQuery();

  const [inviteAccountant, { isLoading: isInviting }] =
    useInviteAccountantMutation();
  const [revokeAccess, { isLoading: isRevoking }] =
    useRevokeAccountantAccessMutation();
  const [extendAccess, { isLoading: isExtending }] =
    useExtendAccountantAccessMutation();
  const [resendInvite, { isLoading: isResending }] =
    useResendAccountantInvitationMutation();

  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalStatusFilter, setInternalStatusFilter] = useState<string>("ALL");

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : internalSearchQuery;
  const setSearchQuery = propSetSearchQuery || setInternalSearchQuery;
  const statusFilter = propStatusFilter !== undefined ? propStatusFilter : internalStatusFilter;
  const setStatusFilter = propSetStatusFilter || setInternalStatusFilter;

  // Modal states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [itemToRevoke, setItemToRevoke] = useState<IAccountantInvitation | null>(
    null,
  );
  const [itemToExtend, setItemToExtend] = useState<IAccountantInvitation | null>(
    null,
  );

  const filteredInvitations = useMemo(() => {
    return invitations.filter((item) => {
      const matchQuery =
        !searchQuery.trim() ||
        item.accountantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phoneNumber.includes(searchQuery) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [invitations, searchQuery, statusFilter]);

  // Pagination state (8 records/page)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  React.useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, invitations.length]);

  const paginatedInvitations = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredInvitations.slice(start, start + PAGE_SIZE);
  }, [filteredInvitations, page]);

  const handleInviteSubmit = async (data: any) => {
    try {
      const result = await inviteAccountant(data).unwrap();
      showSuccess(`Đã gửi lời mời tới kế toán ${data.accountantName}`);
      refetch();
      return result;
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        (typeof err?.data === "string" ? err.data : null) ||
        err?.message ||
        "Gửi lời mời thất bại";
      showError(msg);
      throw err;
    }
  };

  const handleRevokeConfirm = async (id: string, reason: string) => {
    try {
      await revokeAccess({ id, reason }).unwrap();
      showSuccess("Đã thu hồi quyền truy cập của kế toán viên thành công");
      refetch();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        (typeof err?.data === "string" ? err.data : null) ||
        err?.message ||
        "Thu hồi quyền thất bại";
      showError(msg);
      throw err;
    }
  };

  const handleExtendConfirm = async (id: string, newExpiryDate: string) => {
    try {
      await extendAccess({
        id,
        newExpiryDate,
        phoneNumber: itemToExtend?.phoneNumber,
        email: itemToExtend?.email,
        scopes: itemToExtend?.scopes,
      }).unwrap();
      showSuccess("Gia hạn quyền truy cập thành công");
      refetch();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        (typeof err?.data === "string" ? err.data : null) ||
        err?.message ||
        "Gia hạn quyền thất bại";
      showError(msg);
      throw err;
    }
  };

  const handleResend = async (item: IAccountantInvitation) => {
    try {
      await resendInvite(item).unwrap();
      showSuccess(`Đã gửi lại lời mời tới ${item.accountantName}`);
      refetch();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        (typeof err?.data === "string" ? err.data : null) ||
        err?.message ||
        "Gửi lại lời mời thất bại";
      showError(msg);
    }
  };

  const getStatusBadge = (status: TInvitationStatus) => {
    switch (status) {
      case INVITATION_STATUS.ACTIVE:
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {INVITATION_STATUS_LABELS[status]}
          </span>
        );
      case INVITATION_STATUS.PENDING:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            {INVITATION_STATUS_LABELS[status]}
          </span>
        );
      case INVITATION_STATUS.REVOKED:
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {INVITATION_STATUS_LABELS[status]}
          </span>
        );
      case INVITATION_STATUS.EXPIRED:
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
            {INVITATION_STATUS_LABELS[status]}
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[520px] w-full animate-auth-fade-in">
      {/* Top Header Controls */}
      {propSearchQuery !== undefined ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-slate-800 text-sm">
              Danh sách kế toán thuê ngoài
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {filteredInvitations.length} kế toán
            </span>
          </div>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex h-11 lg:h-9 items-center gap-1.5 px-4 bg-kv-blue-primary hover:bg-kv-blue-dark text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Mời kế toán mới</span>
          </button>
        </div>
      ) : (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 mb-4 rounded-xl">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tìm theo tên, SĐT hoặc email kế toán..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-kv-blue-primary focus:ring-1 focus:ring-blue-100 outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
              {[
                { key: "ALL", label: "Tất cả" },
                { key: INVITATION_STATUS.ACTIVE, label: "Đang hoạt động" },
                { key: INVITATION_STATUS.PENDING, label: "Chờ xác nhận" },
                { key: INVITATION_STATUS.REVOKED, label: "Đã thu hồi" },
                { key: INVITATION_STATUS.EXPIRED, label: "Hết hạn" },
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
          </div>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-kv-blue-primary hover:bg-kv-blue-dark text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Mời kế toán mới</span>
          </button>
        </div>
      )}

      {/* Table Data */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <span className="h-6 w-6 rounded-full border-2 border-kv-blue-primary border-t-transparent animate-spin" />
            <span>Đang tải danh sách kế toán thuê ngoài...</span>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-slate-100 text-slate-400">
              <FileSpreadsheet size={32} />
            </div>
            <div className="font-bold text-slate-700 text-sm">
              {searchQuery || statusFilter !== "ALL"
                ? "Không tìm thấy kế toán phù hợp với bộ lọc"
                : "Chưa có kế toán thuê ngoài nào được mời"}
            </div>
            <p className="text-slate-500 max-w-sm">
              Ủy quyền cho kế toán thuê ngoài giúp đối soát hóa đơn điện tử và kê khai thuế mà vẫn kiểm soát được bảo mật dữ liệu.
            </p>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="mt-1 px-4 py-2 bg-kv-blue-light text-kv-blue-primary rounded-xl font-bold hover:bg-blue-100 transition-colors"
            >
              Mời kế toán thuê ngoài ngay
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold z-10">
              <tr>
                <th className="p-3">Kế toán viên</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Phạm vi dữ liệu</th>
                <th className="p-3">Thời hạn truy cập</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedInvitations.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      {item.accountantName}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.email}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800">
                    {item.phoneNumber}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {item.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-100"
                        >
                          {ACCESS_SCOPE_LABELS[scope]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{item.expiryDate}</span>
                    </div>
                    {item.revokedAt && (
                      <div className="text-[10px] text-rose-500 italic mt-0.5">
                        Thu hồi: {item.revokedAt}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === INVITATION_STATUS.ACTIVE && (
                        <>
                          <button
                            onClick={() => setItemToExtend(item)}
                            className="p-1.5 text-slate-600 hover:text-kv-blue-primary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Gia hạn thời hạn truy cập"
                          >
                            <Clock size={15} />
                          </button>
                          <button
                            onClick={() => setItemToRevoke(item)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Thu hồi quyền truy cập"
                          >
                            <UserX size={15} />
                          </button>
                        </>
                      )}

                      {item.status === INVITATION_STATUS.PENDING && (
                        <>
                          <button
                            onClick={() => handleResend(item)}
                            disabled={isResending}
                            className="px-2 py-1 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Gửi lại mã mời"
                          >
                            <Send size={12} />
                            <span>Gửi lại</span>
                          </button>
                          <button
                            onClick={() => setItemToRevoke(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hủy lời mời"
                          >
                            <UserX size={15} />
                          </button>
                        </>
                      )}

                      {(item.status === INVITATION_STATUS.EXPIRED ||
                        item.status === INVITATION_STATUS.REVOKED) && (
                        <button
                          onClick={() => setItemToExtend(item)}
                          className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-kv-blue-primary rounded-md font-bold transition-colors cursor-pointer"
                        >
                          Tái cấp quyền
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredInvitations.length > 0 && (
        <TablePaginationFooter
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalElements={filteredInvitations.length}
          onPageChange={setPage}
          recordUnit="kế toán"
        />
      )}

      {/* Info notice bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertCircle size={14} className="text-kv-blue-primary" />
          <span>
            Kế toán được mời chỉ xem được dữ liệu trong phạm vi ủy quyền và không thể thêm/xóa nhân viên của hộ.
          </span>
        </div>
        <span className="font-semibold text-slate-600">
          Tổng cộng: {filteredInvitations.length} kế toán
        </span>
      </div>

      {/* Modals */}
      <InviteAccountantModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={handleInviteSubmit}
        isLoading={isInviting}
      />

      <RevokeAccountantModal
        isOpen={Boolean(itemToRevoke)}
        onClose={() => setItemToRevoke(null)}
        invitation={itemToRevoke}
        onConfirm={handleRevokeConfirm}
        isLoading={isRevoking}
      />

      <ExtendAccountantModal
        isOpen={Boolean(itemToExtend)}
        onClose={() => setItemToExtend(null)}
        invitation={itemToExtend}
        onConfirm={handleExtendConfirm}
        isLoading={isExtending}
      />
    </div>
  );
};
