import React, { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  HelpCircle,
} from "lucide-react";
import {
  useGetFaqsQuery,
  useGetSupportInfoQuery,
  useGetFaqsGroupedQuery,
  useGetFaqDetailQuery,
} from "../api/faqSupportApi";
import { FaqSearchBar } from "../components/FaqSearchBar";
import { FaqCategoryTabs, type TCategoryTabValue } from "../components/FaqCategoryTabs";
import { FaqAccordionItem } from "../components/FaqAccordionItem";
import { FaqEmptyState } from "../components/FaqEmptyState";
import { SystemSupportInfoCard } from "../components/SystemSupportInfoCard";
import { SupportChannelsCard } from "../components/SupportChannelsCard";
import type { TFaqCategory } from "../types/faqSupport.types";
import {
  DEFAULT_FAQS,
  DEFAULT_SUPPORT_INFO,
  DEFAULT_SUPPORT_CHANNELS,
} from "../data/defaultFaqs";

export const FaqSupportPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState<TCategoryTabValue>("ALL");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [viewedFaqId, setViewedFaqId] = useState<string | null>(null);

  // Debounce tìm kiếm sau 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query danh sách câu hỏi theo từ khóa và danh mục (TC-01, TC-02)
  const categoryParam =
    activeCategory !== "ALL" ? (activeCategory as TFaqCategory) : undefined;

  const {
    data: faqsResponse,
    isLoading: isFaqsLoading,
    isFetching: isFaqsFetching,
  } = useGetFaqsQuery({
    keyword: debouncedKeyword || undefined,
    category: categoryParam,
    size: 100,
  });

  // Query thông tin hỗ trợ kỹ thuật và định danh hộ kinh doanh (TC-03)
  const {
    data: supportInfoResponse,
    isLoading: isSupportInfoLoading,
  } = useGetSupportInfoQuery();

  // Query nhóm câu hỏi để tính badge số lượng
  const { data: groupedResponse } = useGetFaqsGroupedQuery();

  // Trigger query chi tiết để backend tăng lượt xem khi mở câu hỏi
  useGetFaqDetailQuery(viewedFaqId || "", {
    skip: !viewedFaqId,
  });

  const apiFaqs = faqsResponse?.result?.content;

  // Sử dụng dữ liệu từ API nếu có phản hồi; fallback về dữ liệu có sẵn để không bao giờ để trống màn hình
  const faqs = useMemo(() => {
    if (apiFaqs && apiFaqs.length > 0) {
      return apiFaqs;
    }

    // Khi người dùng tìm kiếm từ khóa không có kết quả, hoặc khi test Empty State (TC-02)
    if (
      apiFaqs !== undefined &&
      (debouncedKeyword ||
        activeCategory !== "ALL" ||
        faqsResponse?.message?.includes("Không tìm thấy"))
    ) {
      return [];
    }

    return DEFAULT_FAQS.filter((item) => {
      const matchCat =
        activeCategory === "ALL" || item.category === activeCategory;
      const matchKw =
        !debouncedKeyword ||
        item.question.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
        item.answer.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
        item.keywords?.toLowerCase().includes(debouncedKeyword.toLowerCase());
      return matchCat && matchKw;
    });
  }, [apiFaqs, activeCategory, debouncedKeyword, faqsResponse?.message]);

  const supportInfo = supportInfoResponse?.result || DEFAULT_SUPPORT_INFO;
  const supportChannels =
    supportInfo?.supportChannels && supportInfo.supportChannels.length > 0
      ? supportInfo.supportChannels
      : DEFAULT_SUPPORT_CHANNELS;

  // Tính số lượng câu hỏi theo từng Category cho Badge
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<TCategoryTabValue, number>> = { ALL: 0 };
    if (groupedResponse?.result && groupedResponse.result.length > 0) {
      let total = 0;
      for (const group of groupedResponse.result) {
        counts[group.category] = group.totalQuestions;
        total += group.totalQuestions;
      }
      counts.ALL = total;
      return counts;
    }

    // Fallback tính số lượng từ DEFAULT_FAQS
    counts.ALL = DEFAULT_FAQS.length;
    for (const faq of DEFAULT_FAQS) {
      counts[faq.category] = (counts[faq.category] || 0) + 1;
    }
    return counts;
  }, [groupedResponse]);

  const handleToggleFaq = (id: string) => {
    if (openFaqId === id) {
      setOpenFaqId(null);
    } else {
      setOpenFaqId(id);
      setViewedFaqId(id);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedKeyword("");
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchInput(suggestion);
    setDebouncedKeyword(suggestion);
  };

  return (
    <div className="w-full space-y-5 flex-1">
      {/* Banner tiêu đề trang phong cách tối giản, màu sắc dịu mắt */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100/80 mb-2.5">
                <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                <span>Trung tâm trợ giúp</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Câu hỏi thường gặp & Thông tin hỗ trợ kỹ thuật
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                Tra cứu nhanh cách xử lý hóa đơn, bán hàng, đổi mật khẩu và thông tin định danh gửi tổng đài khi cần hỗ trợ.
              </p>
            </div>

            {/* Thống kê nhanh dịu mắt */}
            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/70 px-3 py-1.5 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{DEFAULT_FAQS.length} câu hỏi giải đáp sẵn</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/70 px-3 py-1.5 font-medium">
                <span>Hỗ trợ trực tuyến 24/7</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bố cục chính 2 cột cân đối: Cột trái FAQ (7 phần), Cột phải Kênh hỗ trợ (5 phần) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* CỘT TRÁI: Tìm kiếm & Danh sách câu hỏi thường gặp */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Thanh tìm kiếm */}
            <div className="rounded-xl bg-white p-3 shadow-xs border border-slate-200/80">
              <FaqSearchBar
                value={searchInput}
                onChange={setSearchInput}
                onClear={handleClearSearch}
              />
            </div>

            {/* Các tab phân loại */}
            <FaqCategoryTabs
              activeTab={activeCategory}
              onTabChange={(tab) => {
                setActiveCategory(tab);
                setOpenFaqId(null);
              }}
              categoryCounts={categoryCounts}
            />

            {/* Trạng thái tải dữ liệu */}
            {isFaqsLoading && (
              <div className="flex flex-1 min-h-[380px] flex-col items-center justify-center gap-3 rounded-xl bg-white border border-slate-200/80 p-8 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-xs font-semibold">Đang tải câu hỏi thường gặp...</span>
              </div>
            )}

            {/* Danh sách câu hỏi */}
            {!isFaqsLoading && faqs.length > 0 && (
              <div className="space-y-2.5 flex-1" role="region" aria-label="Danh sách câu hỏi thường gặp">
                <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
                  <span>
                    {debouncedKeyword
                      ? `Kết quả tìm kiếm cho "${debouncedKeyword}" (${faqs.length} câu hỏi)`
                      : `Danh sách câu hỏi (${faqs.length})`}
                  </span>
                  {isFaqsFetching && (
                    <span className="flex items-center gap-1 text-blue-600 font-normal">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </span>
                  )}
                </div>

                {faqs.map((item) => (
                  <FaqAccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openFaqId === item.id}
                    onToggle={() => handleToggleFaq(item.id)}
                  />
                ))}
              </div>
            )}

            {/* Không tìm thấy câu hỏi phù hợp */}
            {!isFaqsLoading && faqs.length === 0 && (
              <div className="flex-1 flex flex-col">
                <FaqEmptyState
                  keyword={debouncedKeyword}
                  onClearKeyword={handleClearSearch}
                  onSelectSuggestion={handleSelectSuggestion}
                  supportChannels={supportChannels}
                />
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Thông tin định danh kỹ thuật & Kênh liên hệ hỗ trợ (Cân đối đồng nhất) */}
          <div className="lg:col-span-5 flex flex-col space-y-4 lg:sticky lg:top-4">
            {/* Card thông tin báo lỗi cho tổng đài */}
            <SystemSupportInfoCard
              supportInfo={supportInfo}
              isLoading={isSupportInfoLoading}
            />

            {/* Card kênh hỗ trợ kỹ thuật trực tiếp (Hotline, Zalo, Email) */}
            <SupportChannelsCard
              channels={supportChannels}
              isLoading={isSupportInfoLoading}
            />
          </div>
        </div>
      </div>
  );
};

export default FaqSupportPage;
