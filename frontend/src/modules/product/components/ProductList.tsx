import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import {
  PRODUCT_FILTER,
  PRODUCT_API_RESPONSE_DEFAULTS,
  PRODUCT_LABELS,
  PRODUCT_LIST_COPY,
  PRODUCT_MESSAGE_BUILDERS,
  PRODUCT_MESSAGES,
  PRODUCT_NOTIFICATION_TYPE,
  PRODUCT_QUERY_CONFIG,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STOCK_FILTER,
  PRODUCT_SYMBOLS,
  PRODUCT_UI_CONFIG,
  type TProductNotificationType,
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

  // Custom toast notifications
  const [notification, setNotification] = useState<{
    message: string;
    type: TProductNotificationType;
  } | null>(null);

  const showNotification = (
    message: string,
    type: TProductNotificationType,
  ) => {
    setNotification({ message, type });
  };

  // Auto clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, PRODUCT_UI_CONFIG.NOTIFICATION_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Delete modal controls
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

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
  const [deleteProduct] = useDeleteProductMutation();

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
        showNotification(
          PRODUCT_MESSAGES.UPDATE_SUCCESS,
          PRODUCT_NOTIFICATION_TYPE.SUCCESS,
        );
      } else {
        await createProduct(productData).unwrap();
        showNotification(
          PRODUCT_MESSAGES.CREATE_SUCCESS,
          PRODUCT_NOTIFICATION_TYPE.SUCCESS,
        );
      }
      refetch();
    } catch (error: unknown) {
      showNotification(
        PRODUCT_MESSAGE_BUILDERS.API_ERROR(
          getApiErrorMessage(error, PRODUCT_MESSAGES.SAVE_FAILED),
        ),
        PRODUCT_NOTIFICATION_TYPE.ERROR,
      );
      throw error;
    }
  };

  const handleEditProduct = (prod: IProduct) => {
    if (!isOwner) {
      showNotification(
        PRODUCT_MESSAGES.OWNER_EDIT_ONLY,
        PRODUCT_NOTIFICATION_TYPE.ERROR,
      );
      return;
    }
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!isOwner) {
      showNotification(
        PRODUCT_MESSAGES.OWNER_DELETE_ONLY,
        PRODUCT_NOTIFICATION_TYPE.ERROR,
      );
      return;
    }
    setProductToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id).unwrap();
      showNotification(
        PRODUCT_MESSAGE_BUILDERS.PRODUCT_DELETE_SUCCESS(productToDelete.name),
        PRODUCT_NOTIFICATION_TYPE.SUCCESS,
      );
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      refetch();
    } catch (error: unknown) {
      showNotification(
        PRODUCT_MESSAGE_BUILDERS.API_ERROR(
          getApiErrorMessage(error, PRODUCT_MESSAGES.DELETE_FAILED),
        ),
        PRODUCT_NOTIFICATION_TYPE.ERROR,
      );
    }
  };


  return (
    <div className="flex flex-col gap-4 w-full animate-auth-fade-in">
      {/* Top action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder={PRODUCT_LIST_COPY.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 shadow-sm transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOwner ? (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="bg-kv-blue-primary hover:bg-kv-blue-dark transition-all text-white font-bold px-4 h-9 rounded-lg flex items-center gap-1.5 shadow-sm text-xs"
            >
              <Plus size={14} />
              {PRODUCT_LABELS.CREATE}
            </button>
          ) : (
            <button
              disabled
              title={PRODUCT_LIST_COPY.OWNER_CREATE_TOOLTIP}
              className="bg-slate-200 text-slate-400 font-bold px-4 h-9 rounded-lg flex items-center gap-1.5 text-xs cursor-not-allowed"
            >
              <Plus size={14} />
              {PRODUCT_LABELS.CREATE}
            </button>
          )}
        </div>
      </div>

      {/* Main product table card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
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
              <table className="w-full text-left border-collapse">
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
                      <td className="p-3 font-mono font-bold text-slate-800">{prod.sku}</td>
                      <td className="p-3 font-bold text-slate-800 break-words max-w-[220px]">
                        {prod.name}
                      </td>
                      <td className="p-3 text-slate-600 font-semibold">{prod.unit}</td>
                      <td className="p-3 text-right font-extrabold text-kv-blue-primary">
                        {formatCurrency(prod.price)}
                      </td>
                      <td className="p-3 text-right font-extrabold text-emerald-600">
                        {formatNumber(prod.stockQuantity)}
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
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditProduct(prod)}
                              title={PRODUCT_LIST_COPY.EDIT_TOOLTIP}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-kv-blue-primary transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              title={PRODUCT_LIST_COPY.DELETE_TOOLTIP}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition-colors"
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
            {totalPages > PRODUCT_QUERY_CONFIG.MIN_PAGINATION_PAGE_COUNT && (
              <div className="flex items-center justify-between border-t pt-4 mt-4 font-semibold text-slate-500 text-xs">
                <span>
                  {PRODUCT_LIST_COPY.PAGINATION_PREFIX} {displayedProducts.length}{" "}
                  {PRODUCT_LIST_COPY.PAGINATION_TOTAL} {totalElements}{" "}
                  {PRODUCT_LIST_COPY.PAGINATION_SUFFIX}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(
                          PRODUCT_QUERY_CONFIG.INITIAL_PAGE,
                          page - PRODUCT_QUERY_CONFIG.PAGE_STEP,
                        ),
                      )
                    }
                    disabled={currentPage === PRODUCT_QUERY_CONFIG.INITIAL_PAGE}
                    className="px-3 h-8 border rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {PRODUCT_LIST_COPY.PREVIOUS_PAGE_ACTION}
                  </button>
                  <span className="font-bold text-slate-700">
                    {PRODUCT_LIST_COPY.PAGE_LABEL}{" "}
                    {currentPage + PRODUCT_QUERY_CONFIG.DISPLAY_INDEX_OFFSET} /{" "}
                    {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(
                          totalPages - PRODUCT_QUERY_CONFIG.PAGE_STEP,
                          page + PRODUCT_QUERY_CONFIG.PAGE_STEP,
                        ),
                      )
                    }
                    disabled={
                      currentPage === totalPages - PRODUCT_QUERY_CONFIG.PAGE_STEP
                    }
                    className="px-3 h-8 border rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {PRODUCT_LIST_COPY.NEXT_PAGE_ACTION}
                  </button>
                </div>
              </div>
            )}
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
          onClick={() => setIsDeleteModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden flex flex-col p-6 animate-modal-bounce-in text-center"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4 border border-rose-100">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm mb-2">
              {PRODUCT_LIST_COPY.DELETE_TITLE}
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6 font-semibold">
              {PRODUCT_LIST_COPY.DELETE_DESCRIPTION_PREFIX}{" "}
              <strong className="text-slate-700">"{productToDelete.name}"</strong>{" "}
              {PRODUCT_LIST_COPY.DELETE_DESCRIPTION_SUFFIX}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
                className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors h-9 rounded-lg text-slate-700 font-bold text-xs"
              >
                {PRODUCT_LIST_COPY.CANCEL_ACTION}
              </button>
              <button
                onClick={confirmDeleteProduct}
                type="button"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white transition-colors h-9 rounded-lg font-bold shadow-sm text-xs"
              >
                {PRODUCT_LIST_COPY.DELETE_CONFIRM_ACTION}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-[200] flex items-center gap-3 bg-white border border-slate-100 shadow-2xl px-4 py-3 rounded-xl max-w-sm animate-modal-bounce-in">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
            notification.type === PRODUCT_NOTIFICATION_TYPE.SUCCESS
              ? "bg-emerald-500"
              : "bg-rose-500"
          }`}>
            {notification.type === PRODUCT_NOTIFICATION_TYPE.SUCCESS
              ? PRODUCT_SYMBOLS.SUCCESS
              : PRODUCT_SYMBOLS.CLOSE}
          </div>
          <div className="flex flex-col gap-0.5 max-w-[200px] text-left">
            <span className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
              {notification.type === PRODUCT_NOTIFICATION_TYPE.SUCCESS
                ? PRODUCT_LABELS.NOTIFICATION_SUCCESS
                : PRODUCT_LABELS.NOTIFICATION_NOTICE}
            </span>
            <span className="text-slate-500 text-[11px] font-semibold leading-snug break-words">
              {notification.message}
            </span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-auto font-semibold text-xs"
          >
            {PRODUCT_SYMBOLS.CLOSE}
          </button>
        </div>
      )}
    </div>
  );
};
