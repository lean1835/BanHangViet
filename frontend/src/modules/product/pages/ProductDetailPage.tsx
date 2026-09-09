import React, { useCallback, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Coins,
  Edit,
  History,
  Info,
  Package,
  Layers,
  Store,
  Tag,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Scale,
} from "lucide-react";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import {
  PRODUCT_MESSAGES,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LABELS,
  STOCK_CARD_CONFIG,
} from "@/constants/product";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  useGetProductByIdQuery,
  useGetStockCardQuery,
  useUpdateProductMutation,
  useGetUnitConversionsQuery,
  useCreateUnitConversionMutation,
  useUpdateUnitConversionMutation,
  useDeleteUnitConversionMutation,
} from "../services/productApi";
import { StockCardSummaryCards } from "../components/StockCardSummaryCards";
import { StockCardFilterBar } from "../components/StockCardFilterBar";
import { StockCardTable } from "../components/StockCardTable";
import { ProductFormModal } from "../components/ProductFormModal";
import { UnitConversionTable } from "../components/UnitConversionTable";
import { UnitConversionFormModal } from "../components/UnitConversionFormModal";
import { PriceTierTable } from "../components/PriceTierTable";
import { PriceTierFormModal } from "../components/PriceTierFormModal";
import { PriceTierSimulator } from "../components/PriceTierSimulator";
import { useOnReturnTicketApproved } from "@/utils/returnTicketEvents";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import type { TProductPayload } from "../types/IProduct";
import type { IStockMovement } from "../types/IStockCard";
import type {
  IProductUnitConversion,
  ICreateUnitConversionRequest,
} from "../types/IProductUnitConversion";
import type {
  IProductPriceTier,
  ICreatePriceTierRequest,
} from "../types/IProductPriceTier";
import {
  UNIT_CONVERSION_MESSAGES,
  PRICE_TIER_COPY,
  PRICE_TIER_MESSAGES,
} from "@/constants/product";
import {
  useGetPriceTiersQuery,
  useCreatePriceTierMutation,
  useUpdatePriceTierMutation,
  useDeletePriceTierMutation,
} from "../services/productApi";
import { Trash2, Plus, TrendingDown } from "lucide-react";

export type TProductDetailTab =
  | "INFO"
  | "STOCK_CARD"
  | "UNIT_CONVERSIONS"
  | "PRICE_TIERS";

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};


const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
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

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRole } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();

  const isOwner = currentRole === USER_ROLES.OWNER;
  const isAccountant = currentRole === USER_ROLES.ACCOUNTANT;
  const canManage = isOwner;
  const canViewStockCard = isOwner || isAccountant;

  const targetId = id || searchParams.get("productId") || "";
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TProductDetailTab>(
    tabParam === "STOCK_CARD"
      ? "STOCK_CARD"
      : tabParam === "UNIT_CONVERSIONS"
      ? "UNIT_CONVERSIONS"
      : tabParam === "PRICE_TIERS"
      ? "PRICE_TIERS"
      : "INFO"
  );

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Unit conversion state
  const [isConversionFormOpen, setIsConversionFormOpen] = useState(false);
  const [editingConversion, setEditingConversion] =
    useState<IProductUnitConversion | null>(null);
  const [deleteConversionTarget, setDeleteConversionTarget] =
    useState<IProductUnitConversion | null>(null);

  // Price tier state
  const [isPriceTierFormOpen, setIsPriceTierFormOpen] = useState(false);
  const [editingPriceTier, setEditingPriceTier] =
    useState<IProductPriceTier | null>(null);
  const [deletePriceTierTarget, setDeletePriceTierTarget] =
    useState<IProductPriceTier | null>(null);

  // Queries & Mutations for Price Tiers
  const {
    data: priceTiers = [],
    isLoading: isPriceTiersLoading,
    refetch: refetchPriceTiers,
  } = useGetPriceTiersQuery(targetId, {
    skip: !targetId,
    refetchOnMountOrArgChange: true,
  });

  const [createPriceTier] = useCreatePriceTierMutation();
  const [updatePriceTier] = useUpdatePriceTierMutation();
  const [deletePriceTier, { isLoading: isDeletingPriceTier }] =
    useDeletePriceTierMutation();

  // Queries & Mutations for Unit Conversion
  const {
    data: unitConversions = [],
    isLoading: isConversionsLoading,
    refetch: refetchConversions,
  } = useGetUnitConversionsQuery(targetId, {
    skip: !targetId,
    refetchOnMountOrArgChange: true,
  });

  const [createUnitConversion] = useCreateUnitConversionMutation();
  const [updateUnitConversion] = useUpdateUnitConversionMutation();
  const [deleteUnitConversion, { isLoading: isDeletingConversion }] =
    useDeleteUnitConversionMutation();

  // Load product detail by id
  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    refetch: refetchProduct,
  } = useGetProductByIdQuery(targetId, {
    skip: !targetId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const [updateProduct] = useUpdateProductMutation();

  // Date filters state for Stock Card
  const defaultDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - STOCK_CARD_CONFIG.DEFAULT_DAYS_RANGE);
    return {
      fromDate: formatDateToISO(start),
      toDate: formatDateToISO(end),
    };
  }, []);

  const [fromDate, setFromDate] = useState<string>(defaultDates.fromDate);
  const [toDate, setToDate] = useState<string>(defaultDates.toDate);
  const [page, setPage] = useState<number>(0);
  const pageSize = STOCK_CARD_CONFIG.DEFAULT_PAGE_SIZE;

  // Load Stock Card data
  const {
    data: stockCardData,
    isLoading: isStockCardLoading,
    isFetching: isStockCardFetching,
    refetch: refetchStockCard,
  } = useGetStockCardQuery(
    {
      productId: targetId,
      fromDate,
      toDate,
      page,
      size: pageSize,
    },
    {
      skip: !canViewStockCard || !targetId || activeTab !== "STOCK_CARD",
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );

  // Tự động refetch native ngay lập tức khi phiếu trả hàng được duyệt
  useOnReturnTicketApproved((payload) => {
    if (
      !payload?.productIds ||
      payload.productIds.length === 0 ||
      payload.productIds.includes(targetId)
    ) {
      refetchProduct();
      if (activeTab === "STOCK_CARD") {
        refetchStockCard();
      }
    }
  });

  // Tự động refetch khi có đơn hàng POS hoàn tất (bán hàng làm thay đổi tồn kho)
  useOnOrderCompleted(() => {
    refetchProduct();
    if (activeTab === "STOCK_CARD") {
      refetchStockCard();
    }
  });

  const handleTabChange = (newTab: TProductDetailTab) => {
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", newTab);
    setSearchParams(newParams, { replace: true });
  };

  const handleDateChange = useCallback((newFrom: string, newTo: string) => {
    setFromDate(newFrom);
    setToDate(newTo);
    setPage(0);
  }, []);

  const handleResetDates = useCallback(() => {
    setFromDate(defaultDates.fromDate);
    setToDate(defaultDates.toDate);
    setPage(0);
  }, [defaultDates]);

  // Handle drill-down to original document (TC-02)
  const handleOpenDocument = useCallback(
    (movement: IStockMovement) => {
      if (movement.documentUrl) {
        navigate(movement.documentUrl);
      }
    },
    [navigate]
  );

  const handleSaveEdit = async (data: TProductPayload) => {
    if (!targetId) return;
    try {
      await updateProduct({ id: targetId, data }).unwrap();
      showSuccess(PRODUCT_MESSAGES.UPDATE_SUCCESS);
      setIsEditModalOpen(false);
      refetchProduct();
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error, PRODUCT_MESSAGES.SAVE_FAILED)
      );
    }
  };

  // Loading state
  if (isProductLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 gap-3 min-h-[400px]">
        <div className="w-8 h-8 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">Đang tải thông tin hàng hóa...</p>
      </div>
    );
  }

  // Not found or error state
  if (isProductError || !product) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[360px] gap-4 text-center">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
          <Package className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Không tìm thấy thông tin hàng hóa
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Hàng hóa không tồn tại hoặc bạn không có quyền truy cập thông tin này.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.PRODUCTS)}
          className="flex items-center gap-1.5 px-4 py-2 bg-kv-blue-primary text-white text-xs font-bold rounded-xl hover:bg-kv-blue-dark transition-all shadow-sm"
        >
          <ArrowLeft size={14} />
          Quay lại danh sách hàng hóa
        </button>
      </div>
    );
  }

  const isActive = product.status === PRODUCT_STATUS.ACTIVE;
  const isDiscrepancy = Boolean(stockCardData?.isDiscrepancy);
  const movements = stockCardData?.movements?.content || [];
  const totalElements = stockCardData?.movements?.totalElements || 0;
  const totalPages = stockCardData?.movements?.totalPages || 1;
  const isLowStock =
    product.minStockQuantity &&
    product.minStockQuantity > 0 &&
    product.stockQuantity <= product.minStockQuantity;

  return (
    <div className="flex flex-col gap-5 w-full flex-1 animate-page-enter pb-12">
      {/* 1. Top Header & Back Navigation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.PRODUCTS)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 active:scale-95 rounded-xl text-slate-700 text-xs font-bold transition-all shadow-2xs shrink-0"
            title="Quay lại danh sách hàng hóa"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {isActive
                  ? PRODUCT_STATUS_LABELS[PRODUCT_STATUS.ACTIVE]
                  : PRODUCT_STATUS_LABELS[PRODUCT_STATUS.INACTIVE]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-1">
              <span>
                Mã SKU: <strong className="font-mono text-kv-blue-primary">{product.sku}</strong>
              </span>
              {product.barcode && (
                <>
                  <span>•</span>
                  <span>
                    Mã vạch: <strong className="font-mono text-slate-700">{product.barcode}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canManage && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Edit size={14} />
              <span>Chỉnh sửa hàng hóa</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Highlight Cards Banner (Tương tự Dư nợ ở SupplierDetailPage) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Giá bán niêm yết */}
        <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50/50 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-600 shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                Giá bán niêm yết
              </span>
              <span className="text-xl font-extrabold text-kv-blue-primary tracking-tight">
                {formatCurrency(product.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Tồn kho khả dụng */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isLowStock
                  ? "bg-amber-100 text-amber-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium block">
                  Tồn kho khả dụng
                </span>
                {isLowStock && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                    Dưới mức tối thiểu
                  </span>
                )}
              </div>
              <span
                className={`text-xl font-extrabold tracking-tight ${
                  isLowStock ? "text-amber-700" : "text-slate-900"
                }`}
              >
                {formatNumber(product.stockQuantity)}{" "}
                <span className="text-xs font-semibold text-slate-400">{product.unit}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tồn tại điểm bán POS */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                Cấp phát điểm bán POS
              </span>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {formatNumber(product.allocatedStock ?? 0)}{" "}
                <span className="text-xs font-semibold text-slate-400">{product.unit}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabs Layout (Chuẩn như Chi tiết NCC) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Tab Navigation Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("INFO")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "INFO"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
            }`}
          >
            <Info size={15} />
            Thông tin chung
          </button>

          {canViewStockCard && (
            <button
              type="button"
              onClick={() => handleTabChange("STOCK_CARD")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === "STOCK_CARD"
                  ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
              }`}
            >
              <History size={15} />
              Thẻ kho biến động
              {isDiscrepancy && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                  Lệch tồn
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleTabChange("UNIT_CONVERSIONS")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "UNIT_CONVERSIONS"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
            }`}
          >
            <Layers size={15} />
            Đơn vị quy đổi
            {unitConversions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                {unitConversions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("PRICE_TIERS")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "PRICE_TIERS"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
            }`}
          >
            <TrendingDown size={15} />
            {PRICE_TIER_COPY.TAB_TITLE}
            {priceTiers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {priceTiers.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "INFO" && (
            /* TAB 1: THÔNG TIN CHUNG */
            <div className="space-y-6">
              {/* Detailed Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Đơn vị tính */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                    <Package size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">
                      Đơn vị tính cơ sở
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {product.unit}
                    </span>
                  </div>
                </div>

                {/* Nhóm hàng */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <Layers size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">
                      Nhóm hàng hóa
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {product.groupName || "Chưa phân nhóm"}
                    </span>
                  </div>
                </div>


                {/* Định mức tồn tối thiểu */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">
                      Định mức tồn tối thiểu
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {product.minStockQuantity
                        ? `${formatNumber(product.minStockQuantity)} ${product.unit}`
                        : "Không áp dụng"}
                    </span>
                  </div>
                </div>

                {/* Thuế suất */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                    <Tag size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">
                      Thuế suất VAT
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {product.taxRateName || "Không chịu thuế"}
                    </span>
                  </div>
                </div>

                {/* Tồn kho điểm bán POS */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <Store size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">
                      Tồn kho tại điểm bán POS
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {product.allocatedStock
                        ? `${formatNumber(product.allocatedStock)} ${product.unit}`
                        : "0"}
                    </span>
                  </div>
                </div>

                {/* Hình thức bán hàng (Bán theo cân / Số lượng thập phân) */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${product.isSoldByWeight ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                    <Scale size={18} />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-0.5">
                      Hình thức bán hàng
                    </span>
                    {product.isSoldByWeight ? (
                      <div>
                        <span className="font-bold text-amber-700 text-sm flex items-center gap-1">
                          Bán theo cân (Số lượng lẻ)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Số chữ số thập phân: <b>{product.decimalPlaces ?? 3}</b> • Bước nhảy: <b>{product.minWeightStep ?? 0.001}</b>
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-700 text-sm">
                        Đóng gói chuẩn (Số nguyên)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* POS breakdown if any */}
              {product.posStocks && product.posStocks.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <Store size={14} className="text-slate-500" />
                    <span>Chi tiết phân bổ theo từng điểm bán POS</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {product.posStocks.map((pos) => (
                      <div
                        key={pos.posId}
                        className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex justify-between items-center"
                      >
                        <span className="font-semibold text-slate-700">{pos.posName}</span>
                        <span className="font-bold text-kv-blue-primary">
                          {formatNumber(pos.stockQuantity)} {product.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  Ngày tạo: {formatDateTime(product.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <RotateCcw size={13} />
                  Cập nhật lần cuối: {formatDateTime(product.updatedAt)}
                </span>
              </div>
            </div>
          )}

          {activeTab === "STOCK_CARD" && (
            /* TAB 2: THẺ KHO BIẾN ĐỘNG (Design lại cho đơn giản) */
            <div className="flex flex-col gap-4">
              {/* Summary Cards */}
              <StockCardSummaryCards
                openingStock={stockCardData?.openingStock ?? 0}
                totalQuantityIn={stockCardData?.totalQuantityIn ?? 0}
                totalQuantityOut={stockCardData?.totalQuantityOut ?? 0}
                closingStock={stockCardData?.closingStock ?? 0}
                currentStock={stockCardData?.currentStock ?? product.stockQuantity}
                unit={product.unit}
                isDiscrepancy={stockCardData?.isDiscrepancy}
                warning={stockCardData?.warning}
              />

              {/* Filter Bar */}
              <StockCardFilterBar
                fromDate={fromDate}
                toDate={toDate}
                onDateChange={handleDateChange}
                onReset={handleResetDates}
                isLoading={isStockCardLoading || isStockCardFetching}
              />

              {/* Movements Table */}
              <StockCardTable
                movements={movements}
                unit={product.unit}
                isLoading={isStockCardLoading}
                page={page}
                pageSize={pageSize}
                totalElements={totalElements}
                totalPages={totalPages}
                onPageChange={setPage}
                onOpenDocument={handleOpenDocument}
              />
            </div>
          )}

          {activeTab === "UNIT_CONVERSIONS" && (
            /* TAB 3: ĐƠN VỊ QUY ĐỔI */
            <div className="space-y-6">
              {/* Banner Top Overview */}
              <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Cấu hình Đơn vị tính & Quy đổi mua bán
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đơn vị cơ sở lưu kho: <strong className="text-kv-blue-primary underline">{product.unit}</strong>.
                      Khi nhập kho hoặc bán bằng các đơn vị quy đổi, hệ thống sẽ tự động nhân chia để đưa về đơn vị cơ sở.
                    </p>
                  </div>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingConversion(null);
                      setIsConversionFormOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    <span>Thêm đơn vị quy đổi</span>
                  </button>
                )}
              </div>

              {/* Table */}
              <UnitConversionTable
                conversions={unitConversions}
                baseUnit={product.unit}
                isOwner={canManage}
                isLoading={isConversionsLoading}
                onEdit={(conv) => {
                  setEditingConversion(conv);
                  setIsConversionFormOpen(true);
                }}
                onDelete={(conv) => setDeleteConversionTarget(conv)}
              />
            </div>
          )}

          {activeTab === "PRICE_TIERS" && (
            /* TAB 4: BẬC GIÁ SỈ & LẺ */
            <div className="space-y-6">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>{PRICE_TIER_COPY.BANNER_TITLE}</span>
                    {priceTiers.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        {priceTiers.length} bậc
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {PRICE_TIER_COPY.BANNER_DESC}
                  </p>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPriceTier(null);
                      setIsPriceTierFormOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    <span>{PRICE_TIER_COPY.ADD_TIER_BUTTON}</span>
                  </button>
                )}
              </div>

              {/* Table */}
              <PriceTierTable
                tiers={priceTiers}
                baseUnit={product.unit}
                baseRetailPrice={product.price}
                costPrice={product.costPrice}
                isOwner={canManage}
                isLoading={isPriceTiersLoading}
                onEdit={(tier) => {
                  setEditingPriceTier(tier);
                  setIsPriceTierFormOpen(true);
                }}
                onDelete={(tier) => setDeletePriceTierTarget(tier)}
                onAddNew={() => {
                  setEditingPriceTier(null);
                  setIsPriceTierFormOpen(true);
                }}
              />

              {/* Simulator */}
              {priceTiers.length > 0 && (
                <PriceTierSimulator
                  productId={targetId}
                  baseUnit={product.unit}
                  baseRetailPrice={product.price}
                  costPrice={product.costPrice}
                  unitConversions={unitConversions}
                  activeTiers={priceTiers}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form thêm / sửa đơn vị quy đổi */}
      <UnitConversionFormModal
        isOpen={isConversionFormOpen}
        onClose={() => {
          setIsConversionFormOpen(false);
          setEditingConversion(null);
        }}
        onSave={async (data: ICreateUnitConversionRequest) => {
          try {
            if (editingConversion) {
              await updateUnitConversion({
                productId: targetId,
                conversionId: editingConversion.id,
                data,
              }).unwrap();
              showSuccess(UNIT_CONVERSION_MESSAGES.UPDATE_SUCCESS);
            } else {
              await createUnitConversion({
                productId: targetId,
                data,
              }).unwrap();
              showSuccess(UNIT_CONVERSION_MESSAGES.CREATE_SUCCESS);
            }
            setIsConversionFormOpen(false);
            setEditingConversion(null);
            refetchConversions();
            refetchProduct();
          } catch (error: unknown) {
            showError(getApiErrorMessage(error, "Lưu đơn vị quy đổi thất bại"));
            throw error;
          }
        }}
        conversion={editingConversion}
        baseUnit={product.unit}
        basePrice={product.price}
        productName={product.name}
        productId={targetId}
      />

      {/* Delete Conversion Dialog */}
      {deleteConversionTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-conv-dialog-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 animate-backdrop-fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl text-center animate-modal-bounce-in">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-3 border border-rose-100">
              <Trash2 size={24} />
            </div>
            <h4
              id="delete-conv-dialog-title"
              className="text-sm font-bold text-slate-900 mb-1"
            >
              {UNIT_CONVERSION_MESSAGES.DELETE_CONFIRM_TITLE}
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {UNIT_CONVERSION_MESSAGES.DELETE_CONFIRM_DESC(
                deleteConversionTarget.unitName,
                product.unit
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeletingConversion}
                onClick={() => setDeleteConversionTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex-1 transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeletingConversion}
                onClick={async () => {
                  try {
                    await deleteUnitConversion({
                      productId: targetId,
                      conversionId: deleteConversionTarget.id,
                    }).unwrap();
                    showSuccess(UNIT_CONVERSION_MESSAGES.DELETE_SUCCESS);
                    setDeleteConversionTarget(null);
                    refetchConversions();
                    refetchProduct();
                  } catch (error: unknown) {
                    showError(
                      getApiErrorMessage(
                        error,
                        UNIT_CONVERSION_MESSAGES.CANNOT_DELETE_IN_USE
                      )
                    );
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex-1 shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {isDeletingConversion && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal for Owner */}
      {isEditModalOpen && (
        <ProductFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          product={product}
        />
      )}

      {/* Modal Form thêm / sửa bậc giá sỉ & lẻ */}
      {isPriceTierFormOpen && (
        <PriceTierFormModal
          isOpen={isPriceTierFormOpen}
          onClose={() => {
            setIsPriceTierFormOpen(false);
            setEditingPriceTier(null);
          }}
          onSave={async (data: ICreatePriceTierRequest) => {
            try {
              if (editingPriceTier) {
                await updatePriceTier({
                  productId: targetId,
                  tierId: editingPriceTier.id,
                  data,
                }).unwrap();
                showSuccess(PRICE_TIER_MESSAGES.UPDATE_SUCCESS);
              } else {
                await createPriceTier({
                  productId: targetId,
                  data,
                }).unwrap();
                showSuccess(PRICE_TIER_MESSAGES.CREATE_SUCCESS);
              }
              setIsPriceTierFormOpen(false);
              setEditingPriceTier(null);
              refetchPriceTiers();
              refetchProduct();
            } catch (error: unknown) {
              showError(getApiErrorMessage(error, "Lưu bậc giá thất bại"));
              throw error;
            }
          }}
          tier={editingPriceTier}
          baseUnit={product.unit}
          basePrice={product.price}
          costPrice={product.costPrice}
          unitConversions={unitConversions}
          productName={product.name}
          productId={targetId}
        />
      )}

      {/* Delete Price Tier Dialog */}
      {deletePriceTierTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-tier-dialog-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 animate-backdrop-fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl text-center animate-modal-bounce-in">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-3 border border-rose-100">
              <Trash2 size={24} />
            </div>
            <h4
              id="delete-tier-dialog-title"
              className="text-sm font-bold text-slate-900 mb-1"
            >
              {PRICE_TIER_MESSAGES.DELETE_CONFIRM_TITLE}
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa bậc giá{" "}
              <strong className="text-slate-800 font-bold">
                {deletePriceTierTarget.tierName}
              </strong>
              ? Sau khi xóa, mặt hàng sẽ không áp dụng bậc giá này nữa.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeletingPriceTier}
                onClick={() => setDeletePriceTierTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex-1 transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeletingPriceTier}
                onClick={async () => {
                  try {
                    await deletePriceTier({
                      productId: targetId,
                      tierId: deletePriceTierTarget.id,
                    }).unwrap();
                    showSuccess(PRICE_TIER_MESSAGES.DELETE_SUCCESS);
                    setDeletePriceTierTarget(null);
                    refetchPriceTiers();
                    refetchProduct();
                  } catch (error: unknown) {
                    showError(
                      getApiErrorMessage(
                        error,
                        "Không thể xóa bậc giá đang được áp dụng"
                      )
                    );
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex-1 shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {isDeletingPriceTier && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
