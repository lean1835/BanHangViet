import React, { useState, useMemo, useEffect } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { USER_ROLES } from "@/constants/roles";
import { APP_ROUTES } from "@/constants/routes";
import {
  SUPPLIER_MESSAGES,
  SUPPLIER_LOG_ACTIONS,
  SUPPLIER_ERROR_CODES,
  SUPPLIER_PAGINATION,
} from "@/constants/supplier";
import {
  SUPPLIER_DEBT_MESSAGES,
  SUPPLIER_DEBT_LOG_ACTIONS,
} from "@/constants/supplierDebt";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useNotification } from "@/hooks/useNotification";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IProductOutletContext } from "@/modules/product/pages/ProductsLayout";
import type { ISupplier } from "../types/ISupplier";
import type { IPaySupplierDebtRequest } from "../types/ISupplierDebt";
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useUpdateSupplierStatusMutation,
} from "../services/supplierApi";
import { usePaySupplierDebtMutation } from "../services/supplierDebtApi";
import { SupplierTable } from "../components/SupplierTable";
import {
  SupplierFormModal,
  type SupplierFormValues,
} from "../components/SupplierFormModal";
import { SupplierStatusModal } from "../components/SupplierStatusModal";
import { SupplierDetailModal } from "../components/SupplierDetailModal";
import { PaySupplierDebtModal } from "../components/PaySupplierDebtModal";

export const SupplierPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole, addLogEntry } = useDashboardDemo();
  const { showSuccess, showError } = useNotification();
  const canManage = currentRole === USER_ROLES.OWNER;
  const canManageDebt =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;

  // Outlet context from ProductsLayout
  const { supplierFilter } = useOutletContext<IProductOutletContext>();

  // Local search state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // RTK Query API Hooks
  const {
    data: suppliers = [],
    isLoading,
    isFetching,
  } = useGetSuppliersQuery();

  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const [updateSupplierStatus, { isLoading: isUpdatingStatus }] =
    useUpdateSupplierStatusMutation();
  const [paySupplierDebt] = usePaySupplierDebtMutation();

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(
    null
  );
  const [serverError, setServerError] = useState<{
    code?: number;
    message?: string;
  } | null>(null);

  // Client-side filtering
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      // Search term filter
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.trim().toLowerCase();
        const code = `ncc-${(sup.id || "").toLowerCase()}`;
        const name = (sup.name || "").toLowerCase();
        const phone = (sup.phoneNumber || "").toLowerCase();
        const email = (sup.email || "").toLowerCase();
        const tax = (sup.taxCode || "").toLowerCase();

        const matchesSearch =
          name.includes(query) ||
          phone.includes(query) ||
          code.includes(query) ||
          email.includes(query) ||
          tax.includes(query);

        if (!matchesSearch) return false;
      }

      // Debt range filter
      const debt = sup.currentDebt || 0;
      if (supplierFilter.debtFrom) {
        const fromVal = Number(supplierFilter.debtFrom);
        if (!isNaN(fromVal) && debt < fromVal) return false;
      }
      if (supplierFilter.debtTo) {
        const toVal = Number(supplierFilter.debtTo);
        if (!isNaN(toVal) && debt > toVal) return false;
      }

      // Status filter
      if (supplierFilter.status === "ACTIVE") {
        if (sup.status === "INACTIVE") return false;
      } else if (supplierFilter.status === "INACTIVE") {
        if (sup.status !== "INACTIVE") return false;
      }

      return true;
    });
  }, [suppliers, debouncedSearch, supplierFilter]);

  // Pagination State
  const [page, setPage] = useState<number>(SUPPLIER_PAGINATION.INITIAL_PAGE);
  const PAGE_SIZE = SUPPLIER_PAGINATION.PAGE_SIZE;

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(SUPPLIER_PAGINATION.INITIAL_PAGE);
  }, [debouncedSearch, supplierFilter]);

  const totalElements = filteredSuppliers.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;

  const paginatedSuppliers = useMemo(() => {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredSuppliers.slice(start, end);
  }, [filteredSuppliers, page, PAGE_SIZE]);

  // Handlers
  const handleOpenCreateModal = () => {
    setSelectedSupplier(null);
    setServerError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (supplier: ISupplier) => {
    setSelectedSupplier(supplier);
    setServerError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (supplier: ISupplier) => {
    navigate(APP_ROUTES.SUPPLIER_DETAIL(supplier.id));
  };

  const handleOpenStatusModal = (supplier: ISupplier) => {
    setSelectedSupplier(supplier);
    setIsStatusModalOpen(true);
  };

  const handleOpenPayModal = (supplier: ISupplier) => {
    setSelectedSupplier(supplier);
    setIsPayModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedSupplier) return;
    const nextStatus =
      selectedSupplier.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    const statusText =
      nextStatus === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động";
    try {
      await updateSupplierStatus({
        id: selectedSupplier.id,
        status: nextStatus,
      }).unwrap();
      addLogEntry(
        "Cập nhật trạng thái NCC",
        `Chuyển nhà cung cấp "${selectedSupplier.name}" sang "${statusText}"`
      );
      showSuccess(`Đã chuyển trạng thái nhà cung cấp sang "${statusText}"`);
      setIsStatusModalOpen(false);
      setSelectedSupplier(null);
    } catch (err: unknown) {
      showError(
        getApiErrorMessage(err, "Không thể cập nhật trạng thái nhà cung cấp")
      );
    }
  };

  const handleFormSubmit = async (values: SupplierFormValues) => {
    setServerError(null);
    const sanitizedEmail = values.email?.trim() ? values.email.trim() : null;
    const sanitizedTaxCode = values.taxCode?.trim()
      ? values.taxCode.trim()
      : null;
    const sanitizedAddress = values.address?.trim()
      ? values.address.trim()
      : null;
    const sanitizedNote = values.note?.trim() ? values.note.trim() : null;
    const debtAmount =
      typeof values.initialDebt === "number" && !isNaN(values.initialDebt)
        ? values.initialDebt
        : 0;
    const statusVal = values.status || "ACTIVE";

    try {
      if (selectedSupplier) {
        // Update existing supplier
        await updateSupplier({
          id: selectedSupplier.id,
          data: {
            name: values.name.trim(),
            phoneNumber: values.phoneNumber.trim(),
            email: sanitizedEmail,
            taxCode: sanitizedTaxCode,
            address: sanitizedAddress,
            note: sanitizedNote,
            status: statusVal,
            currentDebt: debtAmount,
            initialDebt: debtAmount,
          },
        }).unwrap();

        addLogEntry(
          SUPPLIER_LOG_ACTIONS.UPDATE,
          `Cập nhật thông tin nhà cung cấp "${values.name}" (${values.phoneNumber})`
        );
        showSuccess(SUPPLIER_MESSAGES.UPDATE_SUCCESS);
      } else {
        // Create new supplier
        await createSupplier({
          name: values.name.trim(),
          phoneNumber: values.phoneNumber.trim(),
          email: sanitizedEmail,
          taxCode: sanitizedTaxCode,
          address: sanitizedAddress,
          note: sanitizedNote,
          status: statusVal,
          initialDebt: debtAmount,
          currentDebt: debtAmount,
        }).unwrap();

        addLogEntry(
          SUPPLIER_LOG_ACTIONS.CREATE,
          `Thêm mới nhà cung cấp "${values.name}" (${values.phoneNumber})`
        );
        showSuccess(SUPPLIER_MESSAGES.CREATE_SUCCESS);
      }
      setIsFormModalOpen(false);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "data" in err) {
        const errorData = (
          err as { data?: { code?: number; message?: string } }
        ).data;
        if (errorData?.code === SUPPLIER_ERROR_CODES.PHONE_EXISTS) {
          setServerError({
            code: SUPPLIER_ERROR_CODES.PHONE_EXISTS,
            message: SUPPLIER_MESSAGES.PHONE_EXISTS_ERROR,
          });
          return;
        }
      }
      const message = getApiErrorMessage(
        err,
        selectedSupplier
          ? SUPPLIER_MESSAGES.UPDATE_FAILED
          : SUPPLIER_MESSAGES.CREATE_FAILED
      );
      showError(message);
      throw err;
    }
  };

  const handleConfirmPayDebt = async (payload: IPaySupplierDebtRequest) => {
    try {
      const result = await paySupplierDebt(payload).unwrap();
      const supplierName = selectedSupplier?.name || "nhà cung cấp";
      addLogEntry(
        SUPPLIER_DEBT_LOG_ACTIONS.PAY,
        `Thanh toán ${formatCurrency(payload.amount)} cho ${supplierName} (${payload.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" : "Tiền mặt"})`
      );
      showSuccess(
        `Thanh toán thành công ${formatCurrency(result.amount)} cho ${supplierName}!`
      );
      setIsPayModalOpen(false);
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        SUPPLIER_DEBT_MESSAGES.PAY_FAILED
      );
      showError(message);
      throw err;
    }
  };

  const handleExportFile = () => {
    if (suppliers.length === 0) {
      showError("Không có dữ liệu nhà cung cấp để xuất file.");
      return;
    }
    const headers = [
      "Mã NCC",
      "Tên nhà cung cấp",
      "Điện thoại",
      "Email",
      "Mã số thuế",
      "Địa chỉ",
      "Trạng thái",
      "Nợ hiện tại (VND)",
    ];
    const rows = filteredSuppliers.map((s) => [
      `NCC-${(s.id || "").slice(0, 6).toUpperCase()}`,
      `"${s.name}"`,
      `"${s.phoneNumber}"`,
      `"${s.email || ""}"`,
      `"${s.taxCode || ""}"`,
      `"${(s.address || "").replace(/"/g, '""')}"`,
      `"${s.status === "INACTIVE" ? "Ngừng hoạt động" : "Đang hoạt động"}"`,
      s.currentDebt || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Danh_sach_Nha_cung_cap_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Đã xuất danh sách nhà cung cấp thành công!");
  };

  return (
    <div className="flex flex-col gap-5 animate-page-fade">
      {/* Top Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-auth-fade-in">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Theo mã, tên, SĐT nhà cung cấp"
            aria-label="Tìm kiếm nhà cung cấp"
            className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 shadow-sm transition-all placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportFile}
            className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Xuất file
          </button>

          <Link
            to={APP_ROUTES.PRODUCT_STOCK_ENTRY}
            className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
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
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
            Nhập kho
          </Link>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-9 px-4 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nhà cung cấp
            </button>
          )}
        </div>
      </div>

      {/* 2. Supplier Table */}
      <SupplierTable
        suppliers={paginatedSuppliers}
        totalCount={totalElements}
        isLoading={isLoading || isFetching}
        canManage={canManage}
        canPayDebt={canManageDebt}
        onEdit={handleOpenEditModal}
        onToggleStatus={handleOpenStatusModal}
        onViewDetail={handleOpenDetailModal}
        onPayDebt={handleOpenPayModal}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* 4. Create / Edit Modal */}
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedSupplier}
        serverError={serverError}
      />

      {/* 5. Status Confirmation Modal */}
      <SupplierStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedSupplier(null);
        }}
        onConfirm={handleStatusConfirm}
        supplier={selectedSupplier}
        isUpdating={isUpdatingStatus}
      />

      {/* 6. Supplier Detail Modal */}
      <SupplierDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        onEdit={handleOpenEditModal}
        onToggleStatus={handleOpenStatusModal}
        onOpenPayModal={handleOpenPayModal}
        canManage={canManageDebt}
      />

      {/* 7. Pay Supplier Debt Modal */}
      <PaySupplierDebtModal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        onConfirmPayment={handleConfirmPayDebt}
      />
    </div>
  );
};

export default SupplierPage;
