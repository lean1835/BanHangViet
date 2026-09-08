import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  LogOut,
  Monitor,
  Smartphone,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAppSelector } from "@/hooks/useRedux";
import { USER_ROLES } from "@/constants/roles";
import {
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllSessionsForUserMutation,
} from "../services/sessionApi";
import type { IUserSession } from "../types/IUserSession";
import { DeviceBadge } from "./DeviceBadge";
import { RevokeSessionModal } from "./RevokeSessionModal";
import { RevokeAllUserSessionsModal } from "./RevokeAllUserSessionsModal";
import { SessionTimeoutSettingsCard } from "./SessionTimeoutSettingsCard";

export const UserSessionPanel: React.FC = () => {
  const currentUser = useAppSelector((state) => state?.auth?.user);
  const isOwner = currentUser?.roleId === USER_ROLES.OWNER || currentUser?.roleId === "VT-01";

  const { data, isLoading, isFetching, refetch } = useGetSessionsQuery();
  const [revokeSession, { isLoading: isRevokingSingle }] = useRevokeSessionMutation();
  const [revokeAllSessions, { isLoading: isRevokingAll }] = useRevokeAllSessionsForUserMutation();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<string>("ALL");
  const [userFilter, setUserFilter] = useState<string>("ALL");

  // Modal states
  const [selectedSession, setSelectedSession] = useState<IUserSession | null>(null);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

  const [targetUserToRevokeAll, setTargetUserToRevokeAll] = useState<{ id: string; name: string } | null>(null);
  const [isRevokeAllModalOpen, setIsRevokeAllModalOpen] = useState(false);
  const [isRevokingAllOther, setIsRevokingAllOther] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const sessions: IUserSession[] = useMemo(() => data?.result || [], [data]);

  // Unique users in list for filtering (Owner only)
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      if (!map.has(s.userId)) {
        map.set(s.userId, `${s.fullName} (@${s.username})`);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.ipAddress?.toLowerCase().includes(q) ||
        s.deviceName?.toLowerCase().includes(q);

      const matchesDevice =
        deviceFilter === "ALL" ||
        (deviceFilter === "DESKTOP" && s.deviceType?.toUpperCase().includes("DESKTOP")) ||
        (deviceFilter === "MOBILE" && s.deviceType?.toUpperCase().includes("MOBILE")) ||
        (deviceFilter === "TABLET" && s.deviceType?.toUpperCase().includes("TABLET"));

      const matchesUser = userFilter === "ALL" || s.userId === userFilter;

      return matchesSearch && matchesDevice && matchesUser;
    });
  }, [sessions, searchQuery, deviceFilter, userFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = sessions.length;
    const desktop = sessions.filter((s) => s.deviceType?.toUpperCase().includes("DESKTOP")).length;
    const mobile = sessions.filter((s) => s.deviceType?.toUpperCase().includes("MOBILE")).length;
    const tablet = sessions.filter((s) => s.deviceType?.toUpperCase().includes("TABLET")).length;
    return { total, desktop, mobile: mobile + tablet };
  }, [sessions]);

  const handleRevokeSingle = async (sessionId: string, reason?: string) => {
    try {
      await revokeSession({ sessionId, reason }).unwrap();
      setIsRevokeModalOpen(false);
      setSelectedSession(null);
      setFeedback({
        type: "success",
        message: "Đã đăng xuất phiên làm việc từ xa thành công!",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({
        type: "error",
        message: "Không thể đăng xuất phiên làm việc. Vui lòng thử lại sau.",
      });
    }
  };

  const handleRevokeAllConfirm = async (reason?: string) => {
    if (isRevokingAllOther) {
      if (!currentUser?.id) return;
      try {
        await revokeAllSessions({ userId: currentUser.id, reason }).unwrap();
        setIsRevokeAllModalOpen(false);
        setFeedback({
          type: "success",
          message: "Đã đăng xuất khỏi tất cả các thiết bị khác thành công!",
        });
        setTimeout(() => setFeedback(null), 4000);
      } catch {
        setFeedback({
          type: "error",
          message: "Không thể đăng xuất các thiết bị khác. Vui lòng thử lại sau.",
        });
      }
    } else if (targetUserToRevokeAll) {
      try {
        await revokeAllSessions({ userId: targetUserToRevokeAll.id, reason }).unwrap();
        setIsRevokeAllModalOpen(false);
        setTargetUserToRevokeAll(null);
        setFeedback({
          type: "success",
          message: `Đã đăng xuất toàn bộ phiên của ${targetUserToRevokeAll.name}!`,
        });
        setTimeout(() => setFeedback(null), 4000);
      } catch {
        setFeedback({
          type: "error",
          message: "Không thể đăng xuất toàn bộ phiên của nhân viên. Vui lòng thử lại.",
        });
      }
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Quản lý phiên đăng nhập & Đăng xuất từ xa
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              NCL-01-CN-007
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isOwner
              ? "Giám sát tất cả các thiết bị đang đăng nhập trong cửa hàng và chủ động cắt phiên làm việc từ xa khi cần thiết."
              : "Xem các thiết bị đang đăng nhập bằng tài khoản của bạn và chủ động đăng xuất khỏi các thiết bị lạ."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setIsRevokingAllOther(true);
                setTargetUserToRevokeAll(null);
                setIsRevokeAllModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs shadow-amber-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất các thiết bị khác</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-kv-blue-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tổng phiên hoạt động
            </span>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">
              {isLoading ? "..." : stats.total} <span className="text-xs font-normal text-slate-400">thiết bị</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Máy tính / Laptop
            </span>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">
              {isLoading ? "..." : stats.desktop} <span className="text-xs font-normal text-slate-400">phiên</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Di động / Tablet
            </span>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">
              {isLoading ? "..." : stats.mobile} <span className="text-xs font-normal text-slate-400">phiên</span>
            </div>
          </div>
        </div>
      </div>

      {/* Owner-Only: Session Timeout Settings */}
      {isOwner && <SessionTimeoutSettingsCard />}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên người dùng, họ tên, địa chỉ IP..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Device Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Thiết bị:</span>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-kv-blue-primary cursor-pointer"
            >
              <option value="ALL">Tất cả thiết bị</option>
              <option value="DESKTOP">Máy tính (Desktop)</option>
              <option value="MOBILE">Điện thoại (Mobile)</option>
              <option value="TABLET">Máy tính bảng</option>
            </select>
          </div>

          {/* User Filter (Owner Only) */}
          {isOwner && uniqueUsers.length > 1 && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Nhân viên:</span>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-kv-blue-primary cursor-pointer max-w-[200px]"
              >
                <option value="ALL">Toàn bộ nhân viên</option>
                {uniqueUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Session List Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Thiết bị / Ứng dụng</th>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
                <th className="py-3 px-4">Đăng nhập lúc</th>
                <th className="py-3 px-4">Thao tác gần nhất</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Đang tải danh sách phiên đăng nhập...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Không tìm thấy phiên đăng nhập nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    className={`transition-colors ${
                      session.isCurrentSession ? "bg-emerald-50/40 hover:bg-emerald-50/60" : "hover:bg-slate-50/70"
                    }`}
                  >
                    {/* Device & Browser */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <DeviceBadge deviceType={session.deviceType} deviceName={session.deviceName} />
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-bold text-slate-800">{session.fullName}</div>
                        <div className="text-[11px] text-slate-400">@{session.username}</div>
                      </div>
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 font-mono text-slate-600">{session.ipAddress}</td>

                    {/* Login Time */}
                    <td className="py-3 px-4 text-slate-600">{formatDateTime(session.loginAt)}</td>

                    {/* Last Active */}
                    <td className="py-3 px-4 text-slate-600">{formatDateTime(session.lastActiveAt)}</td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {session.isCurrentSession ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Phiên hiện tại
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Đang hoạt động
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {session.isCurrentSession ? (
                        <span className="text-[11px] text-slate-400 italic px-2 py-1">
                          (Thiết bị này)
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSession(session);
                              setIsRevokeModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 hover:border-rose-600 transition-all cursor-pointer"
                            title="Đăng xuất từ xa phiên này"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Đăng xuất</span>
                          </button>

                          {/* Owner can revoke all sessions for this specific user */}
                          {isOwner && session.userId !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsRevokingAllOther(false);
                                setTargetUserToRevokeAll({ id: session.userId, name: session.fullName });
                                setIsRevokeAllModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Đăng xuất toàn bộ phiên của ${session.fullName}`}
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RevokeSessionModal
        session={selectedSession}
        isOpen={isRevokeModalOpen}
        onClose={() => {
          setIsRevokeModalOpen(false);
          setSelectedSession(null);
        }}
        onConfirm={handleRevokeSingle}
        isLoading={isRevokingSingle}
      />

      <RevokeAllUserSessionsModal
        isOpen={isRevokeAllModalOpen}
        onClose={() => {
          setIsRevokeAllModalOpen(false);
          setTargetUserToRevokeAll(null);
          setIsRevokingAllOther(false);
        }}
        onConfirm={handleRevokeAllConfirm}
        targetName={targetUserToRevokeAll?.name}
        isAllOther={isRevokingAllOther}
        isLoading={isRevokingAll}
      />
    </div>
  );
};
