import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  ChevronRight,
  Inbox,
  Settings,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useGetBadgeCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllAsReadMutation,
} from "../services/notificationApi";
import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import { useAppSelector } from "@/hooks/useRedux";
import type { IAppNotificationResponse } from "../types/IAppNotification";
import { NotificationSettingsModal } from "./NotificationSettingsModal";
import { resolveNotificationActionUrl } from "../utils/notificationRouteHelper";

const STORAGE_KEY_NOTIF_VIEWED = "app_notif_last_viewed_at";
const STORAGE_KEY_NOTIF_COUNT = "app_notif_last_viewed_count";

interface NotificationCenterDropdownProps {
  className?: string;
}

type TQuickFilter = "ALL" | "UNREAD" | "DANGER";

export const NotificationCenterDropdown: React.FC<
  NotificationCenterDropdownProps
> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TQuickFilter>("UNREAD");
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // 1. Lấy thống kê badge (tổng việc chưa giải quyết, việc khẩn cấp, việc chưa đọc)
  const { data: badgeRes } = useGetBadgeCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const dangerCount = badgeRes?.result?.dangerCount ?? 0;
  const unreadCount = badgeRes?.result?.unreadCount ?? 0;
  const displayCount = unreadCount;

  // Trạng thái đã mở xem thông báo (để ẩn badge đỏ ngoài chuông)
  const [hasViewed, setHasViewed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const lastViewed = localStorage.getItem(STORAGE_KEY_NOTIF_VIEWED);
      return Boolean(lastViewed);
    } catch {
      return false;
    }
  });

  // Tự động kích hoạt lại badge ngoài khi có thông báo mới (số lượng chưa đọc tăng lên)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const lastCount = Number(localStorage.getItem(STORAGE_KEY_NOTIF_COUNT) || 0);
      if (displayCount > lastCount) {
        setHasViewed(false);
      } else if (displayCount === 0) {
        setHasViewed(true);
        localStorage.setItem(STORAGE_KEY_NOTIF_COUNT, "0");
      }
    } catch {
      // ignore
    }
  }, [displayCount]);

  const handleToggleDropdown = () => {
    setIsOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        setHasViewed(true);
        try {
          localStorage.setItem(STORAGE_KEY_NOTIF_VIEWED, new Date().toISOString());
          localStorage.setItem(STORAGE_KEY_NOTIF_COUNT, String(displayCount));
        } catch {
          // ignore
        }
      }
      return nextState;
    });
  };

  // 2. Tải danh sách thông báo theo filter tab
  const filterParams = useMemo(() => {
    const params: {
      page: number;
      size: number;
      isRead?: boolean;
      isClosed?: boolean;
      severity?: string;
    } = { page: 0, size: 15 };

    if (activeFilter === "UNREAD") {
      params.isRead = false;
    } else if (activeFilter === "DANGER") {
      params.severity = "DANGER";
    }
    return params;
  }, [activeFilter]);

  const {
    data: notificationsRes,
    isLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery(filterParams, { pollingInterval: 30000 });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const notifications: IAppNotificationResponse[] = useMemo(
    () => notificationsRes?.result?.content || [],
    [notificationsRes?.result?.content]
  );

  // 3. Trình duyệt Native Notification: Lưu ID thông báo đã push
  const lastPushedIdRef = useRef<string | null>(null);
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "denied"
  >(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "denied";
  });

  const handleNotificationClick = useCallback(
    async (notif: IAppNotificationResponse) => {
      if (!notif.isRead) {
        try {
          await markAsRead(notif.id).unwrap();
        } catch {
          // Ignored
        }
      }

      setIsOpen(false);
      setHasViewed(true);

      const target = resolveNotificationActionUrl(notif);
      navigate(target);
    },
    [markAsRead, navigate]
  );

  // Tự động đẩy Native Notification khi có cảnh báo mới
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (notifications.length === 0) return;

    const latest = notifications[0];
    if (latest && !latest.isRead && latest.id !== lastPushedIdRef.current) {
      lastPushedIdRef.current = latest.id;
      try {
        const nativeNotif = new window.Notification(latest.title, {
          body: latest.message,
          icon: "/favicon.ico",
        });
        nativeNotif.onclick = () => {
          window.focus();
          handleNotificationClick(latest);
        };
      } catch {
        // Ignored on unsupported devices
      }
    }
  }, [notifications, handleNotificationClick]);

  const requestNativeNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setBrowserPermission(permission);
      } catch {
        // Ignored
      }
    }
  };

  // Đóng khi click ngoài dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatNotificationTime = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const timeStr = d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (isToday) {
        return timeStr;
      }
      return `${timeStr} ${d.getDate()}/${d.getMonth() + 1}`;
    } catch {
      return "";
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      setHasViewed(true);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_NOTIF_VIEWED, new Date().toISOString());
          localStorage.setItem(STORAGE_KEY_NOTIF_COUNT, "0");
        } catch {
          // ignore
        }
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        aria-label="Trung tâm thông báo"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer focus:outline-none"
        title="Thông báo"
      >
        <Bell className={`h-4 w-4 ${dangerCount > 0 && !hasViewed && displayCount > 0 ? "animate-bounce" : ""}`} />

        {/* Badge số đếm ở NGOÀI: chỉ hiện khi chưa xem thông báo và có thông báo chưa đọc */}
        {!hasViewed && displayCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-black text-white shadow-xs animate-in zoom-in-50 ${
              dangerCount > 0 ? "bg-rose-600 animate-pulse" : "bg-rose-600"
            }`}
          >
            {displayCount > 99 ? "99+" : displayCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu - Giao diện tinh gọn, thoáng mắt */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] sm:w-[410px] rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header dropdown */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm text-slate-900 truncate">
                  Thông báo
                </span>
                {displayCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 text-[10px] font-bold shrink-0">
                    {displayCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Nút Cài đặt (Chỉ hiện cho Chủ hộ) */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    title="Cài đặt nhận thông báo"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Nút Đọc tất cả */}
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll || displayCount === 0}
                  className="px-1.5 py-0.5 rounded-md text-[11px] font-medium text-blue-600 hover:bg-blue-50 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đọc tất cả</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Tabs - Segmented Pill Control tinh gọn */}
            <div className="mt-2.5 p-0.5 bg-slate-100 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter("UNREAD")}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  activeFilter === "UNREAD"
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                <span>Chưa đọc</span>
                {displayCount > 0 && (
                  <span className="ml-1 text-[10px] text-slate-500 font-semibold">
                    ({displayCount})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("DANGER")}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  activeFilter === "DANGER"
                    ? "bg-white text-rose-600 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                <span>Khẩn cấp</span>
                {dangerCount > 0 && (
                  <span className="ml-1 text-[10px] text-rose-500 font-semibold">
                    ({dangerCount})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  activeFilter === "ALL"
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                <span>Tất cả</span>
              </button>
            </div>
          </div>

          {/* Banner Bật Thông Báo Trình Duyệt */}
          {browserPermission === "default" && (
            <div className="bg-blue-50/90 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
              <span className="font-medium">Nhận cảnh báo trên màn hình</span>
              <button
                type="button"
                onClick={requestNativeNotificationPermission}
                className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
              >
                Bật thông báo
              </button>
            </div>
          )}

          {/* Danh sách thông báo */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Đang tải thông báo...
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                <p className="text-xs font-semibold mb-1 text-slate-700">
                  Không thể kết nối đến máy chủ
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  Vui lòng kiểm tra lại kết nối mạng hoặc thử lại
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại</span>
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">
                  {activeFilter === "UNREAD"
                    ? "Không có thông báo chưa đọc nào"
                    : "Không có thông báo nào"}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isDanger = notif.severity === "DANGER";
                const isWarning = notif.severity === "WARNING";
                const isClosed = notif.isClosed;

                let icon = (
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                );

                if (isClosed) {
                  icon = (
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  );
                } else if (isDanger) {
                  icon = (
                    <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  );
                } else if (isWarning) {
                  icon = (
                    <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  );
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group px-3.5 py-2.5 flex items-start gap-3 hover:bg-slate-50/90 transition-colors cursor-pointer text-left relative ${
                      !notif.isRead ? "bg-blue-50/25" : ""
                    } ${isClosed ? "opacity-60" : ""}`}
                  >
                    {/* Icon gọn nhẹ */}
                    {icon}

                    <div className="flex-1 min-w-0">
                      {/* Tiêu đề & thời gian */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4
                            className={`text-xs truncate ${
                              !notif.isRead
                                ? "font-bold text-slate-900"
                                : "font-medium text-slate-700"
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {isClosed && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-semibold shrink-0">
                              Đã xử lý
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400">
                            {formatNotificationTime(notif.createdAt)}
                          </span>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Nội dung tin nhắn: gọn gàng 1 dòng (line-clamp-1), ít chữ */}
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                        {notif.message}
                      </p>
                    </div>

                    {/* Mũi tên nhẹ xuất hiện khi hover */}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 self-center opacity-0 group-hover:opacity-100 hidden sm:block" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer dropdown */}
          <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(APP_ROUTES.NOTIFICATIONS);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả thông báo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Cài Đặt Thông Báo (Chủ hộ VT-01) */}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
