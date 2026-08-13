import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { USER_ROLES } from "@/constants/roles";
import {
  SUPPLIER_FILTER,
  SUPPLIER_FILTER_DEFAULTS,
  SUPPLIER_MESSAGES,
  SUPPLIER_SECTION_COPY,
  SUPPLIER_STATUS,
} from "@/constants/supplier";
import { useNotification } from "@/hooks/useNotification";
import { SupplierGroupFormModal } from "@/modules/supplier/components/SupplierGroupFormModal";
import {
  useCreateSupplierGroupMutation,
  useGetSupplierGroupsQuery,
} from "@/modules/supplier/services/supplierApi";
import type {
  ISupplierFilters,
  ISupplierGroupPayload,
  TSupplierStatusFilter,
} from "@/modules/supplier/types/ISupplier";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { formatNumber } from "@/utils/formatCurrency";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface SupplierSidebarProps {
  filters: ISupplierFilters;
  onFiltersChange: (filters: ISupplierFilters) => void;
}

const toCurrencyInputValue = (value: string): string =>
  value ? formatNumber(Number(value)) : "";

const readCurrencyInputValue = (value: string): string =>
  value.replace(/\D/g, "");

export const SupplierSidebar = ({
  filters,
  onFiltersChange,
}: SupplierSidebarProps) => {
  const { currentRole } = useDashboardDemo();
  const { showError, showSuccess } = useNotification();
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const isOwner = currentRole === USER_ROLES.OWNER;
  const { data: groups = [], isLoading: isGroupsLoading } =
    useGetSupplierGroupsQuery();
  const [createSupplierGroup] = useCreateSupplierGroupMutation();
  const debtFrom = Number(filters.debtFrom || 0);
  const debtTo = Number(filters.debtTo || 0);
  const hasInvalidDebtRange = Boolean(
    filters.debtFrom && filters.debtTo && debtFrom > debtTo,
  );
  const hasActiveFilters = Boolean(
    filters.groupId !== SUPPLIER_FILTER_DEFAULTS.groupId ||
      filters.debtFrom ||
      filters.debtTo ||
      filters.status !== SUPPLIER_FILTER_DEFAULTS.status,
  );

  const updateFilters = (values: Partial<ISupplierFilters>) => {
    onFiltersChange({ ...filters, ...values });
  };

  const saveSupplierGroup = async (payload: ISupplierGroupPayload) => {
    try {
      const group = await createSupplierGroup(payload).unwrap();
      updateFilters({ groupId: group.id });
      showSuccess(SUPPLIER_MESSAGES.GROUP_CREATE_SUCCESS);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        SUPPLIER_MESSAGES.GROUP_SAVE_FAILED,
      );
      showError(message);
      throw new Error(message);
    }
  };

  return (
    <section aria-labelledby="supplier-filter-title" className="flex flex-col gap-4">
      <h2
        id="supplier-filter-title"
        className="border-b pb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-400"
      >
        {SUPPLIER_SECTION_COPY.FILTER_TITLE}
      </h2>

      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="supplier-group-filter" className="text-xs font-bold text-slate-700">
            {SUPPLIER_SECTION_COPY.GROUP_LABEL}
          </label>
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsGroupFormOpen(true)}
              className="min-h-9 rounded-md px-1.5 text-xs font-bold text-kv-blue-primary transition-colors hover:bg-kv-blue-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary"
            >
              {SUPPLIER_SECTION_COPY.GROUP_CREATE_ACTION}
            </button>
          )}
        </div>
        <select
          id="supplier-group-filter"
          value={filters.groupId}
          disabled={isGroupsLoading}
          onChange={(event) => updateFilters({ groupId: event.target.value })}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-kv-blue-primary focus:ring-2 focus:ring-kv-blue-primary/15 disabled:cursor-wait disabled:bg-slate-50 lg:h-9"
        >
          <option value={SUPPLIER_FILTER.ALL_GROUPS}>
            {isGroupsLoading
              ? SUPPLIER_SECTION_COPY.GROUPS_LOADING_LABEL
              : SUPPLIER_SECTION_COPY.ALL_GROUPS_LABEL}
          </option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2 border-b border-slate-100 pb-4">
        <legend className="mb-2 text-xs font-bold text-slate-700">
          {SUPPLIER_SECTION_COPY.CURRENT_DEBT_LABEL}
        </legend>
        <label className="flex min-h-11 overflow-hidden rounded-lg border border-slate-300 bg-white lg:min-h-9">
          <span className="flex w-12 shrink-0 items-center bg-slate-50 px-3 text-xs font-bold text-slate-600">
            {SUPPLIER_SECTION_COPY.DEBT_FROM_LABEL}
          </span>
          <input
            type="text"
            inputMode="numeric"
            aria-label={`${SUPPLIER_SECTION_COPY.CURRENT_DEBT_LABEL} ${SUPPLIER_SECTION_COPY.DEBT_FROM_LABEL}`}
            value={toCurrencyInputValue(filters.debtFrom)}
            onChange={(event) =>
              updateFilters({ debtFrom: readCurrencyInputValue(event.target.value) })
            }
            placeholder={SUPPLIER_SECTION_COPY.DEBT_PLACEHOLDER}
            className="min-w-0 flex-1 px-3 text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-kv-blue-primary/20"
          />
        </label>
        <label className="flex min-h-11 overflow-hidden rounded-lg border border-slate-300 bg-white lg:min-h-9">
          <span className="flex w-12 shrink-0 items-center bg-slate-50 px-3 text-xs font-bold text-slate-600">
            {SUPPLIER_SECTION_COPY.DEBT_TO_LABEL}
          </span>
          <input
            type="text"
            inputMode="numeric"
            aria-label={`${SUPPLIER_SECTION_COPY.CURRENT_DEBT_LABEL} ${SUPPLIER_SECTION_COPY.DEBT_TO_LABEL}`}
            value={toCurrencyInputValue(filters.debtTo)}
            onChange={(event) =>
              updateFilters({ debtTo: readCurrencyInputValue(event.target.value) })
            }
            placeholder={SUPPLIER_SECTION_COPY.DEBT_PLACEHOLDER}
            className="min-w-0 flex-1 px-3 text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-kv-blue-primary/20"
          />
        </label>
        {hasInvalidDebtRange && (
          <p role="alert" className="text-[11px] font-semibold text-rose-600">
            {SUPPLIER_SECTION_COPY.INVALID_DEBT_RANGE}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="supplier-status-filter" className="text-xs font-bold text-slate-700">
          {SUPPLIER_SECTION_COPY.STATUS_LABEL}
        </label>
        <select
          id="supplier-status-filter"
          value={filters.status}
          onChange={(event) =>
            updateFilters({ status: event.target.value as TSupplierStatusFilter })
          }
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-kv-blue-primary focus:ring-2 focus:ring-kv-blue-primary/15 lg:h-9"
        >
          <option value={SUPPLIER_STATUS.ACTIVE}>{SUPPLIER_SECTION_COPY.ACTIVE_STATUS_LABEL}</option>
          <option value={SUPPLIER_STATUS.INACTIVE}>{SUPPLIER_SECTION_COPY.INACTIVE_STATUS_LABEL}</option>
          <option value={SUPPLIER_STATUS.ALL}>{SUPPLIER_SECTION_COPY.ALL_STATUS_LABEL}</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onFiltersChange({ ...SUPPLIER_FILTER_DEFAULTS })}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-kv-blue-primary transition-colors hover:bg-kv-blue-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-blue-primary lg:min-h-9"
        >
          <RotateCcw size={13} aria-hidden="true" />
          {SUPPLIER_SECTION_COPY.CLEAR_FILTER_ACTION}
        </button>
      )}

      <SupplierGroupFormModal
        isOpen={isGroupFormOpen}
        onClose={() => setIsGroupFormOpen(false)}
        onSave={saveSupplierGroup}
      />
    </section>
  );
};
