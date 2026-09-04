import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Edit, Trash2, FileSpreadsheet, AlertTriangle, Printer, Barcode, Mic } from "lucide-react";
import { ImportProductsModal } from "@/modules/product/components/ImportProductsModal";
import { BarcodePrintModal } from "@/modules/barcode/components/BarcodePrintModal";
import { VoiceSearchModal } from "@/modules/product/components/VoiceSearchModal";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import {
  PRODUCT_FILTER,
  PRODUCT_API_RESPONSE_DEFAULTS,
  PRODUCT_LABELS,
  PRODUCT_LIST_COPY,
  PRODUCT_MESSAGE_BUILDERS,
  PRODUCT_MESSAGES,
  PRODUCT_QUERY_CONFIG,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STOCK_FILTER,
} from "@/constants/product";
import { USER_ROLES } from "@/constants/roles";
import { useDebounce } from "@/hooks/useDebounce";
import { ProductFormModal } from "@/modules/product/components/ProductFormModal";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/modules/product/services/productApi";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatDate } from "@/utils/dateFormatter";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";

interface ProductListProps {
  userRole?: string;
  selectedGroup: string;
  stockFilter: TStockFilter;
}

export const ProductList: React.FC<ProductListProps> = ({
  userRole,
  selectedGroup,
  stockFilter,
}) => {
  const isOwner = userRole === USER_ROLES.OWNER;
  const { showSuccess, showError } = useNotification();

  // State controls
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(
    searchQuery,
    PRODUCT_QUERY_CONFIG.SEARCH_DEBOUNCE_MS,
  );
  const [currentPage, setCurrentPage] = useState<number>(
    PRODUCT_QUERY_CONFIG.INITIAL_PAGE,
  );
  const pageSize = PRODUCT_QUERY_CONFIG.PAGE_SIZE;

  // Modal form controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

  // Import Excel modal controls
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete modal controls
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  // Barcode print modal controls
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<{ id: string; name: string } | null>(null);

  // Voice search modal controls
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Reset page to 0 on filter changes
  useEffect(() => {
    setCurrentPage(PRODUCT_QUERY_CONFIG.INITIAL_PAGE);
  }, [selectedGroup, stockFilter]);

  // Reset page after the debounced search value changes.
  useEffect(() => {
    setCurrentPage(PRODUCT_QUERY_CONFIG.INITIAL_PAGE);
  }, [debouncedSearch]);

  // Mutations
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeletingProduct }] =
    useDeleteProductMutation();
  const deleteDialogRef = useAccessibleDialog({
    isOpen: isDeleteModalOpen && Boolean(productToDelete),
    onClose: () => setIsDeleteModalOpen(false),
    canClose: !isDeletingProduct,
  });

  // API query
  const { data, isLoading, isError, refetch } = useGetProductsQuery({
    search: debouncedSearch || undefined,
    groupId: selectedGroup === PRODUCT_FILTER.ALL ? undefined : selectedGroup,
    stockFilter:
      stockFilter === PRODUCT_STOCK_FILTER.ALL ? undefined : stockFilter,
    page: currentPage,
    size: pageSize,
  });

  const productsList = data?.content || [];
  const totalElements =
    data?.totalElements || PRODUCT_API_RESPONSE_DEFAULTS.NUMBER;
  const totalPages = data?.totalPages || PRODUCT_API_RESPONSE_DEFAULTS.NUMBER;

  const displayedProducts = productsList;

  // Handlers
  const handleSaveProduct = async (productData: Partial<IProduct> & { taxRateId: string }) => {
    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, data: productData }).unwrap();
        showSuccess(PRODUCT_MESSAGES.UPDATE_SUCCESS);
      } else {
        await createProduct(productData).unwrap();
        showSuccess(PRODUCT_MESSAGES.CREATE_SUCCESS);
      }
      refetch();
    } catch (error: unknown) {
      showError(
        PRODUCT_MESSAGE_BUILDERS.API_ERROR(
          getApiErrorMessage(error, PRODUCT_MESSAGES.SAVE_FAILED),
        ),
      );
      throw error;
    }
  };

  const handleEditProduct = (prod: IProduct) => {
    if (!isOwner) {
      showError(PRODUCT_MESSAGES.OWNER_EDIT_ONLY);
      return;
    }
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!isOwner) {
      showError(PRODUCT_MESSAGES.OWNER_DELETE_ONLY);
      return;
    }
    setProductToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete || isDeletingProduct) return;
    try {
      await deleteProduct(productToDelete.id).unwrap();
      showSuccess(
        PRODUCT_MESSAGE_BUILDERS.PRODUCT_DELETE_SUCCESS(productToDelete.name),
      );
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      refetch();
    } catch (error: unknown) {
      showError(
        PRODUCT_MESSAGE_BUILDERS.API_ERROR(
          getApiErrorMessage(error, PRODUCT_MESSAGES.DELETE_FAILED),
        ),
      );
    }
  };


  return (
    <div className="flex flex-col gap-4 w-full animate-auth-fade-in">
      {/* Top action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar input with Voice Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder={PRODUCT_LIST_COPY.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-10 text-xs font-semibold text-slate-700 shadow-sm transition-all focus:border-kv-blue-primary focus:outline-none lg:h-9"
          />
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-blue-600 transition-colors"
            title="Tìm hàng bằng giọng nói"
          >
            <Mic size={15} />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOwner && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 lg:h-9"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              Nhập từ file Excel
            </button>
          )}

          {isOwner ? (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="flex h-11 items-center gap-1.5 rounded-lg bg-kv-blue-primary px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-kv-blue-dark lg:h-9"
            >
              <Plus size={14} />
              {PRODUCT_LABELS.CREATE}
            </button>
          ) : (
            <button
              disabled
              title={PRODUCT_LIST_COPY.OWNER_CREATE_TOOLTIP}
              className="flex h-11 cursor-not-allowed items-center gap-1.5 rounded-lg bg-slate-200 px-4 text-xs font-bold text-slate-400 lg:h-9"
            >
              <Plus size={14} />
              {PRODUCT_LABELS.CREATE}
            </button>
          )}
        </div>
      </div>

      {/* Main product table card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
        {/* Block Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              {PRODUCT_LIST_COPY.CARD_TITLE}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {totalElements} {PRODUCT_LIST_COPY.PAGINATION_SUFFIX}
          </span>
        </div>
        {isLoading ? (
          <div className="flex flex-col justify-center items-center flex-1 py-20 text-slate-400 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kv-blue-primary"></div>
            <span className="text-xs font-bold">
              {PRODUCT_LIST_COPY.LOADING_MESSAGE}
            </span>
          </div>
        ) : isError ? (
          <div className="flex flex-col justify-center items-center flex-1 py-20 text-rose-500 gap-2 font-bold">
            <span>{PRODUCT_LIST_COPY.LOAD_ERROR_MESSAGE}</span>
            <button
              onClick={() => refetch()}
              className="text-xs bg-slate-100 hover:bg-slate-200 border px-3 py-1.5 rounded-lg text-slate-700 transition-all"
            >
              {PRODUCT_LIST_COPY.RETRY_ACTION}
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col justify-center items-center flex-1 py-20 text-slate-400 gap-2 font-semibold">
            <span>{PRODUCT_LIST_COPY.EMPTY_MESSAGE}</span>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-between">
            <div className="overflow-x-auto">
              <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                    <th className="p-3">{PRODUCT_LIST_COPY.TABLE_HEADERS.INDEX}</th>
                    <th className="p-3">{PRODUCT_LIST_COPY.TABLE_HEADERS.SKU}</th>
                    <th className="p-3 w-56">
                      {PRODUCT_LIST_COPY.TABLE_HEADERS.NAME}
                    </th>
                    <th className="p-3">{PRODUCT_LIST_COPY.TABLE_HEADERS.UNIT}</th>
                    <th className="p-3 text-right">
                      {PRODUCT_LIST_COPY.TABLE_HEADERS.PRICE}
                    </th>
                    <th className="p-3 text-right">
                      {PRODUCT_LIST_COPY.TABLE_HEADERS.STOCK}
                    </th>
                    <th className="p-3">{PRODUCT_LIST_COPY.TABLE_HEADERS.GROUP}</th>
                    <th className="p-3 text-center">
                      {PRODUCT_LIST_COPY.TABLE_HEADERS.STATUS}
                    </th>
                    <th className="p-3">
                      {PRODUCT_LIST_COPY.TABLE_HEADERS.CREATED_AT}
                    </th>
                    {isOwner && (
                      <th className="p-3 text-center w-20">
                        {PRODUCT_LIST_COPY.TABLE_HEADERS.ACTION}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
                  {/* Product Rows */}
                  {displayedProducts.map((prod, index) => (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/50 group transition-all"
                    >
                      <td className="p-3 text-slate-400 font-semibold">
                        {currentPage * pageSize +
                          index +
                          PRODUCT_QUERY_CONFIG.DISPLAY_INDEX_OFFSET}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        <div>{prod.sku}</div>
                        {prod.barcode && (
                          <div className="text-[10px] text-[#0070f4] flex items-center gap-1 font-semibold tracking-normal mt-0.5">
                            <Barcode size={11} className="shrink-0" />
                            <span>{prod.barcode}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-800 break-words max-w-[220px]">
                        {prod.name}
                      </td>
                      <td className="p-3 text-slate-600 font-semibold">{prod.unit}</td>
                      <td className="p-3 text-right font-extrabold text-kv-blue-primary">
                        {formatCurrency(prod.price)}
                      </td>
                      <td className="p-3 text-right font-extrabold">
                        {prod.minStockQuantity &&
                        prod.minStockQuantity > 0 &&
                        prod.stockQuantity <= prod.minStockQuantity ? (
                          <span
                            title={`Tồn kho dưới ngưỡng tối thiểu (${formatNumber(prod.minStockQuantity)})`}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-black ${
                              prod.stockQuantity <= 0
                                ? "text-rose-600 bg-rose-100/80"
                                : "text-amber-600 bg-amber-100/80"
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {formatNumber(prod.stockQuantity)}
                          </span>
                        ) : prod.stockQuantity <= 0 ? (
                          <span className="text-rose-600 font-bold">
                            {formatNumber(prod.stockQuantity)}
                          </span>
                        ) : (
                          <div>
                            <span className="text-slate-800 font-bold">
                              {formatNumber(prod.stockQuantity)}
                            </span>
                            {prod.posStocks && prod.posStocks.length > 0 && (
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">
                                <div>Điểm bán: <span className="font-semibold text-kv-blue-primary">{formatNumber(prod.allocatedStock ?? 0)}</span></div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {prod.groupName && (
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-semibold">
                            {prod.groupName}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          prod.status === PRODUCT_STATUS.ACTIVE
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {PRODUCT_STATUS_LABELS[prod.status]}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-semibold">
                        {formatDate(prod.createdAt)}
                      </td>
                      {isOwner && (
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                            <button
                              onClick={() => setBarcodePrintProduct({ id: prod.id, name: prod.name })}
                              title="In tem mã vạch"
                              aria-label="In tem mã vạch"
                              className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 lg:min-h-0 lg:min-w-0"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => handleEditProduct(prod)}
                              title={PRODUCT_LIST_COPY.EDIT_TOOLTIP}
                              aria-label={PRODUCT_LIST_COPY.EDIT_TOOLTIP}
                              className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-kv-blue-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary lg:min-h-0 lg:min-w-0"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              title={PRODUCT_LIST_COPY.DELETE_TOOLTIP}
                              aria-label={PRODUCT_LIST_COPY.DELETE_TOOLTIP}
                              className="flex min-h-11 min-w-11 items-center justify-center rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 lg:min-h-0 lg:min-w-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <TablePaginationFooter
              currentPage={currentPage}
              pageSize={pageSize}
              totalElements={totalElements}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              recordUnit="bản ghi"
            />
          </div>
        )}
      </div>

      {/* Form modal container */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && createPortal(
        <div
          onClick={() => {
            if (!isDeletingProduct) setIsDeleteModalOpen(false);
          }}
          className="app-modal-backdrop fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-2 backdrop-blur-sm animate-backdrop-fade-in sm:items-center sm:p-4"
        >
          <div
            ref={deleteDialogRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label={PRODUCT_LIST_COPY.DELETE_TITLE}
            aria-describedby="product-delete-description"
            className="app-modal-panel flex w-full max-w-sm flex-col overflow-y-auto rounded-xl border border-slate-100 bg-white p-5 text-center shadow-2xl animate-modal-bounce-in sm:p-6"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4 border border-rose-100">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm mb-2">
              {PRODUCT_LIST_COPY.DELETE_TITLE}
            </h3>
            <p
              id="product-delete-description"
              className="text-slate-500 text-xs leading-relaxed mb-6 font-semibold"
            >
              {PRODUCT_LIST_COPY.DELETE_DESCRIPTION_PREFIX}{" "}
              <strong className="text-slate-700">"{productToDelete.name}"</strong>{" "}
              {PRODUCT_LIST_COPY.DELETE_DESCRIPTION_SUFFIX}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
                disabled={isDeletingProduct}
                className="h-11 flex-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60 lg:h-9"
              >
                {PRODUCT_LIST_COPY.CANCEL_ACTION}
              </button>
              <button
                onClick={confirmDeleteProduct}
                type="button"
                disabled={isDeletingProduct}
                className="h-11 flex-1 rounded-lg bg-rose-600 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60 lg:h-9"
              >
                {PRODUCT_LIST_COPY.DELETE_CONFIRM_ACTION}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Import Products Modal */}
      <ImportProductsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          refetch();
        }}
      />

      {/* Barcode Print Modal */}
      {barcodePrintProduct && (
        <BarcodePrintModal
          isOpen={Boolean(barcodePrintProduct)}
          onClose={() => {
            setBarcodePrintProduct(null);
            refetch();
          }}
          productId={barcodePrintProduct.id}
          productName={barcodePrintProduct.name}
        />
      )}

      {/* Voice Search Modal */}
      {isVoiceModalOpen && (
        <VoiceSearchModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSelectProduct={(product) => {
            setSearchQuery(product.name);
          }}
          groupId={selectedGroup === PRODUCT_FILTER.ALL ? undefined : selectedGroup}
        />
      )}
    </div>
  );
};
