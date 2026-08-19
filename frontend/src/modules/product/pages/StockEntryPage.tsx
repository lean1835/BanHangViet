import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PRODUCT_LOG_ACTIONS,
  PRODUCT_MESSAGES,
  PRODUCT_STOCK_ENTRY_CONFIG,
} from "@/constants/product";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { StockEntryHistoryTable } from "@/modules/product/components/StockEntryHistoryTable";
import { GoodsReceiptModal } from "@/modules/product/components/GoodsReceiptModal";
import { GoodsReceiptDetailModal } from "@/modules/product/components/GoodsReceiptDetailModal";
import type { ICreateGoodsReceiptPayload, IGoodsReceipt } from "@/modules/product/types/IGoodsReceipt";
import {
  useGetProductsQuery,
  useCreateGoodsReceiptMutation,
  useGetGoodsReceiptsQuery,
} from "@/modules/product/services/productApi";
import { useGetSuppliersQuery } from "@/modules/supplier/services/supplierApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";

export const StockEntryPage = () => {
  const { showSuccess, showError } = useNotification();
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { data: productsData } = useGetProductsQuery({
    size: PRODUCT_STOCK_ENTRY_CONFIG.PRODUCT_QUERY_SIZE,
  });
  const products = productsData?.content || [];

  const { data: suppliers = [] } = useGetSuppliersQuery();
  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of suppliers) {
      if (s.id && s.name) {
        map.set(s.id, s.name);
      }
    }
    return map;
  }, [suppliers]);

  // Manage pagination state
  const [page, setPage] = useState<number>(PRODUCT_STOCK_ENTRY_CONFIG.INITIAL_PAGE);
  const PAGE_SIZE = PRODUCT_STOCK_ENTRY_CONFIG.GOODS_RECEIPT_PAGE_SIZE;

  // Call real API with batch size to allow client-side search and pagination
  const { data: receiptsData, isLoading: isReceiptsLoading, refetch } = useGetGoodsReceiptsQuery({
    page: PRODUCT_STOCK_ENTRY_CONFIG.INITIAL_PAGE,
    size: PRODUCT_STOCK_ENTRY_CONFIG.GOODS_RECEIPT_BATCH_SIZE,
  });

  const [createGoodsReceipt] = useCreateGoodsReceiptMutation();

  const [isGoodsReceiptModalOpen, setIsGoodsReceiptModalOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [stockEntrySearch, setStockEntrySearch] = useState("");

  const isOwner = currentRole === USER_ROLES.OWNER;
  const isAccountant = currentRole === USER_ROLES.ACCOUNTANT;
  const canCreateGoodsReceipt = isOwner;

  // Reset page when search term changes
  useEffect(() => {
    setPage(0);
  }, [stockEntrySearch]);

  // Filter goods receipts using useMemo for performance (mã phiếu, nhà cung cấp, ghi chú)
  const normalizedStockEntrySearch = stockEntrySearch.trim().toLocaleLowerCase("vi");
  const filteredReceipts = useMemo(() => {
    const list: IGoodsReceipt[] = receiptsData?.content || [];
    if (!normalizedStockEntrySearch) return list;
    return list.filter((receipt) => {
      const supplierName =
        receipt.supplierName ||
        (receipt.supplierId ? supplierMap.get(receipt.supplierId) : "") ||
        "";
      return [receipt.receiptNumber, supplierName, receipt.notes].some((value) =>
        (value || "").toLocaleLowerCase("vi").includes(normalizedStockEntrySearch)
      );
    });
  }, [receiptsData?.content, normalizedStockEntrySearch, supplierMap]);

  const totalElements = filteredReceipts.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;

  // Get paginated slice
  const paginatedReceipts = useMemo(() => {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredReceipts.slice(start, end);
  }, [filteredReceipts, page, PAGE_SIZE]);

  const handleAddStock = async (payload: ICreateGoodsReceiptPayload) => {
    try {
      const result = await createGoodsReceipt(payload).unwrap();

      const itemsCount = payload.details.length;
      addLogEntry(
        PRODUCT_LOG_ACTIONS.STOCK_ENTRY,
        `Lập phiếu nhập kho ${result.receiptNumber} (${itemsCount} mặt hàng)`
      );
      showSuccess(PRODUCT_MESSAGES.STOCK_UPDATE_SUCCESS);
      setPage(0);
      refetch();
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error, PRODUCT_MESSAGES.STOCK_UPDATE_FAILED);
      showError(`Lập phiếu nhập kho thất bại: ${errorMsg}`);
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Role Notice for Accountant */}
      {isAccountant && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold animate-auth-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              <strong>Chế độ Kế toán (VT-03):</strong> Bạn có quyền tra cứu danh sách và xem chi tiết phiếu nhập kho. Thao tác lập phiếu nhập thuộc thẩm quyền Chủ hộ kinh doanh (VT-01).
            </span>
          </div>
        </div>
      )}

      {/* Search & Actions Header Bar */}
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
            placeholder="Tìm theo mã phiếu nhập, nhà cung cấp, ghi chú..."
            aria-label="Tìm kiếm phiếu nhập kho"
            className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={APP_ROUTES.PRODUCT_SUPPLIERS}
            className="font-bold px-3.5 h-9 rounded-xl flex items-center gap-1.5 text-xs transition-all bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-500"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Quản lý Nhà cung cấp
          </Link>

          {canCreateGoodsReceipt && (
            <button
              type="button"
              onClick={() => setIsGoodsReceiptModalOpen(true)}
              className="font-bold px-4 h-9 rounded-xl flex items-center gap-1.5 text-xs transition-all bg-kv-blue-primary hover:bg-kv-blue-dark text-white shadow-2xs active:scale-[0.98]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Lập phiếu nhập kho
            </button>
          )}
        </div>
      </div>

      {/* Receipts History Table */}
      <div className="grid grid-cols-1 gap-6">
        {isReceiptsLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400 flex flex-col items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-kv-blue-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Đang tải danh sách phiếu nhập kho...</span>
          </div>
        ) : (
          <StockEntryHistoryTable
            receipts={paginatedReceipts}
            onViewDetails={setSelectedReceiptId}
          />
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-slate-200 bg-white px-5 py-3 rounded-xl shadow-2xs animate-auth-fade-in text-xs font-semibold text-slate-700">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="relative inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Trang trước
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page + 1 >= totalPages}
              className="relative ml-3 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition-colors"
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
