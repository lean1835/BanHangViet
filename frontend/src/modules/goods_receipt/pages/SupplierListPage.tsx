import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import type { IProductOutletContext } from "@/modules/product/pages/ProductsLayout";
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  usePaySupplierDebtMutation,
} from "../services/supplierApi";
import type { ISupplier, ISupplierFilter, ICreateSupplierRequest } from "../types/supplier";
import { SupplierModal } from "../components/SupplierModal";
import { SupplierDetailDrawer } from "../components/SupplierDetailDrawer";
import { PayDebtModal } from "../components/PayDebtModal";

export const SupplierListPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { currentRole } = useDashboardDemo();
  const canManageSuppliers = currentRole === USER_ROLES.OWNER;

  // Read filter state passed down from ProductsLayout (rendered in left sidebar below Danh mục chức năng)
  const {
    supplierSearchQuery,
    setSupplierSearchQuery,
    supplierGroup,
    supplierMinDebt,
    supplierMaxDebt,
    supplierStatusFilter,
  } = useOutletContext<IProductOutletContext>();

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // RTK Query params
  const filterParams: ISupplierFilter = useMemo(
    () => ({
      searchQuery: supplierSearchQuery,
      groupName: supplierGroup,
      minDebt: supplierMinDebt,
      maxDebt: supplierMaxDebt,
      status: supplierStatusFilter,
      page,
      size: PAGE_SIZE,
    }),
    [supplierSearchQuery, supplierGroup, supplierMinDebt, supplierMaxDebt, supplierStatusFilter, page]
  );

  const { data: supplierData, isLoading } = useGetSuppliersQuery(filterParams);
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();
  const [payDebt, { isLoading: isPaying }] = usePaySupplierDebtMutation();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<ISupplier | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<ISupplier | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const suppliers = supplierData?.content || [];
  const totalElements = supplierData?.totalElements || 0;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  const allSelected = suppliers.length > 0 && selectedIds.length === suppliers.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(suppliers.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handlers
  const handleSaveSupplier = async (values: ICreateSupplierRequest & { id?: string }) => {
    try {
      if (values.id) {
        await updateSupplier({ id: values.id, ...values }).unwrap();
        showSuccess("Cập nhật thông tin nhà cung cấp thành công!");
      } else {
        await createSupplier(values).unwrap();
        showSuccess("Thêm mới nhà cung cấp thành công!");
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
    } catch (err: any) {
      showError(err?.data?.message || "Thao tác thất bại, vui lòng thử lại!");
      throw err;
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ngừng hoạt động nhà cung cấp "${name}"?`)) return;
    try {
      await deleteSupplier(id).unwrap();
      showSuccess("Đã ngừng hoạt động nhà cung cấp thành công!");
    } catch (err: any) {
      showError(err?.data?.message || "Không thể xóa nhà cung cấp này!");
    }
  };

  const handlePayDebtSubmit = async (data: { amount: number; paymentMethod: "CASH" | "BANK_TRANSFER"; notes?: string }) => {
    if (!payingSupplier) return;
    try {
      await payDebt({
        supplierId: payingSupplier.id,
        ...data,
      }).unwrap();
      showSuccess(`Đã ghi nhận thanh toán ${data.amount.toLocaleString("vi-VN")} đ cho nhà cung cấp!`);
      setPayingSupplier(null);
    } catch (err: any) {
      showError(err?.data?.message || "Thanh toán công nợ thất bại!");
      throw err;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-auth-fade-in">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            value={supplierSearchQuery}
            onChange={(e) => setSupplierSearchQuery(e.target.value)}
            placeholder="Theo mã, tên, SĐT nhà cung cấp"
            aria-label="Tìm kiếm nhà cung cấp"
            className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 shadow-xs transition-all"
          />
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export button */}
          <button
            type="button"
            onClick={() => showSuccess("Xuất danh sách nhà cung cấp thành công (Excel)!")}
            className="px-3.5 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Xuất file
          </button>

          {/* Nav to Stock entry */}
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.PRODUCT_STOCK_ENTRY)}
            className="px-3.5 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
            Nhập kho
          </button>

          {/* Add Supplier button */}
          {canManageSuppliers && (
            <button
              type="button"
              onClick={() => {
                setEditingSupplier(null);
                setIsModalOpen(true);
              }}
              className="px-4 h-9 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nhà cung cấp
            </button>
          )}
        </div>
      </div>

      {/* Main Full-Width Data Table Panel */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-200 p-5 pb-4">
            Quản lý Nhà cung cấp
          </h3>

          {isLoading ? (
            <div className="py-20 text-center text-slate-400 font-semibold animate-pulse">
              Đang tải danh sách nhà cung cấp...
            </div>
          ) : suppliers.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-semibold">
              Không tìm thấy nhà cung cấp nào phù hợp bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Mã nhà cung cấp</th>
                    <th className="p-3.5">Tên nhà cung cấp</th>
                    <th className="p-3.5">Điện thoại</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5 text-right">Nợ cần trả hiện tại</th>
                    <th className="p-3.5 text-right">Tổng mua</th>
                    <th className="p-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-700 bg-white">
                  {suppliers.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSupplierForDetail(s)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => handleToggleSelect(s.id)}
                          className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-800 hover:text-kv-blue-primary hover:underline">
                        {s.code}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 hover:text-kv-blue-primary">
                        {s.name}
                        {s.address && (
                          <span className="block text-[11px] font-normal text-slate-400 truncate max-w-md">
                            {s.address}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-700">{s.phone || "—"}</td>
                      <td className="p-3.5 text-slate-600">{s.email || "—"}</td>
                      <td className="p-3.5 text-right font-bold text-slate-800">
                        {s.currentDebt > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-extrabold">
                            {s.currentDebt.toLocaleString("vi-VN")} đ
                          </span>
                        ) : (
                          "0 đ"
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-800">
                        {s.totalPurchase > 0 ? `${s.totalPurchase.toLocaleString("vi-VN")} đ` : "0 đ"}
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {canManageSuppliers && (
                            <>
                              {s.currentDebt > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setPayingSupplier(s)}
                                  title="Thanh toán nợ"
                                  className="p-1 text-emerald-600 hover:text-emerald-800 transition-colors font-bold text-xs"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect width="20" height="14" x="2" y="5" rx="2" />
                                    <line x1="2" x2="22" y1="10" y2="10" />
                                  </svg>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteSupplier(s.id, s.name)}
                                title="Ngừng hoạt động"
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  <line x1="10" x2="10" y1="11" y2="17" />
                                  <line x1="14" x2="14" y1="11" y2="17" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border border-slate-200 bg-white px-5 py-3 rounded-xl shadow-xs text-xs font-semibold text-slate-700">
            <p className="text-slate-500">
              Hiển thị bản ghi từ <span className="font-bold text-slate-800">{page * PAGE_SIZE + 1}</span> đến{" "}
              <span className="font-bold text-slate-800">{Math.min((page + 1) * PAGE_SIZE, totalElements)}</span>{" "}
              trong tổng số <span className="font-bold text-slate-800">{totalElements}</span> nhà cung cấp
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 font-bold"
              >
                Trang trước
              </button>
              <span className="px-3 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-bold">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
                className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 font-bold"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSaveSupplier}
        initialData={editingSupplier}
        isLoading={isCreating || isUpdating}
      />

      <SupplierDetailDrawer
        isOpen={selectedSupplierForDetail !== null}
        onClose={() => setSelectedSupplierForDetail(null)}
        supplier={selectedSupplierForDetail}
        onEdit={(sup) => {
          setSelectedSupplierForDetail(null);
          setEditingSupplier(sup);
          setIsModalOpen(true);
        }}
        onOpenPayModal={(sup) => {
          setSelectedSupplierForDetail(null);
          setPayingSupplier(sup);
        }}
      />

      <PayDebtModal
        isOpen={payingSupplier !== null}
        onClose={() => setPayingSupplier(null)}
        supplier={payingSupplier}
        onPay={handlePayDebtSubmit}
        isLoading={isPaying}
      />
    </div>
  );
};

export default SupplierListPage;
