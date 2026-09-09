import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Barcode,
  History,
  Package,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  useGetProductsQuery,
  useGetStockCardQuery,
} from "@/modules/product/services/productApi";
import { StockCardSummaryCards } from "../components/StockCardSummaryCards";
import { StockCardFilterBar } from "../components/StockCardFilterBar";
import { StockCardTable } from "../components/StockCardTable";
import { useOnReturnTicketApproved } from "@/utils/returnTicketEvents";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import { STOCK_CARD_CONFIG, STOCK_CARD_MESSAGES } from "@/constants/product";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IStockMovement } from "@/modules/product/types/IStockCard";

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const StockCardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRole } = useDashboardDemo();

  // Role permissions: Only Owner (VT-01) and Accountant (VT-03)
  const isOwner = currentRole === USER_ROLES.OWNER;
  const isAccountant = currentRole === USER_ROLES.ACCOUNTANT;
  const hasPermission = isOwner || isAccountant;

  // Selected product state
  const urlProductId = searchParams.get("productId") || "";
  const [selectedProductId, setSelectedProductId] = useState<string>(urlProductId);
  const [productSearchInput, setProductSearchInput] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Sync state with URL params
  useEffect(() => {
    if (urlProductId && urlProductId !== selectedProductId) {
      setSelectedProductId(urlProductId);
    }
  }, [urlProductId, selectedProductId]);

  // Load products list for the selector
  const { data: productsData, isLoading: isProductsLoading } = useGetProductsQuery({
    size: 200,
  });
  const products: IProduct[] = useMemo(
    () => productsData?.content || [],
    [productsData?.content]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearchInput.trim()) return products.slice(0, 30);
    const q = productSearchInput.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 30);
  }, [products, productSearchInput]);

  // Date filters
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

  // Fetch Stock Card data
  const {
    data: stockCardData,
    isLoading: isStockCardLoading,
    isFetching: isStockCardFetching,
    error: stockCardError,
    refetch: refetchStockCard,
  } = useGetStockCardQuery(
    {
      productId: selectedProductId,
      fromDate,
      toDate,
      page,
      size: pageSize,
    },
    {
      skip: !hasPermission || !selectedProductId,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );

  // Tự động refetch thẻ kho khi phiếu trả hàng được duyệt
  useOnReturnTicketApproved((payload) => {
    if (
      !payload?.productIds ||
      payload.productIds.length === 0 ||
      payload.productIds.includes(selectedProductId)
    ) {
      refetchStockCard();
    }
  });

  // Tự động refetch thẻ kho khi có đơn bán hàng mới
  useOnOrderCompleted(() => {
    refetchStockCard();
  });

  const handleSelectProduct = (product: IProduct) => {
    setSelectedProductId(product.id);
    setProductSearchInput("");
    setIsDropdownOpen(false);
    setPage(0);
    setSearchParams({ productId: product.id });
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

  // TC-02: Open original document
  const handleOpenDocument = useCallback(
    (movement: IStockMovement) => {
      if (movement.documentUrl) {
        navigate(movement.documentUrl);
      }
    },
    [navigate]
  );

  // If role is forbidden (VT-02)
  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 mb-3">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Hạn chế quyền truy cập
        </h3>
        <p className="text-xs text-slate-500 max-w-md mb-4">
          {STOCK_CARD_MESSAGES.FORBIDDEN_ROLE}
        </p>
      </div>
    );
  }

  const unit = stockCardData?.unit || selectedProduct?.unit || "Cái";
  const movements = stockCardData?.movements?.content || [];
  const totalElements = stockCardData?.movements?.totalElements || 0;
  const totalPages = stockCardData?.movements?.totalPages || 1;

  return (
    <div className="flex flex-col gap-5 w-full animate-auth-fade-in">
      {/* Page Title & Product Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.PRODUCTS)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 active:scale-95 rounded-xl text-slate-700 text-xs font-bold transition-all shadow-2xs shrink-0"
            title="Quay lại danh sách hàng hóa"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Quay lại</span>
          </button>
          <div className="p-2.5 rounded-xl bg-kv-blue-light text-kv-blue-primary shrink-0">
            <History className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>{STOCK_CARD_MESSAGES.TITLE}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {STOCK_CARD_MESSAGES.SUBTITLE}
            </p>
          </div>
        </div>

        {/* Product Picker Dropdown */}
        <div className="relative w-full md:w-96">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-white hover:border-kv-blue-primary cursor-pointer transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2 truncate">
              <Package className="w-4 h-4 text-slate-400 shrink-0" />
              {selectedProduct ? (
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {selectedProduct.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    SKU: {selectedProduct.sku}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  {STOCK_CARD_MESSAGES.SELECT_PRODUCT_PROMPT}
                </span>
              )}
            </div>
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </div>

          {/* Search Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 left-0 mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-scale-in">
              <div className="p-2 border-b border-slate-100 bg-slate-50">
                <input
                  type="text"
                  autoFocus
                  placeholder="Gõ tên, SKU hoặc mã vạch để tìm..."
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-kv-blue-primary"
                />
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {isProductsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Đang nạp danh sách sản phẩm...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Không tìm thấy sản phẩm nào
                  </div>
                ) : (
                  filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        prod.id === selectedProductId
                          ? "bg-kv-blue-light text-kv-blue-primary font-bold"
                          : "text-slate-700 font-medium"
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate">{prod.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{prod.sku}</span>
                          {prod.barcode && (
                            <span className="flex items-center gap-0.5">
                              <Barcode className="w-3 h-3" />
                              {prod.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                        Tồn: {prod.stockQuantity} {prod.unit}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* When no product selected */}
      {!selectedProductId && (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
          <Package className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3" />
          <h3 className="text-sm font-bold text-slate-700 mb-1">
            Chưa chọn mặt hàng
          </h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Vui lòng chọn một mặt hàng từ ô tìm kiếm phía trên để bắt đầu tra cứu thẻ kho và lịch sử biến động.
          </p>
        </div>
      )}

      {/* When product selected: Display full stock card */}
      {selectedProductId && (
        <>
          {/* Error notice if API fails */}
          {stockCardError && (
            <div
              role="alert"
              className="flex items-center gap-2.5 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                Không thể tải thông tin thẻ kho cho mặt hàng này. Vui lòng kiểm tra lại kết nối hoặc khoảng thời gian tra cứu.
              </span>
            </div>
          )}

          {/* KPI Summary Cards & Discrepancy Alert */}
          <StockCardSummaryCards
            openingStock={stockCardData?.openingStock ?? 0}
            totalQuantityIn={stockCardData?.totalQuantityIn ?? 0}
            totalQuantityOut={stockCardData?.totalQuantityOut ?? 0}
            closingStock={stockCardData?.closingStock ?? 0}
            currentStock={stockCardData?.currentStock ?? 0}
            unit={unit}
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
            unit={unit}
            isLoading={isStockCardLoading}
            page={page}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
            onOpenDocument={handleOpenDocument}
          />
        </>
      )}
    </div>
  );
};

export default StockCardPage;
