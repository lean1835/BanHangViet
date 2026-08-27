import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { APP_FALLBACKS } from "@/constants/app";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IPosTab } from "../types/IPos";
import { Camera, Mic, Search } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface IPosHeaderProps {
  products: IProduct[];
  tabs: IPosTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onSelectProduct: (product: IProduct) => void;
  onOpenScannerModal?: () => void;
  onOpenVoiceModal?: () => void;
  onScanBarcode?: (barcode: string) => void;
  userName?: string;
  isOnline?: boolean;
}

export const PosHeader: React.FC<IPosHeaderProps> = ({
  products: initialProducts,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onSelectProduct,
  onOpenScannerModal,
  onOpenVoiceModal,
  onScanBarcode,
  userName = APP_FALLBACKS.CASHIER_NAME,
  isOnline = true,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Live API Search Query
  const { data: searchResultData, isLoading } = useGetProductsQuery({
    search: searchTerm.trim() || undefined,
    page: 0,
    size: 50,
  });

  const searchedProducts = searchResultData?.content || [];
  const displayProducts = searchTerm.trim() ? searchedProducts : (initialProducts.length > 0 ? initialProducts : searchedProducts);

  // F2 (Camera Scan), / or F3 (Search focus), F4 (Voice Search) keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA";

      if (e.key === "F2") {
        e.preventDefault();
        onOpenScannerModal?.();
      } else if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F3") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        onOpenVoiceModal?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenScannerModal, onOpenVoiceModal]);

  // Reset search term when active tab changes (e.g. after order completion or tab switch)
  useEffect(() => {
    setSearchTerm("");
    setIsDropdownOpen(false);
  }, [activeTabId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductClick = (product: IProduct) => {
    onSelectProduct(product);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchTerm.trim();
      if (!query) return;

      if (onScanBarcode) {
        onScanBarcode(query);
        setSearchTerm("");
        setIsDropdownOpen(false);
      } else if (displayProducts.length > 0) {
        handleProductClick(displayProducts[0]);
      }
    }
  };

  return (
    <header className="bg-[#0070f4] text-white shadow-md select-none sticky top-0 z-40">
      <div className="flex items-center justify-start px-3 py-1.5 gap-3">
        {/* Left: Product Search Bar with Camera Scanner & Voice Search */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-72 sm:w-80 lg:w-96 relative" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                <Search size={16} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="w-full h-10 bg-white text-slate-800 text-xs sm:text-[13px] rounded-full pl-10 pr-20 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-slate-400 font-medium shadow-inner transition-all"
                placeholder="Tìm hàng hóa (/)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleKeyDownInput}
              />
              <div className="absolute right-2 flex items-center gap-1">
                {onOpenScannerModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenScannerModal();
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                    title="Mở máy quét Camera (F2)"
                  >
                    <Camera size={16} />
                  </button>
                )}
                {onOpenVoiceModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVoiceModal();
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                    title="Tìm hàng bằng giọng nói (F4)"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Product Autocomplete Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 z-50 max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-medium">
                    Đang tìm kiếm...
                  </div>
                ) : displayProducts.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-medium">
                    Không tìm thấy sản phẩm nào
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {displayProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="flex items-center justify-between p-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div>
                            <div className="font-bold text-xs text-slate-800">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                              <span>Mã: {product.sku || "N/A"}</span>
                              <span>•</span>
                              <span>ĐVT: {product.unit || "Cái"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-xs text-[#0070f4]">
                            {formatCurrency(product.price)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Tồn:{" "}
                            <span
                              className={
                                product.stockQuantity <= 0
                                  ? "text-red-500 font-bold"
                                  : "font-semibold"
                              }
                            >
                              {product.stockQuantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Multi-Order Tabs Bar - ALIGNED FROM LEFT TO RIGHT */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none justify-start">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-lg font-bold text-xs cursor-pointer transition-all shrink-0 ${
                  isActive
                    ? "bg-white text-[#0070f4] shadow-sm border-t-2 border-[#0070f4]"
                    : "bg-blue-600/80 text-white hover:bg-blue-600"
                }`}
              >
                <span>{tab.orderNumber}</span>
                {tab.status === "DRAFT" && (
                  <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-semibold">
                    Nháp
                  </span>
                )}
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="hover:bg-red-500/20 hover:text-red-600 rounded-full p-0.5 transition-colors text-slate-400"
                    title="Đóng tab"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {/* Plus Add Tab Button */}
          <button
            type="button"
            onClick={onAddTab}
            className="flex items-center justify-center p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0"
            title="Thêm đơn hàng mới"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Right: Actions & User Info */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span className="hidden sm:inline text-blue-100 text-[11px]">
              {isOnline ? "Trực tuyến" : "Ngoại tuyến"}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-blue-400 hidden sm:block" />

          <Link
            to={APP_ROUTES.DASHBOARD}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="hidden md:inline">Quản lý</span>
          </Link>

          <div className="text-right hidden lg:block">
            <div className="font-bold text-xs">{userName}</div>
            <div className="text-[10px] text-blue-200">{APP_FALLBACKS.CENTER_BRANCH_NAME}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PosHeader;
