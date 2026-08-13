import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Edit3,
  Mail,
  MapPin,
  PackagePlus,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
import { ROLE_GROUPS, USER_ROLES, type TDemoRole } from "@/constants/roles";
import {
  SUPPLIER_EXPORT_CONFIG,
  SUPPLIER_FILTER,
  SUPPLIER_FORM_COPY,
  SUPPLIER_LIST_COPY,
  SUPPLIER_MESSAGES,
  SUPPLIER_QUERY_CONFIG,
  SUPPLIER_SECTION_COPY,
  SUPPLIER_STATUS,
} from "@/constants/supplier";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotification } from "@/hooks/useNotification";
import { SupplierDeleteDialog } from "@/modules/supplier/components/SupplierDeleteDialog";
import { SupplierFormModal } from "@/modules/supplier/components/SupplierFormModal";
import {
  useCreateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierGroupsQuery,
  useGetSuppliersQuery,
  useUpdateSupplierMutation,
} from "@/modules/supplier/services/supplierApi";
import type {
  ISupplier,
  ISupplierCreatePayload,
  ISupplierFilters,
  ISupplierQueryParams,
  ISupplierUpdatePayload,
} from "@/modules/supplier/types/ISupplier";
import { formatDateShort, getLocalDateString } from "@/utils/dateFormatter";
import { formatCurrency } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface SupplierListProps {
  currentRole: TDemoRole;
  filters: ISupplierFilters;
}

const SupplierTableSkeleton = () => (
  <div role="status" aria-label={SUPPLIER_LIST_COPY.LOADING_MESSAGE} className="animate-pulse p-4 sm:p-5">
    <span className="sr-only">{SUPPLIER_LIST_COPY.LOADING_MESSAGE}</span>
    <div className="hidden space-y-3 sm:block">
      <div className="h-10 rounded-lg bg-slate-100" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid grid-cols-6 gap-3">
          <div className="h-12 rounded-lg bg-slate-100" />
          <div className="col-span-2 h-12 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
    <div className="space-y-3 sm:hidden">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-40 rounded-xl bg-slate-100" />
      ))}
    </div>
  </div>
);

const SupplierEmptyState = () => (
  <div className="flex min-h-56 flex-1 items-center justify-center px-4 py-12 text-center">
    <p className="max-w-md text-xs font-semibold leading-5 text-slate-400">
      {SUPPLIER_LIST_COPY.FILTERED_EMPTY_DESCRIPTION}
    </p>
  </div>
);

export const SupplierList = ({ currentRole, filters }: SupplierListProps) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const isOwner = currentRole === USER_ROLES.OWNER;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(
    searchQuery,
    SUPPLIER_QUERY_CONFIG.SEARCH_DEBOUNCE_MS,
  );
  const [currentPage, setCurrentPage] = useState<number>(
    SUPPLIER_QUERY_CONFIG.INITIAL_PAGE,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<ISupplier | null>(null);

  const debtFrom = filters.debtFrom ? Number(filters.debtFrom) : null;
  const debtTo = filters.debtTo ? Number(filters.debtTo) : null;
  const hasInvalidDebtRange = Boolean(
    debtFrom !== null && debtTo !== null && debtFrom > debtTo,
  );
  const queryParams = useMemo<ISupplierQueryParams>(
    () => ({
      ...(debouncedSearchQuery.trim()
        ? { query: debouncedSearchQuery.trim() }
        : {}),
      ...(filters.groupId !== SUPPLIER_FILTER.ALL_GROUPS
        ? { groupId: filters.groupId }
        : {}),
      ...(debtFrom !== null ? { minDebt: debtFrom } : {}),
      ...(debtTo !== null ? { maxDebt: debtTo } : {}),
      ...(filters.status !== SUPPLIER_STATUS.ALL
        ? { status: filters.status }
        : {}),
    }),
    [debouncedSearchQuery, debtFrom, debtTo, filters.groupId, filters.status],
  );
  const {
    data: suppliers = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetSuppliersQuery(queryParams, { skip: hasInvalidDebtRange });
  const { data: groups = [], isLoading: isGroupsLoading } =
    useGetSupplierGroupsQuery();
  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeleting }] =
    useDeleteSupplierMutation();

  const filteredSuppliers = useMemo(
    () => (hasInvalidDebtRange ? [] : suppliers),
    [hasInvalidDebtRange, suppliers],
  );

  const totalPages = Math.ceil(
    filteredSuppliers.length / SUPPLIER_QUERY_CONFIG.PAGE_SIZE,
  );
  const paginatedSuppliers = filteredSuppliers.slice(
    currentPage * SUPPLIER_QUERY_CONFIG.PAGE_SIZE,
    (currentPage + 1) * SUPPLIER_QUERY_CONFIG.PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(SUPPLIER_QUERY_CONFIG.INITIAL_PAGE);
  }, [debouncedSearchQuery, filters]);

  useEffect(() => {
    if (totalPages === 0 && currentPage !== SUPPLIER_QUERY_CONFIG.INITIAL_PAGE) {
      setCurrentPage(SUPPLIER_QUERY_CONFIG.INITIAL_PAGE);
    } else if (totalPages > 0 && currentPage >= totalPages) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const openCreateForm = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const openEditForm = (supplier: ISupplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSupplier(null);
  };

  const saveSupplier = async (
    payload: ISupplierCreatePayload | ISupplierUpdatePayload,
  ) => {
    try {
      if (editingSupplier && "status" in payload) {
        await updateSupplier({ id: editingSupplier.id, data: payload }).unwrap();
        showSuccess(SUPPLIER_MESSAGES.UPDATE_SUCCESS);
      } else if ("initialDebt" in payload) {
        await createSupplier(payload).unwrap();
        showSuccess(SUPPLIER_MESSAGES.CREATE_SUCCESS);
      }
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, SUPPLIER_MESSAGES.SAVE_FAILED);
      showError(message);
      throw new Error(message);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete || isDeleting) return;

    try {
      await deleteSupplier(supplierToDelete.id).unwrap();
      setSupplierToDelete(null);
      showSuccess(SUPPLIER_MESSAGES.DELETE_SUCCESS);
    } catch (error: unknown) {
      showError(getApiErrorMessage(error, SUPPLIER_MESSAGES.DELETE_FAILED));
    }
  };

  const exportSuppliers = () => {
    if (filteredSuppliers.length === 0) return;

    try {
      const exportRows = filteredSuppliers.map((supplier, index) => ({
        STT: index + SUPPLIER_QUERY_CONFIG.DISPLAY_INDEX_OFFSET,
        "Mã nhà cung cấp": supplier.supplierCode,
        "Tên nhà cung cấp": supplier.name,
        "Nhóm nhà cung cấp": supplier.groupName,
        "Số điện thoại": supplier.phoneNumber,
        Email: supplier.email,
        "Địa chỉ": supplier.address,
        "Mã số thuế": supplier.taxCode,
        "Nợ hiện tại (VNĐ)": supplier.currentDebt,
        "Trạng thái":
          supplier.status === SUPPLIER_STATUS.ACTIVE
            ? SUPPLIER_LIST_COPY.ACTIVE_STATUS
            : SUPPLIER_LIST_COPY.INACTIVE_STATUS,
        "Ngày tạo": formatDateShort(supplier.createdAt),
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 38 },
        { wch: 28 },
        { wch: 28 },
        { wch: 16 },
        { wch: 28 },
        { wch: 38 },
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 20 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        SUPPLIER_EXPORT_CONFIG.SHEET_NAME,
      );
      XLSX.writeFile(
        workbook,
        `${SUPPLIER_EXPORT_CONFIG.FILE_PREFIX}_${getLocalDateString()}.xlsx`,
      );
      showSuccess(SUPPLIER_MESSAGES.EXPORT_SUCCESS);
    } catch {
      showError(SUPPLIER_MESSAGES.EXPORT_FAILED);
    }
  };

  const resultStart =
    currentPage * SUPPLIER_QUERY_CONFIG.PAGE_SIZE +
    SUPPLIER_QUERY_CONFIG.DISPLAY_INDEX_OFFSET;
  const resultEnd = Math.min(
    (currentPage + 1) * SUPPLIER_QUERY_CONFIG.PAGE_SIZE,
    filteredSuppliers.length,
  );

  const actionButtons = (supplier: ISupplier) => {
    if (!isOwner) return null;
    const hasOutstandingDebt = supplier.currentDebt > 0;

    return (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => openEditForm(supplier)}
          aria-label={`${SUPPLIER_LIST_COPY.EDIT_TOOLTIP}: ${supplier.name}`}
          title={SUPPLIER_LIST_COPY.EDIT_TOOLTIP}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-kv-blue-light hover:text-kv-blue-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary lg:min-h-8 lg:min-w-8"
        >
          <Edit3 size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!hasOutstandingDebt) setSupplierToDelete(supplier);
          }}
          disabled={hasOutstandingDebt}
          aria-label={`${SUPPLIER_LIST_COPY.DELETE_TOOLTIP}: ${supplier.name}`}
          title={
            hasOutstandingDebt
              ? SUPPLIER_LIST_COPY.DEBT_DELETE_TOOLTIP
              : SUPPLIER_LIST_COPY.DELETE_TOOLTIP
          }
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent lg:min-h-8 lg:min-w-8"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-4 animate-auth-fade-in">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label={SUPPLIER_LIST_COPY.SEARCH_LABEL}
            placeholder={SUPPLIER_LIST_COPY.SEARCH_PLACEHOLDER}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-10 text-xs font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-kv-blue-primary focus:ring-2 focus:ring-kv-blue-primary/15 lg:h-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={SUPPLIER_LIST_COPY.CLEAR_SEARCH_ACTION}
              className="absolute right-1 top-1/2 flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={exportSuppliers}
            disabled={filteredSuppliers.length === 0 || isLoading}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 lg:min-h-9"
          >
            <Download size={15} aria-hidden="true" />
            {SUPPLIER_LIST_COPY.EXPORT_ACTION}
          </button>
          {ROLE_GROUPS.PRODUCT_MANAGEMENT.some((role) => role === currentRole) && (
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.PRODUCT_STOCK_ENTRY)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary lg:min-h-9"
            >
              <PackagePlus size={15} aria-hidden="true" />
              {SUPPLIER_LIST_COPY.STOCK_ENTRY_ACTION}
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={openCreateForm}
              className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-kv-blue-primary px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-kv-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-blue-primary sm:col-span-1 lg:min-h-9"
            >
              <Plus size={15} aria-hidden="true" />
              {SUPPLIER_LIST_COPY.CREATE_ACTION}
            </button>
          )}
        </div>
      </div>

      <section aria-labelledby="supplier-list-title" className="flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <h1 id="supplier-list-title" className="truncate text-sm font-extrabold text-slate-800 sm:text-base">
              {SUPPLIER_LIST_COPY.TITLE}
            </h1>
            {!isLoading && !isError && (
              <span className="rounded-full bg-kv-blue-light px-2 py-0.5 text-[10px] font-extrabold text-kv-blue-primary">
                {filteredSuppliers.length}
              </span>
            )}
          </div>
          {isFetching && !isLoading && (
            <span className="text-[11px] font-semibold text-slate-400">Đang cập nhật...</span>
          )}
        </header>

        {isLoading ? (
          <SupplierTableSkeleton />
        ) : isError ? (
          <div className="flex min-h-64 flex-1 flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <CircleAlert size={26} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-sm font-extrabold text-slate-700">
              {SUPPLIER_LIST_COPY.LOAD_ERROR_TITLE}
            </h3>
            <p className="mt-1 max-w-md text-xs font-medium leading-5 text-slate-400">
              {SUPPLIER_LIST_COPY.LOAD_ERROR_DESCRIPTION}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary lg:min-h-9"
            >
              {SUPPLIER_LIST_COPY.RETRY_ACTION}
            </button>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <SupplierEmptyState />
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="hidden overflow-x-auto sm:block">
              <table className="responsive-data-table responsive-data-table--page w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th scope="col" className="p-3 font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.INDEX}</th>
                    <th scope="col" className="p-3 font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.SYSTEM_CODE}</th>
                    <th scope="col" className="min-w-48 p-3 font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.NAME}</th>
                    <th scope="col" className="min-w-40 p-3 font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.GROUP}</th>
                    <th scope="col" className="min-w-44 p-3 font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.CONTACT}</th>
                    <th scope="col" className="min-w-52 p-3 font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.ADDRESS}</th>
                    <th scope="col" className="p-3 font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.TAX_CODE}</th>
                    <th scope="col" className="p-3 text-right font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.CURRENT_DEBT}</th>
                    <th scope="col" className="p-3 text-center font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.STATUS}</th>
                    {isOwner && <th scope="col" className="p-3 text-right font-bold">{SUPPLIER_LIST_COPY.TABLE_HEADERS.ACTION}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {paginatedSuppliers.map((supplier, index) => (
                    <tr key={supplier.id} className="group min-h-12 transition-colors hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-400">
                        {currentPage * SUPPLIER_QUERY_CONFIG.PAGE_SIZE + index + SUPPLIER_QUERY_CONFIG.DISPLAY_INDEX_OFFSET}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {supplier.supplierCode || "--"}
                      </td>
                      <td className="p-3">
                        <div className="font-extrabold text-slate-800">{supplier.name}</div>
                        {supplier.note && <div className="mt-0.5 max-w-56 truncate text-[11px] text-slate-400" title={supplier.note}>{supplier.note}</div>}
                      </td>
                      <td className="p-3 font-semibold text-slate-600">
                        {supplier.groupName || "--"}
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-semibold text-slate-700">{supplier.phoneNumber}</div>
                        <div className="mt-0.5 max-w-44 truncate text-[11px] text-slate-400" title={supplier.email}>{supplier.email || "--"}</div>
                      </td>
                      <td className="max-w-64 p-3">
                        <span className="line-clamp-2" title={supplier.address}>{supplier.address || "--"}</span>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-700">{supplier.taxCode || "--"}</td>
                      <td className={`p-3 text-right font-extrabold ${supplier.currentDebt > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {formatCurrency(supplier.currentDebt)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            supplier.status === SUPPLIER_STATUS.ACTIVE
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                        >
                          {supplier.status === SUPPLIER_STATUS.ACTIVE
                            ? SUPPLIER_LIST_COPY.ACTIVE_STATUS
                            : SUPPLIER_LIST_COPY.INACTIVE_STATUS}
                        </span>
                      </td>
                      {isOwner && <td className="p-3">{actionButtons(supplier)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 bg-slate-50/60 p-3 sm:hidden">
              {paginatedSuppliers.map((supplier) => (
                <article key={supplier.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-slate-800">{supplier.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] font-bold text-slate-400">
                        {supplier.supplierCode || "--"}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        supplier.status === SUPPLIER_STATUS.ACTIVE
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      {supplier.status === SUPPLIER_STATUS.ACTIVE
                        ? SUPPLIER_LIST_COPY.ACTIVE_STATUS
                        : SUPPLIER_LIST_COPY.INACTIVE_STATUS}
                    </span>
                  </div>
                  {supplier.groupName && (
                    <div className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                      {supplier.groupName}
                    </div>
                  )}
                  <dl className="mt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Phone size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <dt className="sr-only">{SUPPLIER_FORM_COPY.PHONE_LABEL}</dt>
                      <dd className="font-mono font-semibold">{supplier.phoneNumber}</dd>
                    </div>
                    {supplier.email && (
                      <div className="flex items-start gap-2">
                        <Mail size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                        <dt className="sr-only">{SUPPLIER_FORM_COPY.EMAIL_LABEL}</dt>
                        <dd className="break-all">{supplier.email}</dd>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <dt className="sr-only">{SUPPLIER_FORM_COPY.ADDRESS_LABEL}</dt>
                      <dd>{supplier.address || "Chưa cập nhật địa chỉ"}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {SUPPLIER_LIST_COPY.TABLE_HEADERS.CURRENT_DEBT}
                      </div>
                      <div className={`mt-0.5 text-sm font-extrabold ${supplier.currentDebt > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {formatCurrency(supplier.currentDebt)}
                      </div>
                    </div>
                    {actionButtons(supplier)}
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Phân trang nhà cung cấp" className="mt-auto flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Hiển thị {resultStart}-{resultEnd} trên {filteredSuppliers.length} {SUPPLIER_LIST_COPY.RESULT_COUNT_SUFFIX}
                </span>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                    disabled={currentPage === 0}
                    aria-label={SUPPLIER_LIST_COPY.PREVIOUS_PAGE_ACTION}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:min-h-9 lg:min-w-9"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span className="font-bold text-slate-700">
                    {SUPPLIER_LIST_COPY.PAGE_LABEL} {currentPage + 1}/{totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                    disabled={currentPage >= totalPages - 1}
                    aria-label={SUPPLIER_LIST_COPY.NEXT_PAGE_ACTION}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:min-h-9 lg:min-w-9"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </nav>
            )}
          </div>
        )}
      </section>

      {hasInvalidDebtRange && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <CircleAlert size={15} className="shrink-0" aria-hidden="true" />
          {SUPPLIER_SECTION_COPY.INVALID_DEBT_RANGE}
        </div>
      )}

      <SupplierFormModal
        isOpen={isFormOpen}
        supplier={editingSupplier}
        groups={groups}
        isGroupsLoading={isGroupsLoading}
        onClose={closeForm}
        onSave={saveSupplier}
      />
      <SupplierDeleteDialog
        supplier={supplierToDelete}
        isDeleting={isDeleting}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={confirmDeleteSupplier}
      />
    </div>
  );
};
