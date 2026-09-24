import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  RefreshCw,
  Settings,
  CheckCircle2,
  Clock,
  Inbox,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useGetBadgeCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllAsReadMutation,
  useSyncRemindersMutation,
} from "../services/notificationApi";
import { USER_ROLES } from "@/constants/roles";
import { useAppSelector } from "@/hooks/useRedux";
import { useDebounce } from "@/hooks/useDebounce";
import type { IAppNotificationResponse } from "../types/IAppNotification";
import { NotificationSettingsModal } from "../components/NotificationSettingsModal";
import { resolveNotificationActionUrl } from "../utils/notificationRouteHelper";

export const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth?.user);
  const userRole =
    (typeof user?.role === "string"
      ? user.role
      : (user?.role as { code?: string; name?: string })?.code ||
        (user?.role as { code?: string; name?: string })?.name) ||
    user?.roleId ||
    USER_ROLES.OWNER;
  const isOwner = userRole === USER_ROLES.OWNER;

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedClosedStatus, setSelectedClosedStatus] = useState<string>("ALL");
  const [selectedReadStatus, setSelectedReadStatus] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Badge query
  const { data: badgeRes } = useGetBadgeCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const unclosedCount = badgeRes?.result?.unclosedCount ?? 0;
  const dangerCount = badgeRes?.result?.dangerCount ?? 0;
  const unreadCount = badgeRes?.result?.unreadCount ?? 0;

  // Notifications query params
  const queryParams = useMemo(() => {
    const params: {
      page: number;
      size: number;
      search?: string;
      severity?: string;
      isClosed?: boolean;
      isRead?: boolean;
    } = {
      page,
      size: pageSize,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    if (selectedSeverity !== "ALL") {
      params.severity = selectedSeverity;
    }
    if (selectedClosedStatus === "OPEN") {
      params.isClosed = false;
    } else if (selectedClosedStatus === "CLOSED") {
      params.isClosed = true;
    }
    if (selectedReadStatus === "UNREAD") {
      params.isRead = false;
    } else if (selectedReadStatus === "READ") {
      params.isRead = true;
    }

    return params;
  }, [page, pageSize, debouncedSearch, selectedSeverity, selectedClosedStatus, selectedReadStatus]);

  const { data: notifsRes, isLoading, isFetching } = useGetNotificationsQuery(
    queryParams,
    { pollingInterval: 30000 }
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [syncReminders, { isLoading: isSyncing }] = useSyncRemindersMutation();

  const notifications: IAppNotificationResponse[] = useMemo(
    () => notifsRes?.result?.content || [],
    [notifsRes?.result?.content]
  );
  const totalPages = notifsRes?.result?.totalPages ?? 1;
  const totalElements = notifsRes?.result?.totalElements ?? 0;

  const handleAction = async (notif: IAppNotificationResponse) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id).unwrap();
      } catch {
        // Ignored
      }
    }

    const target = resolveNotificationActionUrl(notif);
    navigate(target);
  };

  const handleManualSync = async () => {
    try {
      await syncReminders().unwrap();
    } catch {
      // Ignored
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch {
      // Ignored
    }
  };

  const formatTime = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case "E_INVOICE":
        return "Hóa đơn điện tử";
      case "TAX_FINANCE":
        return "Tài chính & Thuế";
      case "INVENTORY":
        return "Kho & Hàng hóa";
      case "SYSTEM":
        return "Hệ thống";
      default:
        return "Tác nghiệp";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      {/* Tiêu đề trang & các hành động chính */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Trung tâm thông báo
            </h1>
            <p className="text-xs text-slate-500">
              Theo dõi danh sách cảnh báo, thông báo hệ thống và hoạt động kinh doanh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-600" : "text-slate-500"}`}
            />
            <span>{isSyncing ? "Đang quét..." : "Quét lại việc"}</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || unreadCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
          >
            <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Đọc tất cả</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Cài đặt thông báo</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Thẻ chỉ số tổng quan (Summary Cards) - Tinh gọn, thanh thoát */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Tổng thông báo */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Tổng thông báo
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{totalElements}</span>
            <span className="text-[11px] text-slate-400">bản ghi</span>
          </div>
        </div>

        {/* Card 2: Việc chờ xử lý */}
        <div
          onClick={() => {
            setSelectedClosedStatus("OPEN");
            setPage(0);
          }}
          className={`rounded-xl border p-3 sm:p-3.5 shadow-2xs cursor-pointer transition-all ${
            selectedClosedStatus === "OPEN"
              ? "border-amber-400 bg-amber-50/70 ring-1 ring-amber-300"
              : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
              Cần xử lý ngay
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-amber-900">{unclosedCount}</span>
            <span className="text-[11px] text-amber-700 font-medium">việc chờ</span>
          </div>
        </div>

        {/* Card 3: Khẩn cấp */}
        <div
          onClick={() => {
            setSelectedSeverity("DANGER");
            setPage(0);
          }}
          className={`rounded-xl border p-3 sm:p-3.5 shadow-2xs cursor-pointer transition-all ${
            selectedSeverity === "DANGER"
              ? "border-rose-400 bg-rose-50/70 ring-1 ring-rose-300"
              : "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wide">
              Nguy cấp / Lỗi HĐ
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-rose-900">{dangerCount}</span>
            <span className="text-[11px] text-rose-700 font-medium">khẩn cấp</span>
          </div>
        </div>

        {/* Card 4: Chưa đọc */}
        <div
          onClick={() => {
            setSelectedReadStatus("UNREAD");
            setPage(0);
          }}
          className={`rounded-xl border p-3 sm:p-3.5 shadow-2xs cursor-pointer transition-all ${
            selectedReadStatus === "UNREAD"
              ? "border-blue-400 bg-blue-50/70 ring-1 ring-blue-300"
              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Chưa đọc
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{unreadCount}</span>
            <span className="text-[11px] text-slate-400">tin mới</span>
          </div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm (Filters Toolbar) */}
      <div className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, nội dung..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/60 pl-8.5 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Lọc Mức độ */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">Mức độ:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setPage(0);
              }}
              className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="DANGER">Khẩn cấp (DANGER)</option>
              <option value="WARNING">Cảnh báo (WARNING)</option>
              <option value="INFO">Thông tin (INFO)</option>
            </select>
          </div>

          {/* Lọc Trạng thái xử lý (TC-02) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">Xử lý:</span>
            <select
              value={selectedClosedStatus}
              onChange={(e) => {
                setSelectedClosedStatus(e.target.value);
                setPage(0);
              }}
              className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">Chưa xử lý (Đang chờ)</option>
              <option value="CLOSED">Đã giải quyết xong</option>
            </select>
          </div>

          {/* Lọc Đọc / Chưa đọc */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">Đã đọc:</span>
            <select
              value={selectedReadStatus}
              onChange={(e) => {
                setSelectedReadStatus(e.target.value);
                setPage(0);
              }}
              className="w-full h-8.5 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả</option>
              <option value="UNREAD">Chưa đọc</option>
              <option value="READ">Đã đọc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách thông báo - CÓ VÙNG CUỘN RIÊNG (Scrollable container) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col">
        {isLoading || isFetching ? (
          <div className="py-16 text-center text-sm font-medium text-slate-400">
            Đang tải danh sách thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Inbox className="mx-auto h-10 w-10 text-slate-300 mb-2.5" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy thông báo nào</p>
            <p className="mt-1 text-xs text-slate-400">
              Không có thông báo nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100 scroll-smooth">
            {notifications.map((notif) => {
              const isDanger = notif.severity === "DANGER";
              const isWarning = notif.severity === "WARNING";
              const isClosed = notif.isClosed;

              return (
                <div
                  key={notif.id}
                  className={`px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${
                    !notif.isRead ? "bg-blue-50/25" : ""
                  } ${isClosed ? "opacity-65" : ""}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon mức độ gọn nhẹ */}
                    <div className="shrink-0 mt-0.5">
                      {isClosed ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : isDanger ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                          <AlertTriangle className="h-4 w-4 stroke-[2.2]" />
                        </div>
                      ) : isWarning ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                          <AlertCircle className="h-4 w-4 stroke-[2.2]" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                          <Info className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Nội dung thông báo */}
                    <div className="flex-1 min-w-0">
                      {/* Dòng 1: Tags + Tiêu đề */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                          {getCategoryLabel(notif.notificationCategory)}
                        </span>

                        {isClosed ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã giải quyết xong
                          </span>
                        ) : isDanger ? (
                          <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-semibold text-rose-700">
                            Khẩn cấp
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700">
                            Cần chú ý
                          </span>
                        ) : null}

                        {!notif.isRead && (
                          <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                            Chưa đọc
                          </span>
                        )}

                        <h3
                          className={`text-xs sm:text-sm truncate ${
                            !notif.isRead
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {notif.title}
                        </h3>
                      </div>

                      {/* Dòng 2: Nội dung rút gọn súc tích 1 dòng */}
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                        {notif.message}
                      </p>

                      {/* Dòng 3: Metadata thời gian nhẹ nhàng */}
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span>Tạo lúc: {formatTime(notif.createdAt)}</span>
                        {isClosed && notif.closedAt && (
                          <span className="text-emerald-700 font-medium">
                            • Xong: {formatTime(notif.closedAt)}
                          </span>
                        )}
                        {notif.isRead && notif.readAt && (
                          <span>• Đã đọc: {formatTime(notif.readAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notif.id)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}

                    {notif.actionUrl && (
                      <button
                        type="button"
                        onClick={() => handleAction(notif)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                          isClosed
                            ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            : isDanger
                            ? "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                        }`}
                      >
                        <span>{isClosed ? "Xem lại" : "Mở xử lý ngay"}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phân trang pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-2.5">
            <span className="text-xs font-semibold text-slate-500">
              Trang {page + 1} / {totalPages} (Tổng {totalElements} thông báo)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cài Đặt Thông Báo (Chủ hộ VT-01) */}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default NotificationCenterPage;
