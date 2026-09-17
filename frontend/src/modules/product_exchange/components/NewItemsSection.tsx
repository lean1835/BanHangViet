import React, { useState, useCallback, useEffect } from "react";
import {
  ArrowUpRight,
  Search,
  Plus,
  Minus,
  Trash2,
  PackageCheck,
  AlertTriangle,
  Camera,
  Barcode,
  Boxes,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotification } from "@/hooks/useNotification";
import {
  useGetProductsQuery,
  useLazyGetProductsQuery,
} from "@/modules/product/services/productApi";
import { BarcodeScannerModal } from "@/modules/barcode/components/BarcodeScannerModal";
import { useBarcodeScanner } from "@/modules/barcode/hooks/useBarcodeScanner";
import { playBarcodeBeepSound } from "@/modules/barcode/utils/barcodeAudio";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IProduct } from "@/modules/product/types/IProduct";

export interface SelectedNewItemRow {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  stockQuantity: number;
  exchangeQuantity: number;
  taxRatePercentage?: number;
  error?: string | null;
}

interface NewItemsSectionProps {
  items: SelectedNewItemRow[];
  onAddItem: (product: IProduct) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, newQty: number) => void;
}

export const NewItemsSection: React.FC<NewItemsSectionProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
}) => {
  const { showError } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogPage, setCatalogPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"CATALOG" | "SELECTED">("CATALOG");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Khi người dùng gõ tìm kiếm thì reset trang về 0
  useEffect(() => {
    setCatalogPage(0);
  }, [debouncedSearch]);

  const {
    data: productsData,
    isLoading,
    isFetching,
  } = useGetProductsQuery({
    search: debouncedSearch.trim() || undefined,
    page: catalogPage,
    size: 6,
  });

  const [triggerGetProducts] = useLazyGetProductsQuery();

  const handleBarcodeScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      try {
        const res = await triggerGetProducts({
          search: trimmed,
          page: 0,
          size: 10,
        }).unwrap();

        const productList = res.content || [];
        // Ưu tiên tìm khớp chính xác barcode hoặc sku
        const found =
          productList.find(
            (p) =>
              p.barcode === trimmed ||
              p.sku.toLowerCase() === trimmed.toLowerCase() ||
              p.barcode?.toLowerCase() === trimmed.toLowerCase()
          ) || productList[0];

        if (found) {
          if ((found.stockQuantity ?? 0) <= 0) {
            playBarcodeBeepSound("error");
            showError(`Sản phẩm "${found.name}" đã hết hàng trong kho!`);
            return;
          }

          onAddItem(found);
          playBarcodeBeepSound("success");
          setSearchQuery("");
        } else {
          playBarcodeBeepSound("error");
          showError(`Không tìm thấy sản phẩm có mã vạch / SKU: "${trimmed}"`);
        }
      } catch (_err) {
        playBarcodeBeepSound("error");
        showError(`Lỗi khi tìm kiếm mã vạch "${trimmed}".`);
      }
    },
    [triggerGetProducts, onAddItem, showError]
  );

  // Lắng nghe máy quét barcode phần cứng qua USB/Bluetooth
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !isScannerOpen,
  });

  const handleKeyDownSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;
      await handleBarcodeScan(query);
    }
  };

  const handleSelectCatalogProduct = (product: IProduct) => {
    if ((product.stockQuantity ?? 0) <= 0) {
      showError(`Sản phẩm "${product.name}" đã hết hàng trong kho!`);
      return;
    }
    onAddItem(product);
  };

  const totalExchangeAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.exchangeQuantity,
    0
  );

  const catalogProducts = productsData?.content || [];
  const totalPages = productsData?.totalPages || 0;
  const totalElements = productsData?.totalElements || 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                3. Chọn Món Khách Đổi Sang
              </h3>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Đã chọn: {items.length} món
          </span>
        </div>

        {/* Toolbar: Search Input + Barcode Scanner Button */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              placeholder="Tìm theo tên, SKU hoặc quét mã vạch (Enter)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg transition shadow-sm flex-shrink-0"
            title="Quét mã vạch sản phẩm bằng Camera"
          >
            <Camera className="w-4 h-4" />
            <span>Quét Mã</span>
          </button>
        </div>

        {/* Tab Navigation: Catalog vs Selected */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab("CATALOG")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "CATALOG"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Danh Sách Sản Phẩm</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "CATALOG"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {totalElements}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SELECTED")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "SELECTED"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Món Đã Chọn</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                items.length > 0
                  ? activeTab === "SELECTED"
                    ? "bg-white text-blue-700"
                    : "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {items.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Catalog Products List */}
        {activeTab === "CATALOG" && (
          <div className="space-y-2.5">
            {isLoading || isFetching ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Đang tải danh sách sản phẩm cửa hàng...
              </div>
            ) : catalogProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                Không tìm thấy sản phẩm nào phù hợp với từ khóa
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {catalogProducts.map((product) => {
                  const selectedRow = items.find((i) => i.productId === product.id);
                  const isSelected = !!selectedRow;
                  const outOfStock = (product.stockQuantity ?? 0) <= 0;

                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-lg border transition flex items-center justify-between gap-3 ${
                        outOfStock
                          ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                          : isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate block">
                            {product.name}
                          </span>
                          {product.barcode && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              <Barcode className="w-3 h-3 text-slate-400" />
                              {product.barcode}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>SKU: {product.sku || "N/A"}</span>
                          <span>ĐVT: {product.unit}</span>
                          <span
                            className={`font-semibold ${
                              outOfStock
                                ? "text-rose-600"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            Tồn: {product.stockQuantity ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2.5 flex-shrink-0">
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                            {formatCurrency(product.price || 0)}
                          </span>
                          {isSelected && (
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">
                              Đã chọn: x{selectedRow.exchangeQuantity}
                            </span>
                          )}
                        </div>

                        {outOfStock ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                            Hết hàng
                          </span>
                        ) : isSelected ? (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(
                                product.id,
                                selectedRow.exchangeQuantity + 1
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            title="Tăng thêm số lượng đổi"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectCatalogProduct(product)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            title="Chọn sản phẩm này để đổi"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Chọn Đổi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700">
                <span>
                  Trang {catalogPage + 1} / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={catalogPage === 0}
                    onClick={() => setCatalogPage((p) => Math.max(0, p - 1))}
                    className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={catalogPage >= totalPages - 1}
                    onClick={() => setCatalogPage((p) => p + 1)}
                    className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Selected Items for Exchange */}
        {activeTab === "SELECTED" && (
          <div>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-medium">Chưa có sản phẩm nào được chọn đổi sang</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng quét mã vạch hoặc bấm vào tab Danh Sách Sản Phẩm để chọn
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("CATALOG")}
                  className="mt-3.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Mở Danh Sách Sản Phẩm</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
                {items.map((item) => {
                  const subtotal = item.unitPrice * item.exchangeQuantity;
                  const isOutOfStock = item.exchangeQuantity > item.stockQuantity;

                  return (
                    <div
                      key={item.productId}
                      className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/20 dark:border-blue-900/60 dark:bg-blue-950/10 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate block">
                            {item.productName}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>ĐVT: {item.unit || "Cái"}</span>
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <PackageCheck className="w-3 h-3" /> Tồn kho: {item.stockQuantity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.unitPrice)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.productId)}
                            className="text-slate-400 hover:text-rose-600 transition p-1"
                            title="Xóa món này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.productId, item.exchangeQuantity - 1)
                            }
                            disabled={item.exchangeQuantity <= 1}
                            className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            max={item.stockQuantity}
                            value={item.exchangeQuantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              onUpdateQuantity(item.productId, val);
                            }}
                            className="w-16 h-8 text-center text-sm font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.productId, item.exchangeQuantity + 1)
                            }
                            disabled={item.exchangeQuantity >= item.stockQuantity}
                            className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Thành tiền đổi</span>
                          <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>
                      </div>

                      {isOutOfStock && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-rose-600 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Số lượng vượt quá tồn kho khả dụng ({item.stockQuantity})</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("CATALOG")}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Chọn thêm sản phẩm khác từ danh mục</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Total Exchange Amount */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Tổng giá trị hàng đổi sang (B):
        </span>
        <span className="text-base font-black text-blue-600 dark:text-blue-400">
          {formatCurrency(totalExchangeAmount)}
        </span>
      </div>

      {/* Barcode Scanner Modal (Camera) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setIsScannerOpen(false);
          handleBarcodeScan(code);
        }}
      />
    </div>
  );
};
