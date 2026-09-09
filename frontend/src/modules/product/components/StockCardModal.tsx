import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Barcode,
  Coins,
  Edit,
  ExternalLink,
  History,
  Info,
  Package,
  X,
} from "lucide-react";
import { useGetStockCardQuery } from "@/modules/product/services/productApi";
import { StockCardSummaryCards } from "./StockCardSummaryCards";
import { StockCardFilterBar } from "./StockCardFilterBar";
import { StockCardTable } from "./StockCardTable";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import {
  PRODUCT_STATUS,
  PRODUCT_STATUS_LABELS,
  STOCK_CARD_CONFIG,
  STOCK_CARD_MESSAGES,
} from "@/constants/product";
import { APP_ROUTES } from "@/constants/routes";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IStockMovement } from "@/modules/product/types/IStockCard";

export type TProductDetailTab = "INFO" | "STOCK_CARD";

export interface StockCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productName?: string;
  productSku?: string;
  product?: IProduct | null;
  initialTab?: TProductDetailTab;
  onEditProduct?: (product: IProduct) => void;
  canManage?: boolean;
}

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

export const StockCardModal: React.FC<StockCardModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productSku,
  product,
  initialTab = "STOCK_CARD",
  onEditProduct,
  canManage = false,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TProductDetailTab>(initialTab);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Dialog accessibility
  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(productId),
    onClose,
  });

  // Date filters state
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

  // RTK Query API Call
  const { data, isLoading, isFetching } = useGetStockCardQuery(
    {
      productId: productId || "",
      fromDate,
      toDate,
      page,
      size: pageSize,
    },
    {
      skip: !isOpen || !productId,
    }
  );

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
      if (!movement.documentUrl) return;
      onClose();
      navigate(movement.documentUrl);
    },
    [navigate, onClose]
  );

  const handleOpenFullScreen = useCallback(() => {
    if (!productId) return;
    onClose();
    navigate(`${APP_ROUTES.PRODUCT_STOCK_CARD}?productId=${productId}`);
  }, [navigate, onClose, productId]);

  if (!isOpen || !productId) return null;

  const displayName = product?.name || data?.productName || productName || "Sản phẩm";
  const displaySku = product?.sku || data?.productSku || productSku || "";
  const unit = product?.unit || data?.unit || "Cái";
  const movements = data?.movements?.content || [];
  const totalElements = data?.movements?.totalElements || 0;
  const totalPages = data?.movements?.totalPages || 1;
  const isDiscrepancy = Boolean(data?.isDiscrepancy);
  const isActive = product ? product.status === PRODUCT_STATUS.ACTIVE : true;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-card-modal-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-auth-fade-in"
    >
      <div
        ref={dialogRef}
        className="flex flex-col w-full max-w-5xl max-h-[90vh] bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-100 text-kv-blue-primary shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  id="stock-card-modal-title"
                  className="text-sm sm:text-base font-bold text-slate-800 truncate"
                >
                  {activeTab === "INFO"
                    ? `Chi tiết hàng hóa: ${displayName}`
                    : `${STOCK_CARD_MESSAGES.TITLE}: ${displayName}`}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5 truncate">
                <span className="flex items-center gap-1 font-mono text-slate-700 font-bold">
                  <Barcode className="w-3.5 h-3.5 text-slate-400" />
                  SKU: {displaySku}
                </span>
                <span>•</span>
                <span className="text-slate-600">
                  ĐVT: <strong className="text-slate-800">{unit}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "STOCK_CARD" && (
              <button
                type="button"
                onClick={handleOpenFullScreen}
                title="Mở toàn màn hình chuyên dụng"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary/30 text-xs font-bold transition-all shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xem toàn màn hình</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Đóng"
              aria-label="Đóng"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Header (Tương tự Chi tiết Nhà Cung Cấp) */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("INFO")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "INFO"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
            }`}
          >
            <Info size={14} />
            Thông tin chung
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STOCK_CARD")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "STOCK_CARD"
                ? "border-kv-blue-primary text-kv-blue-primary bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-t-lg"
            }`}
          >
            <History size={14} />
            Thẻ kho biến động
            {isDiscrepancy && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                Lệch tồn
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "INFO" ? (
            /* TAB 1: THÔNG TIN CHUNG (Thiết kế đơn giản, thanh thoát như chi tiết NCC) */
            <div className="flex flex-col gap-4 animate-auth-fade-in">
              {/* Product Title & Status Banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-4 shadow-2xs">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {displayName}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-1">
                    <span>Mã SKU: <strong className="font-mono text-slate-800">{displaySku}</strong></span>
                    {product?.barcode && (
                      <>
                        <span>•</span>
                        <span>Mã vạch: <strong className="font-mono text-kv-blue-primary">{product.barcode}</strong></span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
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

              {/* Highlight Metrics (Giá bán & Tồn kho) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">
                        Giá bán niêm yết
                      </span>
                      <span className="text-lg font-black text-kv-blue-primary">
                        {product ? formatCurrency(product.price) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">
                        Tồn kho khả dụng hiện tại
                      </span>
                      <span className="text-lg font-black text-slate-800">
                        {formatNumber(product?.stockQuantity ?? data?.currentStock ?? 0)}{" "}
                        <span className="text-xs font-semibold text-slate-400">{unit}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("STOCK_CARD")}
                    className="flex items-center gap-1 text-xs font-bold text-kv-blue-primary hover:underline"
                  >
                    <span>Xem thẻ kho</span>
                    <History size={13} />
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Đơn vị tính */}
                <div className="p-3 rounded-xl border border-slate-100 bg-white">
                  <span className="text-slate-400 font-medium block mb-0.5">
                    Đơn vị tính cơ sở
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {unit}
                  </span>
                </div>

                {/* Nhóm hàng */}
                <div className="p-3 rounded-xl border border-slate-100 bg-white">
                  <span className="text-slate-400 font-medium block mb-0.5">
                    Nhóm hàng hóa
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {product?.groupName || "Chưa phân nhóm"}
                  </span>
                </div>

                {/* Tồn tối thiểu */}
                <div className="p-3 rounded-xl border border-slate-100 bg-white">
                  <span className="text-slate-400 font-medium block mb-0.5">
                    Định mức tồn tối thiểu
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {product?.minStockQuantity
                      ? `${formatNumber(product.minStockQuantity)} ${unit}`
                      : "Không áp dụng"}
                  </span>
                </div>

                {/* Phân bổ điểm bán POS */}
                <div className="p-3 rounded-xl border border-slate-100 bg-white">
                  <span className="text-slate-400 font-medium block mb-0.5">
                    Tồn tại điểm bán POS
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {product?.allocatedStock
                      ? `${formatNumber(product.allocatedStock)} ${unit}`
                      : "0"}
                  </span>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200">
                <span>Ngày tạo: {formatDateTime(product?.createdAt)}</span>
                <span>Cập nhật: {formatDateTime(product?.updatedAt)}</span>
              </div>
            </div>
          ) : (
            /* TAB 2: THẺ KHO BIẾN ĐỘNG (Design lại cho đơn giản) */
            <div className="flex flex-col gap-3 animate-auth-fade-in">
              {/* Summary Metrics & Discrepancy Alert */}
              <StockCardSummaryCards
                openingStock={data?.openingStock ?? 0}
                totalQuantityIn={data?.totalQuantityIn ?? 0}
                totalQuantityOut={data?.totalQuantityOut ?? 0}
                closingStock={data?.closingStock ?? 0}
                currentStock={data?.currentStock ?? 0}
                unit={unit}
                isDiscrepancy={data?.isDiscrepancy}
                warning={data?.warning}
              />

              {/* Filter Bar */}
              <StockCardFilterBar
                fromDate={fromDate}
                toDate={toDate}
                onDateChange={handleDateChange}
                onReset={handleResetDates}
                isLoading={isLoading || isFetching}
              />

              {/* Movements Table */}
              <StockCardTable
                movements={movements}
                unit={unit}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                totalElements={totalElements}
                totalPages={totalPages}
                onPageChange={setPage}
                onOpenDocument={handleOpenDocument}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-slate-200 shrink-0 text-xs">
          <div>
            {canManage && product && onEditProduct && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProduct(product);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white font-bold transition-all shadow-2xs"
              >
                <Edit size={13} />
                <span>Chỉnh sửa hàng hóa</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors shadow-2xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StockCardModal;
