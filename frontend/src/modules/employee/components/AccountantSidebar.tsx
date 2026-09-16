import React from "react";
import { Search } from "lucide-react";
import { INVITATION_STATUS } from "../types/IAccountantInvitation";

interface AccountantSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export const AccountantSidebar: React.FC<AccountantSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) => {
  const statusOptions = [
    { value: "ALL", label: "Tất cả" },
    { value: INVITATION_STATUS.ACTIVE, label: "Đang hoạt động" },
    { value: INVITATION_STATUS.PENDING, label: "Chờ xác nhận" },
    { value: INVITATION_STATUS.REVOKED, label: "Đã thu hồi" },
    { value: INVITATION_STATUS.EXPIRED, label: "Hết hạn" },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Title */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        Bộ lọc kế toán
      </div>

      {/* Tìm kiếm */}
      <div className="flex flex-col gap-1.5">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Tìm kiếm
        </span>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs font-semibold text-slate-700 transition-all focus:border-kv-blue-primary focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Trạng thái ủy quyền */}
      <div className="flex flex-col gap-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Trạng thái ủy quyền
        </span>
        <div className="flex flex-col gap-2.5 font-medium text-slate-700 text-xs">
          {statusOptions.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 transition-colors hover:text-kv-blue-primary lg:min-h-0"
            >
              <input
                type="radio"
                name="accountantStatusFilter"
                checked={statusFilter === option.value}
                onChange={() => setStatusFilter(option.value)}
                className="text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4 border-slate-300"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountantSidebar;
