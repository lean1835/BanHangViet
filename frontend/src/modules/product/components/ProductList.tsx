import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { IProduct } from "../types/product";
import { ProductFormModal } from "./ProductFormModal";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "../services/productApi";

interface ProductListProps {
  userRole?: string;
  selectedGroup: string;
  stockFilter: "ALL" | "IN_STOCK" | "OUT_OF_STOCK";
}

export const ProductList: React.FC<ProductListProps> = ({
  userRole,
  selectedGroup,
  stockFilter,
}) => {
  const isOwner = userRole === "VT-01";

  // State controls
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(15);

  // Modal form controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

  // Custom toast notifications
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  };

  // Auto clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Delete modal controls
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  // Reset page to 0 on filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedGroup, stockFilter]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0); // Reset page on search
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Mutations
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  // API query
  const { data, isLoading, isError, refetch } = useGetProductsQuery({
    search: debouncedSearch || undefined,
    groupId: selectedGroup === "ALL" ? undefined : selectedGroup,
    stockFilter: stockFilter === "ALL" ? undefined : stockFilter,
    page: currentPage,
    size: pageSize,
  });

  const productsList = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  const displayedProducts = productsList;

  // Handlers
  const handleSaveProduct = async (productData: Partial<IProduct> & { taxRateId: string }) => {
    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, data: productData }).unwrap();
        showNotification("Cập nhật hàng hóa thành công!", "success");
      } else {
        await createProduct(productData).unwrap();
        showNotification("Thêm hàng hóa mới thành công!", "success");
      }
      refetch();
    } catch (err: any) {
      showNotification("Lỗi: " + (err?.data?.message || "Không thể lưu sản phẩm!"), "error");
      throw err;
    }
  };

  const handleEditProduct = (prod: IProduct) => {
    if (!isOwner) {
      showNotification("Chỉ Chủ hộ kinh doanh (VT-01) mới có quyền chỉnh sửa hàng hóa!", "error");
      return;
    }
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!isOwner) {
      showNotification("Chỉ Chủ hộ kinh doanh (VT-01) mới có quyền xóa hàng hóa!", "error");
      return;
    }
    setProductToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id).unwrap();
      showNotification(`Xóa sản phẩm "${productToDelete.name}" thành công!`, "success");
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      refetch();
    } catch (err: any) {
      showNotification("Lỗi: " + (err?.data?.message || "Không thể xóa hàng hóa!"), "error");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
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
            placeholder="Theo mã, tên hàng"
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
              Tạo mới
            </button>
          ) : (
            <button
              disabled
              title="Chỉ Chủ hộ kinh doanh mới được thêm hàng hóa"
              className="bg-slate-200 text-slate-400 font-bold px-4 h-9 rounded-lg flex items-center gap-1.5 text-xs cursor-not-allowed"
            >
              <Plus size={14} />
              Tạo mới
            </button>
          )}
        </div>
      </div>

      {/* Main product table card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] w-full">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center flex-1 py-20 text-slate-400 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kv-blue-primary"></div>
            <span className="text-xs font-bold">Đang tải danh mục hàng hóa...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col justify-center items-center flex-1 py-20 text-rose-500 gap-2 font-bold">
            <span>Không thể kết nối đến máy chủ API để lấy hàng hóa!</span>
            <button
              onClick={() => refetch()}
              className="text-xs bg-slate-100 hover:bg-slate-200 border px-3 py-1.5 rounded-lg text-slate-700 transition-all"
            >
              Thử lại
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="flex flex-col justify-center items-center flex-1 py-20 text-slate-400 gap-2 font-semibold">
            <span>Không tìm thấy hàng hóa nào phù hợp bộ lọc!</span>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                    <th className="p-3">STT</th>
                    <th className="p-3">Mã hàng (SKU)</th>
                    <th className="p-3 w-56">Tên hàng</th>
                    <th className="p-3">Đơn vị</th>
                    <th className="p-3 text-right">Giá bán</th>
                    <th className="p-3 text-right">Tồn kho</th>
                    <th className="p-3">Nhóm hàng</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3">Ngày tạo</th>
                    {isOwner && <th className="p-3 text-center w-20">Thao tác</th>}
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
                        {currentPage * pageSize + index + 1}
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
                          prod.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {prod.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-semibold">{formatDate(prod.createdAt)}</td>
                      {isOwner && (
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditProduct(prod)}
                              title="Chỉnh sửa sản phẩm"
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-kv-blue-primary transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              title="Xóa sản phẩm"
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4 font-semibold text-slate-500 text-xs">
                <span>
                  Đang hiển thị {displayedProducts.length} trên tổng số {totalElements} hàng hóa
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 h-8 border rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trước
                  </button>
                  <span className="font-bold text-slate-700">
                    Trang {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 h-8 border rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Sau
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
              Xác nhận xóa hàng hóa?
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6 font-semibold">
              Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-700">"{productToDelete.name}"</strong> khỏi hệ thống? Thao tác này sẽ ngừng kinh doanh sản phẩm này và không thể hoàn tác.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
                className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors h-9 rounded-lg text-slate-700 font-bold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDeleteProduct}
                type="button"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white transition-colors h-9 rounded-lg font-bold shadow-sm text-xs"
              >
                Xác nhận xóa
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
            notification.type === "success" ? "bg-emerald-500" : "bg-rose-500"
          }`}>
            {notification.type === "success" ? "✓" : "✕"}
          </div>
          <div className="flex flex-col gap-0.5 max-w-[200px] text-left">
            <span className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
              {notification.type === "success" ? "Thành công" : "Thông báo"}
            </span>
            <span className="text-slate-500 text-[11px] font-semibold leading-snug break-words">
              {notification.message}
            </span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-auto font-semibold text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
