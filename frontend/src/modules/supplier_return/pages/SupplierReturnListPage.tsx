import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useOutletContext } from "react-router-dom";
import {
  Search,
  Plus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import { SUPPLIER_RETURN_CONFIG } from "@/constants/supplierReturn";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateShort } from "@/utils/dateFormatter";
import { formatCurrency } from "@/utils/formatCurrency";
import { useGetGoodsReceiptsQuery } from "@/modules/product/services/productApi";
import { useGetSupplierReturnsQuery } from "../services/supplierReturnApi";
import { SupplierReturnTable } from "../components/SupplierReturnTable";
import { CreateSupplierReturnModal } from "../components/CreateSupplierReturnModal";
import { SupplierReturnDetailModal } from "../components/SupplierReturnDetailModal";
import type { IProductOutletContext } from "@/modules/product/pages/ProductsLayout";
import type { SupplierReturnFilterState } from "../components/SupplierReturnSidebar";

// Modal to select a Goods Receipt to create return
interface SelectReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReceipt: (receiptId: string) => void;
}

const SelectReceiptModal: React.FC<SelectReceiptModalProps> = ({
  isOpen,
  onClose,
  onSelectReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: receiptsData, isLoading: isReceiptsLoading } = useGetGoodsReceiptsQuery(
    { page: 0, size: 50 },
    { skip: !isOpen }
  );

  const { data: allReturnsData, isLoading: isReturnsLoading } = useGetSupplierReturnsQuery(
    { page: 0, size: 200 },
    { skip: !isOpen }
  );

  const isLoading = isReceiptsLoading || isReturnsLoading;

  // Map total returned amount by receipt id / receipt number
  const returnsSummaryMap = useMemo(() => {
    const map = new Map<string, number>();
    (allReturnsData?.content || []).forEach((ret) => {
      if (ret.receiptId) {
        map.set(ret.receiptId, (map.get(ret.receiptId) || 0) + (ret.totalReturnAmount || 0));
      }
      if (ret.receiptNumber) {
        map.set(ret.receiptNumber, (map.get(ret.receiptNumber) || 0) + (ret.totalReturnAmount || 0));
      }
    });
    return map;
  }, [allReturnsData]);

  if (!isOpen) return null;

  const receipts = receiptsData?.content || [];
  const filtered = receipts.filter((r) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      (r.receiptNumber || "").toLowerCase().includes(q) ||
      (r.supplierName || "").toLowerCase().includes(q) ||
      (r.notes || "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-auth-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">
              Chọn Phiếu Nhập Kho Để Trả Hàng
            </h3>
            <p className="text-xs text-slate-500">
              Chọn một phiếu nhập từ nhà cung cấp cần hoàn trả sản phẩm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã phiếu nhập, tên nhà cung cấp..."
              className="w-full pl-9 pr-4 h-9 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs font-semibold text-slate-700"
            />
          </div>
        </div>

        {/* List of receipts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Đang tải danh sách phiếu nhập kho...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Không tìm thấy phiếu nhập kho phù hợp.
            </div>
          ) : (
            filtered.map((r) => {
              const returnedFromSummary =
                (r.id ? returnsSummaryMap.get(r.id) : 0) ||
                (r.receiptNumber ? returnsSummaryMap.get(r.receiptNumber) : 0) ||
                0;

              const totalReturned =
                r.totalReturnedAmount && r.totalReturnedAmount > 0
                  ? r.totalReturnedAmount
                  : returnedFromSummary;

              const isFullyReturned =
                r.returnStatus === "FULLY_RETURNED" ||
                (Boolean(r.totalAmount) && totalReturned >= (r.totalAmount || 0) - 1);

              const isPartiallyReturned =
                !isFullyReturned &&
                (r.returnStatus === "PARTIALLY_RETURNED" || totalReturned > 0);

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    if (isFullyReturned) return;
                    onSelectReceipt(r.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isFullyReturned
                      ? "border-slate-200 bg-slate-50/70 opacity-65 cursor-not-allowed"
                      : isPartiallyReturned
                      ? "border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer group"
                      : "border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 cursor-pointer group"
                  }`}
                  title={isFullyReturned ? "Phiếu nhập này đã được hoàn trả toàn bộ cho NCC, không thể trả thêm" : undefined}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-extrabold text-xs ${
                          isFullyReturned
                            ? "text-slate-500 line-through decoration-slate-400"
                            : isPartiallyReturned
                            ? "text-slate-800 group-hover:text-amber-700"
                            : "text-slate-800 group-hover:text-rose-600"
                        }`}
                      >
                        {r.receiptNumber}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        • {formatDateShort(r.receivedAt)}
                      </span>

                      {/* Trạng thái trả hàng */}
                      {isFullyReturned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <CheckCircle2 className="h-3 w-3 text-rose-500" />
                          Đã trả toàn bộ
                        </span>
                      ) : isPartiallyReturned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <RotateCcw className="h-3 w-3 text-amber-600" />
                          Đã trả 1 phần
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Chưa trả hàng
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 mt-0.5">
                      NCC: <strong>{r.supplierName || "— (Nhập lẻ)"}</strong>
                      {totalReturned > 0 ? (
                        <span className="ml-2 text-[11px] text-rose-600 font-semibold">
                          (Đã trả lại: {formatCurrency(totalReturned)})
                        </span>
                      ) : null}
                    </div>
                    {r.notes && (
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">
                        {r.notes}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className={`block font-extrabold text-xs ${
                        isFullyReturned ? "text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {formatCurrency(r.totalAmount || 0)}
                    </span>
                    {isFullyReturned ? (
                      <button
                        type="button"
                        disabled
                        className="mt-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed"
                      >
                        Đã trả xong
                      </button>
                    ) : isPartiallyReturned ? (
                      <button
                        type="button"
                        className="mt-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-all"
                      >
                        Chọn trả tiếp
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mt-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200 group-hover:bg-rose-600 group-hover:text-white transition-all"
                      >
                        Chọn trả hàng
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export const SupplierReturnListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRole } = useDashboardDemo();

  // Outlet context from ProductsLayout if available
  const outletContext = useOutletContext<
    IProductOutletContext & {
      supplierReturnFilter?: SupplierReturnFilterState;
      setSupplierReturnFilter?: React.Dispatch<
        React.SetStateAction<SupplierReturnFilterState>
      >;
    }
  >();

  const isOwner = currentRole === USER_ROLES.OWNER;
  const isAccountant = currentRole === USER_ROLES.ACCOUNTANT;
  const canCreate = isOwner;

  // Search & Pagination
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 300);
  const [page, setPage] = useState<number>(SUPPLIER_RETURN_CONFIG.INITIAL_PAGE);
  const pageSize = SUPPLIER_RETURN_CONFIG.DEFAULT_PAGE_SIZE;

  // Filter state
  const filter = outletContext?.supplierReturnFilter || {
    supplierId: "",
    fromDate: "",
    toDate: "",
  };

  // Modals state
  const [isSelectReceiptOpen, setIsSelectReceiptOpen] = useState(false);
  const [createReceiptId, setCreateReceiptId] = useState<string | null>(null);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  // Read query params for direct links
  useEffect(() => {
    const directReceiptId = searchParams.get("createReceiptId");
    if (directReceiptId) {
      setCreateReceiptId(directReceiptId);
    }
    const directDetailId = searchParams.get("id");
    if (directDetailId) {
      setSelectedReturnId(directDetailId);
    }
  }, [searchParams]);

  // Query supplier returns
  const { data, isLoading, refetch } = useGetSupplierReturnsQuery({
    supplierId: filter.supplierId || undefined,
    fromDate: filter.fromDate || undefined,
    toDate: filter.toDate || undefined,
    keyword: debouncedKeyword.trim() || undefined,
    page,
    size: pageSize,
  });

  const returns = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 1;

  const handleReturnSuccess = (newReturnId: string) => {
    refetch();
    setSelectedReturnId(newReturnId);
    // Clean URL query params if any
    if (searchParams.get("createReceiptId")) {
      searchParams.delete("createReceiptId");
      setSearchParams(searchParams);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Role Notice for Accountant */}
      {isAccountant && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold animate-auth-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>
              <strong>Chế độ Kế toán (VT-03):</strong> Bạn có quyền tra cứu danh sách và xem chi tiết phiếu trả hàng nhà cung cấp. Quyền lập phiếu trả hàng thuộc về Chủ hộ kinh doanh (VT-01).
            </span>
          </div>
        </div>
      )}

      {/* Header Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-auth-fade-in">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo mã phiếu trả, mã phiếu nhập gốc..."
            aria-label="Tìm kiếm phiếu trả hàng"
            className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={APP_ROUTES.PRODUCT_STOCK_ENTRY}
            className="font-bold px-3.5 h-9 rounded-xl flex items-center gap-1.5 text-xs transition-all bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
            <span>Lịch sử Nhập kho</span>
          </Link>

          {canCreate && (
            <button
              type="button"
              onClick={() => setIsSelectReceiptOpen(true)}
              className="font-bold px-4 h-9 rounded-xl flex items-center gap-1.5 text-xs transition-all bg-rose-600 hover:bg-rose-700 text-white shadow-2xs active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Lập phiếu trả hàng NCC</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
            <span className="text-xs font-semibold">
              Đang tải danh sách phiếu trả hàng nhà cung cấp...
            </span>
          </div>
        ) : (
          <SupplierReturnTable
            returns={returns}
            onViewDetails={(id) => setSelectedReturnId(id)}
            page={page}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Modal to Select Goods Receipt */}
      {isSelectReceiptOpen && (
        <SelectReceiptModal
          isOpen={isSelectReceiptOpen}
          onClose={() => setIsSelectReceiptOpen(false)}
          onSelectReceipt={(receiptId) => setCreateReceiptId(receiptId)}
        />
      )}

      {/* Modal to Create Supplier Return */}
      {createReceiptId && (
        <CreateSupplierReturnModal
          isOpen={Boolean(createReceiptId)}
          onClose={() => setCreateReceiptId(null)}
          receiptId={createReceiptId}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* Modal to View Detail & Print Voucher Sheet */}
      {selectedReturnId && (
        <SupplierReturnDetailModal
          isOpen={Boolean(selectedReturnId)}
          onClose={() => {
            setSelectedReturnId(null);
            if (searchParams.get("id")) {
              searchParams.delete("id");
              setSearchParams(searchParams);
            }
          }}
          returnId={selectedReturnId}
        />
      )}
    </div>
  );
};

export default SupplierReturnListPage;
