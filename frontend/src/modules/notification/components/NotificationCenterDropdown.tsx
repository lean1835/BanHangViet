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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
} from "../services/notificationApi";
import { APP_ROUTES } from "@/constants/routes";
import type { IAppNotificationResponse } from "../types/IAppNotification";

interface NotificationCenterDropdownProps {
  className?: string;
}

export const NotificationCenterDropdown: React.FC<
  NotificationCenterDropdownProps
> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 1. Native Eager Loading: Tải dữ liệu thông báo ngay từ đầu kèm polling ngầm mỗi 30s
  const { data: countRes } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const unreadCount = countRes?.result ?? 0;

  const { data: notificationsRes, isLoading } = useGetNotificationsQuery(
    { page: 0, size: 10 },
    { pollingInterval: 30000 }
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();

  const notifications: IAppNotificationResponse[] = useMemo(
    () => notificationsRes?.result?.content || [],
    [notificationsRes?.result?.content]
  );

  // 2. Trình duyệt Native Notification: Lưu ID thông báo đã push ra màn hình để tránh trùng
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

      if (notif.actionUrl) {
        // Chuẩn hóa url nếu backend trả về /tax/annual-revenue
        if (
          notif.actionUrl === "/tax/annual-revenue" ||
          notif.actionUrl.includes("annual-revenue")
        ) {
          navigate(APP_ROUTES.REPORT_ANNUAL_REVENUE);
        } else {
          navigate(notif.actionUrl);
        }
      } else {
        navigate(APP_ROUTES.REPORT_ANNUAL_REVENUE);
      }
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
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Trung tâm thông báo"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer focus:outline-none"
        title="Trung tâm thông báo"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-slate-800">
                Trung tâm thông báo
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                // Đánh dấu tất cả thông báo hiện có
                notifications
                  .filter((n) => !n.isRead)
                  .forEach((n) => markAsRead(n.id));
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đọc tất cả</span>
            </button>
          </div>

          {/* Banner Bật Thông Báo Trình Duyệt (Native Notification) */}
          {browserPermission === "default" && (
            <div className="bg-blue-50/90 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
              <span className="font-medium">Nhận cảnh báo ngưỡng thuế trên màn hình</span>
              <button
                type="button"
                onClick={requestNativeNotificationPermission}
                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
              >
                Bật thông báo
              </button>
            </div>
          )}

          {/* Danh sách thông báo */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isDanger = notif.severity === "DANGER";
                const isWarning = notif.severity === "WARNING";

                let icon = (
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                );

                if (isDanger) {
                  icon = (
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                      <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
                    </div>
                  );
                } else if (isWarning) {
                  icon = (
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-600 shrink-0">
                      <AlertCircle className="w-4 h-4 stroke-[2.2]" />
                    </div>
                  );
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                      !notif.isRead ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs truncate flex items-center gap-1 ${
                            !notif.isRead
                              ? "font-extrabold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {notif.targetType === "TAX_PERIOD" && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold shrink-0">
                              Thuế
                            </span>
                          )}
                          <span className="truncate">{notif.title}</span>
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{formatNotificationTime(notif.createdAt)}</span>
                        <span className="text-blue-600 font-bold inline-flex items-center gap-0.5">
                          Xem chi tiết <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer dropdown */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(APP_ROUTES.REPORT_ANNUAL_REVENUE);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Xem theo dõi doanh thu lũy kế năm</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
