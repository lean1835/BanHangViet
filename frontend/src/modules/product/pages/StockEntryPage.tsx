import { useMemo, useState } from "react";
import {
  PRODUCT_LOG_ACTIONS,
  PRODUCT_MESSAGE_BUILDERS,
  PRODUCT_MESSAGES,
  PRODUCT_STOCK_ENTRY_CONFIG,
} from "@/constants/product";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { StockEntryHistoryTable } from "@/modules/product/components/StockEntryHistoryTable";
import { GoodsReceiptModal } from "@/modules/product/components/GoodsReceiptModal";
import { GoodsReceiptDetailModal } from "@/modules/product/components/GoodsReceiptDetailModal";
import type { GoodsReceiptFormValues } from "@/modules/product/components/GoodsReceiptModal";
import {
  useGetProductsQuery,
  useCreateGoodsReceiptMutation,
  useGetGoodsReceiptsQuery,
} from "@/modules/product/services/productApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";

export const StockEntryPage = () => {
  const { showSuccess, showError } = useNotification();
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { data: productsData } = useGetProductsQuery({
    size: PRODUCT_STOCK_ENTRY_CONFIG.PRODUCT_QUERY_SIZE,
  });
  const products = productsData?.content || [];

  // Manage pagination state
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Call real API to fetch goods receipts list with pagination parameters
  const { data: receiptsData } = useGetGoodsReceiptsQuery({ page, size: PAGE_SIZE });
  const receipts = receiptsData?.content || [];
  const totalPages = receiptsData?.totalPages || 0;
  const totalElements = receiptsData?.totalElements || 0;

  const [createGoodsReceipt] = useCreateGoodsReceiptMutation();

  const [isGoodsReceiptModalOpen, setIsGoodsReceiptModalOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [stockEntrySearch, setStockEntrySearch] = useState("");

  const canCreateGoodsReceipt = currentRole === USER_ROLES.OWNER;

  // Filter goods receipts from backend using useMemo for performance
  const normalizedStockEntrySearch = stockEntrySearch.trim().toLocaleLowerCase("vi");
  const filteredReceipts = useMemo(() => {
    if (!normalizedStockEntrySearch) return receipts;
    return receipts.filter((receipt: any) =>
      [receipt.receiptNumber, receipt.notes, receipt.createdByUserName, receipt.receivedAt].some((value) =>
        (value || "").toLocaleLowerCase("vi").includes(normalizedStockEntrySearch)
      )
    );
  }, [receipts, normalizedStockEntrySearch]);

  const handleAddStock = async (values: GoodsReceiptFormValues) => {
    const prodId = values.productId;
    const qty = values.quantity;
    const price = values.purchasePrice;
    const selectedProduct = products.find((product) => product.id === prodId);

    if (!selectedProduct) throw new Error("Hàng hóa không tồn tại");

    const receiptNumber = values.receiptNumber.trim() || `NK-${Date.now()}`;

    try {
      await createGoodsReceipt({
        receiptNumber: receiptNumber,
        receivedAt: values.receivedAt + ":00",
        notes: values.notes || undefined,
        details: [
          {
            productId: selectedProduct.id,
            quantity: qty,
            purchasePrice: price,
          },
        ],
      }).unwrap();

      addLogEntry(
        PRODUCT_LOG_ACTIONS.STOCK_ENTRY,
        PRODUCT_MESSAGE_BUILDERS.STOCK_ENTRY_TARGET(
          selectedProduct.name,
          qty,
          selectedProduct.unit,
        ),
      );
      showSuccess(PRODUCT_MESSAGES.STOCK_UPDATE_SUCCESS);
      // Reset to page 0 to see the newly created receipt
      setPage(0);
    } catch (error: unknown) {
      showError(
        PRODUCT_MESSAGE_BUILDERS.STOCK_ENTRY_ERROR(
          getApiErrorMessage(
            error,
            PRODUCT_MESSAGES.STOCK_UPDATE_FAILED,
          ),
        ),
      );
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-auth-fade-in">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            value={stockEntrySearch}
            onChange={(event) => setStockEntrySearch(event.target.value)}
            placeholder="Theo mã phiếu, tên người lập, ghi chú"
            aria-label="Tìm kiếm phiếu nhập kho"
            className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 shadow-sm transition-all"
          />
        </div>

        {canCreateGoodsReceipt && (
          <button
            type="button"
            onClick={() => setIsGoodsReceiptModalOpen(true)}
            className="font-bold px-4 h-9 rounded-lg flex items-center gap-1.5 text-xs transition-all bg-kv-blue-primary hover:bg-kv-blue-dark text-white shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nhập kho
          </button>
        )}
      </div>

      {/* Receipts History Table */}
      <div className="grid grid-cols-1 gap-6">
        <StockEntryHistoryTable receipts={filteredReceipts} onViewDetails={setSelectedReceiptId} />
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-slate-200 bg-white px-5 py-3 rounded-xl shadow-sm animate-auth-fade-in text-xs font-semibold text-slate-700">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Trang trước
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page + 1 >= totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Trang sau
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-slate-500">
                Hiển thị bản ghi từ <span className="font-bold text-slate-800">{page * PAGE_SIZE + 1}</span> đến{" "}
                <span className="font-bold text-slate-800">
                  {Math.min((page + 1) * PAGE_SIZE, totalElements)}
                </span>{" "}
                trong tổng số <span className="font-bold text-slate-800">{totalElements}</span> bản ghi
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center font-bold"
              >
                Trang trước
              </button>
              <span className="px-3 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-bold">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
                className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center font-bold"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Goods Receipt Modal */}
      {canCreateGoodsReceipt && (
        <GoodsReceiptModal
          isOpen={isGoodsReceiptModalOpen}
          onClose={() => setIsGoodsReceiptModalOpen(false)}
          onSave={handleAddStock}
          products={products}
        />
      )}

      {/* View Goods Receipt Detail Modal */}
      <GoodsReceiptDetailModal
        isOpen={selectedReceiptId !== null}
        onClose={() => setSelectedReceiptId(null)}
        receiptId={selectedReceiptId}
      />
    </div>
  );
};

export default StockEntryPage;
