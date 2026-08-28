import React, { useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Package,
  Search,
  TrendingDown,
  Layers,
  Clock,
  DollarSign,
  Tag,
} from "lucide-react";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotification } from "@/hooks/useNotification";
import {
  PRODUCT_FILTER,
  PRODUCT_QUERY_CONFIG,
  INVENTORY_WARNING_QUERY_CONFIG,
  INVENTORY_WARNING_COPY,
} from "@/constants/product";
import { SALES_ANALYTICS_COPY } from "@/constants/salesAnalytics";
import {
  useGetLowStockWarningsQuery,
  useGetPurchaseSuggestionsQuery,
  useGetProductsQuery,
  useCreateGoodsReceiptMutation,
} from "@/modules/product/services/productApi";
import { useGetSlowMovingProductsQuery } from "@/modules/sales_analytics/services/salesAnalyticsApi";
import type { IProductOutletContext } from "@/modules/product/pages/ProductsLayout";
import type {
  ILowStockWarning,
  IPurchaseSuggestion,
} from "@/modules/product/types/IInventoryWarning";
import { LowStockWarningTable } from "@/modules/product/components/LowStockWarningTable";
import { PurchaseSuggestionTable } from "@/modules/product/components/PurchaseSuggestionTable";
import { SlowMovingProductTable } from "@/modules/sales_analytics/components/SlowMovingProductTable";
import { UpdateMinStockModal } from "@/modules/product/components/UpdateMinStockModal";
import {
  GoodsReceiptModal,
  type GoodsReceiptItemRow,
} from "@/modules/product/components/GoodsReceiptModal";
import type { ISlowMovingProduct } from "@/modules/sales_analytics/types/ISalesAnalytics";
import type { ICreateGoodsReceiptPayload } from "@/modules/product/types/IGoodsReceipt";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

export const InventoryWarningPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole } = useDashboardDemo();
  const isOwner = currentRole === USER_ROLES.OWNER;
  const isAllowedSlowMoving =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;
  const { showSuccess, showError } = useNotification();

  const { inventoryWarningFilter, setInventoryWarningFilter } =
    useOutletContext<IProductOutletContext>();

  // Local tab state if not synced with context
  const activeTab = inventoryWarningFilter?.activeTab || "warnings";
  const selectedGroupId =
    inventoryWarningFilter?.groupId === PRODUCT_FILTER.ALL
      ? undefined
      : inventoryWarningFilter?.groupId;
  const periodDays = inventoryWarningFilter?.periodDays || 28;
  const thresholdDays = inventoryWarningFilter?.thresholdDays || 60;

  // Search state
  const [searchQuery, setSearchQuery] = useState(
    inventoryWarningFilter?.search || ""
  );
  const debouncedSearch = useDebounce(
    searchQuery,
    PRODUCT_QUERY_CONFIG.SEARCH_DEBOUNCE_MS
  );

  // Pagination states
  const [warningPage, setWarningPage] = useState<number>(
    PRODUCT_QUERY_CONFIG.INITIAL_PAGE
  );
  const [suggestionPage, setSuggestionPage] = useState<number>(
    PRODUCT_QUERY_CONFIG.INITIAL_PAGE
  );
  const [slowMovingPage, setSlowMovingPage] = useState<number>(
    PRODUCT_QUERY_CONFIG.INITIAL_PAGE
  );
  const pageSize = INVENTORY_WARNING_QUERY_CONFIG.PAGE_SIZE;

  // Modals state
  const [selectedProductForMinStock, setSelectedProductForMinStock] = useState<{
    id: string;
    name: string;
    sku: string;
    unit: string;
    stockQuantity: number;
    minStockQuantity: number;
  } | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptInitialSupplierId, setReceiptInitialSupplierId] = useState<
    string | undefined
  >(undefined);
  const [receiptInitialItems, setReceiptInitialItems] = useState<
    GoodsReceiptItemRow[]
  >([]);

  // Reset pagination on filter changes
  React.useEffect(() => {
    setWarningPage(PRODUCT_QUERY_CONFIG.INITIAL_PAGE);
    setSuggestionPage(PRODUCT_QUERY_CONFIG.INITIAL_PAGE);
    setSlowMovingPage(PRODUCT_QUERY_CONFIG.INITIAL_PAGE);
  }, [selectedGroupId, debouncedSearch, periodDays, thresholdDays]);

  // Query 1: Overall warnings data (Unfiltered by search, used for constant 4 KPI stats & tab badge)
  const {
    data: overallWarningsData,
    refetch: refetchOverallWarnings,
  } = useGetLowStockWarningsQuery({
    groupId: selectedGroupId,
    page: 0,
    size: INVENTORY_WARNING_QUERY_CONFIG.OVERALL_BATCH_SIZE,
  });

  // Query 2: Searched & paginated warnings for table
  const {
    data: warningsData,
    isLoading: isWarningsLoading,
    refetch: refetchWarnings,
  } = useGetLowStockWarningsQuery({
    search: debouncedSearch || undefined,
    groupId: selectedGroupId,
    page: warningPage,
    size: pageSize,
  });

  // Query 3: Purchase suggestions
  const {
    data: suggestionsData,
    isLoading: isSuggestionsLoading,
    refetch: refetchSuggestions,
  } = useGetPurchaseSuggestionsQuery(
    {
      groupId: selectedGroupId,
      periodDays,
      page: suggestionPage,
      size: pageSize,
    },
    { skip: !isOwner }
  );

  // Query 4: Slow moving & stagnant products
  const {
    data: slowMovingData,
    isLoading: isSlowMovingLoading,
  } = useGetSlowMovingProductsQuery(
    {
      thresholdDays,
      groupId: selectedGroupId,
      search: debouncedSearch || undefined,
      page: slowMovingPage,
      size: pageSize,
    },
    { skip: !isAllowedSlowMoving }
  );

  const { data: allProductsData } = useGetProductsQuery({
    size: 200,
  });
  const allProducts = allProductsData?.content || [];

  const [createGoodsReceipt] = useCreateGoodsReceiptMutation();

  // Extract Overall Warning statistics for constant KPI & Tab badge
  const overallWarningList = useMemo(
    () => overallWarningsData?.page?.content || [],
    [overallWarningsData?.page?.content]
  );
  const totalOverallWarnings = overallWarningsData?.page?.totalElements || 0;
  const isStockAdequate = totalOverallWarnings === 0;

  // KPI Calculations based on overall inventory
  const outOfStockCount = useMemo(() => {
    return overallWarningList.filter((item) => item.stockQuantity <= 0).length;
  }, [overallWarningList]);

  const totalShortageSum = useMemo(() => {
    return overallWarningList.reduce(
      (acc, item) => acc + (item.shortageQuantity || 0),
      0
    );
  }, [overallWarningList]);

  // Extract Searched table Warning statistics
  const warningList = useMemo(
    () => warningsData?.page?.content || [],
    [warningsData?.page?.content]
  );
  const totalTableWarningElements = warningsData?.page?.totalElements || 0;
  const totalTableWarningPages = warningsData?.page?.totalPages || 0;

  // Extract Suggestion statistics
  const suggestionList = useMemo(
    () => suggestionsData?.content || [],
    [suggestionsData?.content]
  );
  const totalSuggestionElements = suggestionsData?.totalElements || 0;
  const totalSuggestionPages = suggestionsData?.totalPages || 0;

  const totalSuggestedQuantity = useMemo(() => {
    return suggestionList.reduce(
      (acc, item) => acc + (item.suggestedQuantity || 0),
      0
    );
  }, [suggestionList]);

  const totalEstimatedCost = useMemo(() => {
    return suggestionList.reduce(
      (acc, item) =>
        acc + (item.suggestedQuantity || 0) * (item.costPrice || 0),
      0
    );
  }, [suggestionList]);

  const promotionWarningCount = useMemo(() => {
    return suggestionList.filter((item) => item.hasPromotion).length;
  }, [suggestionList]);

  // Extract Slow Moving statistics
  const slowMovingProducts = useMemo(
    () => slowMovingData?.pageData?.content || [],
    [slowMovingData?.pageData?.content]
  );
  const slowMovingSummary = slowMovingData?.summary;
  const totalSlowMovingElements = slowMovingData?.pageData?.totalElements || 0;
  const totalSlowMovingPages = slowMovingData?.pageData?.totalPages || 0;

  const totalStagnantProducts =
    slowMovingSummary?.totalStagnantProducts ?? totalSlowMovingElements;
  const totalStagnantStockQuantity =
    slowMovingSummary?.totalStagnantStockQuantity ?? 0;
  const totalStagnantCapital = slowMovingSummary?.totalStagnantCapital ?? 0;
  const totalRetailValue = slowMovingSummary?.totalRetailValue ?? 0;

  // Handlers
  const handleTabChange = (tab: "warnings" | "suggestions" | "slow_moving") => {
    if (setInventoryWarningFilter) {
      setInventoryWarningFilter((prev) => ({ ...prev, activeTab: tab }));
    }
  };

  const handleThresholdChange = (days: number) => {
    if (setInventoryWarningFilter) {
      setInventoryWarningFilter((prev) => ({ ...prev, thresholdDays: days }));
    }
  };

  const handleEditMinStock = (item: ILowStockWarning) => {
    setSelectedProductForMinStock({
      id: item.productId,
      name: item.productName,
      sku: item.sku,
      unit: item.unit,
      stockQuantity: item.stockQuantity,
      minStockQuantity: item.minStockQuantity,
    });
  };

  const handleQuickReorderWarning = (item: ILowStockWarning) => {
    const qtyToOrder =
      item.shortageQuantity > 0 ? item.shortageQuantity : 10;
    const matchingProduct = allProducts.find((p) => p.id === item.productId);
    const resolvedListedPrice =
      item.price && item.price > 0
        ? item.price
        : matchingProduct?.price || 0;

    const initialRow: GoodsReceiptItemRow = {
      productId: item.productId,
      productName: item.productName,
      productSku: item.sku,
      unit: item.unit,
      currentStock: item.stockQuantity,
      listedPrice: resolvedListedPrice,
      quantity: qtyToOrder,
      purchasePrice: 0,
      purchasePriceDisplay: "0",
    };

    setReceiptInitialSupplierId(item.lastSupplierId || undefined);
    setReceiptInitialItems([initialRow]);
    setIsReceiptModalOpen(true);
  };

  const handleQuickReorderSuggestion = (item: IPurchaseSuggestion) => {
    const qtyToOrder =
      item.suggestedQuantity > 0 ? item.suggestedQuantity : 10;
    const matchingProduct = allProducts.find((p) => p.id === item.productId);
    const resolvedListedPrice =
      item.price && item.price > 0
        ? item.price
        : matchingProduct?.price || 0;

    const initialRow: GoodsReceiptItemRow = {
      productId: item.productId,
      productName: item.productName,
      productSku: item.sku,
      unit: item.unit,
      currentStock: item.stockQuantity,
      listedPrice: resolvedListedPrice,
      quantity: qtyToOrder,
      purchasePrice: 0,
      purchasePriceDisplay: "0",
    };

    setReceiptInitialSupplierId(item.lastSupplierId || undefined);
    setReceiptInitialItems([initialRow]);
    setIsReceiptModalOpen(true);
  };

  const handleSaveReceipt = async (payload: ICreateGoodsReceiptPayload) => {
    try {
      await createGoodsReceipt(payload).unwrap();
      showSuccess("Lập phiếu nhập kho thành công! Tồn kho đã được cập nhật.");
      setIsReceiptModalOpen(false);
      refetchOverallWarnings();
      refetchWarnings();
      if (isOwner) refetchSuggestions();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error, "Không thể tạo phiếu nhập kho!"));
    }
  };

  const handlePromoteSlowMoving = (product: ISlowMovingProduct) => {
    navigate(APP_ROUTES.PROMOTIONS, {
      state: {
        openCreateModal: true,
        initialProductIds: [product.productId],
        initialName: `Xả hàng ${product.productName}`,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full animate-auth-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {INVENTORY_WARNING_COPY.TITLE}
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl">
          {INVENTORY_WARNING_COPY.SUBTITLE}
        </p>
      </div>

      {/* KPI Cards Row - Dynamic per activeTab */}
      {activeTab === "warnings" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Tổng mặt hàng dưới ngưỡng */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {INVENTORY_WARNING_COPY.KPI_TOTAL_LOW_STOCK}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-slate-800">
                  {formatNumber(totalOverallWarnings)}
                </span>
                <span className="text-xs font-semibold text-slate-400">mặt hàng</span>
              </div>
            </div>
          </div>

          {/* Card 2: Mặt hàng hết tồn */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {INVENTORY_WARNING_COPY.KPI_OUT_OF_STOCK}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-rose-600">
                  {formatNumber(outOfStockCount)}
                </span>
                <span className="text-xs font-semibold text-slate-400">mặt hàng</span>
              </div>
            </div>
          </div>

          {/* Card 3: Tổng số lượng thiếu hụt */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {INVENTORY_WARNING_COPY.KPI_TOTAL_SHORTAGE}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-slate-800">
                  {formatNumber(totalShortageSum)}
                </span>
                <span className="text-xs font-semibold text-slate-400">sản phẩm</span>
              </div>
            </div>
          </div>

          {/* Card 4: Trạng thái tồn kho */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isStockAdequate
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {isStockAdequate ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Layers className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {INVENTORY_WARNING_COPY.KPI_STATUS_ALERT}
              </span>
              <span
                className={`text-sm font-black mt-0.5 truncate ${
                  isStockAdequate ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {isStockAdequate
                  ? INVENTORY_WARNING_COPY.KPI_STATUS_ADEQUATE
                  : INVENTORY_WARNING_COPY.KPI_STATUS_NEED_RESTOCK}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards for Tab 2: Gợi ý nhập hàng (Dự báo) */}
      {activeTab === "suggestions" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Tổng mặt hàng gợi ý nhập */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-kv-blue-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Mặt hàng cần nhập
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-slate-800">
                  {formatNumber(totalSuggestionElements)}
                </span>
                <span className="text-xs font-semibold text-slate-400">mặt hàng</span>
              </div>
            </div>
          </div>

          {/* Card 2: Tổng số lượng gợi ý nhập */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Tổng SL gợi ý nhập
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-indigo-600">
                  {formatNumber(totalSuggestedQuantity)}
                </span>
                <span className="text-xs font-semibold text-slate-400">sản phẩm</span>
              </div>
            </div>
          </div>

          {/* Card 3: Tổng vốn dự kiến nhập */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Vốn dự kiến nhập
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-black text-emerald-700 truncate">
                  {formatCurrency(totalEstimatedCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Cảnh báo khuyến mại trong kỳ */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Có khuyến mại trong kỳ
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-amber-600">
                  {formatNumber(promotionWarningCount)}
                </span>
                <span className="text-xs font-semibold text-slate-400">mặt hàng</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards for Tab 3: Hàng bán chậm & Tồn lâu */}
      {activeTab === "slow_moving" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Tổng mặt hàng đọng vốn */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {SALES_ANALYTICS_COPY.SLOW_MOVING.KPI.TOTAL_PRODUCTS}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-rose-600">
                  {formatNumber(totalStagnantProducts)}
                </span>
                <span className="text-xs font-semibold text-slate-400">mặt hàng</span>
              </div>
            </div>
          </div>

          {/* Card 2: Tổng số lượng tồn đọng */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {SALES_ANALYTICS_COPY.SLOW_MOVING.KPI.TOTAL_STOCK}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-slate-800">
                  {formatNumber(totalStagnantStockQuantity)}
                </span>
                <span className="text-xs font-semibold text-slate-400">sản phẩm</span>
              </div>
            </div>
          </div>

          {/* Card 3: Tổng vốn đọng (Giá vốn) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {SALES_ANALYTICS_COPY.SLOW_MOVING.KPI.TOTAL_CAPITAL}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-black text-red-700 truncate">
                  {formatCurrency(totalStagnantCapital)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Giá trị bán lẻ ước tính */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {SALES_ANALYTICS_COPY.SLOW_MOVING.KPI.TOTAL_RETAIL}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-black text-slate-800 truncate">
                  {formatCurrency(totalRetailValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action row (Search and Tab buttons below statistics) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder={
              activeTab === "warnings"
                ? INVENTORY_WARNING_COPY.SEARCH_PLACEHOLDER
                : "Tìm kiếm theo tên sản phẩm, SKU..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (setInventoryWarningFilter) {
                setInventoryWarningFilter((prev) => ({
                  ...prev,
                  search: e.target.value,
                }));
              }
            }}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 text-xs font-semibold text-slate-700 shadow-sm transition-all focus:border-kv-blue-primary focus:outline-none lg:h-9"
          />
        </div>

        {/* Navigation Tabs buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleTabChange("warnings")}
            className={`flex h-11 items-center gap-1.5 rounded-lg px-4 text-xs font-bold shadow-sm transition-all lg:h-9 ${
              activeTab === "warnings"
                ? "bg-kv-blue-primary text-white hover:bg-kv-blue-dark"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle size={14} />
            <span>{INVENTORY_WARNING_COPY.TAB_WARNINGS}</span>
            {totalOverallWarnings > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ml-1 ${
                  activeTab === "warnings"
                    ? "bg-white text-kv-blue-primary"
                    : "bg-rose-500 text-white"
                }`}
              >
                {totalOverallWarnings}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("suggestions")}
            className={`flex h-11 items-center gap-1.5 rounded-lg px-4 text-xs font-bold shadow-sm transition-all lg:h-9 ${
              activeTab === "suggestions"
                ? "bg-kv-blue-primary text-white hover:bg-kv-blue-dark"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Sparkles size={14} />
            <span>{INVENTORY_WARNING_COPY.TAB_SUGGESTIONS}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("slow_moving")}
            className={`flex h-11 items-center gap-1.5 rounded-lg px-4 text-xs font-bold shadow-sm transition-all lg:h-9 ${
              activeTab === "slow_moving"
                ? "bg-kv-blue-primary text-white hover:bg-kv-blue-dark"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Clock size={14} />
            <span>{INVENTORY_WARNING_COPY.TAB_SLOW_MOVING}</span>
            {totalSlowMovingElements > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ml-1 ${
                  activeTab === "slow_moving"
                    ? "bg-white text-kv-blue-primary"
                    : "bg-rose-500 text-white"
                }`}
              >
                {totalSlowMovingElements}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "warnings" ? (
        <LowStockWarningTable
          warnings={warningList}
          isStockAdequate={isStockAdequate}
          isLoading={isWarningsLoading}
          page={warningPage}
          pageSize={pageSize}
          totalPages={totalTableWarningPages}
          totalElements={totalTableWarningElements}
          isOwner={isOwner}
          onPageChange={setWarningPage}
          onEditMinStock={handleEditMinStock}
          onQuickReorder={handleQuickReorderWarning}
        />
      ) : activeTab === "suggestions" ? (
        <PurchaseSuggestionTable
          suggestions={suggestionList}
          isLoading={isSuggestionsLoading}
          page={suggestionPage}
          pageSize={pageSize}
          totalPages={totalSuggestionPages}
          totalElements={totalSuggestionElements}
          isOwner={isOwner}
          onPageChange={setSuggestionPage}
          onQuickReorder={handleQuickReorderSuggestion}
        />
      ) : (
        <SlowMovingProductTable
          summary={slowMovingSummary}
          products={slowMovingProducts}
          isLoading={isSlowMovingLoading}
          page={slowMovingPage}
          pageSize={pageSize}
          totalPages={totalSlowMovingPages}
          totalElements={totalSlowMovingElements}
          thresholdDays={thresholdDays}
          isAllowed={isAllowedSlowMoving}
          hideSummaryCards={true}
          onPageChange={setSlowMovingPage}
          onThresholdChange={handleThresholdChange}
          onPromoteProduct={handlePromoteSlowMoving}
        />
      )}

      {/* Update Min Stock Modal */}
      <UpdateMinStockModal
        isOpen={Boolean(selectedProductForMinStock)}
        onClose={() => setSelectedProductForMinStock(null)}
        product={selectedProductForMinStock}
      />

      {/* Goods Receipt Modal for Quick Restock */}
      <GoodsReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSave={handleSaveReceipt}
        products={allProducts}
        initialSupplierId={receiptInitialSupplierId}
        initialItems={receiptInitialItems}
      />
    </div>
  );
};

export default InventoryWarningPage;
