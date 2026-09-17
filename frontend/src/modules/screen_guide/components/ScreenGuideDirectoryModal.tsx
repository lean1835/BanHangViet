import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  X,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { useGetAllGuidesQuery } from "../api/screenGuideApi";
import { useScreenGuide } from "../context/ScreenGuideContext";
import { APP_ROUTES } from "@/constants/routes";

import { DEFAULT_SCREEN_GUIDES } from "../data/defaultScreenGuides";

export const ScreenGuideDirectoryModal: React.FC = () => {
  const navigate = useNavigate();
  const { isDirectoryOpen, closeDirectory, openGuide } = useScreenGuide();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: guidesResponse, isLoading } = useGetAllGuidesQuery(
    { search: searchTerm, size: 50 },
    { skip: !isDirectoryOpen }
  );

  if (!isDirectoryOpen) return null;

  const apiGuides = guidesResponse?.result?.content || [];
  const apiCodes = new Set(apiGuides.map((g) => g.screenCode));

  // Chuyển đổi DEFAULT_SCREEN_GUIDES thành dạng danh sách và gộp cùng API
  const defaultList = Object.values(DEFAULT_SCREEN_GUIDES)
    .filter((dg) => !apiCodes.has(dg.screenCode))
    .map((dg) => ({
      id: dg.id,
      screenCode: dg.screenCode,
      screenName: dg.screenName,
      description: dg.description,
      actionUrl: dg.actionUrl,
      targetRole: dg.targetRole,
      viewCount: dg.viewCount,
      isActive: dg.isActive,
      stepCount: dg.totalSteps,
    }));

  const allCombinedGuides = [...apiGuides, ...defaultList];

  const guides = searchTerm.trim()
    ? allCombinedGuides.filter(
        (g) =>
          g.screenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allCombinedGuides;

  const handleSelectGuide = (screenCode: string) => {
    closeDirectory();
    openGuide(screenCode);
  };

  const handleGoToScreen = (actionUrl?: string | null) => {
    if (actionUrl) {
      closeDirectory();
      navigate(actionUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-directory-title"
      >
        {/* Header Modal */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4 text-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sổ tay hướng dẫn hệ thống
              </span>
              <h2
                id="guide-directory-title"
                className="text-base font-bold text-slate-900"
              >
                Danh bạ hướng dẫn các màn hình
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDirectory}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200/70 hover:bg-slate-200/80 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng danh bạ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ô tìm kiếm hướng dẫn */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm màn hình (POS, Mẫu hóa đơn, Nhập kho, Kê khai thuế...)"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Danh sách các màn hình */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading && (
            <div className="flex h-48 items-center justify-center gap-2.5 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Đang tải danh bạ hướng dẫn...</span>
            </div>
          )}

          {!isLoading && guides.length === 0 && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-slate-500">
              <HelpCircle className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold">Không tìm thấy hướng dẫn nào phù hợp</p>
              <p className="text-xs text-slate-400">Thử tìm kiếm với từ khóa khác</p>
            </div>
          )}

          {!isLoading &&
            guides.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      {item.screenName}
                    </h3>
                    <span className="rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                      {item.stepCount} bước
                    </span>
                    {item.targetRole && item.targetRole !== "ALL" && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                        {item.targetRole}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.actionUrl && (
                    <button
                      type="button"
                      onClick={() => handleGoToScreen(item.actionUrl)}
                      className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Mở màn hình này"
                    >
                      <span>Tới trang</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectGuide(item.screenCode)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Xem hướng dẫn</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              closeDirectory();
              navigate(APP_ROUTES.SETTINGS_FAQ_SUPPORT);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Xem Câu hỏi thường gặp & Hotline kỹ thuật</span>
          </button>
          <button
            type="button"
            onClick={closeDirectory}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
